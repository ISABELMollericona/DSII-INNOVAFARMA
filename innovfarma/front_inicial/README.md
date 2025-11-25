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

 - Se añadió un modal de login con diseño tipo "landing": imagen de doctora farmacéutica a la izquierda y formulario a la derecha. La imagen de ejemplo está en `assets/login.jpg`.

 - El modal de login ahora aplica estilos tipo "landing" (imagen a la izquierda + tarjeta blanca centrada a la derecha) y dispone de las pestañas Sign In / Sign Up. Si tu entorno sigue mostrando un modal simple en blanco, asegúrate de que el archivo `front_inicial/assets/login.jpg` existe y que el navegador esté cargando `front_inicial/styles.css` actualizado.
 - El modal de login ahora aplica estilos tipo "landing" (imagen a la izquierda + tarjeta blanca centrada a la derecha) y dispone de las pestañas Sign In / Sign Up. Si tu entorno sigue mostrando un modal simple en blanco, asegúrate de que el archivo `front_inicial/assets/login.jpg` existe y que el navegador esté cargando `front_inicial/styles.css` actualizado.

Tema global (sin degradados):
- Se añadió `front_inicial/custom_theme.css` y se carga después del Tailwind compilado. Este fichero aplica un estilo moderno y plano (sin degradados) a header, sidebar, botones, tarjetas y modales para un look consistente en toda la interfaz.

 - Sustituye `front_inicial/assets/login.jpg` por una imagen propia si deseas usar una foto real de una doctora de farmacia. Ajusta `background-position` / `background-size` en `styles.css` si es necesario.
- El modal se abre automáticamente al iniciar la aplicación (si no hay sesión) o navegando a `#/login`.
