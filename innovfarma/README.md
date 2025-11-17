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

2. Copiar `innovfarma/.env.example` a `.env` y ajustar la variable `DATABASE_URL`.
	 - Si vas a usar Aiven MySQL, establece `DATABASE_URL` en el formato:
		 `mysql+mysqldb://<user>:<password>@<host>:<port>/<database>`
	 - Ejemplo (Aiven):
		`mysql+mysqldb://avnadmin:AVNS_yBvY_6DXh7OJFEiee3p@innovfarma-isabelmollericona1-2658.k.aivencloud.com:21546/innovfarma`
	 - Nota: Aiven puede requerir parámetros SSL/CA; si la conexión falla revisa la documentación de Aiven y agrega los parámetros SSL necesarios.
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

Comprobar conexión a Aiven MySQL (opcional)
1. Instala dependencias si no lo hiciste:

```powershell
pip install -r requirements.txt
```

2. Ejecuta el script de verificación:

```powershell
python check_db_connection.py
```

El script intentará conectarse usando `DATABASE_URL` del `.env` y te mostrará si la conexión fue exitosa o te dará el error.

Siguientes pasos
- Mapear y completar todos los modelos y migraciones.
- Implementar endpoints restantes (facturación, clientes, stock, reportes).
- Integrar con el frontend Angular (CORS o servir `public/frontend`).
