# Funciones helper para facturas con SQLAlchemy
from ..models import db, Factura, DetalleFactura, Cliente, Product
from datetime import datetime

def create_factura(user_id, cliente_id, sucursal_id, items, total):
    """
    Crear una nueva factura con sus detalles
    items: [{'id_producto': ..., 'cantidad': ..., 'precio_unitario': ..., 'subtotal': ...}, ...]
    """
    # Validar que cliente existe
    cliente = Cliente.query.get(cliente_id)
    if not cliente:
        raise ValueError(f"Cliente {cliente_id} no encontrado")
    
    # Crear factura
    factura = Factura(
        id_usuario=user_id,
        id_cliente=cliente_id,
        id_sucursal=sucursal_id,
        fecha=datetime.utcnow(),
        total=total
    )
    db.session.add(factura)
    db.session.flush()  # Para obtener el ID generado
    
    # Crear detalles de factura
    for item in items:
        detalle = DetalleFactura(
            id_factura=factura.id,
            id_producto=item['id_producto'],
            cantidad=item['cantidad'],
            precio_unitario=item['precio_unitario'],
            subtotal=item['subtotal']
        )
        db.session.add(detalle)
    
    db.session.commit()
    return factura.id

def get_factura(factura_id):
    """Obtener factura por ID con sus detalles"""
    factura = Factura.query.get(factura_id)
    if not factura:
        return None
    
    detalles = DetalleFactura.query.filter_by(id_factura=factura_id).all()
    detalles_data = []
    for detalle in detalles:
        detalles_data.append({
            'id': detalle.id,
            'id_factura': detalle.id_factura,
            'id_producto': detalle.id_producto,
            'cantidad': detalle.cantidad,
            'precio_unitario': detalle.precio_unitario,
            'subtotal': detalle.subtotal,
        })
    
    return {
        'id': factura.id,
        'id_usuario': factura.id_usuario,
        'id_cliente': factura.id_cliente,
        'id_sucursal': factura.id_sucursal,
        'fecha': factura.fecha.isoformat() if factura.fecha else None,
        'total': factura.total,
        'detalles': detalles_data,
    }

def list_facturas(limit=100, skip=0):
    """Listar facturas con paginación"""
    facturas = Factura.query.order_by(Factura.fecha.desc()).offset(skip).limit(limit).all()
    out = []
    for factura in facturas:
        out.append({
            'id': factura.id,
            'id_usuario': factura.id_usuario,
            'id_cliente': factura.id_cliente,
            'id_sucursal': factura.id_sucursal,
            'fecha': factura.fecha.isoformat() if factura.fecha else None,
            'total': factura.total,
        })
    return out

def get_detalle_factura(factura_id):
    """Retorna los items/detalles de una factura"""
    factura = get_factura(factura_id)
    if not factura:
        return None
    return factura.get('detalles', [])
