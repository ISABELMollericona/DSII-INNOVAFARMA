#!/usr/bin/env python3
"""
Script seguro para crear dos usuarios iniciales en MongoDB:
 - admin
 - vendedor

Uso (PowerShell):
    python ./scripts/create_initial_users.py

Requisitos:
 - Definir MONGO_URI en un archivo .env en la raíz del proyecto o en las variables de entorno.
 - MongoDB debe estar accesible desde la máquina donde se ejecuta el script.

El script imprimirá los IDs creados y las credenciales en texto plano (para uso inicial).
Cambie las contraseñas tras el primer inicio de sesión.
"""

import os
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient
from werkzeug.security import generate_password_hash


load_dotenv()

MONGO_URI = os.environ.get('MONGO_URI')
if not MONGO_URI:
    print('Error: MONGO_URI no está definido en .env o en las variables de entorno.')
    print('Abra .env y añada: MONGO_URI=mongodb://usuario:pass@host:port/innovfarma')
    raise SystemExit(1)


def main():
    print(f'Conectando a MongoDB...')
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    try:
        client.admin.command('ping')
    except Exception as e:
        print('Error al conectar a MongoDB:', e)
        raise SystemExit(1)

    # Si la URI no incluye una base de datos por defecto, usar 'innovfarma'
    try:
        db = client.get_database()
    except Exception:
        db = client['innovfarma']
    usuarios = db['usuarios']

    # Credenciales iniciales (puede cambiarlas aquí antes de ejecutar)
    admin_creds = {
        'nombre': 'Administrador',
        'apellidos': 'Sistema',
        'username': 'admin',
        'email': 'admin@localhost',
        'rol': 'admin',
        'id_sucursal': None,
        'imagen': None,
        # contraseña en texto plano para impresión (cambiar si desea otra)
        'plain_password': 'Admin123!'
    }

    vendedor_creds = {
        'nombre': 'Vendedor',
        'apellidos': 'Tienda',
        'username': 'vendedor',
        'email': 'vendedor@localhost',
        'rol': 'vendedor',
        'id_sucursal': None,
        'imagen': None,
        'plain_password': 'Vendedor123!'
    }

    to_create = [admin_creds, vendedor_creds]

    created = []
    for u in to_create:
        pwd = u.pop('plain_password')
        doc = u.copy()
        doc['password'] = generate_password_hash(pwd)
        doc['created_at'] = datetime.utcnow()
        # evitar duplicados por username/email
        existing = usuarios.find_one({'$or': [{'username': doc.get('username')}, {'email': doc.get('email')} ]})
        if existing:
            print(f"- Usuario ya existe (username/email): {doc.get('username')}/{doc.get('email')} -> _id: {existing.get('_id')}")
            created.append({'username': doc.get('username'), 'email': doc.get('email'), 'id': str(existing.get('_id')), 'password': '(existing)'} )
            continue

        res = usuarios.insert_one(doc)
        created.append({'username': doc.get('username'), 'email': doc.get('email'), 'id': str(res.inserted_id), 'password': pwd})
        print(f"Creado usuario: {doc.get('username')} (id: {res.inserted_id})")

    print('\nResumen:')
    for c in created:
        print(f"- username: {c['username']}, email: {c['email']}, id: {c['id']}, password: {c['password']}")

    print('\nImportante: cambie las contraseñas después del primer acceso.')
    client.close()


if __name__ == '__main__':
    main()
