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
