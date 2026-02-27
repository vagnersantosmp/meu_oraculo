-- =============================================
-- MEU ORÁCULO — Schema Completo
-- Execute no Supabase Dashboard → SQL Editor
-- =============================================

-- 1. CATÁLOGO DE PRODUTOS (COMPARTILHADO)
create table product_catalog (
    id uuid default gen_random_uuid() primary key,
    nome_produto text not null,
    categoria text not null default 'Outros',
    created_by uuid references auth.users(id),
    created_at timestamptz default now()
);

create index idx_product_catalog_nome on product_catalog (lower(nome_produto));
create unique index idx_product_catalog_unique on product_catalog (lower(trim(nome_produto)));

alter table product_catalog enable row level security;
create policy "Todos podem ler produtos" on product_catalog for select to authenticated using (true);
create policy "Todos podem adicionar produtos" on product_catalog for insert to authenticated with check (true);

-- 2. LISTAS DE COMPRAS
create table shopping_lists (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    nome_lista text not null,
    status text not null default 'aberta' check (status in ('aberta', 'finalizada')),
    data_criacao timestamptz default now(),
    data_compra timestamptz,
    valor_total_lista numeric(12,2) default 0,
    payment_method text,
    created_at timestamptz default now()
);

create index idx_shopping_lists_user on shopping_lists (user_id);

alter table shopping_lists enable row level security;
create policy "User CRUD own lists" on shopping_lists for all to authenticated
    using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. ITENS DA LISTA
create table shopping_items (
    id uuid default gen_random_uuid() primary key,
    list_id uuid references shopping_lists(id) on delete cascade not null,
    nome_item text not null,
    categoria text not null default 'Outros',
    quantidade int default 1,
    unidade_medida text default 'un',
    valor_unitario numeric(12,2) default 0,
    valor_total_item numeric(12,2) default 0,
    marcado_como_pegado boolean default false,
    observacoes text
);

create index idx_shopping_items_list on shopping_items (list_id);

alter table shopping_items enable row level security;
create policy "User CRUD own items" on shopping_items for all to authenticated
    using (list_id in (select id from shopping_lists where user_id = auth.uid()))
    with check (list_id in (select id from shopping_lists where user_id = auth.uid()));

-- 4. TRANSAÇÕES (CAIXA)
create table ledger_transactions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    date timestamptz not null,
    type text not null check (type in ('income', 'expense')),
    category text not null,
    description text not null,
    value numeric(12,2) not null,
    payment_method text not null,
    source text not null default 'manual' check (source in ('manual', 'system')),
    source_ref uuid,
    created_at timestamptz default now()
);

create index idx_ledger_user on ledger_transactions (user_id);
create index idx_ledger_date on ledger_transactions (user_id, date);

alter table ledger_transactions enable row level security;
create policy "User CRUD own transactions" on ledger_transactions for all to authenticated
    using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5. ABASTECIMENTO (CARRO)
create table car_fuel (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    date timestamptz not null,
    km int not null,
    value numeric(12,2) not null,
    payment_method text not null,
    note text,
    created_at timestamptz default now()
);

alter table car_fuel enable row level security;
create policy "User CRUD own fuel" on car_fuel for all to authenticated
    using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 6. MANUTENÇÕES (CARRO)
create table car_maintenance (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    date timestamptz not null,
    type text not null,
    km_done int not null,
    km_next int not null,
    value numeric(12,2) not null,
    payment_method text not null,
    note text,
    created_at timestamptz default now()
);

alter table car_maintenance enable row level security;
create policy "User CRUD own maintenance" on car_maintenance for all to authenticated
    using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 7. DESPESAS FIXAS
create table fixed_expenses (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    description text not null,
    category text not null,
    value numeric(12,2) not null,
    due_date date not null,
    paid boolean default false,
    payment_date date,
    created_at timestamptz default now()
);

alter table fixed_expenses enable row level security;
create policy "User CRUD own fixed" on fixed_expenses for all to authenticated
    using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 8. METAS MENSAIS
create table monthly_goals (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    month text not null,
    goal numeric(12,2) not null,
    created_at timestamptz default now(),
    unique(user_id, month)
);

alter table monthly_goals enable row level security;
create policy "User CRUD own goals" on monthly_goals for all to authenticated
    using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 9. CARTÕES DE CRÉDITO
create table credit_cards (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    color_theme text not null default 'blue',
    limit_amount numeric(12,2) not null,
    closing_day int not null check (closing_day between 1 and 31),
    due_day int not null check (due_day between 1 and 31),
    created_at timestamptz default now()
);

alter table credit_cards enable row level security;
create policy "User CRUD own credit cards" on credit_cards for all to authenticated
    using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 10. TRANSAÇÕES DE CARTÃO DE CRÉDITO (FATURA)
create table credit_transactions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    card_id uuid references credit_cards(id) on delete cascade not null,
    date timestamptz not null,
    category text not null,
    description text not null,
    value numeric(12,2) not null,
    installments int default 1 not null,
    installment_number int default 1 not null,
    parent_transaction_id uuid references credit_transactions(id) on delete cascade,
    status text not null default 'open_invoice' check (status in ('open_invoice', 'closed_invoice', 'paid')),
    payment_date date,
    created_at timestamptz default now()
);

alter table credit_transactions enable row level security;
create index idx_credit_transactions_card on credit_transactions (card_id);
create policy "User CRUD own credit transactions" on credit_transactions for all to authenticated
    using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================
-- RECURRING BILLS (Modelos de Contas Recorrentes)
-- =============================================
create table recurring_bills (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users not null,
    description text not null,
    category text not null,
    estimated_value numeric(12,2) not null default 0,
    is_variable boolean default true not null,
    due_day int not null default 1,
    active boolean default true not null,
    created_at timestamptz default now()
);

alter table recurring_bills enable row level security;
create policy "User CRUD own recurring bills" on recurring_bills for all to authenticated
    using (auth.uid() = user_id) with check (auth.uid() = user_id);
