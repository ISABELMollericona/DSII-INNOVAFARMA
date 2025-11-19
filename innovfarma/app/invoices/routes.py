from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user

try:
    from .. import mongo_models as mongo_helpers
except Exception:
    mongo_helpers = None

from . import sql_helpers as sql_helpers

invoices_bp = Blueprint('invoices', __name__)


def _helpers():
    if current_app and current_app.config.get('MONGO_URI') and mongo_helpers:
        return mongo_helpers
    return sql_helpers


@invoices_bp.route('/facturas', methods=['GET'])
@login_required
def list_invoices():
    page = request.args.get('page', 0, type=int)
    limit = request.args.get('limit', 100, type=int)
    skip = page * limit
    h = _helpers()
    facturas = h.list_facturas(limit=limit, skip=skip)
    return jsonify(facturas)


@invoices_bp.route('/facturas/<factura_id>', methods=['GET'])
@login_required
def get_invoice(factura_id):
    h = _helpers()
    factura = h.get_factura(factura_id)
    if not factura:
        return jsonify({'error': 'factura no encontrada'}), 404
    return jsonify(factura)


@invoices_bp.route('/facturas', methods=['POST'])
@login_required
def create_invoice():
    data = request.get_json() or {}
    cliente_id = data.get('id_cliente')
    sucursal_id = data.get('id_sucursal')
    items = data.get('items', [])
    total = data.get('total', 0)
    recibido = data.get('recibido')
    cambio = data.get('cambio')
    nota = data.get('nota')

    if not cliente_id or not items:
        return jsonify({'error': 'cliente_id y items requeridos'}), 400

    try:
        # obtener user_id desde current_user de forma compatible (flask-login proxy o custom U)
        user_id = None
        try:
            # preferir get_id() si está disponible
            if hasattr(current_user, 'get_id'):
                user_id = current_user.get_id()
            else:
                user_id = getattr(current_user, 'id', None)
        except Exception:
            user_id = getattr(current_user, 'id', None)

        # si se está usando Mongo, validar rol antes de permitir crear factura
        try:
            from ..mongo_models import find_user_by_id
            doc = find_user_by_id(user_id) if user_id else None
        except Exception:
            doc = None

        if doc:
            role = doc.get('rol') or doc.get('role') or doc.get('roles')
            if isinstance(role, list): role = role[0] if role else None
            if role and str(role).lower() != 'vendedor':
                return jsonify({'error': 'Acción no permitida: solo vendedores pueden crear facturas'}), 403

        h = _helpers()
        # pass payment details when creating invoice
        factura_id = h.create_factura(user_id, cliente_id, sucursal_id, items, total, recibido=recibido, cambio=cambio, nota=nota)
        return jsonify({'id': factura_id, 'mensaje': 'factura creada'}), 201
    except Exception as e:
        # validation errors (insufficient stock, missing product) return 400
        if isinstance(e, ValueError):
            return jsonify({'error': str(e)}), 400
        return jsonify({'error': str(e)}), 500


@invoices_bp.route('/facturas/<factura_id>/detalle', methods=['GET'])
@login_required
def get_invoice_detail(factura_id):
    h = _helpers()
    detalle = h.get_detalle_factura(factura_id)
    if detalle is None:
        return jsonify({'error': 'factura no encontrada'}), 404
    return jsonify(detalle)
