Crie a página administrativa da plataforma de câmeras da Ayel Segurança Patrimonial, correspondente à rota:

/admin

Essa tela deve seguir exatamente a mesma identidade visual, o mesmo sistema de design, o mesmo estilo de layout e a mesma linguagem estética da página inicial de câmeras já criada anteriormente.

A plataforma será usada em um subdomínio próprio, então a arquitetura das páginas deve seguir este padrão:

/ → página pública com listagem das câmeras públicas

/login → tela de login

/area → área logada com câmeras restritas

/admin → painel administrativo

Se for necessário um quinto item no menu lateral, usar apenas:

/perfil ou /configuracoes

Mas, se possível, manter apenas 4 itens principais.

Direção principal

Quero que a página admin seja uma continuação natural da home da plataforma, mantendo:

mesma paleta de cores

mesma tipografia

mesmo sistema de espaçamento

mesmo estilo de ícones

mesmo visual dos cards

mesma qualidade estética

mesmo nível de sofisticação

mesma estrutura com menu lateral vertical de ícones

mesma sensação de software premium, limpo, moderno, seguro e corporativo

Essa tela não deve parecer outro sistema separado.
Ela precisa parecer parte do mesmo produto.

Objetivo da página

A tela /admin deve funcionar como um painel administrativo simples, elegante e funcional, para gerenciar:

câmeras

usuários

permissões básicas

status das câmeras

organização da listagem

Não quero um painel complexo de ERP ou um dashboard cheio de métricas.
Quero algo mais objetivo, com foco em operações administrativas da plataforma.

Menu lateral
MUITO IMPORTANTE

Quero menu lateral vertical com ícones, no mesmo estilo visual da página inicial já criada.

Estrutura do menu

Use no máximo 5 páginas principais, priorizando estas 4:

/ → Câmeras públicas

/login → Login

/area → Área restrita

/admin → Administração

Quinto item opcional:
5. /perfil ou /configuracoes

Destaque visual

Nesta tela, o item Administração deve estar ativo no menu lateral.

Estilo do menu

Quero:

menu vertical fixo à esquerda

com ícones minimalistas

elegante

bem espaçado

com labels discretas ou apenas ícones

mesmo estilo da tela principal

aparência premium

clean

moderna

corporativa

Estrutura geral da página

A página admin deve ser dividida em:

Menu lateral vertical de ícones

Barra superior / cabeçalho da área principal

Ações e filtros

Bloco de gerenciamento de câmeras

Bloco de gerenciamento de usuários

Modais ou drawers de cadastro/edição

Estilo visual da página admin

A página precisa transmitir:

organização

segurança

clareza

controle

confiança

tecnologia

profissionalismo

Não quero

visual pesado de sistema antigo

dashboard poluído

muitos indicadores

gráficos

aparência genérica de SaaS

tabelas frias e sem acabamento visual

Cabeçalho da área principal

Crie uma topbar elegante dentro da área principal da tela.

Elementos do cabeçalho

Título principal: Administração

Subtítulo discreto

Campo de busca

Botões de ação

Avatar/perfil no canto direito

Ícone discreto de notificação opcional

Sugestões de texto

Título: Administração
Subtítulo: Gerencie câmeras, usuários e permissões da plataforma.

Campo de busca

Placeholder:
Buscar câmera, usuário ou local

Botões

+ Adicionar câmera

+ Adicionar usuário (secundário ou em aba de usuários)

Organização do conteúdo interno

Quero a área principal organizada com tabs internas ou blocos bem definidos.

Tabs sugeridas

Câmeras

Usuários

Acessos (opcional)

Configurações (opcional)

Direção recomendada

Como é um MVP, priorizar:

Câmeras

Usuários

As abas Acessos e Configurações podem existir apenas para enriquecer o layout, mas de forma leve.

Seção de gerenciamento de câmeras

Essa deve ser a parte mais importante da página admin.

Objetivo

Permitir que o administrador:

veja todas as câmeras cadastradas

pesquise câmeras

filtre câmeras

adicione nova câmera

edite câmera existente

altere tipo de acesso

ative/desative câmera

exclua câmera

Layout da listagem de câmeras

Não quero uma tabela seca tradicional.
Quero uma interface mais refinada, como uma mistura entre:

tabela moderna

lista administrativa visual

miniaturas + informações organizadas

Cada item de câmera deve mostrar:

thumbnail da câmera

nome da câmera

local/setor

tipo de acesso

status

qualidade

ação rápida

Colunas ou campos sugeridos

Preview

Nome

Local

Acesso

Status

Qualidade

Ações

Campos que o cadastro da câmera deve prever

O design deve demonstrar que é possível cadastrar:

Nome da câmera

Local/setor

Descrição

URL do stream

Tipo de acesso

Status

Qualidade

Categoria/localização

Ordem de exibição

Tipo de acesso

Pública

Restrita

Status

Ao vivo

Offline

Qualidade

HD

FHD

Ações por câmera

Cada câmera deve ter ações como:

visualizar

editar

ativar/desativar

excluir

Estilo visual das ações

ícones discretos

menu de 3 pontinhos opcional

elegante e corporativo

Filtros da seção de câmeras

Acima da listagem, inclua filtros como:

Todas

Públicas

Restritas

Ao vivo

Offline

Portaria

Recepção

Estacionamento

Administrativo

Também incluir:

barra de busca

seletor por status

seletor por tipo de acesso

Botão de adicionar câmera

Botão principal em destaque:
+ Adicionar câmera

Esse botão deve abrir visualmente um:

modal elegante
ou

drawer lateral moderno

Formulário de câmera

Criar visualmente um formulário com:

Nome da câmera

Local/setor

Descrição

URL do stream

Tipo de acesso

Status

Qualidade

Categoria/localização

Ordem de exibição

Botões do formulário

Cancelar

Salvar câmera

Seção de gerenciamento de usuários

Essa seção deve permitir:

listar usuários

pesquisar usuários

adicionar novo usuário

editar usuário

ativar/desativar conta

redefinir acesso

excluir usuário

Layout da listagem de usuários

Quero uma tabela/lista moderna e limpa, com aparência coerente com a plataforma.

Colunas sugeridas

Usuário

E-mail

Perfil

Status

Acesso

Último acesso

Ações

Perfis de usuário

Administrador

Cliente

Status

Ativo

Inativo

Tipo de acesso

Área restrita habilitada

Sem acesso

Administrador

Ações por usuário

editar

redefinir senha

ativar/desativar

excluir

Botão principal

+ Adicionar usuário

Formulário de novo usuário

Criar visualmente formulário com:

Nome completo

E-mail

Senha

Tipo de perfil

Status

Permissão de acesso à área restrita

Botões

Cancelar

Salvar usuário

Seção opcional de acessos

Se fizer sentido visualmente, pode incluir uma aba simples chamada Acessos.

Conteúdo dessa aba

Mostrar de forma bem leve:

total de câmeras cadastradas

quantas são públicas

quantas são restritas

total de usuários ativos

Importante

Esses números devem aparecer em cards pequenos e discretos, sem parecer dashboard analítico.

Exemplos:

12 câmeras cadastradas

7 públicas

5 restritas

18 usuários ativos

Estrutura visual recomendada

Organizar a tela assim:

1. Menu lateral

Vertical, fixo, com ícones

2. Topo da área principal

Com:

título

subtítulo

busca

botões

avatar

3. Tabs internas

Câmeras

Usuários

Acessos

Configurações

4. Cards-resumo pequenos

No máximo 3 ou 4 cards discretos

5. Bloco principal de gerenciamento

Listagem elegante com filtros

6. Modal/drawer

Cadastro e edição

Componentes importantes
Cards-resumo

Pequenos, discretos, com números simples:

Total de câmeras

Públicas

Restritas

Usuários ativos

Badges

Usar badges elegantes para:

Pública

Restrita

Ao vivo

Offline

Ativo

Inativo

Administrador

Cliente

Tabelas / listas

Com:

respiro

alinhamento

bordas suaves

visual refinado

miniaturas quando fizer sentido

hover sutil

Modais / drawers

Modernos, limpos, com:

campos organizados

labels claros

bom espaçamento

botão principal em destaque

Identidade visual

Seguir exatamente a identidade visual já aplicada na tela principal da Ayel.

Paleta

Baseada no logo da Ayel:

azul claro institucional

azul escuro / azul petróleo

branco

cinza muito claro

cinza médio

Uso das cores

azul institucional para botões e estados ativos

azul escuro para textos fortes e estrutura

vermelho discreto para badges “ao vivo”

verde discreto para status positivos

Tipografia

Usar a mesma tipografia da home já criada.
A tipografia deve transmitir:

clareza

segurança

sofisticação

tecnologia

Ícones

Usar ícones minimalistas, consistentes e modernos.

Sugestões:

câmera

usuário

cadeado

olho

lápis/editar

lixeira/excluir

busca

filtro

três pontinhos

configurações

notificação

Textos sugeridos da interface
Título

Administração

Subtítulo

Gerencie câmeras, usuários e permissões da plataforma.

Busca

Buscar câmera, usuário ou local

Tabs

Câmeras

Usuários

Acessos

Configurações

Botões

Adicionar câmera

Adicionar usuário

Salvar

Cancelar

Editar

Excluir

Ativar

Desativar

Status e badges

Ao vivo

Offline

Pública

Restrita

Ativo

Inativo

Administrador

Cliente

Exemplos de câmeras

Portaria Principal

Recepção

Entrada Lateral

Estacionamento Frontal

Corredor Interno

Galpão 01

Exemplos de usuários

Carlos Souza

Mariana Lima

João Martins

Fernanda Rocha

Resultado final esperado

Quero uma página /admin elegante, funcional, limpa e coerente com a página principal da plataforma, usando o mesmo design system e a mesma navegação lateral.

Reforços finais

seguir o design da tela inicial já criada

usar menu lateral vertical de ícones

limitar o menu a no máximo 5 itens

priorizar as rotas:

/

/login

/area

/admin

manter aparência premium, segura e corporativa

focar em gerenciamento de câmeras e usuários

evitar dashboard pesado

evitar excesso de informação

manter coerência estética total com a plataforma da Ayel
