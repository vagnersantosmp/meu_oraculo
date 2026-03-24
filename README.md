# 🔮 Meu Oráculo


**Meu Oráculo** é uma aplicação web completa para gestão financeira e organização pessoal. Construída com tecnologias modernas, a plataforma oferece não apenas o rastreamento de receitas e despesas, mas também ferramentas dedicadas para gerenciar cartões de crédito, contas fixas, veículos, listas de compras e metas mensais. O objetivo é fornecer uma visão 360º da sua saúde financeira em um só lugar.

---

## ✨ Principais Funcionalidades

- **📊 Dashboard Interativo**: Visão geral financeira com resumo de saldo, receitas vs. despesas, gráficos interativos (Pizza e Barras) e ranking de maiores gastos.
- **💰 Livro Caixa (Ledger)**: Registro detalhado de transações (receitas e despesas) com categorização.
- **💳 Cartões de Crédito**: Gestão de cartões, limites e acompanhamento de faturas (transações e pagamentos virtuais).
- **📅 Contas Fixas (Bills)**: Controle de despesas recorrentes e contas a pagar, com alertas de vencimento.
- **🚗 Gestão de Veículos (Car)**: Rastreamento de abastecimentos (combustível) e manutenções preventivas/corretivas com alertas de quilometragem.
- **🛒 Listas de Compras**: Criação e gestão de listas de compras dinâmicas, integradas com um catálogo de produtos compartilhados.
- **🎯 Metas Mensais**: Definição de metas de gastos para ajudar no controle orçamentário.
- **🔐 Autenticação e Segurança**: Sistema de login, cadastro e recuperação de senha seguro.
- **♿ Acessibilidade**: Menu dedicado de acessibilidade para adaptar a experiência do usuário.

## 🛠 Tecnologias Utilizadas

O projeto utiliza um stack moderno para garantir alta performance, manutenibilidade e escalabilidade:

### Frontend
- **[React 19](https://react.dev/)**: Biblioteca principal para construção da interface de usuário.
- **[Vite](https://vitejs.dev/)**: Bundler ultrarrápido para desenvolvimento.
- **[TypeScript](https://www.typescriptlang.org/)**: Tipagem estática para maior segurança do código.
- **[Tailwind CSS](https://tailwindcss.com/)**: Framework CSS utilitário para estilização rápida e responsiva.
- **[React Router v7](https://reactrouter.com/)**: Navegação e roteamento do lado do cliente (SPA).
- **[Recharts](https://recharts.org/)**: Biblioteca para renderização de gráficos complexos.
- **[Lucide React](https://lucide.dev/)**: Ícones elegantes e consistentes.

### Backend / BaaS
- **[Supabase](https://supabase.com/)**: Backend-as-a-Service utilizado para:
  - Banco de Dados PostgreSQL.
  - Autenticação de usuários (Auth).

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior recomendada)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- Uma conta no [Supabase](https://supabase.com/) configurada.

### Passo a Passo

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/meu-oraculo.git
   cd meu-oraculo
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as Variáveis de Ambiente**
   Crie um arquivo `.env.local` na raiz do projeto baseado no `.env.example` e insira suas credenciais do Supabase:
   ```env
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_anon_key_do_supabase
   ```

4. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

5. **Acesse a aplicação**
   Abra [http://localhost:5173](http://localhost:5173) no seu navegador.

## 🗄 Estrutura do Projeto

Aplica-se uma divisão modularizada dentro do diretório `src/`:

- `/components`: Componentes reutilizáveis da interface (UI base, navegação, modais).
- `/context`: Contextos globais da aplicação (AppContext, AuthContext, ThemeContext, etc).
- `/hooks`: Hooks customizados (ex: `useFinancialSummary`).
- `/lib`: Configurações de serviços externos e utilitários (Supabase client, cálculos financeiros).
- `/pages`: Componentes de páginas roteáveis divididos por escopo funcional (Auth, Dashboard, Ledger, Shopping, etc).
- `/types`: Definições globais de interfaces e tipos do TypeScript.

## 🤝 Contribuição

Contribuições são sempre bem-vindas! Se você deseja colaborar:
1. Faça um Fork do projeto
2. Crie uma branch para a sua feature (`git checkout -b feature/MinhaFeature`)
3. Faça o commit das suas alterações (`git commit -m 'feat: Minha nova feature'`)
4. Faça o push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença [MIT](https://choosealicense.com/licenses/mit/).

---
*Desenvolvido com dedicação para facilitar sua vida financeira.* 🚀
