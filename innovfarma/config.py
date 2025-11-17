import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Database configuration with SSL support for Aiven
    DATABASE_URL = os.environ.get('DATABASE_URL')
    if DATABASE_URL:
        SQLALCHEMY_DATABASE_URI = DATABASE_URL
        # SQLAlchemy engine options for SSL
        SQLALCHEMY_ENGINE_OPTIONS = {
            'pool_pre_ping': True,
            'pool_recycle': 3600,
            'connect_args': {
                'ssl': {
                    'ssl_ca': os.environ.get('DATABASE_SSL_CA_PATH'),
                    'ssl_verify_cert': True,
                    'ssl_verify_identity': True,
                }
            } if os.environ.get('DATABASE_SSL_CA_PATH') else {}
        }
    else:
        SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'data.sqlite')
        SQLALCHEMY_ENGINE_OPTIONS = {
            'pool_pre_ping': True,
            'pool_recycle': 3600,
        }
    
    # MongoDB (Flask-PyMongo)
    MONGO_URI = os.environ.get('MONGO_URI') or os.environ.get('DATABASE_URL_MONGO') or os.environ.get('MONGO_URL')

