#!/usr/bin/env python
"""
Script para verificar la conexión a la base de datos MySQL en Aiven
"""

import os
import sys
from dotenv import load_dotenv
import pymysql

# Cargar variables de entorno
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

def test_connection():
    """Prueba la conexión a la base de datos"""
    
    print("\n" + "="*60)
    print("🔍 Probando conexión a MySQL Aiven")
    print("="*60)
    
    # Obtener credenciales del .env
    host = os.environ.get('DATABASE_HOST', 'innovfarma-isabelmollericona1-2658.k.aivencloud.com')
    port = int(os.environ.get('DATABASE_PORT', 21546))
    user = os.environ.get('DATABASE_USER', 'avnadmin')
    password = os.environ.get('DATABASE_PASSWORD')
    database = os.environ.get('DATABASE_NAME', 'defaultdb')
    
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"User: {user}")
    print(f"Database: {database}")
    print("="*60)
    
    try:
        # Intentar conectarse
        connection = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            charset='utf8mb4'
        )
        
        print("✅ Conexión exitosa a la base de datos MySQL")
        
        # Ejecutar un query simple
        cursor = connection.cursor()
        cursor.execute("SELECT VERSION()")
        version = cursor.fetchone()
        print(f"✅ Versión de MySQL: {version[0]}")
        
        cursor.execute("SELECT DATABASE()")
        db_name = cursor.fetchone()
        print(f"✅ Base de datos actual: {db_name[0]}")
        
        cursor.close()
        connection.close()
        
        print("="*60)
        print("✅ Prueba completada exitosamente")
        print("="*60 + "\n")
        return True
        
    except pymysql.Error as e:
        print(f"❌ Error de conexión: {e}")
        print("="*60 + "\n")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        print("="*60 + "\n")
        return False

if __name__ == '__main__':
    success = test_connection()
    sys.exit(0 if success else 1)
