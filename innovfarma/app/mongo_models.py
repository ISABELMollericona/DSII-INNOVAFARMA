from .mongo_client import mongo
from typing import cast
from pymongo.database import Database
from pymongo import ReturnDocument
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
from datetime import datetime

# Collections: usuarios, productos, facturas, clientes, detalle_factura

# Accessor to obtain the runtime mongo.db (set when PyMongo.init_app is called).
# Use a function so we always fetch the current value at call time (avoids cases
# where the module was imported before init_app ran and _db stayed None).
def get_db() -> Database:
    return cast(Database, getattr(mongo, 'db', None))


def get_next_sequence(name: str) -> int:
    """Return next sequence integer for a named collection using a counters collection.

    Usage: seq = get_next_sequence('facturas')
    """
    db = get_db()
    if db is None:
        raise RuntimeError('MongoDB not initialized')
    doc = db.counters.find_one_and_update({'_id': name}, {'$inc': {'seq': 1}}, upsert=True, return_document=ReturnDocument.AFTER)
    try:
        return int(doc.get('seq', 0))
    except Exception:
        return 0

def find_user_by_id(user_id):
    try:
        db = get_db()
        if db is None:
            return None
        doc = db.usuarios.find_one({'_id': ObjectId(user_id)})
    except Exception:
        return None
    if not doc:
        return None
    doc['id'] = str(doc['_id'])
    return doc

def find_user_by_identifier(identifier):
    # identifier can be email or username
    db = get_db()
    if db is None:
        return None
    doc = db.usuarios.find_one({'$or': [{'email': identifier}, {'username': identifier}]})
    if not doc:
        return None
    doc['id'] = str(doc['_id'])
    return doc

def check_user_password(doc, password):
    if not doc or 'password' not in doc:
        return False
    return check_password_hash(doc['password'], password)

def create_user(user_data):
    # user_data: dict with fields including 'password'
    pwd = user_data.pop('password', None)
    if pwd:
        user_data['password'] = generate_password_hash(pwd)
    db = get_db()
    if db is None:
        raise RuntimeError('MongoDB not initialized')
    res = db.usuarios.insert_one(user_data)
    return str(res.inserted_id)

# (compatibility implementations for products/live further down)

# === CLIENTES ===

def find_cliente_by_ci(ci):
    """Find cliente by CI"""
    db = get_db()
    if db is None:
        return None
    doc = db.clientes.find_one({'ci': ci})
    if not doc:
        return None
    doc['id'] = str(doc['_id'])
    return doc

def create_cliente_doc(cliente_data):
    """Create new cliente (document-style helper)"""
    db = get_db()
    if db is None:
        raise RuntimeError('MongoDB not initialized')
    try:
        cliente_data['numero'] = get_next_sequence('clientes')
    except Exception:
        pass
    res = db.clientes.insert_one(cliente_data)
    return str(res.inserted_id)


def create_cliente(nombre, ci, direccion='', telefono=''):
    """Compat wrapper con la firma usada por SQL helpers."""
    cliente_data = {
        'nombre': nombre,
        'ci': ci,
        'direccion': direccion,
        'telefono': telefono
    }
    db = get_db()
    if db is None:
        raise RuntimeError('MongoDB not initialized')
    try:
        cliente_data['numero'] = get_next_sequence('clientes')
    except Exception:
        pass
    res = db.clientes.insert_one(cliente_data)
    return str(res.inserted_id)

def get_cliente(cliente_id):
    """Get cliente by ID"""
    try:
        db = get_db()
        if db is None:
            return None
        doc = db.clientes.find_one({'_id': ObjectId(cliente_id)})
    except Exception:
        return None
    if not doc:
        return None
    doc['id'] = str(doc['_id'])
    # expose sequential numero if present
    if 'numero' in doc:
        try:
            doc['numero'] = int(doc.get('numero'))
            doc['display_id'] = str(doc['numero'])
        except Exception:
            doc['display_id'] = str(doc.get('numero'))
    return doc

def list_clientes(skip=0, limit=100):
    """List all clientes with pagination"""
    db = get_db()
    if db is None:
        return []
    docs = db.clientes.find().skip(skip).limit(limit)
    out = []
    for d in docs:
        d['id'] = str(d['_id'])
        if 'numero' in d:
            try:
                d['numero'] = int(d.get('numero'))
                d['display_id'] = str(d['numero'])
            except Exception:
                d['display_id'] = str(d.get('numero'))
        out.append(d)
    return out

# === FACTURAS ===

def create_factura_doc(factura_data):
    """Create new factura from a factura_data dict"""
    factura_data['fecha'] = factura_data.get('fecha', datetime.now())
    # assign sequential numero for display (Mongo compatibility)
    try:
        factura_data['numero'] = get_next_sequence('facturas')
    except Exception:
        pass
    db = get_db()
    if db is None:
        raise RuntimeError('MongoDB not initialized')
    res = db.facturas.insert_one(factura_data)
    return str(res.inserted_id)


def create_factura(user_id, cliente_id, sucursal_id, items, total, recibido=None, cambio=None, nota=None):
    """Compat wrapper con la firma SQL: crea factura y detalles a partir de los parámetros dados.
    Ahora acepta recibido, cambio y nota para guardar información de pago.
    """
    factura_data = {
        'id_usuario': user_id,
        'id_cliente': cliente_id,
        'id_sucursal': sucursal_id,
        'fecha': datetime.now(),
        'total': total,
        'recibido': recibido,
        'cambio': cambio,
        'nota': nota
    }
    db = get_db()
    if db is None:
        raise RuntimeError('MongoDB not initialized')
    # assign sequential invoice numero
    try:
        factura_data['numero'] = get_next_sequence('facturas')
    except Exception:
        pass
    # try to include vendedor nombre for easier display in frontend
    try:
        user_doc = None
        if user_id:
            user_doc = db.usuarios.find_one({'_id': ObjectId(user_id)})
        if user_doc:
            factura_data['vendedor_nombre'] = user_doc.get('nombre') or user_doc.get('name') or user_doc.get('username') or user_doc.get('email')
    except Exception:
        # ignore user lookup errors
        pass

    # Insertar factura primero
    res = db.facturas.insert_one(factura_data)
    fid = str(res.inserted_id)

    # --- Validar stock en Mongo y descontar existencia antes de insertar detalles ---
    # Primer pase: comprobar que todos los productos existen y tienen suficiente existencia
    checks = []
    for item in items:
        pid = item.get('id_producto') or item.get('id') or None
        cantidad = int(item.get('cantidad') or 0)
        if not pid:
            # intentar continuar, pero marcar error
            raise ValueError(f"Producto inválido en detalle: {item}")
        # intentar resolver como ObjectId primero
        prod = None
        try:
            prod = db.productos.find_one({'_id': ObjectId(pid)})
        except Exception:
            prod = db.productos.find_one({'id': pid})
        if not prod:
            raise ValueError(f"Producto {pid} no encontrado")
        existencia = prod.get('existencia', 0) or 0
        try:
            existencia_val = int(existencia)
        except Exception:
            existencia_val = 0
        if existencia_val < cantidad:
            raise ValueError(f"Stock insuficiente para '{prod.get('Nombre_comercial') or pid}': disponible {existencia_val}, solicitado {cantidad}")
        checks.append({'pid': pid, 'cantidad': cantidad})

    # Segundo pase: aplicar decrementos de existencia (mejor hacerlos después de validar todo)
    updated = []
    for c in checks:
        pid = c['pid']
        cantidad = c['cantidad']
        updated_ok = False
        try:
            oid = ObjectId(pid)
            resu = db.productos.find_one_and_update({'_id': oid, 'existencia': {'$gte': cantidad}}, {'$inc': {'existencia': -cantidad}}, return_document=ReturnDocument.AFTER)
            if resu:
                updated_ok = True
        except Exception:
            # intentar con campo 'id'
            resu = db.productos.find_one_and_update({'id': pid, 'existencia': {'$gte': cantidad}}, {'$inc': {'existencia': -cantidad}}, return_document=ReturnDocument.AFTER)
            if resu:
                updated_ok = True
        if not updated_ok:
            # rollback los anteriores
            for u in updated:
                try:
                    # intentar revertir por _id o id
                    try:
                        db.productos.update_one({'_id': ObjectId(u['pid'])}, {'$inc': {'existencia': u['cantidad']}})
                    except Exception:
                        db.productos.update_one({'id': u['pid']}, {'$inc': {'existencia': u['cantidad']}})
                except Exception:
                    pass
            raise ValueError(f"No se pudo descontar existencia para el producto {pid}; operación abortada")
        updated.append({'pid': pid, 'cantidad': cantidad})

    # insertar detalles ahora que stock fue descontado
    for item in items:
        detalle = {
            'id_factura': fid,
            'id_producto': item.get('id_producto') or item.get('id') or None,
            'cantidad': item.get('cantidad'),
            'precio_unitario': item.get('precio_unitario'),
            'subtotal': item.get('subtotal')
        }
        db.detalle_factura.insert_one(detalle)

    return fid

def get_factura(factura_id):
    """Get factura by ID with detalles"""
    try:
        db = get_db()
        if db is None:
            return None
        doc = db.facturas.find_one({'_id': ObjectId(factura_id)})
    except Exception:
        return None
    if not doc:
        return None
    doc['id'] = str(doc['_id'])
    # short id for UI convenience
    doc['short_id'] = doc['id'][:8]
    # expose sequential numero as display id when present
    if 'numero' in doc:
        try:
            doc['numero'] = int(doc.get('numero'))
            doc['display_id'] = str(doc['numero'])
        except Exception:
            doc['display_id'] = str(doc.get('numero'))
    # normalize fecha to ISO string if datetime
    fval = doc.get('fecha')
    try:
        if hasattr(fval, 'isoformat'):
            doc['fecha'] = fval.isoformat()
        else:
            doc['fecha'] = str(fval)
    except Exception:
        doc['fecha'] = str(fval)

    # resolve vendedor name if possible
    try:
        uid = doc.get('id_usuario') or doc.get('id_vendedor') or doc.get('usuario')
        if uid:
            try:
                udoc = db.usuarios.find_one({'_id': ObjectId(uid)})
            except Exception:
                udoc = db.usuarios.find_one({'id': uid})
            if udoc:
                vname = udoc.get('nombre') or udoc.get('name') or udoc.get('username') or udoc.get('email')
                if vname:
                    doc['vendedor_nombre'] = vname
    except Exception:
        pass

    # get detalles and enrich with product names / short ids
    detalles = db.detalle_factura.find({'id_factura': factura_id})
    doc['detalles'] = []
    for d in detalles:
        d['id'] = str(d['_id'])
        # add short id
        d['short_id'] = d['id'][:8]
        # try to resolve product name
        pid = d.get('id_producto') or d.get('id') or d.get('producto_id')
        prod = None
        try:
            if pid:
                try:
                    prod = db.productos.find_one({'_id': ObjectId(pid)})
                except Exception:
                    prod = db.productos.find_one({'id': pid})
        except Exception:
            prod = None
        if prod:
            pname = prod.get('Nombre_comercial') or prod.get('nombre') or prod.get('Nombre_generico')
            if pname:
                d['producto_nombre'] = pname
            # include product short id
            try:
                d['producto_short_id'] = str(prod.get('_id'))[:8]
            except Exception:
                d['producto_short_id'] = str(prod.get('id'))[:8]
        doc['detalles'].append(d)
    return doc

def list_facturas(skip=0, limit=50):
    """List facturas with pagination"""
    db = get_db()
    if db is None:
        return []
    docs = db.facturas.find().skip(skip).limit(limit)
    out = []
    for d in docs:
        d['id'] = str(d['_id'])
        # short id for UI convenience
        d['short_id'] = d['id'][:8]
        # expose sequential numero as display id when present
        if 'numero' in d:
            try:
                d['numero'] = int(d.get('numero'))
                d['display_id'] = str(d['numero'])
            except Exception:
                d['display_id'] = str(d.get('numero'))
        # normalize fecha if datetime
        try:
            fval = d.get('fecha')
            if hasattr(fval, 'isoformat'):
                d['fecha'] = fval.isoformat()
            else:
                d['fecha'] = str(fval)
        except Exception:
            d['fecha'] = str(d.get('fecha'))
        # try to attach client name and vendedor nombre for frontend convenience
        try:
            cid = d.get('id_cliente') or d.get('cliente_id') or d.get('cliente')
            if cid:
                try:
                    cdoc = db.clientes.find_one({'_id': ObjectId(cid)})
                except Exception:
                    cdoc = db.clientes.find_one({'id': cid})
                if cdoc:
                    d['clientName'] = cdoc.get('nombre') or cdoc.get('name') or ''
        except Exception:
            pass
        try:
            uid = d.get('id_usuario') or d.get('id_vendedor')
            if uid:
                try:
                    udoc = db.usuarios.find_one({'_id': ObjectId(uid)})
                except Exception:
                    udoc = db.usuarios.find_one({'id': uid})
                if udoc:
                    d['vendedor_nombre'] = udoc.get('nombre') or udoc.get('name') or udoc.get('username') or ''
        except Exception:
            pass
        out.append(d)
    return out

# === DETALLE_FACTURA ===

def create_detalle_factura(detalle_data):
    """Create detalle_factura"""
    db = get_db()
    if db is None:
        raise RuntimeError('MongoDB not initialized')
    # optionally assign a sequential id within detalle_factura
    try:
        detalle_data['numero'] = get_next_sequence('detalle_factura')
    except Exception:
        pass
    res = db.detalle_factura.insert_one(detalle_data)
    return str(res.inserted_id)

def get_detalles_factura(factura_id):
    """Get all detalles for a factura"""
    db = get_db()
    if db is None:
        return []
    docs = db.detalle_factura.find({'id_factura': factura_id})
    out = []
    for d in docs:
        d['id'] = str(d['_id'])
        # short id
        d['short_id'] = d['id'][:8]
        # enrich with product name when available
        pid = d.get('id_producto') or d.get('id') or d.get('producto_id')
        try:
            if pid:
                try:
                    prod = db.productos.find_one({'_id': ObjectId(pid)})
                except Exception:
                    prod = db.productos.find_one({'id': pid})
                if prod:
                    pname = prod.get('Nombre_comercial') or prod.get('nombre') or prod.get('Nombre_generico')
                    if pname:
                        d['producto_nombre'] = pname
                    d['producto_short_id'] = str(prod.get('_id'))[:8] if prod.get('_id') else str(prod.get('id'))[:8]
        except Exception:
            pass
        out.append(d)
    return out


# ---- Compatibility helpers to mirror SQL helpers interface ----
def get_detalle_factura(factura_id):
    """Alias con el nombre esperado por los endpoints SQL-based."""
    return get_detalles_factura(factura_id)


# === PRODUCTOS (compatibilidad) ===
def _product_doc_to_dict(d):
    if not d:
        return None
    d['id'] = str(d.get('_id') or d.get('id'))
    # Ensure consistent field names as SQL helper
    # Copy known fields if present
    fields = [
        'codigo', 'Nombre_comercial', 'Cod_barrras', 'Nombre_generico',
        'Accion_terapeutica', 'Principio_activo', 'Concentracion', 'Presentacion',
        'Precio_venta', 'Precio_compra', 'Margen_utilidad', 'id_subcategoria',
        'id_forma_farmaceutica', 'id_marca', 'id_laboratorio', 'id_unidad_medida',
        'Cod_imp_nacionales', 'Cantidad_minima_pedido', 'Cantidad_maxima_inventario',
        'Tiempo_sin_movimiento', 'Cantidad_minima_inventario', 'Alerta_caducidad_dias',
        'Cod_nandina', 'Control_inventario', 'Receta_medica', 'Favorito', 'Granel',
        'Medicamento_controlado', 'Solo_compra'
    ]
    out = {k: d.get(k) for k in fields if k in d}
    out['id'] = d['id']
    # include existencia and vencimiento if present
    if 'existencia' in d:
        out['existencia'] = d.get('existencia')
    if 'vencimiento' in d:
        out['vencimiento'] = d.get('vencimiento')
    # include any extra fields
    for k, v in d.items():
        if k not in out and k != '_id':
            out[k] = v
    return out


def list_products(limit=100):
    db = get_db()
    if db is None:
        return []
    docs = db.productos.find().limit(limit)
    return [_product_doc_to_dict(d) for d in docs]


def generar_informe_ventas(fecha_inicio=None, fecha_fin=None, id_usuario=None, top_n=10):
    """Generar informe de ventas (compatibilidad con helper SQL).

    Parámetros opcionales: fecha_inicio/fecha_fin en ISO string o datetime,
    id_usuario filtra por id_usuario, top_n limita productos top vendidos.
    Retorna un dict con: total_vendido, numero_facturas, ventas_por_dia, top_productos
    """
    db = get_db()
    if db is None:
        return {'total_vendido': 0.0, 'numero_facturas': 0, 'ventas_por_dia': [], 'top_productos': []}

    q = {}
    # filtros por fecha
    try:
        if fecha_inicio:
            if isinstance(fecha_inicio, str):
                from datetime import datetime as _dt
                fecha_inicio_dt = _dt.fromisoformat(fecha_inicio)
            else:
                fecha_inicio_dt = fecha_inicio
            q['fecha'] = q.get('fecha', {})
            q['fecha']['$gte'] = fecha_inicio_dt.isoformat() if hasattr(fecha_inicio_dt, 'isoformat') else fecha_inicio_dt
        if fecha_fin:
            if isinstance(fecha_fin, str):
                from datetime import datetime as _dt
                fecha_fin_dt = _dt.fromisoformat(fecha_fin)
            else:
                fecha_fin_dt = fecha_fin
            q['fecha'] = q.get('fecha', {})
            q['fecha']['$lte'] = fecha_fin_dt.isoformat() if hasattr(fecha_fin_dt, 'isoformat') else fecha_fin_dt
    except Exception:
        # si el parse falla, ignorar el filtro de fecha
        q.pop('fecha', None)

    if id_usuario:
        q['id_usuario'] = id_usuario

    # total vendido y numero de facturas
    try:
        numero = db.facturas.count_documents(q)
    except Exception:
        numero = 0
    total_vendido = 0.0
    try:
        cur = db.facturas.find(q)
        for f in cur:
            try:
                total_vendido += float(f.get('total') or 0)
            except Exception:
                continue
    except Exception:
        total_vendido = 0.0

    # ventas por dia (simple grouping by fecha ISO date prefix)
    ventas_por_dia = {}
    try:
        cur = db.facturas.find(q)
        for f in cur:
            fecha = f.get('fecha')
            if not fecha:
                continue
            if hasattr(fecha, 'date'):
                key = fecha.date().isoformat()
            else:
                # assume ISO string
                key = str(fecha)[:10]
            ventas_por_dia[key] = ventas_por_dia.get(key, 0.0) + (float(f.get('total') or 0))
    except Exception:
        ventas_por_dia = {}

    ventas_por_dia_list = [{'fecha': k, 'total': v} for k, v in sorted(ventas_por_dia.items())]

    # top productos: aggregate detalle_factura
    top_products = []
    try:
        pipeline = []
        if q:
            # match by factura ids from facturas that match q
            fid_cursor = db.facturas.find(q, {'_id': 1})
            fids = [str(x.get('_id')) for x in fid_cursor]
            if fids:
                pipeline.append({'$match': {'id_factura': {'$in': fids}}})
        pipeline.extend([
            {'$group': {'_id': '$id_producto', 'vendidos': {'$sum': '$cantidad'}}},
            {'$sort': {'vendidos': -1}},
            {'$limit': int(top_n)}
        ])
        agg = list(db.detalle_factura.aggregate(pipeline)) if pipeline else list(db.detalle_factura.aggregate([{'$group': {'_id': '$id_producto', 'vendidos': {'$sum': '$cantidad'}}}, {'$sort': {'vendidos': -1}}, {'$limit': int(top_n)}]))
        for a in agg:
            top_products.append({'producto': a.get('_id'), 'vendidos': a.get('vendidos', 0)})
    except Exception:
        top_products = []

    return {
        'total_vendido': total_vendido,
        'numero_facturas': numero,
        'ventas_por_dia': ventas_por_dia_list,
        'top_productos': top_products
    }


def filter_products(term, limit=200):
    if not term:
        return list_products(limit)
    regex = {'$regex': term, '$options': 'i'}
    q = {'$or': [{'Nombre_comercial': regex}, {'codigo': regex}, {'Nombre_generico': regex}, {'Cod_barrras': regex}]}
    db = get_db()
    if db is None:
        return []
    docs = db.productos.find(q).limit(limit)
    return [_product_doc_to_dict(d) for d in docs]


def filter_advanced(marca_id=None, categoria_id=None, subcategoria_id=None, forma_id=None,
                   laboratorio_id=None, limit=100, skip=0):
    q = {}
    if marca_id:
        q['id_marca'] = marca_id
    if forma_id:
        q['id_forma_farmaceutica'] = forma_id
    if laboratorio_id:
        q['id_laboratorio'] = laboratorio_id
    if subcategoria_id:
        q['id_subcategoria'] = subcategoria_id
    db = get_db()
    if db is None:
        return []
    cursor = db.productos.find(q).skip(skip).limit(limit)
    return [_product_doc_to_dict(d) for d in cursor]


def get_product(product_id):
    try:
        from bson import ObjectId
        db = get_db()
        if db is None:
            return None
        doc = db.productos.find_one({'_id': ObjectId(product_id)})
    except Exception:
        # try direct id match
        db = get_db()
        if db is None:
            return None
        doc = db.productos.find_one({'id': product_id})
    return _product_doc_to_dict(doc)


def get_product_by_barcode(codigo_barras):
    db = get_db()
    if db is None:
        return None
    doc = db.productos.find_one({'Cod_barrras': codigo_barras})
    return _product_doc_to_dict(doc)


def search_by_barcode(codigo_barras):
    regex = {'$regex': codigo_barras, '$options': 'i'}
    db = get_db()
    if db is None:
        return []
    docs = db.productos.find({'Cod_barrras': regex}).limit(10)
    return [_product_doc_to_dict(d) for d in docs]


def search_suggestions_by_barcode(codigo_barras):
    return search_by_barcode(codigo_barras)


def create_product(codigo, Nombre_comercial, Nombre_generico=None, Precio_venta=0, Precio_compra=0, **kwargs):
    doc = {
        'codigo': codigo,
        'Nombre_comercial': Nombre_comercial,
        'Nombre_generico': Nombre_generico,
        'Precio_venta': Precio_venta,
        'Precio_compra': Precio_compra,
    }
    # merge allowed kwargs
    allowed = [
        'Cod_barrras', 'Accion_terapeutica', 'Principio_activo', 'Concentracion', 'Presentacion',
        'Margen_utilidad', 'Cod_imp_nacionales', 'Cantidad_minima_pedido', 'Cantidad_maxima_inventario',
        'Tiempo_sin_movimiento', 'Cantidad_minima_inventario', 'Alerta_caducidad_dias', 'Cod_nandina',
        'id_subcategoria', 'id_forma_farmaceutica', 'id_marca', 'id_laboratorio', 'id_unidad_medida',
        'Control_inventario', 'Receta_medica', 'Favorito', 'Granel', 'Medicamento_controlado', 'Solo_compra'
    ]
    for k in allowed:
        if k in kwargs:
            doc[k] = kwargs[k]
    # optional fields: existencia, vencimiento
    if 'existencia' in kwargs:
        val = kwargs.get('existencia')
        try:
            if val is None:
                doc['existencia'] = 0
            else:
                doc['existencia'] = int(val)
        except Exception:
            doc['existencia'] = val
    if 'vencimiento' in kwargs:
        doc['vencimiento'] = kwargs.get('vencimiento')

    db = get_db()
    if db is None:
        raise RuntimeError('MongoDB not initialized')
    # assign sequential numero for product
    try:
        doc['numero'] = get_next_sequence('productos')
    except Exception:
        pass
    res = db.productos.insert_one(doc)
    return str(res.inserted_id)


def update_product(product_id, **kwargs):
    try:
        from bson import ObjectId
        oid = ObjectId(product_id)
        db = get_db()
        if db is None:
            return False
        res = db.productos.update_one({'_id': oid}, {'$set': kwargs})
        return res.modified_count > 0
    except Exception:
        db = get_db()
        if db is None:
            return False
        res = db.productos.update_one({'id': product_id}, {'$set': kwargs})
        return res.modified_count > 0


def delete_product(product_id):
    try:
        from bson import ObjectId
        oid = ObjectId(product_id)
        db = get_db()
        if db is None:
            return False
        res = db.productos.delete_one({'_id': oid})
        return res.deleted_count > 0
    except Exception:
        db = get_db()
        if db is None:
            return False
        res = db.productos.delete_one({'id': product_id})
        return res.deleted_count > 0


def get_product_full_details(product_id):
    return get_product(product_id)


# === CLIENTES (compatibilidad) ===
def search_cliente_by_ci(ci):
    return find_cliente_by_ci(ci)


def search_cliente_by_nombre(nombre):
    regex = {'$regex': nombre, '$options': 'i'}
    db = get_db()
    if db is None:
        return []
    docs = db.clientes.find({'nombre': regex}).limit(50)
    out = []
    for d in docs:
        d['id'] = str(d['_id'])
        out.append(d)
    return out


def search_cliente_by_nit(nit):
    """Buscar cliente por NIT (compatibilidad con helpers SQL)."""
    if not nit:
        return None
    db = get_db()
    if db is None:
        return None
    try:
        doc = db.clientes.find_one({'nit': nit})
    except Exception:
        doc = db.clientes.find_one({'NIT': nit})
    if not doc:
        return None
    doc['id'] = str(doc.get('_id'))
    return doc


def update_cliente(cliente_id, **kwargs):
    try:
        from bson import ObjectId
        oid = ObjectId(cliente_id)
        db = get_db()
        if db is None:
            return False
        res = db.clientes.update_one({'_id': oid}, {'$set': kwargs})
        return res.modified_count > 0
    except Exception:
        db = get_db()
        if db is None:
            return False
        res = db.clientes.update_one({'id': cliente_id}, {'$set': kwargs})
        return res.modified_count > 0

