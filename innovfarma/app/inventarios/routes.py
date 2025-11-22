from flask import current_app, jsonify, request
from . import inventarios_bp
from .. import mongo_models as mongo_models
from datetime import datetime, timedelta
from flask_login import login_required

try:
    from ..products import sql_helpers as productos_sql_helpers
except Exception:
    productos_sql_helpers = None




@inventarios_bp.route('/inventarios', methods=['GET'])
def list_inventarios():
    """Listar productos con información de inventario (stock/existencia)."""
    try:
        limit = int(request.args.get('limit', 200))
    except Exception:
        limit = 200
    # Reutilizamos el helper de productos para listar.
    items = mongo_models.list_products(limit=limit) or []
    normalized = []
    for it in items:
        if not isinstance(it, dict):
            # ignorar elementos inesperados
            continue
        existencia = it.get('existencia')
        if existencia is None:
            existencia = it.get('stock', it.get('cantidad', 0))
        try:
            existencia = int(existencia)
        except Exception:
            existencia = 0
        it['existencia'] = existencia
        normalized.append(it)
    return jsonify({'inventarios': normalized, 'total': len(normalized)})


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
    producto_id = data.get('producto_id') or data.get('id_producto') or data.get('id')
    lote_val = data.get('lote')
    cad = data.get('caducidad') or data.get('vencimiento') or data.get('fecha_vencimiento')
    cantidad_val = data.get('cantidad') or data.get('stock') or data.get('cantidad_lote') or 0

    # validar y normalizar cantidad
    try:
        cantidad = int(cantidad_val or 0)
    except Exception:
        return jsonify({'error': 'cantidad inválida'}), 400

    # validar y normalizar caducidad a ISO string (si se proporcionó)
    cad_iso = None
    if cad:
        parsed = None
        # intentar formatos comunes
        try:
            parsed = datetime.fromisoformat(cad)
        except Exception:
            try:
                parsed = datetime.strptime(cad, '%Y-%m-%d')
            except Exception:
                try:
                    parsed = datetime.strptime(cad, '%d/%m/%Y')
                except Exception:
                    try:
                        parsed = datetime.strptime(cad, '%d-%m-%Y')
                    except Exception:
                        parsed = None
        if parsed:
            cad_iso = parsed.date().isoformat()
        else:
            # si no se pudo parsear, dejar el valor tal cual (string) pero advertir en la respuesta
            cad_iso = str(cad)

    lote = {
        'producto_id': producto_id,
        'lote': lote_val,
        'caducidad': cad_iso,
        'cantidad': cantidad,
        'created_at': datetime.utcnow()
    }
    res = db.lotes.insert_one(lote)
    # incrementar existencia en el producto si se proporcionó producto_id
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

    # respuesta: incluir si caducidad fue normalizada o no
    resp = {'id': str(res.inserted_id)}
    if cad and cad_iso:
        resp['caducidad_normalizada'] = cad_iso
    return jsonify(resp), 201


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


@inventarios_bp.route('/inventarios/reportes/inventario', methods=['GET'])
def report_inventario():
    """Reporte completo de inventario: kardex (opcional por producto_id), low_stock y near_expiry.

    Query params opcionales: `product_id`, `low_threshold` (int), `near_days` (int).
    """
    db = getattr(mongo_models, 'get_db')()
    if db is None:
        return jsonify({'error': 'MongoDB no inicializado'}), 500

    product_id = request.args.get('product_id')
    try:
        low_threshold = int(request.args.get('low_threshold', 10))
    except Exception:
        low_threshold = 10
    try:
        near_days = int(request.args.get('near_days', 30))
    except Exception:
        near_days = 30

    now = datetime.utcnow()
    near_date = now + timedelta(days=near_days)

    # low stock
    low_cursor = db.productos.find({'$or': [{'existencia': {'$lte': low_threshold}}, {'stock': {'$lte': low_threshold}}, {'cantidad': {'$lte': low_threshold}}]})
    low = []
    for p in low_cursor:
        low.append({'id': str(p.get('_id')), 'nombre': p.get('Nombre_comercial'), 'existencia': p.get('existencia', p.get('stock', p.get('cantidad', 0)))})

    # near expiry: buscar en lotes por caducidad <= near_date
    try:
        near_cursor = db.lotes.find({'caducidad': {'$lte': near_date.isoformat()}})
    except Exception:
        # si la caducidad se almacenó como fecha, comparar directamente
        near_cursor = db.lotes.find()
    near = []
    for l in near_cursor:
        cad = l.get('caducidad')
        # intentar convertir si es fecha/string
        try:
            near.append({'id': str(l.get('_id')), 'producto_id': l.get('producto_id'), 'lote': l.get('lote'), 'caducidad': l.get('caducidad'), 'cantidad': l.get('cantidad')})
        except Exception:
            continue

    # kardex por producto si se solicitó
    kardex = None
    if product_id:
        out = []
        # ventas
        ventas = db.detalle_factura.find({'id_producto': product_id})
        for v in ventas:
            out.append({'tipo': 'venta', 'cantidad': v.get('cantidad'), 'fecha': v.get('created_at') or v.get('fecha')})
        # compras
        compras = db.compras.find({'items.id_producto': product_id})
        for c in compras:
            for it in c.get('items', []):
                if it.get('id_producto') == product_id or it.get('id') == product_id:
                    out.append({'tipo': 'compra', 'cantidad': it.get('cantidad'), 'fecha': c.get('fecha')})
        # traspasos (si la colección no existe, ignorar)
        try:
            trs = db.traspasos.find({'items.id_producto': product_id})
        except Exception:
            trs = []
        for t in trs:
            for it in t.get('items', []):
                if it.get('id_producto') == product_id:
                    out.append({'tipo': 'traspaso', 'cantidad': it.get('cantidad'), 'fecha': t.get('fecha')})
        try:
            kardex = sorted(out, key=lambda x: x.get('fecha') or '')
        except Exception:
            kardex = out

    return jsonify({'kardex': kardex, 'low_stock': low, 'near_expiry': near})


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
    # traspasos (si la colección no existe, ignorar)
    try:
        trs = db.traspasos.find({'items.id_producto': product_id})
    except Exception:
        trs = []
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
    # Endpoint deshabilitado: traspasos no se permiten en esta instalación.
    return jsonify({'error': 'traspasos deshabilitados'}), 410


@inventarios_bp.route('/pedidos', methods=['POST'])
def create_pedido():
    data = request.get_json() or {}
    db = getattr(mongo_models, 'get_db')()
    if db is None:
        return jsonify({'error': 'MongoDB no inicializado'}), 500

    proveedor = data.get('proveedor') or data.get('proveedor_id')
    items = data.get('items') or []
    fecha = data.get('fecha')

    if not proveedor:
        return jsonify({'error': 'proveedor requerido'}), 400
    if not isinstance(items, list) or not items:
        return jsonify({'error': 'items (lista) requerida'}), 400

    # validar items: cada item debe tener producto_id/id_producto y cantidad
    for it in items:
        if not (it.get('producto_id') or it.get('id_producto') or it.get('id')):
            return jsonify({'error': 'cada item debe incluir producto_id'}), 400
        try:
            qty = int(it.get('cantidad') or 0)
        except Exception:
            return jsonify({'error': 'cantidad inválida en items'}), 400

    pedido = {
        'proveedor': proveedor,
        'items': items,
        'fecha': fecha,
        'estado': 'pendiente',
        'created_at': datetime.utcnow()
    }
    res = db.pedidos.insert_one(pedido)
    return jsonify({'id': str(res.inserted_id), 'estado': 'pendiente'}), 201


@inventarios_bp.route('/pedidos', methods=['GET'])
def list_pedidos():
    db = getattr(mongo_models, 'get_db')()
    if db is None:
        return jsonify({'pedidos': []})
    docs = db.pedidos.find().limit(500)
    out = []
    for d in docs:
        d['id'] = str(d.get('_id'))
        out.append(d)
    return jsonify({'pedidos': out, 'total': len(out)})


@inventarios_bp.route('/pedidos/<pedido_id>', methods=['GET'])
def get_pedido(pedido_id):
    db = getattr(mongo_models, 'get_db')()
    if db is None:
        return jsonify({'error': 'MongoDB no inicializado'}), 500
    try:
        from bson.objectid import ObjectId
        doc = db.pedidos.find_one({'_id': ObjectId(pedido_id)})
    except Exception:
        doc = db.pedidos.find_one({'id': pedido_id})
    if not doc:
        return jsonify({'error': 'pedido no encontrado'}), 404
    doc['id'] = str(doc.get('_id'))
    return jsonify(doc)


@inventarios_bp.route('/pedidos/<pedido_id>/estado', methods=['PUT'])
def update_pedido_estado(pedido_id):
    """Actualizar estado del pedido. Si el nuevo estado es 'recibido', se actualiza existencia."""
    data = request.get_json() or {}
    nuevo_estado = data.get('estado')
    if not nuevo_estado:
        return jsonify({'error': 'estado requerido'}), 400

    db = getattr(mongo_models, 'get_db')()
    if db is None:
        return jsonify({'error': 'MongoDB no inicializado'}), 500

    try:
        from bson.objectid import ObjectId
        oid = ObjectId(pedido_id)
        pedido = db.pedidos.find_one({'_id': oid})
    except Exception:
        pedido = db.pedidos.find_one({'id': pedido_id})

    if not pedido:
        return jsonify({'error': 'pedido no encontrado'}), 404

    # actualizar estado
    db.pedidos.update_one({'_id': pedido.get('_id')}, {'$set': {'estado': nuevo_estado, 'updated_at': datetime.utcnow()}})

    # Si se marca como recibido o completado, incrementar stock de productos
    if str(nuevo_estado).lower() in ('recibido', 'completado'):
        try:
            for it in pedido.get('items', []):
                prod_id = it.get('producto_id') or it.get('id_producto') or it.get('id')
                qty = int(it.get('cantidad') or 0)
                if not prod_id or qty <= 0:
                    continue
                try:
                    from bson.objectid import ObjectId
                    db.productos.update_one({'_id': ObjectId(prod_id)}, {'$inc': {'existencia': qty}})
                except Exception:
                    db.productos.update_one({'id': prod_id}, {'$inc': {'existencia': qty}})
        except Exception:
            pass

    return jsonify({'id': str(pedido.get('_id')), 'estado': nuevo_estado})


@inventarios_bp.route('/inventarios/productos', methods=['POST'])
@login_required
def crear_producto_inventario():
    """Crear nuevo producto con campos de inventario: nombre, categoría, precio, stock y vencimiento."""
    data = request.get_json() or {}
    # validar campos mínimos
    nombre = data.get('Nombre_comercial') or data.get('nombre')
    if not nombre:
        return jsonify({'error': 'Nombre del producto requerido (Nombre_comercial)'}), 400

    precio = data.get('Precio_venta') or data.get('precio') or 0
    existencia = data.get('existencia') or data.get('stock') or data.get('cantidad') or 0
    vencimiento = data.get('vencimiento') or data.get('fecha_vencimiento')
    codigo = data.get('codigo', '')
    id_subcategoria = data.get('id_subcategoria') or data.get('categoria')

    producto_payload = {
        'codigo': codigo,
        'Nombre_comercial': nombre,
        'Precio_venta': precio,
        'id_subcategoria': id_subcategoria,
        'existencia': existencia,
        'vencimiento': vencimiento,
    }

    # seleccionar helper (Mongo preferido si configured)
    use_mongo = current_app and current_app.config.get('MONGO_URI') and getattr(mongo_models, 'get_db', None)
    try:
        if use_mongo:
            # mongo_models.create_product acepta existencia y vencimiento
            pid = mongo_models.create_product(**producto_payload)
        else:
            # usar helper SQL de productos si está disponible
            h = productos_sql_helpers
            if h is None:
                return jsonify({'error': 'No hay helper de productos disponible'}), 500
            # intentar crear con los kwargs (create_product en SQL acepta kwargs permitidos)
            pid = h.create_product(codigo=producto_payload['codigo'], Nombre_comercial=producto_payload['Nombre_comercial'], Precio_venta=producto_payload['Precio_venta'], existencia=producto_payload['existencia'], vencimiento=producto_payload['vencimiento'], id_subcategoria=producto_payload['id_subcategoria'])
        producto = None
        # obtener objeto creado usando el helper adecuado
        if use_mongo:
            producto = mongo_models.get_product(pid)
        else:
            h = productos_sql_helpers
            if h is None:
                return jsonify({'error': 'No hay helper de productos disponible'}), 500
            producto = h.get_product(pid)

        return jsonify({'success': True, 'producto': producto}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
