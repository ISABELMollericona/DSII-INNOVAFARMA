# Funciones helper para productos con SQLAlchemy
from ..models import db, Product

def _product_to_dict(p):
    """Convertir producto a diccionario"""
    return {
        'id': p.id,
        'codigo': p.codigo,
        'Nombre_comercial': p.Nombre_comercial,
        'Cod_barrras': p.Cod_barrras,
        'Nombre_generico': p.Nombre_generico,
        'Accion_terapeutica': p.Accion_terapeutica,
        'Principio_activo': p.Principio_activo,
        'Concentracion': p.Concentracion,
        'Presentacion': p.Presentacion,
        'Precio_venta': p.Precio_venta,
        'Precio_compra': p.Precio_compra,
        'Margen_utilidad': p.Margen_utilidad,
        'id_subcategoria': p.id_subcategoria,
        'id_forma_farmaceutica': p.id_forma_farmaceutica,
        'id_marca': p.id_marca,
        'id_laboratorio': p.id_laboratorio,
        'id_unidad_medida': p.id_unidad_medida,
        'Cod_imp_nacionales': p.Cod_imp_nacionales,
        'Cantidad_minima_pedido': p.Cantidad_minima_pedido,
        'Cantidad_maxima_inventario': p.Cantidad_maxima_inventario,
        'Tiempo_sin_movimiento': p.Tiempo_sin_movimiento,
        'Cantidad_minima_inventario': p.Cantidad_minima_inventario,
        'Alerta_caducidad_dias': p.Alerta_caducidad_dias,
        'Cod_nandina': p.Cod_nandina,
        'Control_inventario': p.Control_inventario,
        'Receta_medica': p.Receta_medica,
        'Favorito': p.Favorito,
        'Granel': p.Granel,
        'Medicamento_controlado': p.Medicamento_controlado,
        'Solo_compra': p.Solo_compra,
    }

def list_products(limit=100):
    """Listar todos los productos"""
    productos = Product.query.limit(limit).all()
    return [_product_to_dict(p) for p in productos]

def filter_products(term, limit=200):
    """Filtrar productos por término de búsqueda en múltiples campos"""
    if not term:
        return list_products(limit)
    
    # Búsqueda en múltiples campos
    productos = Product.query.filter(
        (Product.Nombre_comercial.ilike(f'%{term}%')) |
        (Product.codigo.ilike(f'%{term}%')) |
        (Product.Nombre_generico.ilike(f'%{term}%')) |
        (Product.Cod_barrras.ilike(f'%{term}%')) |
        (Product.Accion_terapeutica.ilike(f'%{term}%')) |
        (Product.Principio_activo.ilike(f'%{term}%')) |
        (Product.Concentracion.ilike(f'%{term}%')) |
        (Product.Presentacion.ilike(f'%{term}%')) |
        (Product.Cod_nandina.ilike(f'%{term}%'))
    ).limit(limit).all()
    
    return [_product_to_dict(p) for p in productos]

def filter_advanced(marca_id=None, categoria_id=None, subcategoria_id=None, forma_id=None, 
                   laboratorio_id=None, limit=100, skip=0):
    """Filtrado avanzado por múltiples criterios"""
    query = Product.query
    
    if marca_id:
        query = query.filter_by(id_marca=marca_id)
    if forma_id:
        query = query.filter_by(id_forma_farmaceutica=forma_id)
    if laboratorio_id:
        query = query.filter_by(id_laboratorio=laboratorio_id)
    if subcategoria_id:
        query = query.filter_by(id_subcategoria=subcategoria_id)
   
    
    productos = query.offset(skip).limit(limit).all()
    return [_product_to_dict(p) for p in productos]

def get_product(product_id):
    """Obtener un producto por ID con detalles completos"""
    p = Product.query.get(product_id)
    if not p:
        return None
    return _product_to_dict(p)

def get_product_by_barcode(codigo_barras):
    """Buscar producto por código de barras"""
    p = Product.query.filter_by(Cod_barrras=codigo_barras).first()
    if not p:
        return None
    return _product_to_dict(p)

def search_by_barcode(codigo_barras):
    """Buscar productos que contengan el código de barras (parcial)"""
    productos = Product.query.filter(
        Product.Cod_barrras.ilike(f'%{codigo_barras}%')
    ).limit(10).all()
    return [_product_to_dict(p) for p in productos]

def search_suggestions_by_barcode(codigo_barras):
    """Obtener sugerencias de productos por código de barras"""
    productos = Product.query.filter(
        Product.Cod_barrras.ilike(f'%{codigo_barras}%')
    ).limit(10).all()
    return [_product_to_dict(p) for p in productos]

def create_product(codigo, Nombre_comercial, Nombre_generico=None, Precio_venta=0, 
                  Precio_compra=0, **kwargs):
    """Crear un nuevo producto con todos los campos.
    Evita pasar kwargs al constructor en caso de que Product tenga __init__ personalizado.
    """
    # Crear instancia sin pasar kwargs al constructor (previene errores si __init__ es personalizado)
    producto = Product()

    # Asignar los campos obligatorios / principales
    producto.codigo = codigo
    producto.Nombre_comercial = Nombre_comercial
    if Nombre_generico is not None:
        producto.Nombre_generico = Nombre_generico
    producto.Precio_venta = Precio_venta
    producto.Precio_compra = Precio_compra

    # Campos permitidos adicionales (coinciden con los usados en update_product)
    campos_permitidos = [
        'codigo', 'Nombre_comercial', 'Cod_barrras', 'Nombre_generico',
        'Accion_terapeutica', 'Principio_activo', 'Concentracion', 'Presentacion',
        'Precio_compra', 'Precio_venta', 'Margen_utilidad', 'Cod_imp_nacionales',
        'Cantidad_minima_pedido', 'Cantidad_maxima_inventario', 'Tiempo_sin_movimiento',
        'Cantidad_minima_inventario', 'Alerta_caducidad_dias', 'Cod_nandina',
        'id_subcategoria', 'id_forma_farmaceutica', 'id_marca', 'id_laboratorio',
        'id_unidad_medida', 'Control_inventario', 'Receta_medica', 'Favorito',
        'Granel', 'Medicamento_controlado', 'Solo_compra'
    ]

    # Asignar kwargs solo si están permitidos y el atributo existe en la instancia
    for key, value in kwargs.items():
        if key in campos_permitidos and hasattr(producto, key):
            setattr(producto, key, value)

    db.session.add(producto)
    db.session.commit()
    return producto.id

def update_product(product_id, **kwargs):
    """Actualizar un producto con validación"""
    producto = Product.query.get(product_id)
    if not producto:
        return False
    
    # Lista de campos permitidos
    campos_permitidos = [
        'codigo', 'Nombre_comercial', 'Cod_barrras', 'Nombre_generico',
        'Accion_terapeutica', 'Principio_activo', 'Concentracion', 'Presentacion',
        'Precio_compra', 'Precio_venta', 'Margen_utilidad', 'Cod_imp_nacionales',
        'Cantidad_minima_pedido', 'Cantidad_maxima_inventario', 'Tiempo_sin_movimiento',
        'Cantidad_minima_inventario', 'Alerta_caducidad_dias', 'Cod_nandina',
        'id_subcategoria', 'id_forma_farmaceutica', 'id_marca', 'id_laboratorio',
        'id_unidad_medida', 'Control_inventario', 'Receta_medica', 'Favorito',
        'Granel', 'Medicamento_controlado', 'Solo_compra'
    ]
    
    for key, value in kwargs.items():
        if key in campos_permitidos and hasattr(producto, key):
            setattr(producto, key, value)
    
    db.session.commit()
    return True

def delete_product(product_id):
    """Eliminar un producto (eliminación física)"""
    producto = Product.query.get(product_id)
    if not producto:
        return False
    
    db.session.delete(producto)
    db.session.commit()
    return True

def get_product_full_details(product_id):
    """Obtener detalles completos de un producto"""
    p = Product.query.get(product_id)
    if not p:
        return None
    return _product_to_dict(p)

