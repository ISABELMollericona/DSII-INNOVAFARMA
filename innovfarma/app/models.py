from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(150))
    apellidos = db.Column(db.String(150))
    username = db.Column(db.String(100), unique=True)
    email = db.Column(db.String(150), unique=True)
    password_hash = db.Column(db.String(255))
    rol = db.Column(db.String(50))
    imagen = db.Column(db.String(255))
    id_sucursal = db.Column(db.Integer)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    # Flask-Login integration
    @property
    def is_authenticated(self):
        return True

    @property
    def is_active(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def get_id(self):
        return str(self.id)

class Product(db.Model):
    __tablename__ = 'productos'
    id = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(100))
    Nombre_comercial = db.Column(db.String(255))
    Cod_barrras = db.Column(db.String(100))
    Nombre_generico = db.Column(db.String(255))
    Accion_terapeutica = db.Column(db.String(255))
    Principio_activo = db.Column(db.String(255))
    Concentracion = db.Column(db.String(100))
    Presentacion = db.Column(db.String(100))
    Precio_compra = db.Column(db.Float)
    Precio_venta = db.Column(db.Float)
    Margen_utilidad = db.Column(db.Float)
    Cod_imp_nacionales = db.Column(db.String(100))
    Cantidad_minima_pedido = db.Column(db.Float)
    Cantidad_maxima_inventario = db.Column(db.Float)
    Tiempo_sin_movimiento = db.Column(db.Integer)
    Cantidad_minima_inventario = db.Column(db.Float)
    Alerta_caducidad_dias = db.Column(db.Integer)
    Cod_nandina = db.Column(db.String(100))
    id_subcategoria = db.Column(db.Integer)
    id_forma_farmaceutica = db.Column(db.Integer)
    id_marca = db.Column(db.Integer)
    id_laboratorio = db.Column(db.Integer)
    id_unidad_medida = db.Column(db.Integer)
    Control_inventario = db.Column(db.Integer, default=0)
    Receta_medica = db.Column(db.Integer, default=0)
    Favorito = db.Column(db.Integer, default=0)
    Granel = db.Column(db.Integer, default=0)
    Medicamento_controlado = db.Column(db.Integer, default=0)
    Solo_compra = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'codigo': self.codigo,
            'Nombre_comercial': self.Nombre_comercial,
            'Cod_barrras': self.Cod_barrras,
            'Nombre_generico': self.Nombre_generico,
            'Accion_terapeutica': self.Accion_terapeutica,
            'Principio_activo': self.Principio_activo,
            'Concentracion': self.Concentracion,
            'Presentacion': self.Presentacion,
            'Precio_compra': self.Precio_compra,
            'Precio_venta': self.Precio_venta,
            'Margen_utilidad': self.Margen_utilidad,
            'Cod_imp_nacionales': self.Cod_imp_nacionales,
            'Cantidad_minima_pedido': self.Cantidad_minima_pedido,
            'Cantidad_maxima_inventario': self.Cantidad_maxima_inventario,
            'Tiempo_sin_movimiento': self.Tiempo_sin_movimiento,
            'Cantidad_minima_inventario': self.Cantidad_minima_inventario,
            'Alerta_caducidad_dias': self.Alerta_caducidad_dias,
            'Cod_nandina': self.Cod_nandina,
            'id_subcategoria': self.id_subcategoria,
            'id_forma_farmaceutica': self.id_forma_farmaceutica,
            'id_marca': self.id_marca,
            'id_laboratorio': self.id_laboratorio,
            'id_unidad_medida': self.id_unidad_medida,
            'Control_inventario': self.Control_inventario,
            'Receta_medica': self.Receta_medica,
            'Favorito': self.Favorito,
            'Granel': self.Granel,
            'Medicamento_controlado': self.Medicamento_controlado,
            'Solo_compra': self.Solo_compra,
        }

class Factura(db.Model):
    __tablename__ = 'facturas'
    id = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer)
    id_cliente = db.Column(db.Integer)
    id_sucursal = db.Column(db.Integer)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)
    total = db.Column(db.Float)

class Cliente(db.Model):
    __tablename__ = 'clientes'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(255))
    ci = db.Column(db.String(100))
    direccion = db.Column(db.String(255))
    telefono = db.Column(db.String(100))

class DetalleFactura(db.Model):
    __tablename__ = 'detalle_factura'
    id = db.Column(db.Integer, primary_key=True)
    id_factura = db.Column(db.Integer)
    id_producto = db.Column(db.Integer)
    cantidad = db.Column(db.Integer)
    precio_unitario = db.Column(db.Float)
    subtotal = db.Column(db.Float)

