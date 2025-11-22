# Funciones helper para clientes con SQLAlchemy
from ..models import db, Cliente


def create_cliente(nombre, nit='', ci='', direccion='', telefono=''):
    """Crear un nuevo cliente. Se prioriza `nit` si está presente."""
    cliente = Cliente(
        nombre=nombre,
        ci=ci,
        nit=nit,
        direccion=direccion,
        telefono=telefono
    )
    db.session.add(cliente)
    db.session.commit()
    return cliente.id

def get_cliente(cliente_id):
    """Obtener cliente por ID"""
    cliente = Cliente.query.get(cliente_id)
    if not cliente:
        return None
    return {
        'id': cliente.id,
        'nombre': cliente.nombre,
        'ci': cliente.ci,
        'nit': cliente.nit,
        'direccion': cliente.direccion,
        'telefono': cliente.telefono,
    }

def search_cliente_by_ci(ci):
    """Buscar cliente por CI"""
    cliente = Cliente.query.filter_by(ci=ci).first()
    if not cliente:
        return None
    return {
        'id': cliente.id,
        'nombre': cliente.nombre,
        'ci': cliente.ci,
        'nit': cliente.nit,
        'direccion': cliente.direccion,
        'telefono': cliente.telefono,
    }


def search_cliente_by_nit(nit):
    """Buscar cliente por NIT"""
    cliente = Cliente.query.filter_by(nit=nit).first()
    if not cliente:
        return None
    return {
        'id': cliente.id,
        'nombre': cliente.nombre,
        'ci': cliente.ci,
        'nit': cliente.nit,
        'direccion': cliente.direccion,
        'telefono': cliente.telefono,
    }

def search_cliente_by_nombre(nombre):
    """Buscar clientes por nombre (búsqueda parcial)"""
    clientes = Cliente.query.filter(Cliente.nombre.ilike(f'%{nombre}%')).limit(10).all()
    out = []
    for cliente in clientes:
        out.append({
            'id': cliente.id,
            'nombre': cliente.nombre,
            'ci': cliente.ci,
            'nit': cliente.nit,
            'direccion': cliente.direccion,
            'telefono': cliente.telefono,
        })
    return out

def list_clientes(limit=100, skip=0):
    """Listar clientes con paginación"""
    clientes = Cliente.query.offset(skip).limit(limit).all()
    out = []
    for cliente in clientes:
        out.append({
            'id': cliente.id,
            'nombre': cliente.nombre,
            'ci': cliente.ci,
            'nit': cliente.nit,
            'direccion': cliente.direccion,
            'telefono': cliente.telefono,
        })
    return out

def update_cliente(cliente_id, **kwargs):
    """Actualizar cliente"""
    cliente = Cliente.query.get(cliente_id)
    if not cliente:
        return False
    
    # Solo actualizar campos que se pasen
    for key, value in kwargs.items():
        if hasattr(cliente, key) and key != 'id':
            setattr(cliente, key, value)
    
    db.session.commit()
    return True
