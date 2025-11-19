from flask import Blueprint

inventarios_bp = Blueprint('inventarios', __name__)

from . import routes  # noqa: E402,F401
