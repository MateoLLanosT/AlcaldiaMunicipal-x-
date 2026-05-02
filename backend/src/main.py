import os
from dotenv import load_dotenv

load_dotenv()  # carga backend/.env antes de que los routers lean os.getenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from src.auth.router import router as auth_router
from src.tramites.router import router as tramite_router
from src.pagos.router import router as pago_router

security = HTTPBearer(auto_error=False)

app = FastAPI(
    title="Alcaldia Digital API",
    version="1.0.0",
    swagger_ui_init_oauth={"usePkceWithAuthorizationCodeGrant": False},
)

_PROD_ORIGIN = "https://alcaldia-grupoN.lab.umng.edu.co"
_DEV_ORIGINS = ["http://localhost:8000", "http://localhost:4200", "http://127.0.0.1:4200"]

origins = (
    _DEV_ORIGINS
    if os.getenv("ENVIRONMENT", "development") == "development"
    else [_PROD_ORIGIN]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(tramite_router, prefix="/api", tags=["tramites"])
app.include_router(pago_router, prefix="/api", tags=["pagos"])
