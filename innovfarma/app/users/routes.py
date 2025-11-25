from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from ..mongo_models import get_db, find_user_by_id, create_user
from werkzeug.security import generate_password_hash
from bson import ObjectId
import re

users_bp = Blueprint('users', __name__)


def _is_admin_user():
    try:
        uid = None
        if hasattr(current_user, 'get_id'):
            uid = current_user.get_id()
        if not uid:
            return False
        doc = find_user_by_id(uid)
        if not doc:
            return False
        role = (doc.get('rol') or doc.get('role') or doc.get('rol_name') or '')
        return str(role).lower() in ('admin', 'administrator', 'administrador')
    except Exception:
        return False


# Allowed roles for users in the system. 'user' role has been removed.
ALLOWED_ROLES = ('admin', 'vendedor')


def admin_required_or_403():
    if not _is_admin_user():
        return jsonify({'error': 'forbidden', 'message': 'Operación permitida sólo para administradores'}), 403
    return None


@users_bp.route('/usuarios', methods=['GET'])
@login_required
def list_users():
    block = admin_required_or_403()
    if block:
        return block
    db = get_db()
    if db is None:
        return jsonify({'error': 'db'}), 503
    try:
        docs = db.usuarios.find()
        out = []
        for d in docs:
            out.append({'id': str(d.get('_id')), 'nombre': d.get('nombre'), 'email': d.get('email'), 'rol': d.get('rol')})
        return jsonify({'usuarios': out}), 200
    except Exception as e:
        return jsonify({'error': 'db_error', 'message': str(e)}), 500


@users_bp.route('/usuarios/<user_id>', methods=['GET'])
@login_required
def get_usuario(user_id):
    block = admin_required_or_403()
    if block:
        return block
    try:
        doc = find_user_by_id(user_id)
        if not doc:
            return jsonify({'error': 'not_found'}), 404
        # hide password
        doc.pop('password', None)
        return jsonify({'usuario': doc}), 200
    except Exception as e:
        return jsonify({'error': 'db_error', 'message': str(e)}), 500


@users_bp.route('/usuarios', methods=['POST'])
@login_required
def create_usuario():
    block = admin_required_or_403()
    if block:
        return block
    data = request.get_json() or {}
    # Nombre no debe contener dígitos
    nombre = (data.get('nombre') or '').strip()
    if nombre and re.search(r'\d', nombre):
        return jsonify({'error': 'invalid_nombre', 'message': 'El nombre no puede contener números.'}), 400
    # expect at least username/email and password
    if not data.get('password') or not (data.get('username') or data.get('email')):
        return jsonify({'error': 'invalid_payload', 'message': 'username/email and password required'}), 400
    try:
        # reuse helper to hash password properly
        # decide role: if provided, validate; otherwise default to 'vendedor'
        provided_role = (data.get('rol') or data.get('role') or '').strip()
        if not provided_role:
            role_to_set = 'vendedor'
        else:
            if provided_role.lower() not in ALLOWED_ROLES:
                return jsonify({'error': 'invalid_role', 'message': f"Rol inválido. Roles permitidos: {', '.join(ALLOWED_ROLES)}"}), 400
            role_to_set = provided_role

        user_doc = {
            'username': data.get('username'),
            'email': data.get('email'),
            'nombre': data.get('nombre'),
            'rol': role_to_set,
            'password': data.get('password')
        }
        uid = create_user(user_doc)
        return jsonify({'id': uid}), 201
    except Exception as e:
        return jsonify({'error': 'db_error', 'message': str(e)}), 500


@users_bp.route('/usuarios/<user_id>', methods=['PUT'])
@login_required
def update_usuario(user_id):
    block = admin_required_or_403()
    if block:
        return block
    data = request.get_json() or {}
    db = get_db()
    if db is None:
        return jsonify({'error': 'db'}), 503
    try:
        # Nombre no debe contener dígitos si se provee
        if 'nombre' in data and data.get('nombre') and re.search(r'\d', str(data.get('nombre'))):
            return jsonify({'error': 'invalid_nombre', 'message': 'El nombre no puede contener números.'}), 400
        upd = {}
        for k in ('nombre', 'email', 'username'):
            if k in data:
                upd[k] = data.get(k)
        # role handling: validate if provided
        if 'rol' in data:
            prov = (data.get('rol') or '').strip()
            if prov.lower() not in ALLOWED_ROLES:
                return jsonify({'error': 'invalid_role', 'message': f"Rol inválido. Roles permitidos: {', '.join(ALLOWED_ROLES)}"}), 400
            upd['rol'] = prov
        if 'password' in data and data.get('password'):
            upd['password'] = generate_password_hash(data.get('password'))
        # try ObjectId first
        try:
            oid = ObjectId(user_id)
            res = db.usuarios.update_one({'_id': oid}, {'$set': upd})
        except Exception:
            res = db.usuarios.update_one({'id': user_id}, {'$set': upd})
        if res.modified_count > 0:
            return jsonify({'updated': True}), 200
        else:
            return jsonify({'updated': False}), 200
    except Exception as e:
        return jsonify({'error': 'db_error', 'message': str(e)}), 500


@users_bp.route('/usuarios/<user_id>', methods=['DELETE'])
@login_required
def delete_usuario(user_id):
    block = admin_required_or_403()
    if block:
        return block
    db = get_db()
    if db is None:
        return jsonify({'error': 'db'}), 503
    try:
        try:
            oid = ObjectId(user_id)
            res = db.usuarios.delete_one({'_id': oid})
        except Exception:
            res = db.usuarios.delete_one({'id': user_id})
        if res.deleted_count > 0:
            return jsonify({'deleted': True}), 200
        return jsonify({'deleted': False}), 200
    except Exception as e:
        return jsonify({'error': 'db_error', 'message': str(e)}), 500
