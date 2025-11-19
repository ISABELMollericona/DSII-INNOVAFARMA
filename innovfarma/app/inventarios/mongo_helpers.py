"""Helpers específicos de inventarios (complementarios).

Por ahora delegan en `app.mongo_models` y exponen funciones convenientes
para futuras operaciones: ajustar stock, registrar lotes, etc.
"""
from .. import mongo_models


def list_inventarios(limit=200):
    items = mongo_models.list_products(limit=limit)
    for it in items:
        it['existencia'] = it.get('existencia', it.get('stock', it.get('cantidad', 0)))
    return items


def adjust_stock(product_id, delta):
    """Ajusta el stock de un producto por delta (positivo o negativo).
    Devuelve True si se aplicó correctamente.
    """
    db = mongo_models.get_db()
    if db is None:
        return False
    try:
        from bson.objectid import ObjectId
        oid = ObjectId(product_id)
        res = db.productos.update_one({'_id': oid}, {'$inc': {'existencia': delta}})
        return res.modified_count > 0
    except Exception:
        # fallback por id string
        res = db.productos.update_one({'id': product_id}, {'$inc': {'existencia': delta}})
        return res.modified_count > 0
