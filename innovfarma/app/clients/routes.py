from flask import Blueprint, request, jsonify
from flask_login import login_required
from .sql_helpers import (
    create_cliente, get_cliente, search_cliente_by_ci,
    search_cliente_by_nombre, list_clientes, update_cliente
)

clients_bp = Blueprint('clients', __name__)

@clients_bp.route('/clientes', methods=['GET'])
def get_clientes():
    """List all clientes with pagination"""
    limit = request.args.get('limit', 100, type=int)
    skip = request.args.get('page', 0, type=int) * limit
    clientes = list_clientes(limit=limit, skip=skip)
    return jsonify({'clientes': clientes, 'total': len(clientes)})

@clients_bp.route('/clientes/<cliente_id>', methods=['GET'])
def get_cliente_detail(cliente_id):
    """Get cliente by ID"""
    cliente = get_cliente(cliente_id)
    if not cliente:
        return jsonify({'error': 'cliente not found'}), 404
    return jsonify(cliente)

@clients_bp.route('/clientes/buscar-por-ci', methods=['POST'])
def search_by_ci():
    """Search for cliente by CI"""
    data = request.get_json() or {}
    ci = data.get('ci')
    if not ci:
        return jsonify({'error': 'ci required'}), 400
    
    cliente = search_cliente_by_ci(ci)
    if not cliente:
        return jsonify({'error': 'cliente not found'}), 404
    return jsonify(cliente)

@clients_bp.route('/clientes/buscar', methods=['POST'])
def search_by_nombre():
    """Search for cliente by nombre"""
    data = request.get_json() or {}
    nombre = data.get('nombre') or data.get('q')
    if not nombre:
        return jsonify({'error': 'nombre or q required'}), 400
    
    clientes = search_cliente_by_nombre(nombre)
    return jsonify({'clientes': clientes, 'total': len(clientes)})

@clients_bp.route('/clientes', methods=['POST'])
@login_required
def create_new_cliente():
    """Create a new cliente"""
    data = request.get_json() or {}
    required = ['nombre', 'ci']
    if not all(k in data for k in required):
        return jsonify({'error': f'fields required: {", ".join(required)}'}), 400
    
    # check if already exists
    existing = search_cliente_by_ci(data['ci'])
    if existing:
        return jsonify({'error': 'cliente with this ci already exists'}), 409
    
    cliente_id = create_cliente(
        nombre=data['nombre'],
        ci=data['ci'],
        direccion=data.get('direccion', ''),
        telefono=data.get('telefono', '')
    )
    cliente = get_cliente(cliente_id)
    return jsonify(cliente), 201

@clients_bp.route('/clientes/<cliente_id>', methods=['PUT'])
@login_required
def update_cliente_detail(cliente_id):
    """Update cliente"""
    data = request.get_json() or {}
    if not data:
        return jsonify({'error': 'no data to update'}), 400
    
    success = update_cliente(cliente_id, **data)
    if not success:
        return jsonify({'error': 'cliente not found or update failed'}), 404
    
    cliente = get_cliente(cliente_id)
    return jsonify(cliente)
