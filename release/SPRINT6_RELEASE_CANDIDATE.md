# Release Candidate - Sprint 6

- Projeto: Ayel Cams
- Versao candidata: `rc-2026.04.30`
- Janela alvo de Go-Live: 30/04/2026
- Responsavel tecnico: ____________________
- Responsavel produto: ____________________

## Escopo fechado no RC

- Hardening de qualidade: `lint`, `test`, `build` e `audit` consolidados em `npm run release:verify`.
- Observabilidade basica no backend:
  - `GET /health/live`
  - `GET /health/ready`
  - `GET /health`
  - logs estruturados JSON com `request-id`.
- Checklists de seguranca e homologacao documentados.
- Plano de rollback operacional documentado.

## Evidencias tecnicas (pre-go-live)

- [ ] `npm run release:verify` executado sem falha.
- [ ] Back-end em ambiente alvo com `JWT_SECRET` e `CORS_ORIGIN` explicitos.
- [ ] Health-check validado em ambiente alvo:
  - [ ] `/health/live` = 200
  - [ ] `/health/ready` = 200
  - [ ] `/health` = 200
- [ ] Teste de rollback de migracao validado em staging.

## Assinaturas

- Homologacao (Usuario-chave): ____________________ Data: ____/____/____
- Seguranca/Compliance: ____________________ Data: ____/____/____
- Tech Lead: ____________________ Data: ____/____/____
