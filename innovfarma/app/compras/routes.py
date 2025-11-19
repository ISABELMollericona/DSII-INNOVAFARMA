from flask import jsonify, request
from . import compras_bp
from .. import mongo_models


@compras_bp.route('/compras', methods=['GET'])
def list_compras():
    db = mongo_models.get_db()
    if db is None:
        return jsonify({'compras': []})
    docs = db.compras.find().limit(200)
    out = []
    for d in docs:
        d['id'] = str(d.get('_id'))
        out.append(d)
    return jsonify({'compras': out, 'total': len(out)})


@compras_bp.route('/compras', methods=['POST'])
def create_compra():
    data = request.get_json() or {}
    db = mongo_models.get_db()
    if db is None:
        return jsonify({'error': 'MongoDB no inicializado'}), 500
    # expected payload: proveedor_id, items [{id_producto,cantidad,precio_unitario}], total
    compra = {
        'proveedor_id': data.get('proveedor_id'),
        'items': data.get('items', []),
        'total': data.get('total', 0),
        'fecha': data.get('fecha')
    }
    res = db.compras.insert_one(compra)
    # actualizar existencia (sumar cantidades compradas)
    try:
        for it in compra.get('items', []):
            prod_id = it.get('id_producto') or it.get('id') or it.get('id_producto')
            qty = int(it.get('cantidad') or 0)
            if not prod_id or qty <= 0:
                continue
            # intentar ObjectId primero
            try:
                from bson.objectid import ObjectId
                oid = ObjectId(prod_id)
                db.productos.update_one({'_id': oid}, {'$inc': {'existencia': qty}})
            except Exception:
                db.productos.update_one({'id': prod_id}, {'$inc': {'existencia': qty}})
    except Exception:
        # no bloquear la creación de la compra si el ajuste falla; solo loguear en futuro
        pass
    return jsonify({'id': str(res.inserted_id)}), 201


@compras_bp.route('/proveedores', methods=['GET'])
def list_proveedores():
    db = mongo_models.get_db()
    if db is None:
        return jsonify({'proveedores': []})
    docs = db.proveedores.find().limit(200)
    out = []
    for d in docs:
        d['id'] = str(d.get('_id'))
        out.append(d)
    return jsonify({'proveedores': out, 'total': len(out)})


@compras_bp.route('/proveedores', methods=['POST'])
def create_proveedor():
    data = request.get_json() or {}
    db = mongo_models.get_db()
    if db is None:
        return jsonify({'error': 'MongoDB no inicializado'}), 500
    prov = {
        'nombre': data.get('nombre'),
        'contacto': data.get('contacto'),
        'telefono': data.get('telefono'),
        'direccion': data.get('direccion')
    }
    res = db.proveedores.insert_one(prov)
    return jsonify({'id': str(res.inserted_id)}), 201
