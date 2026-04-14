# Relatorio de Verificacao de Bugs Criticos

- Data: 19/03/2026
- Escopo: plataforma inteira (front-end + back-end), foco apenas em bugs criticos/alto risco
- Ambiente executado: local
- Ambiente staging: pendente (sem URL/credenciais informadas neste ciclo)

## 1) Baseline da varredura

Status geral do gate tecnico:
- `npm run release:verify` = **PASS**
- `lint` (front/back) = **PASS**
- `test` (back 15 testes, front 4 testes) = **PASS**
- `build` (front/back) = **PASS**
- `audit` (moderate+) = **PASS (0 vulnerabilidades)**

Estado do repositorio no inicio:
- Alteracao pendente: `front-end/app/components/platform/camera-watch-dialog.tsx`

## 2) Validacao critica de API (local)

Banco/infra:
- `npm run db:up` = PASS
- `npm run db:migrate` = PASS
- `npm run db:seed` = PASS

Health/observabilidade:
- `GET /health/live` = 200 PASS
- `GET /health/ready` = 200 PASS
- `GET /health` = 200 PASS

Fluxos criticos executados por roteiro automatizado:
- Negacao sem token em `/auth/me` = PASS (401)
- Login admin valido = PASS (200)
- Sessao com token valido em `/auth/me` = PASS
- Token invalido em rota protegida = PASS (401)
- Cadastro cliente = PASS (201)
- Cliente acessando rota admin `/users` = PASS (403)
- CRUD de camera (create/list/update/delete) = PASS
- CRUD de usuario (create/update/delete) = PASS
- Logout + invalidacao de token = PASS (204 seguido de 401 no `/auth/me`)
- Persistencia de `streamUrl` com link MJPEG/JPEG = PASS

## 3) Achados de risco critico (triagem)

### P1 - Revogacao de token nao persiste em restart
- Impacto: apos restart da API, tokens com logout anterior podem voltar a ser aceitos ate expiracao JWT.
- Evidencia: store de revogacao em memoria (`Map`) sem persistencia.
- Referencia:
  - `back-end/src/lib/token-revocation-store.ts:1`
  - `back-end/src/lib/token-revocation-store.ts:11`
  - `back-end/src/lib/token-revocation-store.ts:15`
- Risco de release: **alto** (seguranca de sessao)
- Recomendacao: persistir blacklist de `jti` no banco (ou reduzir TTL + refresh token rotativo), com limpeza por expiracao.

### P2 - Origem CORS negada retorna 500 em vez de 403
- Impacto: semantica HTTP incorreta e ruido de monitoramento (erro de cliente aparece como erro interno).
- Evidencia: request com `Origin` nao autorizada retorna `500` com payload de erro interno.
- Referencia:
  - `back-end/src/server.ts:349`
  - `back-end/src/server.ts:362`
  - `back-end/src/server.ts:1316`
- Risco de release: **moderado**
- Recomendacao: tratar erro de CORS explicitamente e responder `403` com mensagem de origem nao permitida.

## 4) Backlog priorizado (impacto x esforco)

1. **P1** - Persistencia de revogacao de token (`jti`) em banco  
   - Dono sugerido: Backend/Security  
   - Esforco: medio  
   - ETA sugerido: 1-2 dias uteis  
   - Gate: obrigatorio antes de release final sem mitigacao

2. **P2** - Ajuste de resposta para CORS negado (`403`)  
   - Dono sugerido: Backend API  
   - Esforco: baixo  
   - ETA sugerido: 0.5 dia util  
   - Gate: pode sair com mitigacao documentada

3. **P2** - Evidencia manual de persistencia apos restart em staging  
   - Dono sugerido: QA + DevOps  
   - Esforco: baixo  
   - ETA sugerido: 0.5 dia util  
   - Gate: obrigatorio para fechamento de homologacao

## 5) Gate de release proposto

- `P0`: nenhum achado.
- `P1`: 1 achado aberto (revogacao de token em memoria).

Decisao sugerida:
- **Nao promover para release final** enquanto o P1 nao for corrigido **ou** mitigado com aprovacao formal de risco.
- Seguir com homologacao tecnica em staging usando o checklist do arquivo de execucao local/staging.
