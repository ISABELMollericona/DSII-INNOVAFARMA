from flask import Blueprint, request, jsonify
from flask_login import login_required
from .sql_helpers import (
    list_products, filter_products, filter_advanced, get_product,
    get_product_by_barcode, search_by_barcode, search_suggestions_by_barcode,
    create_product, update_product, delete_product, get_product_full_details
)

products_bp = Blueprint('products', __name__)


# ========== READ (GET) ==========

@products_bp.route('/productos', methods=['GET'])
def productos_index():
    """Listar todos los productos con paginación"""
    limit = request.args.get('limit', 100, type=int)
    skip = request.args.get('skip', 0, type=int)
    
    productos = list_products(limit=limit)
    return jsonify({'productos': productos, 'total': len(productos)})


@products_bp.route('/productos/<int:product_id>', methods=['GET'])
def get_product_detail(product_id):
    """Obtener un producto por ID"""
    producto = get_product(product_id)
    if not producto:
        return jsonify({'error': 'Producto no encontrado'}), 404
    return jsonify(producto)


@products_bp.route('/productos/detalle-completo/<int:product_id>', methods=['GET'])
def get_full_details(product_id):
    """Obtener detalles completos de un producto"""
    producto = get_product_full_details(product_id)
    if not producto:
        return jsonify({'error': 'Producto no encontrado'}), 404
    return jsonify(producto)


@products_bp.route('/productos/codigo-barras/<codigo_barras>', methods=['GET'])
def search_by_exact_barcode(codigo_barras):
    """Buscar un producto exacto por código de barras"""
    producto = get_product_by_barcode(codigo_barras)
    if not producto:
        return jsonify(None), 404
    return jsonify(producto)


@products_bp.route('/productos/sugerencias-codigo/<codigo>', methods=['GET'])
def sugerencias_por_codigo(codigo):
    """Obtener sugerencias de productos por código de barras (parcial)"""
    productos = search_suggestions_by_barcode(codigo)
    return jsonify(productos)


@products_bp.route('/productos/filtrar', methods=['POST'])
def productos_filtrar():
    """Filtrar productos por término de búsqueda en múltiples campos"""
    data = request.get_json() or {}
    term = data.get('term') or data.get('q') or data.get('buscar', '')
    limit = data.get('limit', 200)
    
    productos = filter_products(term, limit=limit)
    return jsonify({'productos': productos, 'total': len(productos)})


@products_bp.route('/productos/filtro-avanzado', methods=['POST'])
def filtro_avanzado():
    """Filtrado avanzado por marca, categoría, forma, laboratorio"""
    data = request.get_json() or {}
    marca_id = data.get('marca_id')
    categoria_id = data.get('categoria_id')
    subcategoria_id = data.get('subcategoria_id')
    forma_id = data.get('forma_id')
    laboratorio_id = data.get('laboratorio_id')
    limit = data.get('limit', 100)
    skip = data.get('skip', 0)
    
    productos = filter_advanced(
        marca_id=marca_id,
        categoria_id=categoria_id,
        subcategoria_id=subcategoria_id,
        forma_id=forma_id,
        laboratorio_id=laboratorio_id,
        limit=limit,
        skip=skip
    )
    return jsonify({'productos': productos, 'total': len(productos)})


# ========== CREATE (POST) ==========

@products_bp.route('/productos', methods=['POST'])
@login_required
def create_new_product():
    """Crear un nuevo producto"""
    data = request.get_json() or {}
    
    # Validar campos requeridos
    required = ['codigo', 'Nombre_comercial']
    if not all(k in data for k in required):
        return jsonify({'error': f'Campos requeridos: {", ".join(required)}'}), 400
    
    try:
        # Preparar datos del producto
        product_data = {
            'codigo': data['codigo'],
            'Nombre_comercial': data['Nombre_comercial'],
            'Nombre_generico': data.get('Nombre_generico'),
            'Cod_barrras': data.get('Cod_barrras'),
            'Accion_terapeutica': data.get('Accion_terapeutica'),
            'Principio_activo': data.get('Principio_activo'),
            'Concentracion': data.get('Concentracion'),
            'Presentacion': data.get('Presentacion'),
            'Precio_compra': data.get('Precio_compra', 0),
            'Precio_venta': data.get('Precio_venta', 0),
            'Margen_utilidad': data.get('Margen_utilidad', 0),
            'Cod_imp_nacionales': data.get('Cod_imp_nacionales'),
            'Cantidad_minima_pedido': data.get('Cantidad_minima_pedido'),
            'Cantidad_maxima_inventario': data.get('Cantidad_maxima_inventario'),
            'Tiempo_sin_movimiento': data.get('Tiempo_sin_movimiento'),
            'Cantidad_minima_inventario': data.get('Cantidad_minima_inventario'),
            'Alerta_caducidad_dias': data.get('Alerta_caducidad_dias'),
            'Cod_nandina': data.get('Cod_nandina'),
            'id_subcategoria': data.get('id_subcategoria'),
            'id_forma_farmaceutica': data.get('id_forma_farmaceutica'),
            'id_marca': data.get('id_marca'),
            'id_laboratorio': data.get('id_laboratorio'),
            'id_unidad_medida': data.get('id_unidad_medida'),
            'Control_inventario': 1 if data.get('Control_inventario') else 0,
            'Receta_medica': 1 if data.get('Receta_medica') else 0,
            'Favorito': 1 if data.get('Favorito') else 0,
            'Granel': 1 if data.get('Granel') else 0,
            'Medicamento_controlado': 1 if data.get('Medicamento_controlado') else 0,
            'Solo_compra': 1 if data.get('Solo_compra') else 0,
        }
        
        product_id = create_product(**product_data)
        producto = get_product(product_id)
        
        return jsonify({'success': True, 'message': 'Producto guardado correctamente', 'producto': producto}), 201
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error al guardar el producto', 'error': str(e)}), 500


# ========== UPDATE (PUT) ==========

@products_bp.route('/productos/<int:product_id>', methods=['PUT'])
@login_required
def update_product_detail(product_id):
    """Actualizar un producto"""
    data = request.get_json() or {}
    
    if not data:
        return jsonify({'error': 'No hay datos para actualizar'}), 400
    
    try:
        # Preparar datos para actualización
        update_data = {}
        
        allowed_fields = [
            'codigo', 'Nombre_comercial', 'Cod_barrras', 'Nombre_generico',
            'Accion_terapeutica', 'Principio_activo', 'Concentracion', 'Presentacion',
            'Precio_compra', 'Precio_venta', 'Margen_utilidad', 'Cod_imp_nacionales',
            'Cantidad_minima_pedido', 'Cantidad_maxima_inventario', 'Tiempo_sin_movimiento',
            'Cantidad_minima_inventario', 'Alerta_caducidad_dias', 'Cod_nandina',
            'id_subcategoria', 'id_forma_farmaceutica', 'id_marca', 'id_laboratorio',
            'id_unidad_medida'
        ]
        
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        # Manejo de checkboxes
        checkbox_fields = [
            'Control_inventario', 'Receta_medica', 'Favorito', 'Granel',
            'Medicamento_controlado', 'Solo_compra'
        ]
        
        for field in checkbox_fields:
            if field in data:
                update_data[field] = 1 if data[field] else 0
        
        success = update_product(product_id, **update_data)
        
        if not success:
            return jsonify({'error': 'Producto no encontrado o error en actualización'}), 404
        
        producto = get_product(product_id)
        return jsonify({'success': True, 'message': 'Producto actualizado correctamente', 'producto': producto}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error al actualizar el producto', 'error': str(e)}), 500


# ========== DELETE (DELETE) ==========

@products_bp.route('/productos/<int:product_id>', methods=['DELETE'])
@login_required
def delete_product_detail(product_id):
    """Eliminar un producto"""
    try:
        success = delete_product(product_id)
        
        if not success:
            return jsonify({'error': 'Producto no encontrado'}), 404
        
        return jsonify({'success': True, 'message': 'Producto eliminado exitosamente'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error al eliminar el producto', 'error': str(e)}), 500
