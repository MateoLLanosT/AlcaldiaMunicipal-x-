-- Esquema Alcaldia Digital de Municipio X
-- Para aplicar manualmente:
--   psql -U postgres -c "CREATE DATABASE alcaldia_db"
--   psql -U postgres -d alcaldia_db -f schema.sql
-- Con Docker Compose: se aplica automaticamente via docker-entrypoint-initdb.d

CREATE TABLE IF NOT EXISTS ciudadanos (
    id            SERIAL PRIMARY KEY,
    cedula        VARCHAR(12) UNIQUE NOT NULL,
    nombre        VARCHAR(120) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    telefono      VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(30) DEFAULT 'ROLE_CIUDADANO',
    estado        VARCHAR(20) DEFAULT 'activo',
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS funcionarios (
    id            SERIAL PRIMARY KEY,
    nombre        VARCHAR(120) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    cargo         VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(30) DEFAULT 'ROLE_FUNCIONARIO',
    estado        VARCHAR(20) DEFAULT 'activo',
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tramites (
    id           SERIAL PRIMARY KEY,
    ciudadano_id INT REFERENCES ciudadanos(id),
    tipo         VARCHAR(80) NOT NULL,
    estado       VARCHAR(30) DEFAULT 'pendiente',
    descripcion  TEXT,
    created_at   TIMESTAMP DEFAULT NOW(),
    updated_at   TIMESTAMP DEFAULT NOW()
);

-- Almacena solo el token opaco de la pasarela de pago, nunca PAN ni CVV
CREATE TABLE IF NOT EXISTS transacciones (
    id            SERIAL PRIMARY KEY,
    ciudadano_id  INT REFERENCES ciudadanos(id),
    monto         DECIMAL(12,2),
    matricula     VARCHAR(30),
    payment_token VARCHAR(80) NOT NULL,
    estado        VARCHAR(20),
    created_at    TIMESTAMP DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'alcaldia_app') THEN
        CREATE USER alcaldia_app WITH PASSWORD 'alcaldia_pass_local';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE alcaldia_db TO alcaldia_app;
GRANT USAGE ON SCHEMA public TO alcaldia_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO alcaldia_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO alcaldia_app;
