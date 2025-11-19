from .mongo_client import mongo
from typing import cast
from pymongo.database import Database
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId
from datetime import datetime

# Collections: usuarios, productos, facturas, clientes, detalle_factura

# Accessor to obtain the runtime mongo.db (set when PyMongo.init_app is called).
# Use a function so we always fetch the current value at call time (avoids cases
# where the module was imported before init_app ran and _db stayed None).
def get_db() -> Database:
    return cast(Database, getattr(mongo, 'db', None))

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
        out.append(d)
    return out

# === FACTURAS ===

def create_factura_doc(factura_data):
    """Create new factura from a factura_data dict"""
    factura_data['fecha'] = factura_data.get('fecha', datetime.now())
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

    res = db.facturas.insert_one(factura_data)
    fid = str(res.inserted_id)

    # insertar detalles
    for item in items:
        detalle = {
            'id_factura': fid,
            'id_producto': item.get('id_producto') or item.get('id_producto'),
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
    # get detalles
    detalles = db.detalle_factura.find({'id_factura': factura_id})
    doc['detalles'] = []
    for d in detalles:
        d['id'] = str(d['_id'])
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
        out.append(d)
    return out

# === DETALLE_FACTURA ===

def create_detalle_factura(detalle_data):
    """Create detalle_factura"""
    db = get_db()
    if db is None:
        raise RuntimeError('MongoDB not initialized')
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
        from bson.objectid import ObjectId
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
    res = db.productos.insert_one(doc)
    return str(res.inserted_id)


def update_product(product_id, **kwargs):
    try:
        from bson.objectid import ObjectId
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
        from bson.objectid import ObjectId
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


def update_cliente(cliente_id, **kwargs):
    try:
        from bson.objectid import ObjectId
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

