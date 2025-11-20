from flask import Flask
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_cors import CORS

from .models import db
from .mongo_client import mongo
from .mongo_models import find_user_by_id

migrate = Migrate()
login_manager = LoginManager()


def create_app(config_object='innovfarma.config.Config'):
    app = Flask(__name__, instance_relative_config=False)
    app.config.from_object(config_object)

    db.init_app(app)
    # init mongo
    mongo.init_app(app)
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

    @login_manager.user_loader
    def load_user(user_id):
        # try loading from Mongo first
        doc = find_user_by_id(user_id)
        if doc:
            # lightweight user object for Flask-Login
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
                def to_dict(self):
                    return self._d
            return U(doc)
        return None

    return app
