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
    # Session cookie settings: allow overriding the cookie domain and flags via environment
    # Useful in development when accessing the app by IP (e.g. 192.168.0.21)
    SESSION_COOKIE_DOMAIN = os.environ.get('SESSION_COOKIE_DOMAIN') or None
    # Set to 'Lax' or 'Strict' or 'None' (None requires Secure=True in browsers)
    SESSION_COOKIE_SAMESITE = os.environ.get('SESSION_COOKIE_SAMESITE', 'Lax')
    # In development you may want Secure=False; set to 'True' to enable
    SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'False').lower() in ('1', 'true', 'yes')

    # Frontend behavior (toggle demo prefill in auth modal).
    # Use environment variable FRONTEND_DEMO_PREFILL to explicitly enable demo prefill
    # (e.g. for local dev or CI). Defaults to False in production.
    FRONTEND_DEMO_PREFILL = os.environ.get('FRONTEND_DEMO_PREFILL', 'False').lower() in ('1', 'true', 'yes')

