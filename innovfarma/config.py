import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    

    # MongoDB (Flask-PyMongo)
    MONGO_URI = os.environ.get('MONGO_URI') or os.environ.get('DATABASE_URL_MONGO') or os.environ.get('MONGO_URL')

