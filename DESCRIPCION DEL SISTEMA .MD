# ¿Qué hace el sistema?

InnovFarma automatiza y centraliza la gestión de una farmacia, permitiendo:

- Registrar y autenticar usuarios con diferentes roles (admin, vendedor, cajero), controlando el acceso a cada módulo según permisos.
- Administrar el catálogo de productos: alta, edición, baja, control de stock y vencimiento, búsqueda y filtrado.
- Registrar clientes, editar sus datos y buscar por nombre, CI o contacto.
- Realizar ventas mediante un carrito interactivo, donde el vendedor selecciona productos, ajusta cantidades y genera facturas. El sistema valida el stock y muestra advertencias si la cantidad supera la existencia.
- Generar facturas automáticamente, asociando cada venta a un cliente y registrando el método de pago (efectivo o tarjeta).
- Actualizar el inventario en tiempo real tras cada venta o compra, mostrando alertas cuando el stock es bajo o hay productos próximos a vencer.
- Registrar compras a proveedores, lo que incrementa el inventario y permite llevar control de entradas de productos.
- Consultar y gestionar facturas, compras e inventarios desde paneles administrativos, con filtros y reportes.
- Proteger la información mediante sesiones seguras, cookies y control de acceso, garantizando la privacidad y trazabilidad de los datos.

El sistema está pensado para ser fácil de usar, con una interfaz web responsiva, mensajes claros y modales para advertencias y confirmaciones. Todo el flujo de trabajo de la farmacia (desde la entrada de productos, ventas, hasta la gestión de clientes y reportes) se realiza desde un solo lugar, optimizando tiempos y reduciendo errores humanos.
# Documentación Detallada del Sistema: InnovFarma

## 1. Introducción
InnovFarma es un sistema integral para la gestión de farmacias, orientado a optimizar procesos de ventas, inventarios, compras, facturación, usuarios y clientes. El sistema está diseñado para ser modular, escalable y fácil de mantener, utilizando tecnologías modernas tanto en backend como en frontend.

## 2. Aspectos Técnicos
- **Lenguajes:** Python (Backend), JavaScript, HTML, CSS (Frontend)
- **Frameworks:** Flask (Backend), Vanilla JS y Tailwind CSS (Frontend)
- **Base de datos:** MongoDB (NoSQL) como principal, SQL para migraciones
- **Estructura modular:** auth, clients, compras, inventarios, invoices, products, users
- **Gestión de dependencias:** requirements.txt (Python), package.json (frontend)
- **Configuración:** Variables en .env, config.py para Flask y MongoDB
- **Scripts de inicialización y migración:** init_mongo_db.py, migrate_sql_to_mongo.py, verify_and_fix_db.py
- **Seguridad:** Manejo de sesiones con Flask-Login, cookies seguras, roles y permisos

## 3. Colecciones de MongoDB

### Usuarios (`users`)
```json
{
	"_id": ObjectId,
	"nombre": "Juan Perez",
	"email": "juan@correo.com",
	"password_hash": "...",
	"rol": "admin|vendedor|cajero",
	"activo": true,
	"fecha_creacion": "2025-11-23T10:00:00Z"
}
```

### Productos (`products`)
```json
{
	"_id": ObjectId,
	"nombre": "Paracetamol",
	"categoria": "Analgésico",
	"precio": 10.5,
	"stock": 100,
	"codigo_barras": "1234567890123",
	"vencimiento": "2026-05-01"
}
```

### Clientes (`clients`)
```json
{
	"_id": ObjectId,
	"nombre": "Maria Lopez",
	"ci": "12345678",
	"telefono": "78945612",
	"email": "maria@correo.com",
	"direccion": "Av. Principal 123"
}
```

### Facturas (`invoices`)
```json
{
	"_id": ObjectId,
	"cliente_id": ObjectId,
	"fecha": "2025-11-23T12:00:00Z",
	"items": [
		{"producto_id": ObjectId, "cantidad": 2, "precio_unitario": 10.5}
	],
	"total": 21.0,
	"metodo_pago": "efectivo|tarjeta"
}
```

### Inventarios (`inventarios`)
```json
{
	"_id": ObjectId,
	"producto_id": ObjectId,
	"stock": 100,
	"sucursal": "Central",
	"fecha_actualizacion": "2025-11-23T09:00:00Z"
}
```

### Compras (`compras`)
```json
{
	"_id": ObjectId,
	"proveedor_id": ObjectId,
	"fecha": "2025-11-22T15:00:00Z",
	"items": [
		{"producto_id": ObjectId, "cantidad": 50, "precio_unitario": 8.0}
	],
	"total": 400.0
}
```

## 4. Lógica del Sistema
- **Autenticación y roles:** Login con email/usuario y contraseña, roles (admin, vendedor, cajero), permisos por módulo
- **Gestión de productos:** CRUD, control de stock y vencimiento
- **Gestión de clientes:** Registro, edición, búsqueda y filtrado
- **Ventas y facturación:** Carrito de compras, generación de facturas, métodos de pago
- **Inventarios:** Actualización automática por ventas y compras, alertas de bajo stock
- **Compras:** Registro de compras a proveedores, actualización de inventario

## 5. Interfaz de Usuario
- **Frontend SPA:** Navegación por módulos, formularios responsivos, tablas, filtros y búsquedas
- **Experiencia de usuario:** Modales para advertencias y confirmaciones, paneles de administración y ventas, acceso restringido según rol

## 6. Aspectos No Técnicos
- **Objetivos:** Automatizar la gestión de farmacia, mejorar trazabilidad y control, facilitar administración de usuarios y ventas
- **Requerimientos funcionales:**
	1. Registro y autenticación de usuarios
	2. Gestión de clientes y productos
	3. Registro de compras y ventas
	4. Control de inventarios
	5. Generación de facturas
- **Requerimientos no funcionales:** Seguridad y privacidad de datos, interfaz intuitiva y responsiva, escalabilidad y mantenibilidad

---
¿Necesitas agregar diagramas, ejemplos de endpoints, o detalles de configuración?
