# Ejecutar esta app con Electron

Estos pasos permiten ejecutar la versión de escritorio de la carpeta `front_inicial` usando Electron.

Requisitos:
- Node.js (12+)

Pasos:

1. Abrir la terminal en `innovfarma/front_inicial`.
2. Instalar dependencias locales:

```powershell
npm install
```

3. Iniciar la app de escritorio:

```powershell
npm run start:electron
```

Notas:
- El script `start:electron` arranca Electron que carga el `index.html` desde la carpeta local.
- La aplicación aún depende de un backend (rutas `/api/...`) — Electron no crea el backend automáticamente. Si deseas usar la app en modo offline o empaquetarla con un backend integrado tendríamos que añadirlo como siguiente paso.

Important: Antes de iniciar Electron debes arrancar el backend (API) de la app. Por defecto el frontend asume que el backend está en http://localhost:5000.

Cómo arrancar el backend (ejemplo con Python/Flask desde la raíz del proyecto):

```powershell
cd ..\..\  # sitúate en la raíz del repo (donde está run.py)
python run.py
```

Si quieres que Electron use otra URL para el backend puedes pasar una variable al proceso de Electron (en el main) o exportar BACKEND_URL antes de lanzar:

```powershell
set BACKEND_URL=http://localhost:8000
npx electron .
```

Credenciales demo (prellenadas en el formulario de login cuando se ejecuta localmente y en Electron):

- Administrador
	- usuario: admin
	- contraseña: Admin123!

- Vendedor (valor por defecto en el login demo)
	- usuario: vendedor
	- contraseña: Vendedor123!
