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

def create_factura(user_id, cliente_id, sucursal_id, items, total, recibido=None, cambio=None, nota=None):
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
        'recibido': recibido,
        'cambio': cambio,
        'nota': nota,
    }
    # --- validate stock first (don't modify DB yet) ---
    for item in items:
        prod_id = item.get('id_producto')
        cantidad = int(item.get('cantidad') or 0)
        if not prod_id or not cantidad:
            continue
        try:
            oid = ObjectId(prod_id)
            query = {'_id': oid}
        except Exception:
            query = {'id': str(prod_id)}

        doc = db.productos.find_one(query)
        if not doc:
            raise ValueError(f'Producto {prod_id} no encontrado')

        # determine available quantity from known fields
        available = None
        for f in ('cantidad', 'stock', 'existencia'):
            if f in doc and doc.get(f) is not None:
                try:
                    available = int(doc.get(f))
                    break
                except Exception:
                    available = None
        # if no explicit stock field, assume unlimited (None)
        if available is not None and cantidad > available:
            raise ValueError(f'Stock insuficiente para producto {prod_id}: disponible {available}, pedido {cantidad}')

    # if all validations pass, insert factura
    res = db.facturas.insert_one(factura_doc)
    fid = str(res.inserted_id)

    # insert detalles en colección detalle_factura and decrement stock
    for item in items:
        try:
            detalle = {
                'id_factura': fid,
                'id_producto': item.get('id_producto'),
                'cantidad': item.get('cantidad'),
                'precio_unitario': item.get('precio_unitario'),
                'subtotal': item.get('subtotal')
            }
            db.detalle_factura.insert_one(detalle)
        except Exception:
            pass

        # intentar decrementar stock en productos
        try:
            prod_id = item.get('id_producto')
            if not prod_id:
                continue
            # si parece ObjectId
            try:
                oid = ObjectId(prod_id)
                query = {'_id': oid}
            except Exception:
                query = {'id': str(prod_id)}

            cantidad = int(item.get('cantidad') or 0)
            if cantidad:
                doc = db.productos.find_one(query)
                if doc:
                    updates = {}
                    for f in ('cantidad', 'stock', 'existencia'):
                        if f in doc:
                            updates[f] = -cantidad
                    if updates:
                        db.productos.update_one(query, {'$inc': updates})
        except Exception:
            pass

    return fid

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
