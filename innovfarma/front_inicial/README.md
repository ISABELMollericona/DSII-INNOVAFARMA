# Front Inicial - InnovFarma

Esta carpeta contiene una interfaz estática ligera servida desde Flask para desarrollo rápido.

Rutas cliente (SPA hash-based):
- #/inicio — Dashboard
- #/productos — Listado de productos
- #/productos/create — Crear producto
- #/productos/edit/:id — Editar producto
- #/clientes — Listado de clientes
- #/facturas — Listado de facturas
- #/login — Login

API esperada (ejemplos):
- GET /api/products
- GET /api/products/:id
- POST /api/products
- PUT /api/products/:id
- DELETE /api/products/:id
- GET /api/clients
- GET /api/invoices
- POST /api/login -> { token, user }

Instrucciones:
1. Desde la raíz del proyecto ejecuta:
   python run.py
2. Abre http://localhost:5000

Notas:
- El frontend usa fetch y guarda `token` en localStorage cuando se autentica.
- Es una interfaz minimalista para desarrollo; puedes mejorar estilos y agregar funcionalidades según el backend.
