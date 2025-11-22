# Funciones helper para facturas con SQLAlchemy
from ..models import db, Factura, DetalleFactura, Cliente, Product
from datetime import datetime
from pathlib import Path
from sqlalchemy import func


def _formatear_comprobante_txt(datos_factura, cliente, detalles):
    lineas = []
    lineas.append(f"FACTURA ID: {datos_factura.get('id')}")
    lineas.append(f"FECHA: {datos_factura.get('fecha')}")
    lineas.append("")
    lineas.append("CLIENTE:")
    lineas.append(f"  Nombre: {cliente.nombre if cliente else ''}")
    lineas.append(f"  CI: {cliente.ci if cliente else ''}")
    lineas.append(f"  Dirección: {cliente.direccion if cliente else ''}")
    lineas.append(f"  Teléfono: {cliente.telefono if cliente else ''}")
    lineas.append("")
    lineas.append("DETALLE DE PRODUCTOS:")
    lineas.append(f"{'Cant':>4}  {'Descripción':<40} {'P.Unit':>8} {'Subtotal':>10}")
    lineas.append("-" * 70)
    for d in detalles:
        # intentar obtener nombre del producto
        prod = None
        try:
            prod = Product.query.get(d.get('id_producto'))
        except Exception:
            prod = None
        desc = prod.Nombre_comercial if prod and getattr(prod, 'Nombre_comercial', None) else str(d.get('id_producto'))
        cantidad = d.get('cantidad') or 0
        precio_unit = d.get('precio_unitario') or 0
        subtotal = d.get('subtotal') or (cantidad * precio_unit)
        lineas.append(f"{cantidad:>4}  {desc:<40} {precio_unit:>8.2f} {subtotal:>10.2f}")
    lineas.append("-" * 70)
    lineas.append(f"TOTAL: {datos_factura.get('total'):.2f}")
    if datos_factura.get('recibido') is not None:
        lineas.append(f"EFECTIVO RECIBIDO: {datos_factura.get('recibido'):.2f}")
    if datos_factura.get('cambio') is not None:
        lineas.append(f"CAMBIO: {datos_factura.get('cambio'):.2f}")
    if datos_factura.get('nota'):
        lineas.append("")
        lineas.append(f"NOTA: {datos_factura.get('nota')}")
    return "\n".join(lineas)


def _guardar_comprobante_txt(id_factura, texto):
    # Guardar en carpeta receipts bajo el root del proyecto
    raiz = Path(__file__).resolve().parents[2]
    carpeta = raiz / 'receipts'
    carpeta.mkdir(parents=True, exist_ok=True)
    nombre = carpeta / f"factura_{id_factura}.txt"
    with open(nombre, 'w', encoding='utf-8') as f:
        f.write(texto)
    return str(nombre)

def create_factura(user_id, cliente_id, sucursal_id, items, total, recibido=None, cambio=None, nota=None):
    """
    Crear una nueva factura con sus detalles
    items: [{'id_producto': ..., 'cantidad': ..., 'precio_unitario': ..., 'subtotal': ...}, ...]
    """
    # Validar que cliente existe
    cliente = Cliente.query.get(cliente_id)
    if not cliente:
        raise ValueError(f"Cliente {cliente_id} no encontrado")
    
    # Crear factura (usar asignación de atributos en vez de kwargs para evitar warnings de tipado)
    factura = Factura()
    factura.id_usuario = user_id
    factura.id_cliente = cliente_id
    factura.id_sucursal = sucursal_id
    factura.fecha = datetime.utcnow()
    factura.total = total
    factura.recibido = recibido
    factura.cambio = cambio
    factura.nota = nota
    db.session.add(factura)
    db.session.flush()  # Para obtener el ID generado
    
    # Crear detalles de factura
    # Validar stock y crear detalles de factura, descontando existencia
    for item in items:
        pid = item.get('id_producto') or item.get('id') or None
        cantidad = int(item.get('cantidad') or 0)
        if not pid:
            raise ValueError(f"Producto inválido en detalle: {item}")
        prod = Product.query.get(pid)
        if not prod:
            raise ValueError(f"Producto {pid} no encontrado")
        # si el producto tiene control de inventario o existencia definida, validar
        exist = prod.existencia if hasattr(prod, 'existencia') else None
        try:
            exist_val = int(exist) if exist is not None else None
        except Exception:
            exist_val = None
        if exist_val is not None and exist_val < cantidad:
            raise ValueError(f"Stock insuficiente para '{prod.Nombre_comercial or pid}': disponible {exist_val}, solicitado {cantidad}")
        # descontar existencia (si estaba definido)
        if exist_val is not None:
            prod.existencia = exist_val - cantidad

        detalle = DetalleFactura()
        detalle.id_factura = factura.id
        detalle.id_producto = pid
        detalle.cantidad = cantidad
        detalle.precio_unitario = item.get('precio_unitario') or item.get('precio') or 0
        detalle.subtotal = item.get('subtotal') or (cantidad * (detalle.precio_unitario or 0))
        db.session.add(detalle)
    
    db.session.commit()
    # después de crear la factura, generar comprobante TXT
    try:
        datos_factura = {
            'id': factura.id,
            'fecha': factura.fecha.isoformat() if factura.fecha else None,
            'total': factura.total,
            'recibido': factura.recibido,
            'cambio': factura.cambio,
            'nota': factura.nota,
        }
        lista_detalles = []
        for item in items:
            lista_detalles.append({
                'id_producto': item.get('id_producto') or item.get('id') or None,
                'cantidad': item.get('cantidad') or 0,
                'precio_unitario': item.get('precio_unitario') or item.get('precio') or 0,
                'subtotal': item.get('subtotal') or ( (item.get('cantidad') or 0) * (item.get('precio_unitario') or item.get('precio') or 0) ),
            })
        texto = _formatear_comprobante_txt(datos_factura, cliente, lista_detalles)
        ruta = _guardar_comprobante_txt(factura.id, texto)
        # opcional: podríamos guardar la ruta en la base o loggear
    except Exception:
        # no debemos fallar la creación de la factura por un error en el guardado del txt
        ruta = None

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
        'recibido': factura.recibido,
        'cambio': factura.cambio,
        'nota': factura.nota,
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


def generar_informe_ventas(fecha_inicio=None, fecha_fin=None, id_usuario=None, top_n=10):
    """Genera un informe de ventas filtrado por rango de fechas y usuario.

    Retorna dict con: total_ventas, numero_facturas, ventas_por_dia, top_productos
    """
    # construir filtros
    filtros = []
    if fecha_inicio:
        filtros.append(Factura.fecha >= fecha_inicio)
    if fecha_fin:
        filtros.append(Factura.fecha <= fecha_fin)
    if id_usuario:
        filtros.append(Factura.id_usuario == id_usuario)

    # Total vendido (sumatoria de subtotales en detalle)
    total_vendido = db.session.query(func.coalesce(func.sum(DetalleFactura.subtotal), 0.0))
    total_vendido = total_vendido.join(Factura, Factura.id == DetalleFactura.id_factura)
    if filtros:
        total_vendido = total_vendido.filter(*filtros)
    total_vendido = total_vendido.scalar() or 0.0

    # Numero de facturas
    q_facturas = db.session.query(func.count(func.distinct(Factura.id))).join(DetalleFactura, Factura.id == DetalleFactura.id_factura)
    if filtros:
        q_facturas = q_facturas.filter(*filtros)
    numero_facturas = q_facturas.scalar() or 0

    # Ventas por día
    ventas_por_dia_q = db.session.query(func.date(Factura.fecha).label('dia'), func.coalesce(func.sum(DetalleFactura.subtotal), 0.0).label('total'))
    ventas_por_dia_q = ventas_por_dia_q.join(Factura, Factura.id == DetalleFactura.id_factura)
    if filtros:
        ventas_por_dia_q = ventas_por_dia_q.filter(*filtros)
    ventas_por_dia_q = ventas_por_dia_q.group_by('dia').order_by('dia')
    ventas_por_dia = []
    for dia, total in ventas_por_dia_q.all():
        ventas_por_dia.append({'fecha': dia.isoformat() if hasattr(dia, 'isoformat') else str(dia), 'total': float(total)})

    # Productos más vendidos (por cantidad)
    top_q = db.session.query(DetalleFactura.id_producto.label('id_producto'), func.coalesce(func.sum(DetalleFactura.cantidad), 0).label('cantidad'), func.coalesce(func.sum(DetalleFactura.subtotal), 0.0).label('monto'))
    top_q = top_q.join(Factura, Factura.id == DetalleFactura.id_factura)
    if filtros:
        top_q = top_q.filter(*filtros)
    top_q = top_q.group_by(DetalleFactura.id_producto).order_by(func.sum(DetalleFactura.cantidad).desc()).limit(top_n)
    top_productos = []
    for row in top_q.all():
        prod = Product.query.get(row.id_producto)
        nombre = prod.Nombre_comercial if prod and getattr(prod, 'Nombre_comercial', None) else str(row.id_producto)
        top_productos.append({'id_producto': row.id_producto, 'nombre': nombre, 'cantidad': int(row.cantidad), 'monto': float(row.monto)})

    return {
        'total_vendido': float(total_vendido),
        'numero_facturas': int(numero_facturas),
        'ventas_por_dia': ventas_por_dia,
        'top_productos': top_productos,
    }
