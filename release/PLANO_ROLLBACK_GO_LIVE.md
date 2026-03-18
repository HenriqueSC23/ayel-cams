# Plano de Rollback - Go-Live

## Quando acionar rollback

- Erro critico de autenticacao/autorizacao apos deploy.
- Indisponibilidade do backend acima de 5 minutos.
- Falha de migracao sem recuperacao imediata.
- Regressao funcional bloqueadora em fluxos core (Home, Area, Admin).

## Passos de rollback (aplicacao)

1. Interromper rollout atual.
2. Reimplantar a versao estavel anterior (tag de producao anterior).
3. Validar health:
   - `GET /health/live`
   - `GET /health/ready`
4. Validar login e listagem de cameras.

## Passos de rollback (banco)

1. Executar rollback de migracao:
   - `npm --prefix back-end run db:rollback`
2. Reaplicar migracoes somente apos estabilizacao:
   - `npm --prefix back-end run db:migrate`
3. Se necessario, restaurar backup da base de dados anterior ao deploy.

## Verificacao pos-rollback

- [ ] Health endpoints normalizados.
- [ ] Fluxo de login validado.
- [ ] CRUD administrativo validado.
- [ ] Monitoramento sem erro critico recorrente por 30 minutos.

## Donos e comunicacao

- Responsavel tecnico de plantao: ____________________
- Responsavel de produto: ____________________
- Canal de comunicacao do incidente: ____________________
