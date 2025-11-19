from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from ..mongo_models import find_user_by_identifier, check_user_password

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    # GET: return current logged-in user (if any)
    if request.method == 'GET':
        if not current_user or getattr(current_user, 'is_authenticated', False) is not True:
            return jsonify({'user': None}), 200
        # try to return a simple dict for the frontend
        try:
            # current_user may be a lite proxy object; attempt to read common fields
            uid = getattr(current_user, 'get_id', lambda: None)()
            # try to load from mongo_models for richer info
            from ..mongo_models import find_user_by_id
            doc = find_user_by_id(uid) if uid else None
        except Exception:
            doc = None
        if not doc:
            # fallback to minimal info
            return jsonify({'user': {'id': uid}}), 200
        return jsonify({'user': {'id': doc.get('id'), 'nombre': doc.get('nombre'), 'email': doc.get('email'), 'rol': doc.get('rol')}}), 200

    # POST: perform login
    data = request.get_json() or {}
    identifier = data.get('email') or data.get('username')
    password = data.get('password')
    remember = bool(data.get('remember'))
    if not identifier or not password:
        return jsonify({'error': 'email/username and password required'}), 400

    doc = find_user_by_identifier(identifier)
    if not doc or not check_user_password(doc, password):
        return jsonify({'error': 'invalid credentials'}), 401

    # create a minimal user object for flask-login
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

    user = U(doc)
    # respect remember flag to create a persistent session cookie if requested
    login_user(user, remember=remember)
    return jsonify({'message': 'ok', 'user': {'id': doc.get('id'), 'nombre': doc.get('nombre'), 'email': doc.get('email'), 'rol': doc.get('rol')}})


@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'logged out'})
