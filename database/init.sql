-- Script de inicializacion para Docker (la BD ya fue creada por POSTGRES_DB)
-- Para uso manual ver schema.sql

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

CREATE TABLE IF NOT EXISTS transacciones (
    id            SERIAL PRIMARY KEY,
    ciudadano_id  INT REFERENCES ciudadanos(id),
    monto         DECIMAL(12,2),
    matricula     VARCHAR(30),
    payment_token VARCHAR(80) NOT NULL,
    estado        VARCHAR(20),
    created_at    TIMESTAMP DEFAULT NOW()
);

-- Datos de prueba
INSERT INTO ciudadanos (cedula, nombre, email, telefono, password_hash)
VALUES (
    '1234567890',
    'Juan Perez',
    'juan@example.com',
    '3001234567',
    '$2b$12$6hwj8uHZNT9iengFGvLr8eU6IDv03YkXiqgMnH8QZAsgpSBqzNFpm'
) ON CONFLICT (cedula) DO NOTHING;
-- La contrasena del usuario de prueba es: Test1234!

INSERT INTO funcionarios (nombre, email, cargo, password_hash)
VALUES (
    'Carlos Ramirez',
    'carlos@alcaldia.gov.co',
    'Secretario',
    '$2b$12$6hwj8uHZNT9iengFGvLr8eU6IDv03YkXiqgMnH8QZAsgpSBqzNFpm'
) ON CONFLICT (email) DO NOTHING;
