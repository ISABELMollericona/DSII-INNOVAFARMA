from flask import Flask
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_cors import CORS

from .models import db, User

migrate = Migrate()
login_manager = LoginManager()


def create_app(config_object='config.Config'):
    app = Flask(__name__, instance_relative_config=False)
    app.config.from_object(config_object)

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    CORS(app, supports_credentials=True)

    # blueprints
    from .auth.routes import auth_bp
    from .products.routes import products_bp
    from .invoices.routes import invoices_bp
    from .clients.routes import clients_bp

    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(products_bp, url_prefix='/api')
    app.register_blueprint(invoices_bp, url_prefix='/api')
    app.register_blueprint(clients_bp, url_prefix='/api')

    # Ruta raíz
    @app.route('/')
    def index():
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
        # Cargar usuario desde SQL
        user = User.query.get(user_id)
        return user

    return app
