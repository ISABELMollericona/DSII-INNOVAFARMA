import os
from flask import Flask, send_from_directory
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_cors import CORS

from .models import db, User
from .mongo_client import mongo as pymongo

migrate = Migrate()
login_manager = LoginManager()


def create_app(config_object='innovfarma.config.Config'):
    # Determine project root and the path to the frontend static folder
    basedir = os.path.abspath(os.path.dirname(__file__))
    project_root = os.path.abspath(os.path.join(basedir, '..'))
    static_dir = os.path.join(project_root, 'front_inicial')

    # Create Flask app configured to serve static frontend from `front_inicial`
    app = Flask(__name__, instance_relative_config=False, static_folder=static_dir, static_url_path='')
    app.config.from_object(config_object)

    # Ensure SQLALCHEMY_DATABASE_URI exists to avoid flask-sqlalchemy runtime errors
    # If no DB URI is configured (e.g., when running only with Mongo), fall back to a local sqlite file
    if not app.config.get('SQLALCHEMY_DATABASE_URI'):
        fallback_sqlite = os.path.join(project_root, 'data.sqlite')
        app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{fallback_sqlite}'

    # Initialize Mongo if MONGO_URI is set (prefer Mongo when provided)
    if app.config.get('MONGO_URI'):
        try:
            pymongo.init_app(app)
        except Exception:
            # if flask_pymongo not configured, ignore here and let errors surface elsewhere
            pass

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    CORS(app, supports_credentials=True)

    # blueprints
    from .auth.routes import auth_bp
    from .products.routes import products_bp
    from .invoices.routes import invoices_bp
    from .clients.routes import clients_bp
    from .inventarios.routes import inventarios_bp
    from .compras.routes import compras_bp

    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(products_bp, url_prefix='/api')
    app.register_blueprint(invoices_bp, url_prefix='/api')
    app.register_blueprint(clients_bp, url_prefix='/api')
    app.register_blueprint(inventarios_bp, url_prefix='/api')
    app.register_blueprint(compras_bp, url_prefix='/api')

    # Serve frontend index.html at root if the static frontend exists; otherwise return API status
    @app.route('/')
    def index():
        try:
            # If front_inicial/index.html exists, serve it
            return send_from_directory(static_dir, 'index.html')
        except Exception:
            return {
                'message': 'InnovFarma API - Backend running',
                'status': 'online',
                'version': '1.0.0',
                'endpoints': {
                    'auth': '/api/login',
                    'products': '/api/products',
                    'invoices': '/api/invoices',
                    'clients': '/api/clients'
                }
            }, 200

    @login_manager.user_loader
    def load_user(user_id):
        # Si se está usando Mongo, cargar usuario desde colección 'usuarios'
        if app.config.get('MONGO_URI'):
            try:
                from . import mongo_models
                doc = mongo_models.find_user_by_id(user_id)
                if not doc:
                    return None

                class U:
                    def __init__(self, d):
                        self._d = d
                    def get_id(self):
                        return self._d.get('id')
                    @property
                    def is_authenticated(self):
                        return True
                    @property
                    def is_active(self):
                        return True
                    @property
                    def is_anonymous(self):
                        return False

                return U(doc)
            except Exception:
                # fallback to SQL user loader
                pass

        # fallback: cargar usuario desde SQL
        user = User.query.get(user_id)
        return user

    return app
