# Meu Oráculo - Gestão Financeira Pessoal

## 📌 Sobre o Projeto
**Meu Oráculo** é um sistema completo e moderno de gestão financeira pessoal e controle de gastos. Desenvolvido para proporcionar clareza, organização e previsibilidade sobre a sua vida financeira, o aplicativo permite que você acompanhe suas receitas, despesas (fixas e variáveis), cartões de crédito, e muito mais, tudo em uma interface limpa e intuitiva.

### 🌟 Principais Benefícios
- **Clareza Financeira:** Visualize rapidamente para onde seu dinheiro está indo através de gráficos dinâmicos e relatórios na Dashboard.
- **Controle Total:** Gerencie cartões de crédito, despesas recorrentes e listas de compras em módulos específicos e interligados.
- **Tomada de Decisão:** Baseie suas decisões financeiras em dados concretos e atualizados em tempo real.
- **Organização Centralizada:** Veículos, compras do mês, faturas e lançamentos diários, tudo no mesmo lugar e disponível a qualquer momento.

---

## ♿ Acessibilidade Integrada
O **Meu Oráculo** foi construído com a acessibilidade em mente desde o primeiro dia. O projeto inclui comandos de acessibilidade e navegação otimizada para garantir que usuários com diferentes necessidades possam utilizar a aplicação de forma autônoma e sem barreiras. As implementações de acessibilidade focam em melhorar o suporte a leitores de tela em elementos iterativos e na clareza geral da hierarquia e do contraste da interface.

---

## 🧩 Módulos do Sistema

O sistema é modular para facilitar o seu dia a dia em todas as frentes da economia doméstica:

1. **Dashboard & Relatórios:** O coração do aplicativo. Apresenta gráficos de receitas vs despesas, evolução de saldo em contas e distribuição de gastos por categoria para uma visão geral e rápida da sua saúde financeira.
2. **Lançamentos (Ledger):** Registro diário (livro-caixa) de todas as transações avulsas, tanto de entrada quanto de saída.
3. **Cartões de Crédito (Cards):** Gestão completa das faturas, limites, transações correntes e compras parceladas de todos os seus cartões.
4. **Despesas Fixas:** Controle automatizado de contas recorrentes (água, luz, internet, aluguel) para não esquecer nenhum compromisso mensal.
5. **Listas de Compras (Shopping):** Planejamento preventivo de idas ao supermercado com cálculo automático do total. O fluxo é totalmente integrado com a área de cartões de crédito, debitando ou estornando valores do limite automaticamente ao reabrir ou fechar uma lista.
6. **Gestão de Veículos (Car):** Acompanhamento preciso das despesas automotivas, controle de revisões/manutenções e histórico de abastecimento.
7. **Autenticação e Perfil:** Sistema seguro de login (Auth) e painel personalizável de configurações do usuário.

---

## 🛠️ Tecnologias Utilizadas
O projeto utiliza uma stack moderna e robusta para alta performance, escalabilidade e excelente experiência de desenvolvimento:

- **React 19 & Vite 7:** A principal biblioteca para interfaces interativas junto de um _bundler_ e ambiente de desenvolvimento ultrarrápido.
- **TypeScript:** Superset do JavaScript que adiciona tipagem estática, entregando um código limpo e livre de falhas inesperadas de tipos.
- **Tailwind CSS:** Framework CSS _utility-first_ que permite estilização responsiva, bonita e rápida diretamente no código.
- **Supabase:** Plataforma Backend as a Service (BaaS) de código aberto (baseado em PostgreSQL) poderosa para banco de dados e autenticação segura.
- **Recharts:** Biblioteca leve de componentes para gráficos de dados fluidos e responsivos.
- **Zod & React Hook Form:** A dupla perfeita para validação rígida, amigável e performática de formulários antes dos dados irem para o servidor.
- **Lucide React:** Biblioteca de ícones elegantes, consistentes e de alta qualidade.

---

## 🚀 Melhorias Futuras (Roadmap)
Embora a ferramenta seja muito completa, nossa arquitetura permite constante evolução. Entre os planos futuros, temos forte foco em IA e integrações cotidianas:

- **✨ Integração com WhatsApp:** No futuro, será possível lançar despesas, registrar compras de mercado via áudio e receber resumos diários/mensais ou alertas de faturas diretamente no seu WhatsApp utilizando integração com um _Bot_ parceiro do Meu Oráculo.
- **Previsão de Gastos com IA:** Análises que informarão se você tende a extrapolar o limite no mês de acordo com o padrão das despesas variáveis.
- **Exportação de Relatórios Gerenciais:** Possibilidade de retirar o compilado por períodos em planilhas detalhadas ou PDFs gerenciais.
- **Orçamentos e Metas (Budgets):** Definição estrita de balizas de limite de gatos separados por categoria com alertas sempre que a meta correr risco.
