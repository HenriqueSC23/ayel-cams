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

Variaveis importantes para streaming seguro:
- `STREAM_URL_ENCRYPTION_KEY`: chave base64 de 32 bytes para criptografia do stream no banco.
- `STREAM_PLAY_TOKEN_SECRET`: segredo para assinatura dos tokens efemeros de reproducao.
- `STREAM_PLAY_TOKEN_TTL_SECONDS`: validade do token de reproducao (default 120s).
- `STREAM_SESSION_RATE_LIMIT`: limite de criacao de sessoes por usuario/camera na janela.
- `STREAM_SESSION_RATE_LIMIT_WINDOW_MS`: janela de rate-limit em milissegundos.
- `STREAM_MAX_CONCURRENT_PER_USER_CAMERA`: limite de sessoes simultaneas por usuario/camera.
- `STREAM_URL_ALLOWED_HOSTS`: allowlist de hostnames/IPs permitidos para stream.
- `STREAM_GATEWAY_PUBLIC_BASE_URL`: base URL publica usada para montar `playbackUrl`.
- `STREAM_INTERNAL_API_KEY`: chave de protecao da rota interna `/internal/streams/source/:cameraId`.

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

## Streaming seguro

- `POST /streams/sessions` (autenticado): cria sessao efemera e retorna `playbackUrl`.
- `GET /streams/play/:playToken`: retransmite stream da camera sem expor URL upstream.
- `GET /internal/streams/source/:cameraId`: rota interna protegida por `x-stream-internal-key`.
