# InnovFarma (Flask migration)

Este proyecto contiene un scaffold inicial para migrar la lógica de `sistemfacturation` (Laravel) a Flask.

Objetivo rápido
- App Flask 'innovfarma' con SQLAlchemy, Flask-Migrate y Flask-Login.
- Blueprints iniciales: auth (login/logout) y products (list, filtrar).

Instrucciones rápidas
1. Crear y activar un entorno virtual (Windows PowerShell):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```


3. Inicializar migrations y crear la base de datos:

```powershell
set FLASK_APP=run.py
flask db init
flask db migrate -m "initial"
flask db upgrade
```

4. Ejecutar la app:

```powershell
python run.py
```



El script intentará conectarse usando `DATABASE_URL` del `.env` y te mostrará si la conexión fue exitosa o te dará el error.

Siguientes pasos
- Mapear y completar todos los modelos y migraciones.
- Implementar endpoints restantes (facturación, clientes, stock, reportes).
- Integrar con el frontend Angular (CORS o servir `public/frontend`).
