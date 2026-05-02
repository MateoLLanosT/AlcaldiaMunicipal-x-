from fastapi import APIRouter, Header, HTTPException, Query, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import psycopg2
from src.auth.service import decode_token, DB_CONFIG

router = APIRouter()
_bearer = HTTPBearer(auto_error=False)


def _get_payload(
    authorization: str = Header(None),
    credentials: HTTPAuthorizationCredentials = Security(_bearer),
) -> dict:
    token = None
    if credentials:
        token = credentials.credentials
    elif authorization:
        token = authorization.replace("Bearer ", "").strip()

    if not token:
        raise HTTPException(401, "No autorizado")
    try:
        return decode_token(token)
    except ValueError:
        raise HTTPException(401, "Token invalido")


@router.get("/tramites/mis-tramites")
def ver_mis_tramites(
    authorization: str = Header(None),
    credentials: HTTPAuthorizationCredentials = Security(_bearer),
):
    payload = _get_payload(authorization, credentials)
    uid = payload.get("user_id")
    if uid is None:
        raise HTTPException(401, "Token invalido")

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT id, tipo, estado, descripcion, created_at "
                    "FROM tramites WHERE ciudadano_id = %s",
                    (uid,),
                )
                rows = cursor.fetchall()
        finally:
            conn.close()
    except psycopg2.Error:
        raise HTTPException(500, "Error al consultar tramites")

    return {"tramites": rows}


@router.get("/intranet/funcionarios")
def listar_funcionarios(
    authorization: str = Header(None),
    credentials: HTTPAuthorizationCredentials = Security(_bearer),
    buscar: str = Query(""),
):
    payload = _get_payload(authorization, credentials)

    if payload.get("role") not in {"ROLE_ADMIN", "ROLE_FUNCIONARIO"}:
        raise HTTPException(403, "No tienes permiso para esta accion")

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT id, nombre, cargo, email FROM funcionarios WHERE nombre ILIKE %s",
                    (f"%{buscar}%",),
                )
                rows = cursor.fetchall()
        finally:
            conn.close()
    except psycopg2.Error:
        raise HTTPException(500, "Error al consultar funcionarios")

    return {"funcionarios": rows}
