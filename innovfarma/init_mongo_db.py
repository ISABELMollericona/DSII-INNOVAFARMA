#!/usr/bin/env python3
"""
Script para inicializar la base de datos MongoDB 'innovfarma' 
con colecciones y índices basados en los modelos Laravel.

Uso: python init_mongo_db.py
"""

import os
import sys
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError, OperationFailure
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

MONGO_URI = os.environ.get('MONGO_URI')
if not MONGO_URI:
    print("Error: MONGO_URI no está definido en .env")
    sys.exit(1)

print(f"Conectando a MongoDB: {MONGO_URI[:50]}...")

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    # Verificar conexión
    client.admin.command('ping')
    print("✓ Conexión exitosa a MongoDB")
except ServerSelectionTimeoutError as e:
    print(f"✗ Error de conexión: {e}")
    sys.exit(1)

db = client['innovfarma']
print(f"✓ Base de datos 'innovfarma' lista")

# Definir colecciones y esquemas según modelos Laravel
COLLECTIONS = {
    'usuarios': {
        'fields': ['nombre', 'apellidos', 'username', 'email', 'password', 'rol', 'imagen', 'id_sucursal'],
        'indices': [
            ('email', True),
            ('username', True),
            ('id_sucursal', False),
        ]
    },
    'productos': {
        'fields': [
            'codigo', 'Nombre_comercial', 'Nombre_generico', 'Accion_terapeutica',
            'Principio_activo', 'Concentracion', 'Presentacion', 'Precio_compra',
            'Cod_barrras', 'Margen_utilidad', 'Precio_venta', 'cod_impuestos_nacionales',
            'Cantidad_minima_pedido', 'Cantidad_maxima_inventario', 'Tiempo_sin_movimiento',
            'Cantidad_minima_inventario', 'Alerta_caducidad_dias', 'Cod_nandina',
            'Control_inventario', 'Receta_medica', 'Favorito', 'Granel',
            'Medicamento_controlado', 'Solo_compra', 'id_subcategoria', 'id_forma_farmaceutica',
            'id_marca', 'id_laboratorio', 'id_unidad_medida'
        ],
        'indices': [
            ('codigo', False),
            ('Nombre_comercial', False),
            ('id_subcategoria', False),
            ('id_marca', False),
            ('id_laboratorio', False),
        ]
    },
    'clientes': {
        'fields': ['nit_ci', 'nombre', 'correo'],
        'indices': [
            ('nit_ci', True),
            ('nombre', False),
        ]
    },
    'facturas': {
        'fields': ['id_usuario', 'id_cliente', 'id_sucursal', 'fecha', 'total'],
        'indices': [
            ('id_usuario', False),
            ('id_cliente', False),
            ('id_sucursal', False),
            ('fecha', False),
        ]
    },
    'detalle_factura': {
        'fields': ['id_factura', 'id_producto', 'cantidad', 'precio_unitario', 'subtotal'],
        'indices': [
            ('id_factura', False),
            ('id_producto', False),
        ]
    },
    'sucursales': {
        'fields': ['nombre', 'direccion', 'ciudad', 'telefono'],
        'indices': [
            ('nombre', True),
        ]
    },
    'stock_sucursal': {
        'fields': ['id_producto', 'id_sucursal', 'cantidad', 'cantidad_minima'],
        'indices': [
            ('id_producto', False),
            ('id_sucursal', False),
        ]
    },
    'categorias': {
        'fields': ['nombre', 'descripcion'],
        'indices': [
            ('nombre', True),
        ]
    },
    'subcategorias': {
        'fields': ['nombre', 'id_categoria', 'descripcion'],
        'indices': [
            ('nombre', False),
            ('id_categoria', False),
        ]
    },
    'marcas': {
        'fields': ['nombre', 'descripcion'],
        'indices': [
            ('nombre', True),
        ]
    },
    'laboratorios': {
        'fields': ['nombre', 'descripcion', 'ciudad'],
        'indices': [
            ('nombre', True),
        ]
    },
    'forma_farmaceutica': {
        'fields': ['nombre', 'descripcion'],
        'indices': [
            ('nombre', True),
        ]
    },
    'unidad_medida': {
        'fields': ['nombre', 'abreviatura'],
        'indices': [
            ('nombre', True),
            ('abreviatura', True),
        ]
    },
}

# Crear colecciones e índices
for coll_name, coll_info in COLLECTIONS.items():
    try:
        # Crear colección
        if coll_name not in db.list_collection_names():
            db.create_collection(coll_name)
            print(f"  ✓ Colección '{coll_name}' creada")
        else:
            print(f"  - Colección '{coll_name}' ya existe")
        
        # Crear índices
        coll = db[coll_name]
        for field, unique in coll_info['indices']:
            try:
                coll.create_index(field, unique=unique)
                print(f"    ✓ Índice en '{field}' (unique={unique})")
            except OperationFailure as e:
                print(f"    ⚠ Índice en '{field}': {str(e)[:50]}")
    except Exception as e:
        print(f"  ✗ Error en '{coll_name}': {e}")

print("\n✓ Inicialización de base de datos completada")
print("\nColecciones creadas:")
for coll in sorted(db.list_collection_names()):
    print(f"  - {coll}")

client.close()
