import os
from dotenv import load_dotenv

# Import directo desde el paquete `innovfarma` — esto elimina advertencias
# estáticas en el editor (Pylance) y funciona cuando ejecutas desde la raíz.
from innovfarma.app import create_app, db
import logging

# Cargar variables de entorno (archivo .env en la raíz del repo)
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
        # Mostrar configuración de cookies de sesión para depuración
        try:
            print(f"🔐 SESSION_COOKIE_DOMAIN: {app.config.get('SESSION_COOKIE_DOMAIN')}")
            print(f"📦 SESSION_COOKIE_SAMESITE: {app.config.get('SESSION_COOKIE_SAMESITE')}")
            print(f"🔒 SESSION_COOKIE_SECURE: {app.config.get('SESSION_COOKIE_SECURE')}")
        except Exception:
            pass
        # Mostrar valor de FRONTEND_DEMO_PREFILL para debugging (útil en despliegues)
        try:
            print(f"⚙️ FRONTEND_DEMO_PREFILL: {app.config.get('FRONTEND_DEMO_PREFILL', False)}")
        except Exception:
            pass
        print("="*70)
        print("Endpoints disponibles:")
        print("  • GET        / - Estado de la API")
        print("  • POST /api/login - Iniciar sesión")
        print("  • GET  /api/products - Lista de productos")
        print("  • GET  /api/invoices - Lista de facturas")
        print("  • GET  /api/clients - Lista de clientes")
        print("="*70)
        print("Presiona CTRL+C para detener el servidor\n")
    
    # Use $PORT when provided by the host (Render sets $PORT) and
    # enable debug only when FLASK_ENV != 'production'. This keeps
    # the behavior consistent when Render runs `python run.py`.
    # configure basic logging (so logs are consistent in Render)
    log_level = os.environ.get('LOG_LEVEL', 'INFO').upper()
    logging.basicConfig(level=log_level, format='%(asctime)s %(levelname)s %(name)s: %(message)s')
    logger = logging.getLogger('run')

    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_ENV', 'development') != 'production'
    logger.info(f"Starting server on 0.0.0.0:{port} (debug={debug_mode})")

    if not debug_mode:
        # In production use a real WSGI server. Try waitress first (pure-Python WSGI server)
        try:
            from waitress import serve
            threads = int(os.environ.get('WAITRESS_THREADS', '4'))
            logger.info('Running with waitress WSGI server (threads=%s)', threads)
            serve(app, host='0.0.0.0', port=port, threads=threads)
        except Exception as e:
            logger.warning('waitress unavailable or failed (%s) — falling back to built-in server', e)
            app.run(host='0.0.0.0', port=port, debug=False)
    else:
        # Development / debug: run Flask's built-in server (with reloader)
        app.run(host='0.0.0.0', port=port, debug=True)
