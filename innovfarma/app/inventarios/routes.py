from flask import current_app, jsonify, request
from . import inventarios_bp
from .. import mongo_models as mongo_models
from datetime import datetime, timedelta




@inventarios_bp.route('/inventarios', methods=['GET'])
def list_inventarios():
    """Listar productos con información de inventario (stock/existencia)."""
    try:
        limit = int(request.args.get('limit', 200))
    except Exception:
        limit = 200
    # Reutilizamos el helper de productos para listar
    items = mongo_models.list_products(limit=limit)
    # Aseguramos que cada item tenga campo existencia
    for it in items:
        it['existencia'] = it.get('existencia', it.get('stock', it.get('cantidad', 0)))
    return jsonify({'inventarios': items, 'total': len(items)})


@inventarios_bp.route('/lotes', methods=['GET'])
def list_lotes():
    """Endpoint placeholder para lotes. Devuelve lotes si existen en colección 'lotes'."""
    db = getattr(mongo_models, 'get_db')()
    if db is None:
        return jsonify({'lotes': []})
    docs = db.lotes.find().limit(500)
    out = []
    for d in docs:
        d['id'] = str(d.get('_id'))
        out.append(d)
    return jsonify({'lotes': out, 'total': len(out)})


@inventarios_bp.route('/lotes', methods=['POST'])
def create_lote():
    data = request.get_json() or {}
    db = getattr(mongo_models, 'get_db')()
    if db is None:
        return jsonify({'error': 'MongoDB no inicializado'}), 500
    # expected: producto_id, lote, caducidad, cantidad
    lote = {
        'producto_id': data.get('producto_id'),
        'lote': data.get('lote'),
        'caducidad': data.get('caducidad'),
        'cantidad': int(data.get('cantidad') or 0),
        'created_at': datetime.utcnow()
    }
    res = db.lotes.insert_one(lote)
    # incrementar existencia en el producto
    try:
        pid = lote.get('producto_id')
        qty = lote.get('cantidad', 0)
        if pid and qty:
            try:
                from bson.objectid import ObjectId
                db.productos.update_one({'_id': ObjectId(pid)}, {'$inc': {'existencia': qty}})
            except Exception:
                db.productos.update_one({'id': pid}, {'$inc': {'existencia': qty}})
    except Exception:
        pass
    return jsonify({'id': str(res.inserted_id)}), 201


@inventarios_bp.route('/inventarios/alertas', methods=['GET'])
def inventarios_alertas():
    """Return low-stock and near-expiry alerts."""
    db = getattr(mongo_models, 'get_db')()
    if db is None:
        return jsonify({'alertas': []})
    low_threshold = int(request.args.get('low_threshold', 10))
    near_days = int(request.args.get('near_days', 30))
    now = datetime.utcnow()
    near_date = now + timedelta(days=near_days)
    # low stock
    low_cursor = db.productos.find({'$or': [{'existencia': {'$lte': low_threshold}}, {'stock': {'$lte': low_threshold}}, {'cantidad': {'$lte': low_threshold}}]})
    low = []
    for p in low_cursor:
        low.append({'id': str(p.get('_id')), 'nombre': p.get('Nombre_comercial'), 'existencia': p.get('existencia', p.get('stock', p.get('cantidad', 0)))})
    # near expiry: look into lotes collection
    near_cursor = db.lotes.find({'caducidad': {'$lte': near_date.isoformat()}})
    near = []
    for l in near_cursor:
        near.append({'id': str(l.get('_id')), 'producto_id': l.get('producto_id'), 'lote': l.get('lote'), 'caducidad': l.get('caducidad'), 'cantidad': l.get('cantidad')})
    return jsonify({'alertas': {'low_stock': low, 'near_expiry': near}})


@inventarios_bp.route('/inventarios/reportes/top-movers', methods=['GET'])
def report_top_movers():
    """Simple report: aggregate ventas (detalle_factura) group by producto and sum cantidad."""
    db = getattr(mongo_models, 'get_db')()
    if db is None:
        return jsonify({'reportes': []})
    pipeline = [
        {'$group': {'_id': '$id_producto', 'vendidos': {'$sum': '$cantidad'}}},
        {'$sort': {'vendidos': -1}},
        {'$limit': 50}
    ]
    try:
        agg = list(db.detalle_factura.aggregate(pipeline))
        out = []
        for a in agg:
            pid = a.get('_id')
            out.append({'producto': pid, 'vendidos': a.get('vendidos', 0)})
        return jsonify({'reportes': out})
    except Exception:
        return jsonify({'reportes': []})


@inventarios_bp.route('/inventarios/kardex/<product_id>', methods=['GET'])
def inventarios_kardex(product_id):
    db = getattr(mongo_models, 'get_db')()
    if db is None:
        return jsonify({'kardex': []})
    # collect movimientos from compras, detalle_factura and traspasos
    out = []
    # ventas
    ventas = db.detalle_factura.find({'id_producto': product_id})
    for v in ventas:
        out.append({'tipo': 'venta', 'cantidad': v.get('cantidad'), 'fecha': v.get('created_at') or v.get('fecha')})
    # compras
    compras = db.compras.find({'items.id_producto': product_id})
    for c in compras:
        # find item
        for it in c.get('items', []):
            if it.get('id_producto') == product_id or it.get('id') == product_id:
                out.append({'tipo': 'compra', 'cantidad': it.get('cantidad'), 'fecha': c.get('fecha')})
    # traspasos
    trs = db.traspasos.find({'items.id_producto': product_id})
    for t in trs:
        for it in t.get('items', []):
            if it.get('id_producto') == product_id:
                out.append({'tipo': 'traspaso', 'cantidad': it.get('cantidad'), 'fecha': t.get('fecha')})
    # sort by fecha if exists
    try:
        out_sorted = sorted(out, key=lambda x: x.get('fecha') or '')
    except Exception:
        out_sorted = out
    return jsonify({'kardex': out_sorted})


@inventarios_bp.route('/traspasos', methods=['POST'])
def create_traspaso():
    data = request.get_json() or {}
    # Simple placeholder: persist en colección traspasos
    db = getattr(mongo_models, 'get_db')()
    if db is None:
        return jsonify({'error': 'MongoDB no inicializado'}), 500
    res = db.traspasos.insert_one({
        'origen': data.get('origen'),
        'destino': data.get('destino'),
        'items': data.get('items', []),
        'fecha': data.get('fecha')
    })
    return jsonify({'id': str(res.inserted_id)}), 201


@inventarios_bp.route('/pedidos', methods=['POST'])
def create_pedido():
    data = request.get_json() or {}
    db = getattr(mongo_models, 'get_db')()
    if db is None:
        return jsonify({'error': 'MongoDB no inicializado'}), 500
    res = db.pedidos.insert_one({
        'proveedor': data.get('proveedor'),
        'items': data.get('items', []),
        'fecha': data.get('fecha')
    })
    return jsonify({'id': str(res.inserted_id)}), 201
