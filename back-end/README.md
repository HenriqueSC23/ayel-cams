# Ayel Cams Back-end

## PostgreSQL (Sprint 4)

1. Subir banco:
   - `docker compose up -d postgres`
2. Aplicar migracoes:
   - `npm run db:migrate`
3. Popular dados iniciais:
   - `npm run db:seed`
4. Rodar API:
   - `npm run dev`

## Rollback de migracao

- Reverter ultimo passo:
  - `npm run db:rollback`
- Reaplicar:
  - `npm run db:migrate`

## Variaveis de ambiente

Use `.env` baseado em `.env.example`.

## Observabilidade basica (Sprint 6)

- `GET /health/live`: liveness da API (sem dependencia de banco).
- `GET /health/ready`: readiness com verificacao de conexao no PostgreSQL.
- `GET /health`: status consolidado com check de banco.

Logs estruturados em JSON:
- `request.started`
- `request.completed`
- `request.unhandled_error`
- `server.started`
- `server.start_failed`
