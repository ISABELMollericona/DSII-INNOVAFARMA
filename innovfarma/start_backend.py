#!/usr/bin/env python
"""
Script para iniciar el backend de InnovFarma
Conecta a la base de datos MySQL en Aiven
"""

import os
import sys
from dotenv import load_dotenv

# Cargar variables de entorno
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

# Importar la aplicación Flask
from app import create_app, db
from app.models import User

# Crear la instancia de la aplicación
app = create_app()

@app.shell_context_processor
def make_shell_context():
    """Contexto para flask shell"""
    return {'db': db, 'User': User}

@app.before_request
def before_request():
    """Hook ejecutado antes de cada request"""
    pass

@app.after_request
def after_request(response):
    """Hook ejecutado después de cada request"""
    return response

if __name__ == '__main__':
    with app.app_context():
        # Crear las tablas si no existen
        try:
            db.create_all()
            print("✓ Tablas de base de datos verificadas/creadas")
        except Exception as e:
            print(f"⚠ Error al crear tablas: {e}")
        
        # Información de conexión
        print("\n" + "="*60)
        print("🚀 Iniciando InnovFarma Backend")
        print("="*60)
        print(f"Database Host: {os.environ.get('DATABASE_HOST', 'N/A')}")
        print(f"Database Port: {os.environ.get('DATABASE_PORT', 'N/A')}")
        print(f"Database Name: {os.environ.get('DATABASE_NAME', 'N/A')}")
        print(f"Flask Environment: {os.environ.get('FLASK_ENV', 'production')}")
        print("="*60)
        print("Server running on: http://0.0.0.0:5000")
        print("Press CTRL+C to quit")
        print("="*60 + "\n")
    
    # Iniciar el servidor Flask
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=os.environ.get('FLASK_ENV') == 'development',
        use_reloader=True
    )
