# Homecare API Backend

Sistema de gestión de ayuda a domicilio. API backend para dar de alta y gestionar trabajadoras.

## Estructura del Proyecto

```
src/
├── database/
│   ├── config.ts                 # Configuración de BD desde database.json
│   ├── connection.ts             # Pool de conexión a MSSQL
│   ├── IMigration.ts             # Interfaz para migraciones
│   ├── migrationRunner.ts        # Gestor de migraciones (up/down)
│   ├── runMigrations.ts          # Script para ejecutar migraciones
│   └── migrations/
│       └── 001_create_workers_table.ts  # Primera migración
├── workers/
│   ├── dto/
│   │   └── create-worker.dto.ts  # DTO para crear trabajadora
│   ├── entities/
│   │   └── worker.entity.ts      # Entidad Worker
│   ├── workers.controller.ts     # Controlador de Workers
│   ├── workers.service.ts        # Servicio de Workers
│   └── workers.module.ts         # Módulo de Workers
├── app.module.ts
├── app.controller.ts
├── app.service.ts
└── main.ts

config/
└── database.json                 # Configuración de conexión MSSQL
```

## Configuración

1. **Copia `.env.example` a `.env`** y configura los datos de tu MSSQL Server:
   ```bash
   cp .env.example .env
   ```

2. **Actualiza `config/database.json`** con tus credenciales de MSSQL Server.

## Migraciones

### Ejecutar migraciones (crear tabla)
```bash
npm run migration:up
```

### Revertir última migración
```bash
npm run migration:down
```

Las migraciones se rastrean en la tabla `__migrations__` automáticamente.

## API Endpoints

### Crear una trabajadora
```bash
POST /workers
Content-Type: application/json

{
  "firstName": "María",
  "lastName": "García López",
  "documentNumber": "12345678A",
  "dateOfBirth": "1985-03-15"
}
```

### Obtener todas las trabajadoras
```bash
GET /workers
```

### Obtener una trabajadora por ID
```bash
GET /workers/{id}
```

## Desarrollo

Instalar dependencias:
```bash
pnpm install
```

Ejecutar en modo desarrollo:
```bash
npm run start:dev
```

Compilar:
```bash
npm run build
```

Ejecutar en producción:
```bash
npm run start:prod
```

## Testing

```bash
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e
```

## TDD Outside-in Double Loop

El proyecto sigue la metodología TDD outside-in:
1. **Acceptance test** (test de aceptación) - define el comportamiento esperado
2. **Unit tests** - implementa la lógica con pruebas unitarias
3. **Refactoring** - mejora el código manteniendo los tests en verde

## Modelo de Base de Datos

### Tabla: workers
```
id                  UNIQUEIDENTIFIER (PK)
first_name         NVARCHAR(255)
last_name          NVARCHAR(255)
document_number    NVARCHAR(50) UNIQUE
date_of_birth      DATE
created_at         DATETIME2
updated_at         DATETIME2
```

Índices:
- `idx_workers_document` en `document_number`
- `idx_workers_created_at` en `created_at`

## Próximos Pasos

- Agregar validación con `class-validator`
- Agregar tests de aceptación con Supertest
- Agregar autenticación y autorización
- Expandir modelo de trabajadora con más campos
- Crear más módulos (clientes, servicios, etc.)
