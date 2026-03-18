# AGENT.md

Guia operacional do projeto **Ayel Cams** para desenvolvimento humano + IA.

## 1) Regras gerais de colaboracao
- Trabalhar em entregas pequenas, incrementais e prontas para producao.
- Priorizar clareza, legibilidade e previsibilidade do codigo.
- Reutilizar componentes existentes antes de criar novos.
- Evitar duplicacao de logica de UI e regra de negocio.
- Refatorar continuamente para manter base limpa.
- Evitar over-engineering e abstracoes sem uso real imediato.
- Registrar decisoes relevantes neste arquivo e/ou no `ayel-platform.md`.

## 2) Estrutura do repositorio
- Estrutura raiz obrigatoria:
  - `front-end/`
  - `back-end/`
- Documentacao de apoio na raiz:
  - `ayel-platform.md`
  - `guidelines.md`
  - `attributions.md`

## 3) Convencoes de nomes e arquivos
- Novos arquivos devem seguir:
  - somente minusculas (`a-z`);
  - sem acentos;
  - sem `_` (underscore);
  - separacao por hifen quando necessario (`kebab-case`).
- Imports e referencias devem ser atualizados junto com qualquer renomeacao.

## 4) Stack e arquitetura
- Front-end:
  - React 18 + Vite + TypeScript/TSX.
  - `react-router` para rotas.
  - Tailwind + tokens em `styles/theme.css`.
  - `lucide-react` para icones.
- Back-end:
  - Node.js + Express.
  - Endpoints de auth, profile e catalogo.

## 5) Rotas e acesso
- Rotas principais: `/`, `/login`, `/area`, `/admin`, `/perfil`.
- Perfis:
  - `visitante` (nao autenticado),
  - `cliente`,
  - `administrador`.
- Acesso:
  - `/`: publico.
  - `/area`: `cliente` e `administrador`.
  - `/admin`: somente `administrador`.
  - `/perfil`: `cliente` e `administrador`.

## 6) Regras de status de camera (vigente)
- Estados permitidos na UI: **`Ao vivo`** e **`Offline`**.
- Remover/ignorar estado `Online` em toda a plataforma.
- Mapeamento tecnico:
  - `live` -> `Ao vivo`
  - `offline` -> `Offline`

## 7) Regras visuais e UX consolidadas
- Header colado a sidebar (sem espacamento lateral entre os blocos).
- Pagina de administracao: remover espaco entre barra de paginas (tabs) e cabecalho.
- Tag `Ao vivo`: layout corrigido para leitura clara (texto em uma linha quando possivel).
- Tag `Offline`: coloracao cinza.
- Cards da home:
  - remover o ponto/icone vermelho decorativo no canto direito;
  - substituir bolinha cinza do local por icone de pin;
  - alinhar o icone de localizacao no topo a esquerda (nao centralizado verticalmente com o texto).
- Remover icone/botao de notificacoes (sino) do cabecalho em toda a plataforma.

## 8) Regras funcionais de interface ja definidas
- Botao de atualizar no header deve:
  - refazer a requisicao de lista de cameras;
  - exibir feedback visual durante atualizacao (ex.: spinner/estado carregando).
- Pagina de administracao:
  - excluir camera deve exigir modal de confirmacao.
- Pagina inicial (modo lista):
  - usar layout de lista/tabela definido;
  - nas acoes da direita, manter apenas botao **Assistir**;
  - botao **Assistir** abre modal com video ao vivo da camera.

## 9) Contratos de API e comportamento de erro
- Tratar corretamente:
  - `200/201/204` sucesso;
  - `400` erro de requisicao;
  - `401` sessao ausente/expirada (redirecionar para login);
  - `403` sem permissao;
  - `404` recurso nao encontrado;
  - `409` conflito;
  - `422` validacao;
  - `429` limite de tentativas;
  - `500/503` indisponibilidade.
- Exibir feedback de erro acionavel e nao tecnico para usuario final.

## 10) Seguranca e sessao
- Nao expor links sensiveis de stream no front publico.
- Protecao visual nao substitui validacao no back-end.
- Sessao deve ser invalidada corretamente no logout.
- Endpoints sensiveis devem aplicar protecao de abuso (rate limit) e validacao de permissao.

## 11) Regras de execucao local
- Front-end: executar comandos dentro de `front-end/`.
- Back-end: executar comandos dentro de `back-end/`.
- Se ocorrer `EADDRINUSE` na API (porta `3333`), encerrar processo que ja esta usando a porta antes de subir novamente.
- Se ocorrer `ENOENT package.json`, confirmar diretorio correto antes de rodar `npm run dev`.

## 12) Checklist obrigatorio por entrega
- Mudanca funcional implementada sem regressao visual.
- Estados de loading, erro e vazio revisados.
- Responsividade minima (desktop + mobile) preservada.
- Sem quebra de nomenclatura e sem caminhos desatualizados.
- Fluxos criticos validados apos alteracao.

## 13) Fonte de verdade
- Este arquivo consolida regras praticas do dia a dia.
- Para contexto completo de produto/arquitetura: consultar `ayel-platform.md`.
