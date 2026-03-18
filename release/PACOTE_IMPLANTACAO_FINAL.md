# Pacote de Implantacao Final

## Checklist tecnico de pre-deploy

1. `npm run release:verify`
2. `npm run db:up`
3. `npm run db:migrate`
4. `npm run db:seed` (apenas ambiente novo)

## Variaveis obrigatorias

### Back-end

- `PORT`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `DATABASE_URL`
- `LOG_LEVEL`

### Front-end

- `VITE_API_URL`

## Smoke test pos-deploy

1. `GET /health/live` retorna `200`.
2. `GET /health/ready` retorna `200`.
3. Login de administrador.
4. Listagem de cameras em Home.
5. Abertura de transmissao no modal "Assistir".
6. Operacao de edicao/exclusao de camera no Admin.

## Artefatos desta entrega

- `release/SPRINT6_RELEASE_CANDIDATE.md`
- `release/CHECKLIST_SEGURANCA_FINAL.md`
- `release/PLANO_HOMOLOGACAO_USUARIOS.md`
- `release/PLANO_ROLLBACK_GO_LIVE.md`
