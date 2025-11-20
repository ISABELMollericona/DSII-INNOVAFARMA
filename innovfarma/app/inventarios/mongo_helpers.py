"""Helpers específicos de inventarios (complementarios).

Por ahora delegan en `app.mongo_models` y exponen funciones convenientes
para futuras operaciones: ajustar stock, registrar lotes, etc.
"""
from .. import mongo_models
from bson.objectid import ObjectId
from bson.errors import InvalidId
from typing import Any, Dict, List


def list_inventarios(limit: int = 200) -> List[Dict[str, Any]]:
    """Lista productos normalizando el campo `existencia`.

    Protege contra items nulos y garantiza que siempre haya un entero en
    `existencia` (usa `stock` o `cantidad` como fallback).
    """
    items = mongo_models.list_products(limit=limit) or []
    normalized: List[Dict[str, Any]] = []
    for it in items:
        if not isinstance(it, dict):
            # ignora entradas inesperadas
            continue
        existencia = it.get('existencia')
        if existencia is None:
            existencia = it.get('stock', it.get('cantidad', 0))
        try:
            # intenta asegurar int por si viene como str
            existencia = int(existencia)
        except Exception:
            existencia = 0
        it['existencia'] = existencia
        normalized.append(it)
    return normalized


def adjust_stock(product_id: str, delta: int) -> bool:
    """Ajusta el stock de un producto por delta (positivo o negativo).
    Devuelve True si se aplicó correctamente.
    """
    db = mongo_models.get_db()
    if db is None:
        return False
    # Primero intenta como ObjectId
    try:
        oid = ObjectId(product_id)
        res = db.productos.update_one({'_id': oid}, {'$inc': {'existencia': delta}})
        if res.modified_count > 0:
            return True
    except (InvalidId, TypeError):
        # valor no es ObjectId válido; seguiremos con fallback
        pass
    except Exception:
        # un error inesperado al usar ObjectId — seguiremos al fallback
        pass

    # fallback por id string (campo `id` usado en algunos documentos)
    try:
        res = db.productos.update_one({'id': product_id}, {'$inc': {'existencia': delta}})
        return res.modified_count > 0
    except Exception:
        return False
