from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from .sql_helpers import (
    create_factura, get_factura, list_facturas, get_detalle_factura
)

invoices_bp = Blueprint('invoices', __name__)


@invoices_bp.route('/facturas', methods=['GET'])
@login_required
def list_invoices():
    page = request.args.get('page', 0, type=int)
    limit = request.args.get('limit', 100, type=int)
    skip = page * limit
    facturas = list_facturas(limit=limit, skip=skip)
    return jsonify(facturas)


@invoices_bp.route('/facturas/<factura_id>', methods=['GET'])
@login_required
def get_invoice(factura_id):
    factura = get_factura(factura_id)
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

    if not cliente_id or not items:
        return jsonify({'error': 'cliente_id y items requeridos'}), 400

    try:
        # obtener user_id desde current_user
        user_id = current_user.id
        factura_id = create_factura(user_id, cliente_id, sucursal_id, items, total)
        return jsonify({'id': factura_id, 'mensaje': 'factura creada'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@invoices_bp.route('/facturas/<factura_id>/detalle', methods=['GET'])
@login_required
def get_invoice_detail(factura_id):
    detalle = get_detalle_factura(factura_id)
    if detalle is None:
        return jsonify({'error': 'factura no encontrada'}), 404
    return jsonify(detalle)
