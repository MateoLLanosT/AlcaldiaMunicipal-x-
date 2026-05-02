"""Tests de auth Caso C — verifica correcciones de seguridad."""
import base64
import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from src.main import app

client = TestClient(app, raise_server_exceptions=False)

_FAKE_HASH = "$2b$12$fakehashfortest000000000000000000000000000000000000000"


def _mock_conn(fetchone=None, fetchall=None):
    """Retorna (conn_mock, cursor_mock) con valores prefijados."""
    cursor = MagicMock()
    cursor.__enter__ = lambda s: s
    cursor.__exit__ = MagicMock(return_value=False)
    cursor.fetchone.return_value = fetchone
    cursor.fetchall.return_value = fetchall or []

    conn = MagicMock()
    conn.__enter__ = lambda s: s
    conn.__exit__ = MagicMock(return_value=False)
    conn.cursor.return_value = cursor
    return conn, cursor


# ---------------------------------------------------------------------------
# Test 1: mensajes de error identicos (anti user-enumeration)
# ---------------------------------------------------------------------------
def test_login_mensajes_diferentes():
    """Usuario inexistente y password incorrecto deben dar exactamente el mismo mensaje."""
    # Caso 1: cedula no existe en BD — verify_password usa el hash dummy
    conn1, _ = _mock_conn(fetchone=None)
    with patch("psycopg2.connect", return_value=conn1), \
         patch("src.auth.router.verify_password", return_value=False):
        r_no_existe = client.post(
            "/api/auth/login",
            json={"cedula": "0000000000", "password": "cualquier_cosa"},
        )

    # Caso 2: cedula existe pero password incorrecto
    conn2, _ = _mock_conn(fetchone=(1, "Juan Perez", "ROLE_CIUDADANO", "activo", _FAKE_HASH))
    with patch("psycopg2.connect", return_value=conn2), \
         patch("src.auth.router.verify_password", return_value=False):
        r_wrong_pwd = client.post(
            "/api/auth/login",
            json={"cedula": "1234567890", "password": "password_incorrecto"},
        )

    assert r_no_existe.status_code == 401
    assert r_wrong_pwd.status_code == 401
    assert r_no_existe.json()["detail"] == r_wrong_pwd.json()["detail"], (
        "Los mensajes deben ser identicos para evitar enumeracion de usuarios"
    )


# ---------------------------------------------------------------------------
# Test 2: token no contiene la cedula completa
# ---------------------------------------------------------------------------
def test_cedula_en_token():
    """El JWT debe incluir cedula_masked (***XXXX), nunca la cedula completa."""
    cedula = "9876543210"

    conn, _ = _mock_conn(fetchone=(42, "Maria Lopez", "ROLE_CIUDADANO", "activo", _FAKE_HASH))
    with patch("psycopg2.connect", return_value=conn), \
         patch("src.auth.router.verify_password", return_value=True):
        resp = client.post(
            "/api/auth/login",
            json={"cedula": cedula, "password": "mi_password_seguro"},
        )

    assert resp.status_code == 200, f"Login fallo: {resp.json()}"
    token = resp.json()["token"]

    # Decodificar payload sin verificar firma
    segment = token.split(".")[1]
    padding = 4 - len(segment) % 4
    payload = json.loads(base64.urlsafe_b64decode(segment + "=" * padding))

    assert cedula not in json.dumps(payload), (
        "La cedula completa no debe estar en el payload del token"
    )
    assert "cedula_masked" in payload, "Debe incluir el campo cedula_masked"
    assert payload["cedula_masked"].startswith("***"), (
        "cedula_masked debe iniciar con *** para estar enmascarada"
    )


# ---------------------------------------------------------------------------
# Test 3: pago no almacena PAN ni CVV
# ---------------------------------------------------------------------------
def test_pago_no_almacena_tarjeta():
    """El endpoint de pago solo debe persistir el payment_token, nunca PAN ni CVV."""
    from src.auth.service import create_token

    token = create_token({"sub": "1", "user_id": 1, "role": "ROLE_CIUDADANO"})

    conn, cursor = _mock_conn()
    with patch("psycopg2.connect", return_value=conn):
        resp = client.post(
            "/api/pago/impuesto",
            json={
                "payment_token": "tok_4242_1714567890",
                "matricula_inmobiliaria": "MAT-2024-001",
                "monto": 150000,
            },
            headers={"Authorization": f"Bearer {token}"},
        )

    assert resp.status_code == 200, f"Pago fallo: {resp.json()}"

    # Verificar que ningun INSERT guarda un PAN (16 digitos) ni CVV (3-4 digitos)
    for call in cursor.execute.call_args_list:
        sql = str(call[0][0]).lower()
        if "insert" in sql and "transacciones" in sql:
            params = call[0][1] if len(call[0]) > 1 else ()
            for p in params:
                if isinstance(p, str) and p.isdigit():
                    assert len(p) != 16, f"PAN detectado en INSERT: {p}"
                    assert len(p) not in (3, 4), f"CVV detectado en INSERT: {p}"

    # La respuesta no debe devolver datos de tarjeta
    body_str = json.dumps(resp.json()).lower()
    assert "cvv" not in body_str, "La respuesta no debe contener CVV"
    assert "tarjeta" not in body_str, "La respuesta no debe contener numero de tarjeta"
