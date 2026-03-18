# Checklist de Seguranca Final (Sprint 6)

## Aplicacao

- [ ] `JWT_SECRET` definido e forte em producao (sem fallback padrao).
- [ ] `CORS_ORIGIN` configurado com lista explicita de dominios permitidos.
- [ ] Sem credenciais hardcoded em codigo-fonte.
- [ ] Fluxo de senha com hash ativo (sem senha em texto puro).
- [ ] Endpoints administrativos protegidos por autenticacao e papel.

## Dependencias e cadeia de build

- [ ] `npm run audit` sem vulnerabilidade critica/moderada aberta.
- [ ] Lockfiles atualizados e versionados.
- [ ] Build reproducivel a partir de clone limpo.

## Operacao

- [ ] `LOG_LEVEL` definido conforme ambiente.
- [ ] Health endpoints monitorados (`/health/live`, `/health/ready`).
- [ ] Plano de rollback revisado com o time.
- [ ] Rotina de backup de banco confirmada antes do deploy.

## Aprovao

- Responsavel seguranca: ____________________
- Data: ____/____/____
- Observacoes: __________________________________________________________
