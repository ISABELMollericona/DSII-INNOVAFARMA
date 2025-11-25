#!/usr/bin/env python3
"""Seed script for farmacia area: productos, lotes, sucursales y stock_sucursal.

Usage:
  - Set environment variable `MONGO_URI`, e.g.
      setx MONGO_URI "mongodb://localhost:27017/innovfarma"
    or pass --uri on the command line.
  - Run: `python scripts/seed_farmacia.py` (from repo root)
  - Use `--force` to remove previously seeded documents created by this script.

This script marks created documents with `seeded_by: 'seed_farmacia_v1'` so
they can be identified/removed safely.
"""
from datetime import datetime, timedelta
import random
import os
import argparse
from pymongo import MongoClient
from bson import ObjectId


SEED_TAG = 'seed_farmacia_v1'


def get_db(uri=None, dbname=None):
    uri = uri or os.environ.get('MONGO_URI') or 'mongodb://localhost:27017/innovfarma'
    # allow passing explicit dbname, otherwise try to use DB in URI or fallback
    client = MongoClient(uri)
    if dbname:
        return client[dbname]
    # try to extract DB from URI
    try:
        # if URI contains a path like /dbname
        if '/' in uri and not uri.endswith('/'):
            path = uri.split('/', 3)
            if len(path) >= 4 and path[3]:
                return client[path[3]]
    except Exception:
        pass
    return client.get_database()


def seed(db, force=False):
    # Check for previous seed
    existing = db.productos.count_documents({'seeded_by': SEED_TAG})
    if existing and not force:
        print(f"Found {existing} previously seeded productos. Use --force to reseed.")
        return

    if force:
        print('Removing previous seeded documents...')
        db.productos.delete_many({'seeded_by': SEED_TAG})
        db.lotes.delete_many({'seeded_by': SEED_TAG})
        db.stock_sucursal.delete_many({'seeded_by': SEED_TAG})
        db.sucursales.delete_many({'seeded_by': SEED_TAG})

    print('Inserting sucursales...')
    sucursales = [
        {'codigo': 'S001', 'nombre': 'Sucursal Central', 'direccion': 'Av. Principal 123', 'seeded_by': SEED_TAG},
        {'codigo': 'S002', 'nombre': 'Sucursal Norte', 'direccion': 'Calle Norte 45', 'seeded_by': SEED_TAG}
    ]
    res = db.sucursales.insert_many(sucursales)
    suc_ids = [str(_id) for _id in res.inserted_ids]

    print('Inserting productos...')
    sample_products = [
        ('PARACETAMOL 500MG', 'PARA500'),
        ('IBUPROFENO 400MG', 'IBU400'),
        ('AMOXICILINA 500MG', 'AMOX500'),
        ('OMEPRAZOL 20MG', 'OMEP20'),
        ('LORATADINA 10MG', 'LORA10'),
        ('METFORMINA 850MG', 'METF850'),
        ('ATORVASTATINA 20MG', 'ATOR20'),
        ('CEFTRIAXONA 1G', 'CEF1G'),
        ('VITAMINA C 500MG', 'VITC500'),
        ('SALBUTAMOL 100MCG', 'SALB100')
    ]

    productos = []
    for name, code in sample_products:
        p = {
            'codigo': code,
            'Nombre_comercial': name,
            'Precio_venta': round(random.uniform(20, 500), 2),
            'id_marca': 'marca_' + code.lower(),
            'id_laboratorio': 'lab_' + code.lower(),
            'Control_inventario': 1,
            'existencia': 0,
            'seeded_by': SEED_TAG
        }
        productos.append(p)

    res = db.productos.insert_many(productos)
    prod_ids = list(res.inserted_ids)

    print(f'Inserted {len(prod_ids)} productos')

    print('Inserting lotes and updating existencia...')
    lote_docs = []
    today = datetime.utcnow().date()
    for pid in prod_ids:
        # create between 1 and 3 lotes
        for i in range(random.randint(1, 3)):
            # choose expiry: some expired, some near, some far
            choice = random.random()
            if choice < 0.2:
                cad = today - timedelta(days=random.randint(10, 180))
            elif choice < 0.6:
                cad = today + timedelta(days=random.randint(1, 45))
            else:
                cad = today + timedelta(days=random.randint(90, 720))
            cantidad = random.randint(5, 200)
            lote = {
                'producto_id': str(pid),
                'lote': f'L{random.randint(1000,9999)}',
                'caducidad': cad.isoformat(),
                'cantidad': cantidad,
                'created_at': datetime.utcnow(),
                'seeded_by': SEED_TAG
            }
            lote_docs.append(lote)
    if lote_docs:
        res = db.lotes.insert_many(lote_docs)
        print(f'Inserted {len(res.inserted_ids)} lotes')

    # update product existencia based on lotes
    for pid in prod_ids:
        pid_str = str(pid)
        total = db.lotes.aggregate([
            {'$match': {'producto_id': pid_str}},
            {'$group': {'_id': '$producto_id', 'sum': {'$sum': '$cantidad'}}}
        ])
        total_val = 0
        for t in total:
            total_val = int(t.get('sum', 0))
        db.productos.update_one({'_id': pid}, {'$set': {'existencia': total_val}})

    # create stock_sucursal documents (split existencia across sucursales)
    print('Creating stock_sucursal entries...')
    stock_docs = []
    for pid in prod_ids:
        pid_str = str(pid)
        prod = db.productos.find_one({'_id': pid})
        existencia = int(prod.get('existencia', 0))
        if existencia <= 0:
            continue
        # split between sucursales
        parts = [random.randint(0, existencia) for _ in range(len(suc_ids))]
        # normalize to sum existencia
        s = sum(parts)
        if s == 0:
            parts[0] = existencia
            s = existencia
        factor = existencia / s
        for idx, suc_id in enumerate(suc_ids):
            cantidad = int(round(parts[idx] * factor))
            doc = {
                'producto_id': pid_str,
                'sucursal_id': suc_id,
                'cantidad': cantidad,
                'updated_at': datetime.utcnow(),
                'seeded_by': SEED_TAG
            }
            stock_docs.append(doc)
    if stock_docs:
        res = db.stock_sucursal.insert_many(stock_docs)
        print(f'Inserted {len(res.inserted_ids)} stock_sucursal entries')

    print('Seeding completed.')
    # summary
    print('Summary:')
    print('  productos:', db.productos.count_documents({'seeded_by': SEED_TAG}))
    print('  lotes:', db.lotes.count_documents({'seeded_by': SEED_TAG}))
    print('  sucursales:', db.sucursales.count_documents({'seeded_by': SEED_TAG}))
    print('  stock_sucursal:', db.stock_sucursal.count_documents({'seeded_by': SEED_TAG}))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--uri', help='MongoDB URI (overrides MONGO_URI env)')
    parser.add_argument('--db', help='Database name (optional)')
    parser.add_argument('--force', action='store_true', help='Remove previous seeded documents and reseed')
    args = parser.parse_args()

    db = get_db(uri=args.uri, dbname=args.db)
    print('Connected to MongoDB, database:', db.name)
    seed(db, force=args.force)


if __name__ == '__main__':
    main()
