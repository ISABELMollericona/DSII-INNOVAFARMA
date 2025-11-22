from flask import jsonify, request
from datetime import datetime
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

    proveedor_id = data.get('proveedor_id') or data.get('proveedor')
    items = data.get('items') or []
    total = data.get('total', 0)
    fecha = data.get('fecha')

    if not proveedor_id:
        return jsonify({'error': 'proveedor_id requerido'}), 400
    if not isinstance(items, list) or not items:
        return jsonify({'error': 'items (lista) requerida'}), 400

    # normalizar fecha si se proporciona
    fecha_norm = None
    if fecha:
        parsed = None
        try:
            parsed = datetime.fromisoformat(fecha)
        except Exception:
            try:
                parsed = datetime.strptime(fecha, '%Y-%m-%d')
            except Exception:
                try:
                    parsed = datetime.strptime(fecha, '%d/%m/%Y')
                except Exception:
                    parsed = None
        fecha_norm = parsed.isoformat() if parsed else str(fecha)

    compra = {
        'proveedor_id': proveedor_id,
        'items': items,
        'total': float(total) if total is not None else 0.0,
        'fecha': fecha_norm,
        'created_at': datetime.utcnow()
    }
    # assign sequential numero for compra
    try:
        if hasattr(mongo_models, 'get_next_sequence'):
            compra['numero'] = mongo_models.get_next_sequence('compras')
    except Exception:
        pass

    res = db.compras.insert_one(compra)
    compra_id = str(res.inserted_id)

    # actualizar existencia (sumar cantidades compradas)
    try:
        for it in compra.get('items', []):
            prod_id = it.get('id_producto') or it.get('id') or it.get('producto_id')
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

    # devolver documento creado
    try:
        from bson.objectid import ObjectId
        doc = db.compras.find_one({'_id': ObjectId(compra_id)})
    except Exception:
        doc = db.compras.find_one({'id': compra_id})
    if doc:
        doc['id'] = str(doc.get('_id'))
    return jsonify(doc or {'id': compra_id}), 201


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
        'direccion': data.get('direccion'),
        'nit': data.get('nit') or data.get('NIT') or ''
    }
    # assign sequential numero if helper available
    try:
        if hasattr(mongo_models, 'get_next_sequence'):
            prov['numero'] = mongo_models.get_next_sequence('proveedores')
    except Exception:
        pass
    res = db.proveedores.insert_one(prov)
    prov['id'] = str(res.inserted_id)
    return jsonify(prov), 201


@compras_bp.route('/cuentas-pagar', methods=['POST'])
def crear_cuenta_pagar():
    """Registrar una deuda con proveedor: proveedor_id, monto, fecha_vencimiento, descripcion, saldo (inicial = monto)."""
    data = request.get_json() or {}
    db = mongo_models.get_db()
    if db is None:
        return jsonify({'error': 'MongoDB no inicializado'}), 500

    proveedor_id = data.get('proveedor_id') or data.get('proveedor')
    monto = data.get('monto')
    fecha_vencimiento = data.get('fecha_vencimiento') or data.get('vencimiento')
    descripcion = data.get('descripcion') or data.get('concepto') or ''

    if not proveedor_id:
        return jsonify({'error': 'proveedor_id requerido'}), 400
    if monto is None:
        return jsonify({'error': 'monto requerido'}), 400
    try:
        monto_val = float(monto)
    except (TypeError, ValueError):
        return jsonify({'error': 'monto inválido'}), 400

    cuenta = {
        'proveedor_id': proveedor_id,
        'monto': monto_val,
        'saldo': monto_val,
        'fecha_vencimiento': fecha_vencimiento,
        'descripcion': descripcion,
        'pagos': [],
        'estado': 'pendiente',
        'created_at': datetime.utcnow()
    }
    res = db.cuentas_pagar.insert_one(cuenta)
    cuenta_id = str(res.inserted_id)
    cuenta['id'] = cuenta_id
    return jsonify(cuenta), 201


@compras_bp.route('/cuentas-pagar', methods=['GET'])
def list_cuentas_pagar():
    db = mongo_models.get_db()
    if db is None:
        return jsonify({'cuentas': []})
    docs = db.cuentas_pagar.find().limit(500)
    out = []
    for d in docs:
        d['id'] = str(d.get('_id'))
        out.append(d)
    return jsonify({'cuentas': out, 'total': len(out)})


@compras_bp.route('/cuentas-pagar/<cuenta_id>', methods=['GET'])
def get_cuenta_pagar(cuenta_id):
    db = mongo_models.get_db()
    if db is None:
        return jsonify({'error': 'MongoDB no inicializado'}), 500
    try:
        from bson.objectid import ObjectId
        doc = db.cuentas_pagar.find_one({'_id': ObjectId(cuenta_id)})
    except Exception:
        doc = db.cuentas_pagar.find_one({'id': cuenta_id})
    if not doc:
        return jsonify({'error': 'cuenta no encontrada'}), 404
    doc['id'] = str(doc.get('_id'))
    return jsonify(doc)


@compras_bp.route('/cuentas-pagar/<cuenta_id>/pagar', methods=['PUT'])
def pagar_cuenta(cuenta_id):
    """Registrar un pago parcial o total sobre una cuenta por pagar.

    Body: { monto: number, fecha: ISO string, referencia: str }
    """
    data = request.get_json() or {}
    monto = data.get('monto')
    fecha = data.get('fecha')
    referencia = data.get('referencia') or data.get('nota') or ''

    if monto is None:
        return jsonify({'error': 'monto requerido'}), 400
    try:
        pago_val = float(monto)
    except (TypeError, ValueError):
        return jsonify({'error': 'monto inválido'}), 400

    db = mongo_models.get_db()
    if db is None:
        return jsonify({'error': 'MongoDB no inicializado'}), 500

    try:
        from bson.objectid import ObjectId
        oid = ObjectId(cuenta_id)
        cuenta = db.cuentas_pagar.find_one({'_id': oid})
    except Exception:
        cuenta = db.cuentas_pagar.find_one({'id': cuenta_id})

    if not cuenta:
        return jsonify({'error': 'cuenta no encontrada'}), 404

    # registrar pago
    pago = {
        'monto': pago_val,
        'fecha': fecha or datetime.utcnow().isoformat(),
        'referencia': referencia,
        'created_at': datetime.utcnow()
    }
    # insertar en array pagos y disminuir saldo
    try:
        db.cuentas_pagar.update_one({'_id': cuenta.get('_id')}, {'$push': {'pagos': pago}, '$inc': {'saldo': -pago_val}})
    except Exception:
        # fallback por si el _id no es ObjectId
        db.cuentas_pagar.update_one({'id': cuenta_id}, {'$push': {'pagos': pago}, '$inc': {'saldo': -pago_val}})

    # recuperar cuenta actualizada
    try:
        from bson.objectid import ObjectId
        doc = db.cuentas_pagar.find_one({'_id': ObjectId(cuenta_id)})
    except Exception:
        doc = db.cuentas_pagar.find_one({'id': cuenta_id})
    if doc:
        # normalizar estado si saldo <= 0
        saldo = doc.get('saldo')
        if saldo is not None and float(saldo) <= 0:
            db.cuentas_pagar.update_one({'_id': doc.get('_id')}, {'$set': {'estado': 'pagada', 'paid_at': datetime.utcnow()}})
            doc['estado'] = 'pagada'
        doc['id'] = str(doc.get('_id'))
    return jsonify(doc), 200
