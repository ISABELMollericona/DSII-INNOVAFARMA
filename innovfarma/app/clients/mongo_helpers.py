# Funciones helper para clientes en MongoDB
from ..mongo_client import mongo
from bson.objectid import ObjectId

def create_cliente(nombre, ci, direccion='', telefono=''):
    if mongo is None or mongo.db is None:
        raise RuntimeError("MongoDB no está inicializado. Verifica mongo_client.py")
    cliente_doc = {
        'nombre': nombre,
        'ci': ci,
        'direccion': direccion,
        'telefono': telefono,
    }
    res = mongo.db.clientes.insert_one(cliente_doc)
    return str(res.inserted_id)

def get_cliente(cliente_id):
    if mongo is None or mongo.db is None:
        raise RuntimeError("MongoDB no está inicializado")
    try:
        doc = mongo.db.clientes.find_one({'_id': ObjectId(cliente_id)})
    except Exception:
        return None
    if doc:
        doc['id'] = str(doc['_id'])
    return doc

def search_cliente_by_ci(ci):
    if mongo is None or mongo.db is None:
        raise RuntimeError("MongoDB no está inicializado")
    doc = mongo.db.clientes.find_one({'ci': ci})
    if doc:
        doc['id'] = str(doc['_id'])
    return doc

def search_cliente_by_nombre(nombre):
    if mongo is None or mongo.db is None:
        raise RuntimeError("MongoDB no está inicializado")
    regex = {'$regex': nombre, '$options': 'i'}
    docs = mongo.db.clientes.find({'nombre': regex}).limit(10)
    out = []
    for d in docs:
        d['id'] = str(d['_id'])
        out.append(d)
    return out

def list_clientes(limit=100, skip=0):
    if mongo is None or mongo.db is None:
        raise RuntimeError("MongoDB no está inicializado")
    docs = mongo.db.clientes.find().skip(skip).limit(limit)
    out = []
    for d in docs:
        d['id'] = str(d['_id'])
        out.append(d)
    return out

def update_cliente(cliente_id, **kwargs):
    if mongo is None or mongo.db is None:
        raise RuntimeError("MongoDB no está inicializado")
    try:
        result = mongo.db.clientes.update_one({'_id': ObjectId(cliente_id)}, {'$set': kwargs})
        return result.modified_count > 0
    except Exception:
        return False
