# 🚀 Apresentando o Meu Oráculo - Meu projeto para o Dev Club!

Fala pessoal do Dev Club! 👋 
Estou muito animado em compartilhar com vocês o **Meu Oráculo**, o projeto que desenvolvi para o nosso concurso de projetos da escola. Ele é um sistema completo de gestão financeira pessoal e previsões financeiras (por isso o nome), focado em facilidade de uso, acessibilidade e controle inteligente de gastos.

## 🎯 O que é o projeto?
O **Meu Oráculo** nasceu da necessidade de ter um controle financeiro que não fosse apenas uma planilha chata, mas uma ferramenta visualmente agradável e inteligente. Ele ajuda na gestão completa de receitas e despesas com a adição de cálculos automáticos para acompanhamento de metas, como o que está *pago* e o que ainda está *pendente*.

## ✨ Principais Funcionalidades
- **📊 Dashboard Interativo**: Visão geral do saldo mensal, com um resumo dinâmico e gráficos para as categorias de gastos.
- **📅 Gestão Recorrente (Despesas Fixas e Variáveis)**: O sistema cadastra e gera automaticamente contas recorrentes. Você pode colocar uma "Estimativa" (Ex: Conta de Luz Estimada: R$150) e depois o valor "Real", vendo a porcentagem de diferença e mantendo os gastos na linha.
- **💳 Módulo de Cartões de Crédito**: Para quem usa muito cartão, há uma separação clara do total da fatura em aberto, do que já foi consolidado/pago e do pendente de pagamento do mês.
- **♿ Menu de Acessibilidade Integrado**: O projeto possui ferramentas nativas para auxiliar a deficiência visual, leitor de telas, navegação de teclado, entre outros, garantindo uma aplicação útil para *todos*.

*[ 📸 Sugestão para o post: Inserir um Print da tela de Dashboard com os Gráficos aqui ]*

*[ 📸 Sugestão para o post: Inserir um Print da tela de Despesas Fixas, Faturas e Totais aqui ]*

## 🛠️ Stack Tecnológica & Parte Técnica
No desenvolvimento, procurei focar nas tecnologias mais modernas e robustas do mercado atual:

**Frontend (Client-Side):**
- ⚛️ **React 19** e **Vite**: Um ambiente de desenvolvimento estritamente rápido e otimizado.
- 🟦 **TypeScript**: Garantindo robustez através da tipagem estática do projeto.
- 🎨 **Tailwind CSS**: Toda a estilização do front-end é montada usando *Utility-first CSS*, desde os micro-componentes, *cards* com variantes personalizadas e cores para Dark/Light mode de forma nativa.
- 📈 **Recharts**: Para a renderização dos gráficos financeiros performáticos na interface.
- 🧭 **React Router DOM v7**: Roteamento suave de Single Page Application.
- 🧩 **Lucide React**: Biblioteca adotada para os ícones modernos.
- 🗓️ **Date-fns**: Para o uso intensivo de formatações e lógica de calendários associadas aos meses das faturas e lançamentos.

**Backend & Integração de Dados (BaaS):**
- 🟢 **Supabase**: Toda a infraestrutura de dados (banco PostgreSQL na nuvem), API instantânea, camada de segurança e de autenticação está construída sobre o Supabase, comunicando-se usando o `@supabase/supabase-js`.

## 🧠 Desafios de Desenvolvimento (Opcional - bônus para programadores!)
O maior desafio técnico foi arquitetar a projeção das faturas fixas nos meses seguintes e lidar com as diferenças de datas e status (`Pago/Pendente`), fazendo os *cards* de totalizador atualizarem instantaneamente com o React *hooks* (como o uso do `useMemo` otimizado). A parte de acessibilidade também foi muito gratificante de aplicar!

E aí, o que acharam? Sugestões e feedbacks são muito bem-vindos! 🚀👇

#DevClub #ReactJS #TypeScript #TailwindCSS #Supabase #WebDevelopment #Finanças
