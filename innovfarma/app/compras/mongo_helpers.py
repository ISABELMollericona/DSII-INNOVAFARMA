"""Helpers para compras y proveedores."""
from .. import mongo_models


def list_proveedores(limit=200):
    db = mongo_models.get_db()
    if db is None:
        return []
    docs = db.proveedores.find().limit(limit)
    out = []
    for d in docs:
        d['id'] = str(d.get('_id'))
        out.append(d)
    return out


def create_proveedor(data):
    db = mongo_models.get_db()
    if db is None:
        raise RuntimeError('MongoDB not initialized')
    res = db.proveedores.insert_one(data)
    return str(res.inserted_id)


def create_compra(compra_data):
    db = mongo_models.get_db()
    if db is None:
        raise RuntimeError('MongoDB not initialized')
    # compra_data: proveedor_id, items, total, fecha
    res = db.compras.insert_one(compra_data)
    return str(res.inserted_id)
