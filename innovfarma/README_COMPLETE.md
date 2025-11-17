# InnovFarma - Flask Migration (Completa)

## Descripción

Migración de `sistemfacturation` (Laravel) a **Flask + MongoDB**. Proyecto de facturación farmacéutica.

## Estructura

```
innovfarma/
├── app/
│   ├── __init__.py              # App factory y registrador de blueprints
│   ├── config.py                # Configuración
│   ├── mongo_client.py           # Cliente PyMongo
│   ├── mongo_models.py           # Helpers Mongo (usuarios, productos, etc.)
│   ├── models.py                 # Modelos SQLAlchemy (legacy, no usado en endpoints)
│   ├── auth/
│   │   └── routes.py             # POST /api/login, /api/logout
│   ├── products/
│   │   └── routes.py             # GET /api/productos, POST /api/productos/filtrar
│   ├── invoices/
│   │   └── routes.py             # GET/POST /api/facturas, POST /api/facturas/emitir
│   └── clients/
│       └── routes.py             # POST /api/clientes/buscar-por-ci, POST /api/clientes/registrar
├── run.py                       # Punto de entrada
├── requirements.txt             # Dependencias
├── .env.example                 # Variables de entorno
└── README.md                    # Este archivo

```

## Instalación y setup

### 1. Crear virtualenv e instalar dependencias

```powershell
cd C:\Users\MOLLERICONA\Downloads\IInnovfarma\innovfarma
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
```

### 2. Configurar `.env`

Copiar `.env.example` a `.env` y ajustar:

```bash
DATABASE_URL=mysql://...           # (opcional, no usado si usas Mongo)
MONGO_URI=mongodb+srv://rmq23:rmq71832695@cluster0.cju1e.mongodb.net/innovfarma?retryWrites=true&w=majority
FLASK_ENV=development
SECRET_KEY=change-me-in-production
```

### 3. Ejecutar la app

```powershell
python run.py
```

La app correrá en `http://127.0.0.1:5000`.

## Endpoints principales

### Autenticación

- **POST** `/api/login`
  - Body: `{ "email": "...", "password": "..." }` o `{ "username": "...", "password": "..." }`
  - Response: `{ "message": "ok", "user": {...} }`

- **POST** `/api/logout` (requiere login)
  - Response: `{ "message": "logged out" }`

### Productos

- **GET** `/api/productos`
  - Query params: (ninguno requerido)
  - Response: `[ { "id": "...", "Nombre_comercial": "...", ... }, ... ]`

- **POST** `/api/productos/filtrar`
  - Body: `{ "term": "paracetamol" }`
  - Response: `[ {...}, ... ]`

### Clientes

- **POST** `/api/clientes/buscar-por-ci`
  - Body: `{ "ci": "1234567" }`
  - Response: `{ "id": "...", "nombre": "...", "ci": "...", ... }`

- **POST** `/api/clientes/registrar`
  - Body: `{ "nombre": "Juan", "ci": "1234567", "direccion": "...", "telefono": "..." }`
  - Response: `{ "id": "...", "nombre": "...", ... }` (201 Created)

### Facturas

- **GET** `/api/facturas` (requiere login)
  - Query params: `skip=0&limit=50`
  - Response: `[ { "id": "...", "id_cliente": "...", "total": 100.00, ... }, ... ]`

- **GET** `/api/facturas/<factura_id>` (requiere login)
  - Response: `{ "id": "...", "detalles": [ {...}, ... ], ... }`

- **POST** `/api/facturas/emitir` (requiere login)
  - Body:
    ```json
    {
      "id_cliente": "507f1f77bcf86cd799439011",
      "id_sucursal": 1,
      "detalles": [
        { "id_producto": "507f1f77bcf86cd799439012", "cantidad": 2, "precio_unitario": 50.00 },
        { "id_producto": "507f1f77bcf86cd799439013", "cantidad": 1, "precio_unitario": 30.00 }
      ]
    }
    ```
  - Response: `{ "id": "...", "total": 130.00, "detalles": [...], ... }` (201 Created)

## Notas sobre MongoDB

- **Base de datos**: `innovfarma`
- **Colecciones principales**:
  - `usuarios` (email, username, password, nombre, apellidos, rol)
  - `productos` (Nombre_comercial, Nombre_generico, codigo, Precio_venta, etc.)
  - `clientes` (nombre, ci, direccion, telefono)
  - `facturas` (id_usuario, id_cliente, id_sucursal, fecha, total)
  - `detalle_factura` (id_factura, id_producto, cantidad, precio_unitario, subtotal)

## Integración con frontend Angular

El frontend Angular en `sistemfacturation/frontend` puede usar la API de Flask:

1. Cambiar la URL base en los servicios HTTP de Angular a `http://127.0.0.1:5000/api` (o la URL de producción).
2. El proxy en `frontend/proxy.conf.json` debería apuntar a `http://127.0.0.1:5000` si usas `ng serve`.

Ejemplo de cambio en `proxy.conf.json`:
```json
{
  "/api": {
    "target": "http://127.0.0.1:5000",
    "secure": false,
    "changeOrigin": true
  }
}
```

## Comandos útiles

- **Activar virtualenv**:
  ```powershell
  .\\.venv\\Scripts\\Activate.ps1
  ```

- **Desactivar virtualenv**:
  ```powershell
  deactivate
  ```

- **Instalar nuevas dependencias**:
  ```powershell
  pip install nombre_paquete
  pip freeze > requirements.txt
  ```

- **Ejecutar en modo debug**:
  ```powershell
  python run.py
  # La app automáticamente está en debug=True
  ```

## Próximos pasos

- [ ] Importar datos desde MySQL a MongoDB (script de migración).
- [ ] Añadir autenticación JWT opcional (en lugar de sesiones).
- [ ] Crear tests unitarios para endpoints.
- [ ] Desplegar a producción (ej. Heroku, AWS, DigitalOcean).
- [ ] Servir el frontend compilado de Angular desde Flask en producción.

## Troubleshooting

- **Error de conexión a MongoDB**: Verifica que la URI en `.env` sea correcta y que el cluster de Atlas esté disponible.
- **Error "Acceso denegado"**: Comprueba las credenciales de MongoDB en la URI.
- **CORS errors**: Los endpoints están configurados con CORS habilitado. Si aún hay problemas, ajusta `CORS(app, ...)` en `app/__init__.py`.

