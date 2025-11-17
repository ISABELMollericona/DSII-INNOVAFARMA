# Funciones helper para invoices/facturas en MongoDB
from ..mongo_client import mongo
from bson.objectid import ObjectId
from datetime import datetime

def _get_db():
    """Obtiene la conexión a MongoDB, inicializándola si es necesario"""
    if mongo is None or mongo.db is None:
        raise RuntimeError(
            "Conexión a MongoDB no disponible. "
            "Asegúrate de que mongo_client.py inicializa correctamente la conexión."
        )
    return mongo.db

def create_factura(user_id, cliente_id, sucursal_id, items, total):
    """
    items: [{'id_producto': ..., 'cantidad': ..., 'precio_unitario': ..., 'subtotal': ...}, ...]
    """
    db = _get_db()
    factura_doc = {
        'id_usuario': user_id,
        'id_cliente': cliente_id,
        'id_sucursal': sucursal_id,
        'fecha': datetime.utcnow(),
        'total': total,
        'items': items,
    }
    res = db.facturas.insert_one(factura_doc)
    return str(res.inserted_id)

def get_factura(factura_id):
    db = _get_db()
    try:
        doc = db.facturas.find_one({'_id': ObjectId(factura_id)})
    except Exception:
        return None
    if doc:
        doc['id'] = str(doc['_id'])
    return doc

def list_facturas(limit=100, skip=0):
    db = _get_db()
    docs = db.facturas.find().skip(skip).limit(limit).sort('fecha', -1)
    out = []
    for d in docs:
        d['id'] = str(d['_id'])
        out.append(d)
    return out

def get_detalle_factura(factura_id):
    """Retorna los items de una factura (detalle)"""
    factura = get_factura(factura_id)
    if not factura:
        return None
    return factura.get('items', [])
