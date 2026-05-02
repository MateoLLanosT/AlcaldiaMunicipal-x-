from fastapi import APIRouter, Header, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, condecimal, constr
import psycopg2
from src.auth.service import decode_token, DB_CONFIG

router = APIRouter()
_bearer = HTTPBearer(auto_error=False)


class PagoBody(BaseModel):
    payment_token: constr(min_length=1, max_length=80)
    matricula_inmobiliaria: constr(min_length=1, max_length=30)
    monto: condecimal(gt=0, max_digits=12, decimal_places=2)


@router.post("/pago/impuesto")
def procesar_pago(
    body: PagoBody,
    authorization: str = Header(None),
    credentials: HTTPAuthorizationCredentials = Security(_bearer),
):
    token = None
    if credentials:
        token = credentials.credentials
    elif authorization:
        token = authorization.replace("Bearer ", "").strip()

    if not token:
        raise HTTPException(401, "No autorizado")
    try:
        payload = decode_token(token)
    except ValueError:
        raise HTTPException(401, "Token invalido")

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO transacciones (ciudadano_id, monto, matricula, payment_token, estado) "
                    "VALUES (%s, %s, %s, %s, 'aprobado')",
                    (payload["user_id"], body.monto, body.matricula_inmobiliaria, body.payment_token),
                )
            conn.commit()
        finally:
            conn.close()
    except psycopg2.Error:
        raise HTTPException(500, "Error al procesar el pago")

    return {
        "mensaje": "Pago procesado exitosamente",
        "matricula": body.matricula_inmobiliaria,
        "monto": str(body.monto),
    }
