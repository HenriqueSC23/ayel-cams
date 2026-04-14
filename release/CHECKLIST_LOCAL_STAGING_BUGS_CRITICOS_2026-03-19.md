# Checklist de Execucao - Bugs Criticos (Local + Staging)

## A) Local (executado)

### Baseline tecnico
- [x] `npm run release:verify`
- [x] Lint front/back
- [x] Testes front/back
- [x] Build front/back
- [x] Audit npm (moderate+)

### Banco e API
- [x] `npm run db:up`
- [x] `npm run db:migrate`
- [x] `npm run db:seed`
- [x] `GET /health/live`
- [x] `GET /health/ready`
- [x] `GET /health`

### Fluxos criticos API
- [x] Login valido/invalido
- [x] Sessao e logout (token invalido apos logout)
- [x] Rotas admin com permissao
- [x] Negacao sem token/token invalido/role sem permissao
- [x] CRUD camera
- [x] CRUD usuario
- [x] Persistencia de `streamUrl` (inclusive MJPEG/JPEG)

### UX critica (evidencia tecnica)
- [x] Home exibe feedback claro quando API indisponivel
- [x] Modal de transmissao suporta stream URL de video e stream MJPEG/JPEG por imagem
- [ ] Revalidacao manual visual completa em browser (pendente de rodada QA guiada)

## B) Staging (pendente)

Pre-requisitos:
- [ ] URL de staging informada
- [ ] Credenciais de homologacao informadas
- [ ] Variaveis de ambiente de staging confirmadas

Execucao minima obrigatoria:
- [ ] `GET /health/live` = 200
- [ ] `GET /health/ready` = 200
- [ ] Login admin e cliente
- [ ] Home: grid/lista + filtro + assistir
- [ ] Area restrita: filtros + assistir
- [ ] Admin: CRUD camera e usuario
- [ ] Perfil: atualizar conta + trocar senha
- [ ] Coletar logs estruturados no backend com `request-id`
- [ ] Registrar divergencias local x staging

Resultado staging:
- Status: [ ] Aprovado  [ ] Aprovado com ressalvas  [ ] Reprovado
- Evidencias/observacoes:
  - _______________________________________________________________
  - _______________________________________________________________
