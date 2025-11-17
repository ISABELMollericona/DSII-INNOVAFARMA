import os
from dotenv import load_dotenv
from app import create_app, db

# Cargar variables de entorno
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        # Crear las tablas si no existen
        try:
            db.create_all()
            print("✓ Tablas de base de datos verificadas/creadas")
        except Exception as e:
            print(f"⚠ Error al crear tablas: {e}")
        
        # Información de conexión
        print("\n" + "="*70)
        print("🚀 Iniciando InnovFarma Backend")
        print("="*70)
        print(f"📍 URL: http://localhost:5000")
        print(f"📍 API Base: http://localhost:5000/api")
        print(f"🔧 Environment: {os.environ.get('FLASK_ENV', 'development')}")
        print("="*70)
        print("Endpoints disponibles:")
        print("  • GET  / - Estado de la API")
        print("  • POST /api/login - Iniciar sesión")
        print("  • GET  /api/products - Lista de productos")
        print("  • GET  /api/invoices - Lista de facturas")
        print("  • GET  /api/clients - Lista de clientes")
        print("="*70)
        print("Presiona CTRL+C para detener el servidor\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
