import os
import pytest

# Variables de entorno antes de importar la app
os.environ.setdefault("DB_HOST", "127.0.0.1")
os.environ.setdefault("DB_NAME", "alcaldia_db")
os.environ.setdefault("DB_USER", "alcaldia_app")
os.environ.setdefault("DB_PASSWORD", "alcaldia_pass_local")
os.environ.setdefault("JWT_SECRET", "test_secret_key_for_pytest_only")
os.environ.setdefault("ENVIRONMENT", "development")
