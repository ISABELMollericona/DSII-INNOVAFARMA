from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required

# Import both helper modules; choose at request time based on current_app config
try:
    from .. import mongo_models as mongo_helpers
except Exception:
    mongo_helpers = None

from . import sql_helpers as sql_helpers

clients_bp = Blueprint('clients', __name__)


def _helpers():
    if current_app and current_app.config.get('MONGO_URI') and mongo_helpers:
        return mongo_helpers
    return sql_helpers

@clients_bp.route('/clientes', methods=['GET'])
def get_clientes():
    """List all clientes with pagination"""
    limit = request.args.get('limit', 100, type=int)
    skip = request.args.get('page', 0, type=int) * limit
    h = _helpers()
    clientes = h.list_clientes(limit=limit, skip=skip)
    # Normalizar campo 'ci' y exponer también 'documento' para la UI
    normalized = []
    for c in clientes:
        if not isinstance(c, dict):
            normalized.append(c)
            continue
        if not c.get('ci'):
            # usar 'nit' como fallback si existe
            c['ci'] = c.get('nit') or c.get('NIT') or ''
        # añadir alias 'documento' por compatibilidad con front
        c['documento'] = c.get('ci') or c.get('nit') or ''
        normalized.append(c)
    return jsonify({'clientes': normalized, 'total': len(normalized)})

@clients_bp.route('/clientes/<cliente_id>', methods=['GET'])
def get_cliente_detail(cliente_id):
    """Get cliente by ID"""
    h = _helpers()
    cliente = h.get_cliente(cliente_id)
    if not cliente:
        return jsonify({'error': 'cliente not found'}), 404
    # Normalizar 'ci' y alias 'documento'
    if not cliente.get('ci'):
        cliente['ci'] = cliente.get('nit') or cliente.get('NIT') or ''
    cliente['documento'] = cliente.get('ci') or cliente.get('nit') or ''
    return jsonify(cliente)

@clients_bp.route('/clientes/buscar-por-ci', methods=['POST'])
def search_by_ci():
    """Search for cliente by CI"""
    data = request.get_json() or {}
    ci = data.get('ci')
    if not ci:
        return jsonify({'error': 'ci required'}), 400
    
    h = _helpers()
    cliente = h.search_cliente_by_ci(ci)
    if not cliente:
        return jsonify({'error': 'cliente not found'}), 404
    return jsonify(cliente)


@clients_bp.route('/clientes/buscar-por-nit', methods=['POST'])
def search_by_nit():
    """Buscar cliente por NIT"""
    data = request.get_json() or {}
    nit = data.get('nit')
    if not nit:
        return jsonify({'error': 'nit requerido'}), 400
    
    h = _helpers()
    cliente = None
    # si el helper SQL/Mongo soporta búsqueda por nit
    if hasattr(h, 'search_cliente_by_nit'):
        cliente = h.search_cliente_by_nit(nit)
    else:
        # fallback: buscar por ci si no existe nit
        cliente = h.search_cliente_by_ci(nit)

    if not cliente:
        return jsonify({'error': 'cliente no encontrado'}), 404
    return jsonify(cliente)

@clients_bp.route('/clientes/buscar', methods=['POST'])
def search_by_nombre():
    """Search for cliente by nombre"""
    data = request.get_json() or {}
    nombre = data.get('nombre') or data.get('q')
    if not nombre:
        return jsonify({'error': 'nombre or q required'}), 400
    
    h = _helpers()
    clientes = h.search_cliente_by_nombre(nombre)
    return jsonify({'clientes': clientes, 'total': len(clientes)})

@clients_bp.route('/clientes', methods=['POST'])
@login_required
def create_new_cliente():
    """Crear un nuevo cliente (requiere `nombre` y `nit`). Acepta `ci` como alias para compatibilidad."""
    data = request.get_json() or {}
    required = ['nombre']
    if not all(k in data for k in required):
        return jsonify({'error': f'campo requerido: nombre'}), 400

    nit = data.get('nit') or data.get('ci') or ''
    if not nit:
        return jsonify({'error': 'nit requerido'}), 400

    # comprobar si ya existe por nit
    h = _helpers()
    existing = None
    if hasattr(h, 'search_cliente_by_nit'):
        existing = h.search_cliente_by_nit(nit)
    else:
        existing = h.search_cliente_by_ci(nit)

    if existing:
        return jsonify({'error': 'cliente con este NIT/CI ya existe'}), 409

    # Llamar al helper de creación intentando pasar `nit`, y si falla por firma,
    # reintentar sin `nit` para mantener compatibilidad con adaptadores antiguos.
    kwargs = {
        'nombre': data['nombre'],
        'nit': nit,
        'ci': data.get('ci', ''),
        'direccion': data.get('direccion', ''),
        'telefono': data.get('telefono', ''),
    }
    try:
        cliente_id = h.create_cliente(**kwargs)
    except TypeError:
        # reintentar sin nit
        kwargs.pop('nit', None)
        cliente_id = h.create_cliente(**kwargs)
    cliente = h.get_cliente(cliente_id)
    return jsonify(cliente), 201

@clients_bp.route('/clientes/<cliente_id>', methods=['PUT'])
@login_required
def update_cliente_detail(cliente_id):
    """Update cliente"""
    data = request.get_json() or {}
    if not data:
        return jsonify({'error': 'no data to update'}), 400
    
    h = _helpers()
    success = h.update_cliente(cliente_id, **data)
    if not success:
        return jsonify({'error': 'cliente not found or update failed'}), 404
    
    cliente = h.get_cliente(cliente_id)
    return jsonify(cliente)
