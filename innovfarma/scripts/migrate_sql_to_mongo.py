"""
Migration script: copy core MySQL tables into MongoDB collections
Usage: python scripts/migrate_sql_to_mongo.py

It reads DB connection from `config.Config` (uses SQLALCHEMY_DATABASE_URI) and MONGO_URI env var.
Be careful: run on a safe copy / backup first. This script inserts documents into Mongo.
"""
from __future__ import annotations
import sys
import os
from dotenv import load_dotenv
from urllib.parse import urlparse
from datetime import datetime

# make project root importable
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, ROOT)

from config import Config

from sqlalchemy import create_engine, text
from pymongo import MongoClient

load_dotenv(os.path.join(ROOT, '.env'))

SQL_URI = getattr(Config, 'SQLALCHEMY_DATABASE_URI', None)
MONGO_URI = os.environ.get('MONGO_URI') or getattr(Config, 'MONGO_URI', None)

if not SQL_URI:
    print('No SQLALCHEMY_DATABASE_URI found in config. Aborting.')
    sys.exit(1)
if not MONGO_URI:
    print('No MONGO_URI found in environment/config. Aborting.')
    sys.exit(1)

print('Connecting to SQL:', SQL_URI)
print('Connecting to Mongo:', MONGO_URI)

engine = create_engine(SQL_URI)
mongo = MongoClient(MONGO_URI)
db = mongo.get_default_database()

# helpers
def fetch_all(conn, table):
    rows = conn.execute(text(f"SELECT * FROM {table}")).mappings().all()
    return rows

# mappings to keep relations
product_map = {}   # sql_id -> mongo_id (str)
user_map = {}
client_map = {}
category_map = {}
subcat_map = {}
marca_map = {}
lab_map = {}
unidad_map = {}
factura_map = {}

with engine.connect() as conn:
    # 1) categories
    try:
        rows = fetch_all(conn, 'categoria')
        print(f'Found {len(rows)} categoria rows')
        for r in rows:
            doc = dict(r)
            doc['sql_id'] = int(r['id'])
            res = db.categoria.insert_one(doc)
            category_map[r['id']] = str(res.inserted_id)
    except Exception as e:
        print('categoria table error or not present:', e)

    # 2) subcategoria
    try:
        rows = fetch_all(conn, 'subcategoria')
        print(f'Found {len(rows)} subcategoria rows')
        for r in rows:
            doc = dict(r)
            doc['sql_id'] = int(r['id'])
            # keep reference to sql id of category as well
            doc['id_categoria_sql'] = r.get('id_categoria')
            res = db.subcategoria.insert_one(doc)
            subcat_map[r['id']] = str(res.inserted_id)
    except Exception as e:
        print('subcategoria table error or not present:', e)

    # 3) forma_farmaceutica
    try:
        rows = fetch_all(conn, 'forma_farmaceutica')
        print(f'Found {len(rows)} forma_farmaceutica rows')
        for r in rows:
            doc = dict(r)
            doc['sql_id'] = int(r['id'])
            res = db.forma_farmaceutica.insert_one(doc)
    except Exception as e:
        print('forma_farmaceutica table error or not present:', e)

    # 4) laboratorios
    try:
        rows = fetch_all(conn, 'laboratorios')
        print(f'Found {len(rows)} laboratorios rows')
        for r in rows:
            doc = dict(r)
            doc['sql_id'] = int(r['id'])
            res = db.laboratorios.insert_one(doc)
            lab_map[r['id']] = str(res.inserted_id)
    except Exception as e:
        print('laboratorios table error or not present:', e)

    # 5) marca
    try:
        rows = fetch_all(conn, 'marca')
        print(f'Found {len(rows)} marca rows')
        for r in rows:
            doc = dict(r)
            doc['sql_id'] = int(r['id'])
            res = db.marca.insert_one(doc)
            marca_map[r['id']] = str(res.inserted_id)
    except Exception as e:
        print('marca table error or not present:', e)

    # 6) unidad_medida
    try:
        rows = fetch_all(conn, 'unidad_medida')
        print(f'Found {len(rows)} unidad_medida rows')
        for r in rows:
            doc = dict(r)
            doc['sql_id'] = int(r['id'])
            res = db.unidad_medida.insert_one(doc)
            unidad_map[r['id']] = str(res.inserted_id)
    except Exception as e:
        print('unidad_medida table error or not present:', e)

    # 7) productos
    try:
        rows = fetch_all(conn, 'productos')
        print(f'Found {len(rows)} productos rows')
        for r in rows:
            pid = int(r['id'])
            doc = {
                'sql_id': pid,
                'codigo': r.get('codigo'),
                'Nombre_comercial': r.get('nombre_comercial') or r.get('Nombre_comercial'),
                'Nombre_generico': r.get('nombre_generico') or r.get('Nombre_generico'),
                'Precio_compra': float(r['precio_compra']) if r.get('precio_compra') is not None else None,
                'Precio_venta': float(r['precio_venta']) if r.get('precio_venta') is not None else None,
                'stock_actual': int(r.get('stock_actual') or 0),
                        'fecha_vencimiento': None,
                'id_marca_sql': r.get('id_marca'),
                'id_subcategoria_sql': r.get('id_subcategoria'),
                'id_forma_farmaceutica_sql': r.get('id_forma_farmaceutica'),
                'id_unidad_medida_sql': r.get('id_unidad_medida'),
                'id_laboratorio_sql': r.get('id_laboratorio')
            }
            # keep legacy names too for frontend compatibility
            if doc['Nombre_comercial'] and 'Nombre_comercial' not in doc:
                doc['Nombre_comercial'] = doc.pop('nombre_comercial')
            res = db.productos.insert_one(doc)
            product_map[pid] = str(res.inserted_id)
    except Exception as e:
        print('productos table error or not present:', e)

    # 8) usuarios
    try:
        rows = fetch_all(conn, 'usuarios')
        print(f'Found {len(rows)} usuarios rows')
        for r in rows:
            uid = int(r['id'])
            doc = dict(r)
            doc['sql_id'] = uid
            res = db.usuarios.insert_one(doc)
            user_map[uid] = str(res.inserted_id)
    except Exception as e:
        print('usuarios table error or not present:', e)

    # 9) clientes
    try:
        rows = fetch_all(conn, 'clientes')
        print(f'Found {len(rows)} clientes rows')
        for r in rows:
            cid = int(r['id'])
            doc = dict(r)
            # normalize field name used by mongo helpers
            if 'nit_ci' in doc:
                doc['ci'] = doc.pop('nit_ci')
            doc['sql_id'] = cid
            res = db.clientes.insert_one(doc)
            client_map[cid] = str(res.inserted_id)
    except Exception as e:
        print('clientes table error or not present:', e)

    # 10) facturas
    try:
        rows = fetch_all(conn, 'facturas')
        print(f'Found {len(rows)} facturas rows')
        for r in rows:
            fid_sql = int(r['id'])
            doc = dict(r)
            # map user and client ids to mongo ids if possible
            uid_val = r.get('id_usuario')
            if uid_val is not None:
                try:
                    uid_int = int(uid_val)
                    doc['id_usuario'] = user_map.get(uid_int, uid_val)
                except Exception:
                    doc['id_usuario'] = uid_val
            cid_val = r.get('id_cliente')
            if cid_val is not None:
                try:
                    cid_int = int(cid_val)
                    doc['id_cliente'] = client_map.get(cid_int, cid_val)
                except Exception:
                    doc['id_cliente'] = cid_val
            # ensure fecha is datetime
            if isinstance(doc.get('fecha'), str):
                try:
                    doc['fecha'] = datetime.fromisoformat(doc['fecha'])
                except Exception:
                    pass
            doc['sql_id'] = fid_sql
            res = db.facturas.insert_one(doc)
            factura_map[fid_sql] = str(res.inserted_id)
    except Exception as e:
        print('facturas table error or not present:', e)

    # 11) detalle_factura
    try:
        rows = fetch_all(conn, 'detalle_factura')
        print(f'Found {len(rows)} detalle_factura rows')
        for r in rows:
            doc = dict(r)
            # replace id_factura and id_producto with mongo inserted ids (strings)
            id_fact_val = r.get('id_factura')
            if id_fact_val is not None:
                try:
                    idf_int = int(id_fact_val)
                    doc['id_factura'] = factura_map.get(idf_int) or id_fact_val
                except Exception:
                    doc['id_factura'] = id_fact_val
            id_prod_val = r.get('id_producto')
            if id_prod_val is not None:
                try:
                    idp_int = int(id_prod_val)
                    doc['id_producto'] = product_map.get(idp_int) or id_prod_val
                except Exception:
                    doc['id_producto'] = id_prod_val
            # keep sql id
            doc['sql_id'] = int(r['id'])
            res = db.detalle_factura.insert_one(doc)
    except Exception as e:
        print('detalle_factura table error or not present:', e)

    # 12) stock_inventario
    try:
        rows = fetch_all(conn, 'stock_inventario')
        print(f'Found {len(rows)} stock_inventario rows')
        for r in rows:
            doc = dict(r)
            idp_val = r.get('id_producto')
            if idp_val is not None:
                try:
                    idp_int = int(idp_val)
                    doc['id_producto'] = product_map.get(idp_int) or idp_val
                except Exception:
                    doc['id_producto'] = idp_val
            doc['sql_id'] = int(r['id'])
            res = db.stock_inventario.insert_one(doc)
    except Exception as e:
        print('stock_inventario table error or not present:', e)

print('\nMigration complete.')
print(f'Inserted {len(product_map)} products, {len(user_map)} users, {len(client_map)} clients, {len(factura_map)} facturas')
