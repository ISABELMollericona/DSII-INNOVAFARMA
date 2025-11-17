from .mongo_client import mongo
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId
from datetime import datetime

# Collections: usuarios, productos, facturas, clientes, detalle_factura

def find_user_by_id(user_id):
    try:
        doc = mongo.db.usuarios.find_one({'_id': ObjectId(user_id)})
    except Exception:
        return None
    if not doc:
        return None
    doc['id'] = str(doc['_id'])
    return doc

def find_user_by_identifier(identifier):
    # identifier can be email or username
    doc = mongo.db.usuarios.find_one({'$or': [{'email': identifier}, {'username': identifier}]})
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
    res = mongo.db.usuarios.insert_one(user_data)
    return str(res.inserted_id)

def list_products(limit=100):
    docs = mongo.db.productos.find().limit(limit)
    out = []
    for d in docs:
        d['id'] = str(d['_id'])
        out.append(d)
    return out

def filter_products(term, limit=200):
    if not term:
        return list_products(limit)
    regex = {'$regex': term, '$options': 'i'}
    q = {'$or': [{'Nombre_comercial': regex}, {'codigo': regex}, {'Nombre_generico': regex}]}
    docs = mongo.db.productos.find(q).limit(limit)
    out = []
    for d in docs:
        d['id'] = str(d['_id'])
        out.append(d)
    return out

# === CLIENTES ===

def find_cliente_by_ci(ci):
    """Find cliente by CI"""
    doc = mongo.db.clientes.find_one({'ci': ci})
    if not doc:
        return None
    doc['id'] = str(doc['_id'])
    return doc

def create_cliente(cliente_data):
    """Create new cliente"""
    res = mongo.db.clientes.insert_one(cliente_data)
    return str(res.inserted_id)

def get_cliente(cliente_id):
    """Get cliente by ID"""
    try:
        doc = mongo.db.clientes.find_one({'_id': ObjectId(cliente_id)})
    except Exception:
        return None
    if not doc:
        return None
    doc['id'] = str(doc['_id'])
    return doc

def list_clientes(skip=0, limit=100):
    """List all clientes with pagination"""
    docs = mongo.db.clientes.find().skip(skip).limit(limit)
    out = []
    for d in docs:
        d['id'] = str(d['_id'])
        out.append(d)
    return out

# === FACTURAS ===

def create_factura(factura_data):
    """Create new factura"""
    factura_data['fecha'] = factura_data.get('fecha', datetime.now())
    res = mongo.db.facturas.insert_one(factura_data)
    return str(res.inserted_id)

def get_factura(factura_id):
    """Get factura by ID with detalles"""
    try:
        doc = mongo.db.facturas.find_one({'_id': ObjectId(factura_id)})
    except Exception:
        return None
    if not doc:
        return None
    doc['id'] = str(doc['_id'])
    # get detalles
    detalles = mongo.db.detalle_factura.find({'id_factura': factura_id})
    doc['detalles'] = []
    for d in detalles:
        d['id'] = str(d['_id'])
        doc['detalles'].append(d)
    return doc

def list_facturas(skip=0, limit=50):
    """List facturas with pagination"""
    docs = mongo.db.facturas.find().skip(skip).limit(limit)
    out = []
    for d in docs:
        d['id'] = str(d['_id'])
        out.append(d)
    return out

# === DETALLE_FACTURA ===

def create_detalle_factura(detalle_data):
    """Create detalle_factura"""
    res = mongo.db.detalle_factura.insert_one(detalle_data)
    return str(res.inserted_id)

def get_detalles_factura(factura_id):
    """Get all detalles for a factura"""
    docs = mongo.db.detalle_factura.find({'id_factura': factura_id})
    out = []
    for d in docs:
        d['id'] = str(d['_id'])
        out.append(d)
    return out
