# Hub Casa

Plataforma web para moradores de uma mesma casa administrarem juntos as contas, as tarefas domésticas, a lista de compras, o estoque da dispensa e a agenda. Cada casa é um espaço de dados isolado, com papéis distintos entre administrador e morador. O problema que resolve: apps de finanças pessoais são feitos para uma pessoa e não modelam "quem da casa é responsável por qual conta", e planilhas compartilhadas não têm controle de acesso nem regra de negócio.

## Status

MVP em produção, rodando em hospedagem compartilhada e em uso real por uma casa. Este repositório reflete o estado do que está no ar, e não uma branch de features.

O escopo original previa nove módulos. Seis foram entregues.

**Implementado e funcionando**

| Módulo | O que faz |
|---|---|
| Dashboard | Agrega ciclo ativo, contas a pagar do mês, tarefas do dia, alertas de estoque e próximos eventos |
| Financeiro | Gastos pontuais e recorrentes, ganhos, parcelamentos com parcelas geradas, ciclos de pagamento, categorias |
| Tarefas | Quadro semanal por dia da semana, com responsáveis, reordenação por drag and drop e reset automático toda segunda |
| Agenda | Eventos com data e hora, em visão de lista e calendário |
| Compras | Lista de compras com compra parcial, que dá baixa no estoque da dispensa |
| Dispensa | Produtos com estoque atual, estoque mínimo e alerta de reposição |

Autenticação via Laravel Fortify com verificação de e-mail, recuperação de senha e 2FA por TOTP com códigos de recuperação. Onboarding que cria a casa e semeia categorias padrão. Tela de configuração da casa com gestão de papéis e remoção de membros.

**Planejado, não implementado**

- **Módulo de notificações.** Estava no escopo original com seis gatilhos (conta vencendo, tarefa atribuída, item de dispensa baixo, entre outros). Não existe tabela, model nem endpoint.
- **Convite para casa existente.** Hoje o onboarding só cria casa nova, e o cadastro público está desativado em `config/fortify.php:147`. Não existe painel de administração global nem fluxo de convite, então incluir um segundo morador exige inserção direta no banco. É a lacuna mais relevante, porque colaboração é a premissa do produto.
- **Rateio de valor por membro.** As tabelas `gasto_membro_valor`, `parcela_membro_valor` e `parcelamento_membro_valor` existem no schema e os models estão escritos, mas nenhum código de leitura ou escrita os usa. Hoje um lançamento tem responsáveis, não tem valor por pessoa.
- **Histórico financeiro comparativo.** O escopo original pedia navegação por mês e ano com gráfico comparando mês atual e anterior. Existe um componente React (`historico-view.tsx`) sem rota e sem endpoint.
- **Recorrência não mensal.** O escopo previa mensal, anual, fixa e diária. Só mensal foi implementada: o model `Gasto` tem `recorrente` (booleano) e `dia_recorrencia`, sem tipo de periodicidade.
- **Login com Google (OAuth)** e **papel de administrador global**. Ver a seção de decisões.

**Estado da verificação automatizada**

A suíte tem 46 testes. 45 falham. A causa é única e conhecida: `phpunit.xml` fixa `sqlite :memory:` para os testes, herança da fase em que o projeto rodava em SQLite, e duas migrations usam SQL específico de MySQL (`DAY()` em `2026_03_23_000001_alter_financial_transactions_schema.php:41` e `DELETE ... INNER JOIN` em `2026_06_04_185921_add_unique_index_to_gastos_recorrentes.php:18`). Como o Pest roda `RefreshDatabase`, toda migration executa antes de cada teste e a suíte inteira morre na migration, não nas asserções. Os dois workflows do GitHub Actions estão vermelhos por esse motivo. `tsc --noEmit` acusa 11 erros, 9 deles dentro de arquivos React órfãos que não são importados por nenhuma página.

Não há nenhum teste cobrindo isolamento entre casas, que é justamente o mecanismo mais crítico da aplicação.

## Por que multi-tenant

O sistema nasceu para uma casa específica, mas o dado é naturalmente particionado: um gasto, uma tarefa ou um produto pertencem a uma casa e não fazem sentido fora dela. Havia duas opções.

A primeira era construir para uma casa só e generalizar depois. Isso significaria escrever queries sem escopo, e depois ter que auditar cada uma delas para adicionar filtro, com risco alto de esquecer alguma. Retrofitar isolamento em um sistema que não nasceu isolado é caro e falha em silêncio: o bug não quebra a aplicação, ele mostra o dado errado para a pessoa errada.

A segunda era assumir a partição desde a primeira migration. Foi essa. A tabela `houses` e a coluna `users.house_id` existem desde o primeiro dia do modelo de domínio, e toda tabela de domínio criada depois carrega a chave da casa. O custo é que cada consulta precisa lembrar do filtro, o que é discutido abaixo.

## Decisões de arquitetura

Várias das decisões abaixo são desvios explícitos do desenho original do projeto. Onde for esse o caso, o desenho original está registrado, porque a comparação é o argumento.

### Isolamento por coluna discriminadora, em base e schema únicos

Cada tabela de domínio carrega a chave da casa e toda consulta filtra por ela. Não há banco por tenant, schema por tenant, nem troca de conexão em runtime.

**Por que não banco ou schema por tenant.** Três razões concretas:

1. **A hospedagem não permite.** O ambiente de produção é hospedagem compartilhada, sem privilégio para `CREATE DATABASE` em runtime. Provisionar tenant exigiria intervenção manual no painel a cada casa nova, o que inviabiliza qualquer fluxo de cadastro automático.
2. **O custo de migration multiplica.** Com N bancos, cada `php artisan migrate` vira N execuções, e uma falha no meio deixa tenants em versões diferentes de schema. Para um projeto de um desenvolvedor, isso é um problema operacional que não se paga.
3. **A escala não pede.** O tenant aqui é uma casa, com tipicamente 2 a 5 usuários e volume de dados na casa das centenas de linhas por mês. A justificativa clássica de banco por tenant, que é isolamento de performance e de blast radius, não se aplica nesse volume.

**O custo que essa escolha aceita.** Com coluna discriminadora, o isolamento é responsabilidade da aplicação, não do banco. Um `where` esquecido não gera erro, gera vazamento silencioso. Em banco por tenant, esse mesmo erro simplesmente não teria dado para retornar. Foi uma troca consciente de segurança estrutural por simplicidade operacional, e o preço é a disciplina descrita a seguir.

### Vínculo usuário-casa de 1 para N, no lugar do pivot planejado

O modelo original previa uma tabela pivot `house_user` com papel por vínculo, ou seja, um usuário podendo pertencer a várias casas. O que foi implementado é uma coluna `users.house_id`: um usuário pertence a exatamente uma casa.

A simplificação vale a pena porque o pivot só se paga quando existe o conceito de casa ativa: seletor na interface, casa corrente na sessão, e todo controller passando a depender desse estado em vez de depender do usuário. Sem nenhum usuário real com duas casas, isso seria complexidade paga adiantado por um requisito hipotético.

A consequência direta é boa para segurança: como a casa vem do usuário autenticado, não existe parâmetro de tenant na URL nem no corpo da requisição para adulterar. Não há subdomínio por casa nem `/casa/{id}/...`. A casa é sempre `auth()->user()->house_id`, e nenhum controller lê identificador de casa vindo do request. Isso elimina uma classe inteira de ataque por definição.

O limite é que suportar alguém em duas casas hoje é uma mudança de modelo, não um ajuste.

O middleware `EnsureUserHasHouse` faz uma coisa só: se o usuário autenticado não tem casa, redireciona para o onboarding. Ele deliberadamente não injeta escopo em query alguma. É um guarda de fluxo, não um resolvedor de tenant.

### Inertia em vez de API REST com SPA separada

O plano original era Laravel expondo uma API REST com Sanctum, e um front React desacoplado consumindo essa API, com React Query, camada de services por módulo, hooks por recurso e um `AuthContext` próprio. O que foi construído é um monolito com Inertia.js: o controller devolve props tipadas direto para o componente React da página, sem endpoint JSON, sem token e sem cliente HTTP no frontend.

**Por que a troca.** A opção REST cobrava um imposto fixo que o projeto não tinha como pagar: rotas declaradas duas vezes (uma no Laravel, outra no roteador do React), tipos declarados duas vezes (FormRequest e interface TypeScript), CORS e `SANCTUM_STATEFUL_DOMAINS` para configurar, estado de servidor para gerenciar no cliente com cache e invalidação, e estados de loading e erro para escrever em cada tela. Tudo isso é justificado quando existe mais de um consumidor da API, como um app mobile. Aqui existe um: o próprio site.

Com Inertia, uma criação de gasto é `redirect()->route('financeiro.index')->with('success', ...)`, e a página seguinte já chega com os dados recalculados. Não há cache para invalidar porque não há cache.

**O que se perde, declarado.** Não há API para consumir de fora, então um app mobile no futuro exigiria construir a camada REST que foi evitada. O frontend fica acoplado ao Laravel e não roda separado. E como a página inteira é remontada a cada mutação, telas pesadas pagam esse custo: `/financeiro` recalcula recorrências, parcelas e totais por ciclo a cada gravação.

O `laravel/wayfinder` cobre a parte que faltava: ele gera, em tempo de build, funções TypeScript tipadas a partir das rotas do Laravel, em `resources/js/routes` e `resources/js/actions`. Esses diretórios são gerados e não versionados, o que significa que um clone recém-feito não compila até o primeiro build.

### O filtro é manual e repetido, e esse é o ponto mais frágil

Não há global scope no Eloquent, nem trait de escopo, nem `Route::bind` com escopo de casa. O isolamento é conseguido de duas formas, repetidas à mão:

- **Na leitura**, cada método de repositório aplica seu próprio `where('casa_id', $casaId)` ou `where('house_id', $houseId)`. São 33 ocorrências espalhadas pelos 10 repositórios.
- **Na escrita**, o route model binding resolve o registro sem escopo nenhum, e a barreira fica na camada de serviço, através da trait `AuthorizesHouseResource::ensureCanEdit`, que compara a casa do recurso com a casa do usuário e aborta com 403.

Isso funciona, e a comparação falha fechado: qualquer divergência resulta em 403 indevido, nunca em acesso indevido. Mas o desenho depende de o próximo método lembrar de chamar a verificação. Um global scope teria feito o banco de dados dizer não por padrão, em vez de depender de o programador dizer não em cada caminho. Se eu fosse recomeçar, começaria por aí.

Um sintoma concreto dessa fragilidade: as regras de validação usam `exists:users,id` e `exists:produtos,id` sem escopo de casa, então a garantia de pertencimento não está na validação, está espalhada por asserções na camada de serviço (`assertCycleBelongsToHouse`, `assertCategoryBelongsToHouse`) que cobrem ciclo e categoria, mas não cobrem responsáveis nem produto.

Há exatamente uma operação que cruza tenants de propósito, e ela é explícita: o reset semanal de tarefas em `routes/console.php`, que roda `Task::query()->update(['completed' => false])` toda segunda às 00:00 para todas as casas de uma vez.

### Chave de tenant derivada nas tabelas filhas

`parcelas` e `lista_compras` não têm coluna de casa. Elas herdam do pai, `parcelamentos` e `produtos` respectivamente, e os models expõem um accessor virtual `getCasaIdAttribute()` que resolve por relacionamento.

A alternativa seria denormalizar a chave da casa em toda tabela filha. Isso deixaria os filtros mais diretos e mais rápidos, ao custo de manter a mesma verdade em dois lugares e de abrir espaço para inconsistência caso um parcelamento fosse movido de casa. Como a chave estrangeira já garante a hierarquia, denormalizar seria trocar uma garantia do banco por uma otimização que o volume não pede. O custo real é que os repositórios de filhas filtram com `whereHas` no pai, que é um subquery, e que a trait de autorização depende de carregar o relacionamento.

### Reescrita do financeiro: de tabela polimórfica para tabelas por tipo

A primeira versão tinha uma única tabela `financial_transactions` com uma coluna `type` de cinco valores (`gasto`, `ganho`, `divida`, `emprestimo`, `afiado`) e colunas que só faziam sentido para alguns deles: `installments_count` e `last_installment_date` ficavam nulas em todo gasto simples, `recurrence` ficava nula em toda dívida. Além disso, a projeção de qual lançamento aparece em qual mês era feita **no frontend**, em `resources/js/pages/financeiro/utils.ts`.

A migration `2026_03_28_000001` trocou isso por tabelas separadas: `gastos`, `ganhos`, `parcelamentos` e `parcelas`. Cada uma só tem as colunas que fazem sentido para ela, e a projeção mensal passou para o backend.

**Por que.** Dois motivos práticos. O primeiro é que uma coluna nula por design vira uma pergunta a cada leitura: dá para confiar em `installments_count` neste registro? Com tabelas separadas, `parcelas.numero_parcela` é sempre obrigatório e sempre significa a mesma coisa. O segundo é que a projeção no frontend era regra de negócio fora do servidor: o Dashboard precisava da mesma regra e teria que reimplementá-la, e qualquer consumidor futuro dos dados receberia números crus, sem a projeção aplicada. Hoje `GastoRepository::getResolvedForMonth()` é a única fonte da verdade, e o Dashboard chama exatamente o mesmo método.

**O custo aceito.** Três tipos de lançamento significam três repositórios, três conjuntos de FormRequest e um merge no serviço para montar a lista unificada da tela. `FinanceiroService::getPageData()` busca gastos, ganhos e parcelas em três consultas e junta em memória, em vez de fazer uma consulta só. A tabela `financial_transactions` original continua sendo criada e depois dropada pela sequência de migrations, resíduo dessa transição.

### Recorrência: uma linha mutável em vez de instâncias materializadas

Esta é a decisão com o limite mais claro, e também um desvio direto do plano original, que dizia "recorrência gera novos lançamentos automaticamente via scheduler".

Um gasto recorrente é **uma única linha** em `gastos`, com `recorrente = true` e `dia_recorrencia`. A projeção acontece na leitura, em `GastoRepository::resolveRecorrente()`:

- Mês passado ou futuro: o gasto é projetado em memória com a data calculada e status sempre `aberto`. Nada é gravado.
- Mês corrente, quando o vencimento gravado ainda é de um mês anterior: a linha é reescrita. `vencimento` avança e `status` volta para `aberto`, via `saveQuietly()`.

**Por que não o scheduler do plano original.** Existe um job agendado no projeto, o reset semanal de tarefas, então não é que cron seja impossível. A diferença está na consequência de uma execução perdida ou repetida. O reset de tarefas é idempotente e tolerante: se a segunda-feira falhar, roda na próxima e ninguém perde dado. Gerar linhas financeiras não é: uma execução perdida deixa o mês sem lançamento, uma execução repetida duplica a conta, e as duas falhas aparecem como número errado na tela de dinheiro. Em hospedagem compartilhada, sem monitoramento de job e sem fila, garantir exatamente uma execução por mês exigiria trava e verificação de idempotência. Projetar na leitura tem um estado a menos para dar errado: o dado é derivado, então não existe estado divergente para reconciliar.

**O limite conhecido, declarado sem rodeio:** como a linha é reescrita, gasto recorrente não tem histórico. Marcar a conta de luz de junho como paga e depois abrir julho sobrescreve a linha, e o "pago" de junho deixa de existir. Meses passados sempre aparecem como `aberto`, mesmo tendo sido pagos. Além disso, a reescrita acontece dentro de uma requisição `GET`, o que significa que carregar a tela do financeiro grava no banco, com o comportamento de concorrência que isso implica.

Vale notar que o schema já contém a tentativa de conserto: as migrations `2026_06_03_232145` e `2026_06_04_185921` adicionam `parent_gasto_id`, `mes_referencia` e um índice único em `(parent_gasto_id, mes_referencia)`, exatamente o desenho de instâncias materializadas sob demanda, com o índice impedindo duplicata em vez de depender da corretude de um job. Essa versão não é a que está em produção, e as colunas estão hoje sem uso. Migrar para ela é o item de maior prioridade técnica do roadmap.

### Autorização em dois níveis, sem Policies, e sem administrador global

`ensureCanEdit` aplica duas checagens em sequência: primeiro se o recurso pertence à casa do usuário, depois se o usuário pode editar aquele recurso especificamente. Admin pode tudo dentro da casa; morador comum pode editar o que criou ou aquilo de que é responsável.

Não foram usadas Policies do Laravel. A razão é que a regra é a mesma para praticamente todo recurso do sistema, e uma Policy por model significaria replicar a mesma lógica em oito ou nove classes. Uma trait chamada pelos serviços centraliza isso em um lugar.

O que se perde: `Gate::authorize()` e `$this->authorize()` não funcionam, a regra não aparece em `can` no frontend, e não há como um recurso ter regra diferente sem sair do padrão. Se as regras divergirem por módulo, a trait vira um `if` grande e o desenho deixa de se pagar.

O escopo original previa três papéis, com um "Admin Sistema" acima dos demais, responsável por criar as casas e gerenciar usuários globalmente. Foram implementados dois, `admin` e `user`, ambos internos à casa. Construir o papel global exigiria uma área administrativa inteira fora do tenant, com suas próprias telas, rotas e regras de acesso, para atender um único operador que é a mesma pessoa que tem acesso ao banco. O onboarding assumiu o lugar dessa área: quem cria a casa vira admin dela.

A consequência é a lacuna já declarada no Status. Como o cadastro público está desativado, coerente com a regra original de que casas não se criam sozinhas, e como o painel que criaria os usuários não existe, o fluxo de entrada ficou sem as duas pontas.

### Não existe sistema de módulos, e isso é intencional

Não há pacote de módulos, service provider por módulo, nem registro dinâmico. "Módulo" aqui é uma convenção de organização, e todo módulo tem a mesma forma:

```
Route::prefix('financeiro')->name('financeiro.')->group(...)   rotas agrupadas em routes/web.php
FinanceiroController                                            entrada HTTP
StoreGastoRequest, UpdateGastoRequest, ...                      validação
FinanceiroService                                               regra de negócio e autorização
GastoRepository, GanhoRepository, ...                           acesso a dados
resources/js/pages/financeiro/                                  telas e componentes
```

Um módulo é adicionado escrevendo essas peças e um grupo de rotas. Não há carregamento dinâmico nem possibilidade de desligar um módulo por casa.

**Por que não um sistema de módulos de verdade.** Módulos com registro dinâmico existem para resolver dois problemas: permitir que terceiros estendam a aplicação, e permitir habilitar recursos por cliente. Nenhum dos dois é requisito aqui. O que sobraria seria a cerimônia: um provider por módulo, autoload configurado, e uma camada de indireção entre a rota e o controller que não paga o próprio custo em um sistema de seis módulos escritos pela mesma pessoa.

**Onde o isolamento entre módulos vaza.** Os módulos não são realmente independentes. `DashboardService` injeta sete repositórios de quatro módulos diferentes para montar a tela inicial, e `EstoqueService` atende compras e dispensa ao mesmo tempo, porque registrar uma compra dá baixa no estoque. Esse acoplamento é do domínio, não do código: uma casa que compra arroz aumenta o estoque de arroz. Modelar isso como eventos entre módulos desacoplados seria mais puro e menos legível.

### Camadas aplicadas de forma desigual

Financeiro, compras e dispensa seguem Controller, FormRequest, Service, Repository, Model. Tarefas e agenda não: consultam o Eloquent direto no controller e validam com `$request->validate()` inline.

Isso não é decisão de design, é uma refatoração incremental que ainda não terminou. Vale registrar por honestidade: quem abrir `TarefasController` e `FinanceiroController` vai ver dois padrões diferentes no mesmo projeto. O critério para migrar foi complexidade: o financeiro tem projeção de recorrência, agregação por ciclo e três tipos de lançamento, e ficou impossível de ler dentro do controller. Tarefas é CRUD com reordenação, e o custo das camadas ali seria maior que o benefício.

### Duas convenções de nomenclatura coexistindo

Os módulos originais usam inglês (`house_id`, `created_by`, `assignees`). O financeiro e o estoque, reescritos depois, usam português (`casa_id`, `criado_por`, `responsaveis`), seguindo o vocabulário do backlog original, que já falava em `casa_id` e `criado_por`. A trait `AuthorizesHouseResource` faz a ponte em runtime com coalescing:

```php
$resourceHouseId = $resource->casa_id ?? $resource->house_id ?? null;
$createdBy       = $resource->criado_por ?? $resource->created_by ?? null;
```

Isso é dívida técnica, não decisão. A reescrita de março passou o financeiro e o estoque para o vocabulário do domínio e parou ali. A ponte foi a forma de não travar a entrega enquanto o resto não era migrado. O custo é que a trait precisa conhecer as duas convenções e que qualquer módulo novo tem que escolher um lado.

### Deploy em hospedagem compartilhada, com a raiz servindo a aplicação

O ambiente de produção não permite apontar o document root para `public/`. Por isso o repositório carrega um `index.php` na raiz, que é o front controller do Laravel com os caminhos ajustados, e um `.htaccess` que reescreve todas as requisições para `public/`.

É uma concessão ao ambiente, não um padrão a copiar: expõe o diretório da aplicação abaixo do document root e depende de o `.htaccess` estar funcionando. A alternativa correta seria um servidor com document root configurável, o que a hospedagem atual não oferece.

## Stack

**Backend**
- PHP 8.2 ou superior, Laravel 12
- Laravel Fortify 1.30 para autenticação, incluindo 2FA por TOTP
- Inertia.js 2.0 no lado servidor
- MySQL ou MariaDB (obrigatório, ver a seção de execução)

**Frontend**
- React 19 com TypeScript 5.7
- Inertia.js 2.3 no lado cliente, sem API REST separada
- Tailwind CSS 4, componentes shadcn/ui sobre Radix UI
- Laravel Wayfinder, que gera rotas tipadas a partir das rotas do Laravel em tempo de build
- dnd-kit para reordenação de tarefas, lucide-react para ícones, sonner para notificações
- Vite 7

**Qualidade**
- Pest 3 para testes, Laravel Pint para formatação PHP, ESLint e Prettier para o frontend
- GitHub Actions com dois workflows, lint e testes

## Estrutura do projeto

```
app/
  Concerns/          AuthorizesHouseResource (autorização por casa), regras de validação compartilhadas
  Http/
    Controllers/     um por módulo, mais Settings/ para perfil, segurança e casa
    Middleware/      EnsureUserHasHouse, HandleInertiaRequests, HandleAppearance
    Requests/        26 FormRequests, agrupados por módulo
  Models/            15 models Eloquent
  Repositories/      10 repositórios, onde vive o filtro por casa
  Services/          FinanceiroService, EstoqueService, DashboardService
  Providers/         AppServiceProvider, FortifyServiceProvider

database/migrations/ 24 migrations, incluindo a reescrita do modelo financeiro em 2026_03_28

resources/js/
  pages/             uma pasta por módulo, componentes locais em pages/<modulo>/components/
  components/hub/    componentes de domínio reaproveitados (status, ciclo, avatares, cartões)
  components/ui/     shadcn/ui
  layouts/           app-layout, auth, settings
  routes/, actions/  gerados pelo Wayfinder no build, não versionados

routes/
  web.php            todos os módulos, agrupados por prefixo
  settings.php       perfil, segurança e configuração da casa
  console.php        reset semanal de tarefas (única tarefa agendada)
```

## Como rodar

**Pré-requisitos**

- PHP 8.2 ou superior, com as extensões padrão do Laravel
- Composer 2
- Node.js 22
- **MySQL 8 ou MariaDB.** Não é opcional. Duas migrations usam SQL específico de MySQL e falham em SQLite e PostgreSQL. O `DB_CONNECTION=sqlite` que vem no `.env.example` é herança da fase inicial do projeto e não funciona mais.

**Instalação**

```bash
git clone <url-do-repositorio>
cd hub-casa

composer install
npm install

cp .env.example .env
php artisan key:generate
```

Edite o `.env` e aponte para o MySQL:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=hubcasa
DB_USERNAME=root
DB_PASSWORD=
```

Crie o banco e rode as migrations:

```bash
mysql -u root -e "CREATE DATABASE hubcasa"
php artisan migrate
```

**Build do frontend**

O projeto tem dois arquivos de configuração do Vite. O Vite resolve `vite.config.js` antes de `vite.config.ts`, e o `.js` é um resto de starter kit que aponta para um entrypoint que não é o da aplicação. Por isso o config correto precisa ser informado explicitamente:

```bash
npx vite build --config vite.config.ts     # produção
npx vite --config vite.config.ts           # desenvolvimento
```

Sem a flag, `npm run build` gera um bundle sem React e a aplicação não renderiza. Remover `vite.config.js` resolve isso de forma definitiva e está no roadmap.

**Servidor**

```bash
php artisan serve
```

O cadastro público está desativado. Crie o primeiro usuário pelo Tinker:

```bash
php artisan tinker
>>> App\Models\User::create(['name' => 'Seu Nome', 'email' => 'voce@exemplo.com', 'password' => bcrypt('senha')]);
```

Faça login e o onboarding vai pedir para criar a casa. Você vira administrador dela e as categorias padrão são semeadas automaticamente.

Para o reset semanal de tarefas funcionar, o scheduler precisa estar rodando: `php artisan schedule:work` em desenvolvimento, ou uma entrada de cron chamando `schedule:run` a cada minuto em produção.

**Testes**

`php artisan test` falha hoje por incompatibilidade entre o SQLite fixado em `phpunit.xml` e o SQL específico de MySQL das migrations. Rodar contra um banco MySQL de teste é o caminho até isso ser corrigido.

## Próximos passos

Em ordem de prioridade técnica:

1. **Destravar a suíte de testes.** Reescrever as duas migrations com SQL portável, ou passar os testes a rodar contra MySQL. Sem isso não há rede de proteção para nenhuma mudança abaixo.
2. **Escrever testes de isolamento entre casas.** Usuário da casa A recebendo 403 ao tentar ler e ao tentar escrever em cada recurso da casa B. É o mecanismo mais crítico do sistema e hoje o menos verificado.
3. **Global scope de casa no Eloquent**, para que o isolamento passe a ser o padrão e o vazamento passe a exigir uma decisão explícita (`withoutGlobalScope`), em vez de depender de lembrar do `where`.
4. **Fluxo de convite para casa existente**, para que colaboração deixe de exigir acesso ao banco. É o que fecha a lacuna entre o cadastro desativado e o onboarding.
5. **Migrar recorrência para instâncias materializadas**, usando `parent_gasto_id` e `mes_referencia` que já existem no schema, e assim recuperar histórico de gastos recorrentes. Isso também destrava o histórico financeiro comparativo, que hoje não tem dado de onde partir.
6. **Limpeza.** Remover `vite.config.js`, os arquivos `resources/js/app.js` e `resources/js/bootstrap.js` que importam uma dependência ausente do `package.json`, o `default.php` da hospedagem, o `resources/views/welcome.blade.php` não utilizado, e os cinco componentes React órfãos do financeiro, que respondem por 9 dos 11 erros de tipagem.
7. **Unificar a nomenclatura** em `casa_id` e `criado_por`, e então remover o coalescing da trait de autorização.
8. **Concluir a padronização de camadas** em tarefas e agenda.
