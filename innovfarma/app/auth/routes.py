from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from ..mongo_models import find_user_by_identifier, check_user_password

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    identifier = data.get('email') or data.get('username')
    password = data.get('password')
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
    login_user(user)
    return jsonify({'message': 'ok', 'user': {'id': doc.get('id'), 'nombre': doc.get('nombre'), 'email': doc.get('email')}})


@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'logged out'})
