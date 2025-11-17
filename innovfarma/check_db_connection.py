"""Script de comprobación rápida de conexión a la base de datos usando SQLAlchemy.

Uso:
  1) Activar entorno virtual e instalar dependencias:
     pip install -r requirements.txt
  2) Ejecutar:
     python check_db_connection.py

El script lee la variable DATABASE_URL de .env o del entorno y trata de crear un engine y conectarse.
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    print('ERROR: no se encontró DATABASE_URL en .env o variables de entorno')
    raise SystemExit(1)

print('Intentando conectar con:', DATABASE_URL)

try:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    with engine.connect() as conn:
        # Usar text() para cumplir con las firmas de SQLAlchemy y Pylance
        value = conn.scalar(text("SELECT 1"))
        print('Conexión OK, resultado de prueba:', value)
except OperationalError as e:
    print('Error de conexión:', e)
    raise SystemExit(1)
except Exception as e:
    print('Error inesperado al conectar:', e)
    raise SystemExit(1)
