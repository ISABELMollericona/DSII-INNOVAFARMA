#!/usr/bin/env python3
"""
Script para añadir/actualizar el campo `existencia` en todos los documentos
de la colección `productos` con un entero aleatorio entre 0 y 100.

Uso:
  python add_random_existencia.py [--yes]

El script lee la URI de Mongo desde `config.Config.MONGO_URI` o variables de
entorno `MONGO_URI`, `DATABASE_URL_MONGO`, `MONGO_URL`. Si la URI no contiene
nombre de base de datos por defecto solicitará al usuario el nombre.
"""
import os
import sys
import argparse
import random

from pymongo import MongoClient, UpdateOne

try:
    from config import Config
except Exception:
    Config = None


def get_mongo_uri():
    # Try config class first, then env vars
    uri = None
    if Config is not None:
        uri = getattr(Config, 'MONGO_URI', None)
    uri = uri or os.environ.get('MONGO_URI') or os.environ.get('DATABASE_URL_MONGO') or os.environ.get('MONGO_URL')
    return uri


def main(yes=False):
    uri = get_mongo_uri()
    if not uri:
        print("No se encontró MONGO_URI en config ni en variables de entorno.")
        print("Define MONGO_URI en .env o en la variable de entorno y vuelve a ejecutar.")
        sys.exit(1)

    print('Conectando a MongoDB...')
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    try:
        client.admin.command('ping')
    except Exception as e:
        print('Error conectando a Mongo:', e)
        sys.exit(1)

    # determine DB: prefer default database from URI, else ask
    db = None
    try:
        db = client.get_default_database()
    except Exception:
        db = None

    if db is None:
        dbname = os.environ.get('MONGO_DBNAME')
        if not dbname:
            dbname = input('No se detectó base de datos por defecto en la URI. Indica el nombre de la base de datos: ').strip()
            if not dbname:
                print('Nombre de base de datos no proporcionado. Abortando.')
                sys.exit(1)
        db = client[dbname]

    col = db.productos
    total = col.count_documents({})
    print(f"Base de datos: {db.name} | colección: productos | documentos encontrados: {total}")
    if total == 0:
        print('No hay documentos en la colección. Nada que hacer.')
        return

    if not yes:
        confirm = input(f"¿Actualizar {total} documentos estableciendo 'existencia' aleatoria 0-100? (y/N): ")
        if confirm.lower() != 'y':
            print('Operación cancelada por el usuario.')
            return

    updated = 0
    batch = []
    BATCH_SIZE = 500
    cursor = col.find({}, {'_id': 1})
    for doc in cursor:
        val = random.randint(0, 100)
        batch.append(UpdateOne({'_id': doc['_id']}, {'$set': {'existencia': val}}))
        if len(batch) >= BATCH_SIZE:
            res = col.bulk_write(batch)
            updated += res.modified_count
            batch = []

    if batch:
        res = col.bulk_write(batch)
        updated += res.modified_count

    print(f'Actualización finalizada. Documentos actualizados: {updated}/{total}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Añadir existencia aleatoria a productos en MongoDB')
    parser.add_argument('-y', '--yes', action='store_true', help='No pedir confirmación, ejecutar directamente')
    args = parser.parse_args()
    main(yes=args.yes)
