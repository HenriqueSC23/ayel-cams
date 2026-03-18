# Atualizacao v1.5 (2026-03-17)
- Sprint 6 concluido: padronizacao de nomenclatura aplicada nos arquivos do projeto.
- Regra aplicada:
  - nomes de arquivo somente em minusculas;
  - sem underscore;
  - separacao por hifen quando necessario.
- Resultado da entrega:
  - arquivos principais do front-end renomeados para `kebab-case` (rotas, auth, layouts e componentes);
  - arquivos de documentacao da raiz renomeados para o mesmo padrao (`ayel-platform.md`, `attributions.md`, `guidelines.md`);
  - todos os imports/referencias atualizados para os novos caminhos.

# Atualizacao v1.4 (2026-03-17)
- Sprint 5 executado (fechamento tecnico de auth + testes).
- Auth:
  - novo endpoint `POST /auth/logout` com invalidacao de token (denylist em memoria por `jti`);
  - middleware de auth agora rejeita token revogado;
  - limite de tentativas de login mantido com resposta `429`.
- Sessao front-end:
  - logout agora tenta invalidar sessao no backend antes de limpar estado local.
- Testes automatizados backend:
  - `vitest + supertest` configurados;
  - suite cobrindo login valido/invalido, rate limit, acesso admin, perfil (update/senha) e invalidacao de token no logout.

# Atualizacao v1.3 (2026-03-17)
- Sprint 4 iniciado com foco em perfil real e seguranca basica.
- Backend:
  - adicionadas rotas `GET /profile/me`, `PATCH /profile/me` e `PATCH /profile/me/password`;
  - adicionada limitacao de tentativas de login com resposta `429` apos excesso de falhas.
- Frontend:
  - pagina `/perfil` integrada ao backend para leitura/edicao de dados e atualizacao de senha;
  - sessao movida para `sessionStorage` e invalidada automaticamente quando a API retorna `401`.

# Atualizacao v1.2 (2026-03-17)
- Estrutura fisica obrigatoria na raiz: apenas as pastas `front-end` e `back-end`.
- Convencao obrigatoria para novos arquivos:
  - somente minusculas (`a-z`);
  - sem acentos e sem caracteres especiais;
  - palavras separadas apenas por hifen (`-`), ex.: `side-bar.tsx`.
- Arquivos legados fora do padrao devem ser migrados em refatoracao dedicada para evitar quebra em massa.

# AYEL Platform

Spec viva da plataforma de câmeras da Ayel Segurança Patrimonial.  
Este documento é a referência operacional para desenvolvimento humano e sessões com agentes de IA.

**Versão do documento:** `v1.1`  
**Data de atualização:** `2026-03-16`  
**Status:** consolidação de stack, rotas e regras de negócio (etapa 2)

## 1. Visão geral do projeto
- A plataforma Ayel é uma aplicação web própria para visualização e operação de câmeras de segurança patrimonial.
- O produto atende dois públicos principais:
  - Visitantes/usuários sem autenticação (acesso público controlado).
  - Usuários autenticados com diferentes níveis de permissão (área restrita e administração).
- Problema que resolve:
  - Centralizar monitoramento visual em um ambiente único, limpo e orientado a operação.
  - Separar conteúdo institucional de fluxo operacional de segurança.
- Relação com WordPress:
  - O WordPress permanece como site institucional e não é a base da aplicação de monitoramento.
  - A plataforma de câmeras roda em subdomínio próprio, com front-end e evolução independentes.
- Diferença entre área pública e área restrita:
  - Área pública: exibe somente câmeras de acesso público.
  - Área restrita: exibe câmeras sensíveis e recursos vinculados a autenticação/autorização.
- Foco do MVP:
  - Entregar experiência visual completa e consistente para listagem de câmeras, autenticação visual, administração básica e perfil.
  - Preparar base para futura integração real com backend (auth, permissões, streams, CRUD).

## 2. Objetivo do produto
### Objetivo principal
Fornecer uma plataforma corporativa de monitoramento com navegação clara, visual premium e separação explícita entre acessos públicos e protegidos.

### O que o MVP precisa entregar
- Rotas principais funcionais: `/`, `/login`, `/area`, `/admin`, `/perfil`.
- Design system consistente com referência do Figma em todas as telas.
- Componentes reutilizáveis de layout, filtros, cards, badges e cabeçalho.
- Dados mockados representando cenários reais (ao vivo/offline, público/restrito, usuários/perfis).

### Fora do escopo inicial (MVP)
- Stream real de vídeo ao vivo.
- Persistência em banco de dados.
- Auditoria completa, trilha de acesso, observabilidade e alertas em tempo real.
- Gestão avançada de incidentes e analytics operacionais.

### Potencial Fase 2
- MFA, SSO e políticas avançadas de identidade.
- Integração com provedores/NVRs para stream real.
- CRUD persistente de câmeras e usuários.
- Telemetria, logs auditáveis e monitoramento de saúde.
- Notificações operacionais e preferências persistidas por usuário.

## 3. Arquitetura funcional do MVP
### Mapa de rotas

| Rota | Propósito | Usuário | Componentes visuais principais | Ações principais | Exige autenticação (decisão v1.1) | Dependências futuras de backend |
|---|---|---|---|---|---|---|
| `/` | Exibir catálogo de câmeras públicas | Público geral | `Sidebar`, `PageHeader`, `FilterChips`, `HomeCameraCard` em grid/lista | Buscar, filtrar, alternar visualização | Não | Listagem pública real, status em tempo real |
| `/login` | Entrada de usuário na plataforma | Usuário com credencial | Hero institucional + formulário de login | Inserir e-mail/senha, entrar | Não; se sessão ativa, redireciona | Auth real, recuperação de senha, sessão segura |
| `/area` | Visualização de câmeras restritas | Usuário autenticado | `PageHeader`, blocos de acesso protegido, filtros avançados, `RestrictedCameraCard` | Buscar, filtrar por tipo/status/local, visualizar câmera | Sim (`cliente` ou `administrador`) | Guard de rota, permissão por perfil, stream restrito |
| `/admin` | Gestão de câmeras e usuários | Administrador | `PageHeader`, tabs internas, `AdminCameras`, `AdminUsers`, tabelas e drawer/modal | Adicionar/editar/excluir (UI), filtrar, buscar | Sim (`administrador`) | RBAC, CRUD real, auditoria de ações |
| `/perfil` | Gestão de dados do usuário logado | Usuário autenticado | `PageHeader`, card principal de usuário, formulários de dados, segurança, permissões e preferências | Editar dados, alterar preferências, encerrar sessão (UI) | Sim (`cliente` ou `administrador`) | Persistência de perfil/preferências, sessões reais |

### Estado atual no código
- As rotas existem e renderizam no front-end.
- Ainda não há proteção de rota real por autenticação/perfil.
- Navegação é funcional via `react-router`, com layout padrão via `MainLayout`.

## 4. Regras de negócio
### Câmeras
- `public`: pode aparecer em `/`.
- `restricted`: deve aparecer em `/area` e pode aparecer no contexto administrativo.
- Status de câmera:
  - `live`: transmissão ativa (sinal ao vivo).
  - `offline`: indisponível, com feedback visual de indisponibilidade.

### Perfis e autorização (decisão fechada v1.1)
- Perfis válidos da plataforma:
  - `visitante`: não autenticado.
  - `cliente`: autenticado com acesso operacional.
  - `administrador`: autenticado com acesso administrativo.

| Capacidade | visitante | cliente | administrador |
|---|---|---|---|
| Ver câmeras públicas (`/`) | Sim | Sim | Sim |
| Fazer login (`/login`) | Sim | Sim (com redirecionamento se sessão ativa) | Sim (com redirecionamento se sessão ativa) |
| Ver câmeras restritas (`/area`) | Não | Sim | Sim |
| Acessar administração (`/admin`) | Não | Não | Sim |
| Acessar perfil (`/perfil`) | Não | Sim | Sim |
| Gerenciar câmeras | Não | Não | Sim |
| Gerenciar usuários | Não | Não | Sim |

### Administração e permissões
- Acesso a `/admin`: somente usuários com permissão administrativa.
- Edição de usuários: somente perfis autorizados (ex.: admin).
- Gerenciamento de câmeras: somente perfil `administrador` no MVP.

### Autenticação e sessão (decisão fechada v1.1)
- Modelo de autenticação:
  - Sessão baseada em cookies `HttpOnly` + `Secure` + `SameSite=Lax`.
  - Não armazenar token de acesso em `localStorage` ou `sessionStorage`.
- Tokens/sessão:
  - `access token` de curta duração (referência: 15 minutos).
  - `refresh token` rotativo para renovação de sessão (referência: 7 dias).
- Fluxo de sessão:
  - Login válido cria sessão no servidor e retorna usuário/permissões.
  - Logout invalida sessão no servidor e remove credenciais.
  - Em expiração, o cliente tenta renovação uma vez; se falhar, força novo login.
- Proteção de mutações:
  - Endpoints de escrita devem exigir proteção anti-CSRF.
- Redirecionamento pós-login:
  - `administrador` -> `/admin`.
  - `cliente` -> `/area`.
- Acesso a `/login` com sessão ativa:
  - Redirecionar automaticamente conforme perfil.

### Comportamentos obrigatórios
- Câmera offline:
  - Exibir badge `Offline`.
  - Exibir estado visual reduzido/escurecido e mensagem curta (`Sem sinal`, `Indisponível`).
- Acesso não autorizado:
  - Sem sessão (`401`): redirecionar para `/login` com `returnTo`.
  - Sem permissão (`403`): exibir feedback de acesso negado e redirecionar para rota permitida.
- Sessão expirada:
  - Invalidar acesso às rotas protegidas e redirecionar para `/login`.
  - Exibir mensagem clara de sessão expirada.

### Status HTTP e comportamento do cliente (decisão fechada v1.1)
| Status | Uso no domínio Ayel | Comportamento obrigatório no front-end |
|---|---|---|
| `200 OK` | Leitura/ação bem-sucedida | Renderizar conteúdo e limpar erros anteriores |
| `201 Created` | Criação de câmera/usuário | Confirmar criação e atualizar listagem |
| `204 No Content` | Exclusão/logout sem payload | Confirmar sucesso sem tentar parse de body |
| `400 Bad Request` | Requisição malformada | Exibir erro técnico amigável |
| `401 Unauthorized` | Sem sessão, sessão expirada, credencial inválida | Limpar estado de auth e redirecionar para `/login` |
| `403 Forbidden` | Sessão válida sem permissão de perfil | Exibir “Sem permissão” e manter usuário em rota permitida |
| `404 Not Found` | Recurso inexistente (câmera/usuário/rota API) | Exibir estado vazio/erro contextual |
| `409 Conflict` | Conflito de cadastro (ex.: e-mail duplicado) | Exibir erro de conflito no campo/ação |
| `422 Unprocessable Entity` | Validação de domínio (campos inválidos) | Exibir erros de validação por campo |
| `429 Too Many Requests` | Proteção de login e endpoints sensíveis | Exibir bloqueio temporário e tempo de espera |
| `500/503` | Falha interna/indisponibilidade | Exibir fallback genérico e permitir nova tentativa |

## 5. Stack e decisões técnicas
### Stack identificada no repositório
- Framework principal: React 18 (`react`, `react-dom`).
- Build tool: Vite 6.
- Linguagem: TypeScript/TSX (arquivos `.tsx`), porém sem `tsconfig` versionado no estado atual.
- Roteamento: `react-router` com `createBrowserRouter`.
- Estilização:
  - Tailwind CSS v4.
  - Tokens e variáveis em `styles/theme.css`.
  - Fonte principal Inter (`styles/fonts.css`).
- Animação: `motion` (`motion/react`).
- Ícones: `lucide-react`.
- Base de dados no MVP: mocks locais em `app/data/platform.ts`.

### Decisões fechadas v1.1 (auth, perfis e contratos HTTP)
- O MVP seguirá RBAC com 3 perfis: `visitante`, `cliente`, `administrador`.
- Rotas protegidas no cliente:
  - `/area` para `cliente|administrador`.
  - `/admin` para `administrador`.
  - `/perfil` para `cliente|administrador`.
- Contrato HTTP de autenticação e autorização:
  - `401` para ausência/invalidade de sessão.
  - `403` para sessão válida sem permissão.
  - `422` para erros de validação de formulário.
  - `429` para limitação de tentativas de login.
- Tokens não devem ser persistidos em storage de browser.

### Gerenciamento de estado
- Estado local por página/componente (`useState`, `useMemo`).
- Não há store global (Redux/Zustand/Context de domínio) no estado atual.

### Estratégia de componentes
- Reuso concentrado em `app/components/platform`:
  - `PageHeader`, `SurfacePanel`, `FilterChips`, `PillBadge`, `StatCard`.
- Componentes por feature:
  - `home`, `area`, `admin`.
- Layout global:
  - `MainLayout` + `Sidebar` com navegação lateral.

### Organização de pastas (atual)
- `app/layouts`: layout raiz.
- `app/pages`: páginas por rota.
- `app/components`: componentes compartilhados e por domínio.
- `app/data`: dados mockados e funções de filtro.
- `styles`: tokens e CSS global.

### Itens a validar
- Estratégia oficial de tipagem e configuração TypeScript (`tsconfig`).
- Padrão de lint/format e quality gates de CI.
- Camada de serviços para integração backend (auth/câmeras/usuários).
- Estratégia de error boundaries e tratamento global de exceções.

## 6. Design system e padrões visuais
### Princípios visuais
- Interface corporativa, limpa, premium e focada em segurança patrimonial.
- Clareza operacional e hierarquia visual acima de ornamentação.
- Continuidade visual entre todas as rotas.

### Identidade Ayel (estado atual)
- Paleta predominante:
  - Azul institucional: `--ayel-cyan` (`#009fe3`).
  - Azul escuro/ink: `--ayel-ink` (`#002441`).
  - Tons claros e neutros para fundos/superfícies.
- Tipografia:
  - Inter como fonte base.
- Linguagem:
  - Bordas arredondadas, sombras suaves, componentes com alto respiro.

### Padrões de layout
- `Sidebar` fixa à esquerda em desktop e barra inferior em mobile.
- `PageHeader` no topo com busca, ações, notificação e avatar.
- Área de conteúdo com painéis (`SurfacePanel`) e espaçamentos consistentes.

### Componentes recorrentes
- Sidebar: navegação primária por ícones.
- Topbar: busca + ações contextuais por tela.
- Cards:
  - Câmeras públicas (`HomeCameraCard`).
  - Câmeras restritas (`RestrictedCameraCard`).
  - Cartões estatísticos (`StatCard`).
- Badges/Pills:
  - Estado (`Ao vivo`, `Offline`).
  - Acesso (`Pública`, `Restrita`).
  - Perfil/permissão (`Administrador`, `Habilitado`, etc.).
- Filtros:
  - Chips/tabs via `FilterChips`.
  - Seletores adicionais por status/local em telas internas.
- Inputs:
  - Campos com bordas suaves e feedback claro de foco.
- Botões:
  - Primário em azul institucional.
  - Secundário discreto com borda.
- Modais/Drawers:
  - Padrão atual no admin com painel lateral para criação.
- Tabelas/Listas:
  - Admin prioriza tabela desktop + cards mobile.

### Estados visuais recorrentes
- Loading: a definir padrão único (a validar).
- Empty state: mensagens claras em painel dedicado.
- Offline: badge + visual reduzido.
- Erro/acesso negado: sem padrão unificado implementado (a validar).

### Regra de consistência
Todas as telas devem manter fidelidade ao sistema visual definido no Figma e aos componentes compartilhados já estabelecidos no front-end.

## 7. Padrões de desenvolvimento
- IA deve atuar como pair programming, não como gerador one-shot.
- Decisão funcional e de produto é humana; IA apoia execução técnica.
- Priorizar entregas pequenas, incrementais e prontas para produção.
- Refatorar continuamente para evitar degradação de base.
- Evitar arquivos gigantes; separar responsabilidades por domínio.
- Evitar over-engineering e abstrações sem uso imediato.
- Reutilizar componentes existentes antes de criar novos.
- Nomear componentes, props e funções de forma explícita.
- Evitar duplicação de lógica visual e de negócio.
- Priorizar simplicidade, legibilidade e previsibilidade.

## 8. Processo de desenvolvimento com IA
- Antes de codar:
  - Ler este `ayel-platform.md`.
  - Inspecionar estado atual dos arquivos impactados.
  - Identificar componentes reutilizáveis.
- Durante a implementação:
  - Propor e executar etapas pequenas.
  - Preservar padrões visuais já aprovados.
  - Evitar mudanças de arquitetura sem necessidade explícita.
- Após cada etapa:
  - Resumir o que foi criado/ajustado.
  - Informar riscos, pendências e próximos passos.
- Ao tomar novas decisões relevantes:
  - Atualizar este documento na mesma entrega.

## 9. Estratégia de testes
### Princípio
Testes são obrigatórios para reduzir regressão em fluxos críticos de acesso e visualização.

### Situação atual
- Não há framework de testes configurado no repositório (dívida técnica prioritária).
- Não existem scripts `test` em `package.json`.

### Mínimo esperado no MVP (alvo)
- Testes de rota e autorização:
  - Login válido.
  - Login inválido.
  - Acesso não autorizado à `/area`.
  - Acesso não autorizado à `/admin`.
- Testes de renderização/comportamento:
  - Renderização de câmera pública em `/`.
  - Renderização de câmera restrita em `/area`.
  - Estado de câmera offline.
  - Funcionamento de busca e filtros.

### Recomendação técnica inicial
- Adotar `Vitest` + `React Testing Library` para testes de unidade/componente.
- Adotar `Playwright` para smoke/e2e de rotas críticas.
- Definir pipeline CI com bloqueio mínimo em testes críticos (a validar).

## 10. Segurança
- Nunca expor URLs sensíveis de stream no front-end público.
- Bloqueio visual não é segurança:
  - Toda autorização deve ser validada no backend quando existir integração real.
- Proteger rotas no servidor e no cliente (guard + validação backend).
- Validar permissões por endpoint (RBAC/ABAC conforme necessidade).
- Sanitizar e validar dados de input no front e no backend.
- Tratar sessão/cookies/tokens com políticas seguras (expiração, renovação, revogação).
- Evitar vazamento de dados em logs, erros e telemetry.
- Segurança é prática contínua de engenharia, não etapa final.

## 11. Convenções de UI e UX
- Loading:
  - Definir skeleton/spinner padrão por contexto (a validar).
- Estado vazio:
  - Mensagem objetiva + orientação de próxima ação.
- Estado offline:
  - Feedback visual claro e discreto (`Offline`, `Sem sinal`).
- Mensagens de erro:
  - Texto curto, acionável e sem exposição técnica desnecessária.
- Mensagens de acesso restrito:
  - Explicar bloqueio e indicar ação (`fazer login`, `sem permissão`).
- Feedback de ações:
  - Confirmar ações críticas (`salvar`, `excluir`, `encerrar sessão`) com retorno visual.
- Navegação:
  - Sidebar e header consistentes entre páginas.
- Responsividade mínima:
  - Desktop e mobile funcional.
  - Tabelas com fallback para cards em telas menores.

## 12. Estrutura recomendada de componentes e módulos
### Estrutura atual base
- `layouts`: shell da aplicação e áreas comuns.
- `components/platform`: componentes compartilhados de design system.
- `components/{feature}`: componentes específicos por domínio (home/area/admin).
- `pages`: composição de rota.
- `data`: mocks e helpers de filtro.

### Evolução recomendada
- `app/guards`:
  - `AuthGuard`, `RoleGuard`.
- `app/services`:
  - `authService`, `cameraService`, `userService`.
- `app/mocks`:
  - separar fixtures por domínio.
- `app/constants`:
  - enums, chaves e mensagens de domínio.
- `app/tokens`:
  - consolidar tokens visuais além de `styles/theme.css`.
- `app/features`:
  - opcional para escalar módulos (admin, area, profile) com isolamento de responsabilidades.

### Regra
Manter estrutura simples até necessidade real de expansão. Evolução deve ser incremental e orientada por problemas concretos.

## 13. Fluxo recomendado de entrega
1. Analisar contexto atual da base e este documento.
2. Identificar impacto funcional e visual da mudança.
3. Implementar em etapa pequena e isolada.
4. Validar visualmente no contexto da rota afetada.
5. Validar por testes (ou, temporariamente, checklist manual se teste ainda não existir).
6. Revisar/refatorar para manter consistência e legibilidade.
7. Registrar decisão/padrão novo neste documento.
8. Seguir para a próxima etapa.

## 14. Backlog técnico inicial
- Consolidar layout base e comportamento de navegação global.
- Revisar fluxo final de `/login` para integração real de auth.
- Finalizar comportamento de proteção real em `/area`.
- Finalizar regras de autorização e ações reais em `/admin`.
- Consolidar persistência e experiência de edição em `/perfil`.
- Implementar route guards (`/area`, `/admin`, `/perfil`).
- Preparar integração de autenticação (backend).
- Preparar estrutura de CRUD de câmeras.
- Preparar estrutura de CRUD de usuários.
- Definir camada de dados/serviços com contrato de API.
- Configurar testes automatizados mínimos.
- Revisar segurança ponta a ponta.
- Revisar responsividade em breakpoints críticos.
- Definir tratamento global de erro e fallback de rota.

## 15. Dívidas técnicas e pontos de atenção
- Não há autenticação/autorização real implementada.
- Não há proteção de rota efetiva no cliente.
- Não há backend integrado para câmeras/usuários/sessão.
- Não há testes automatizados configurados.
- Não há scripts de lint e typecheck no `package.json`.
- Não há `tsconfig` versionado no estado atual do repositório.
- Alias `@` no `vite.config.ts` aponta para `./src`, enquanto a base está em `./app` (a validar uso real).
- Dependências de UI amplas (MUI/Radix/shadcn) sem mapeamento de uso mínimo consolidado.
- Risco de divergência entre Figma e código se novas telas não reutilizarem componentes centrais.

## 16. Checklist pós-implementação
- [ ] UI consistente com design definido no Figma e no sistema atual.
- [ ] Código limpo e legível.
- [ ] Componente reutilizável criado quando necessário.
- [ ] Sem duplicação desnecessária.
- [ ] Testes mínimos passando (ou evidência de validação manual, temporariamente).
- [ ] Fluxo principal da rota validado.
- [ ] Rota protegida funcionando (quando aplicável).
- [ ] Estados de erro e vazio tratados.
- [ ] Responsividade revisada.
- [ ] Segurança revisada no escopo da entrega.
- [ ] `ayel-platform.md` atualizado com decisões novas.

## 17. Regra de evolução do documento
- Este documento deve evoluir junto com o projeto.
- Toda decisão importante de produto/arquitetura/segurança deve ser registrada aqui.
- Novos obstáculos, padrões, limitações e soluções devem ser adicionados.
- Agentes de IA e desenvolvedores devem tratar este arquivo como fonte de verdade operacional do projeto.
- Se houver conflito entre implementação e documentação, corrigir um dos lados imediatamente na mesma entrega.
