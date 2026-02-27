-- =============================================================
-- RLS AUDIT SCRIPT — Meu Oráculo
-- Execute no Supabase SQL Editor para auditar e criar as políticas
-- de Row Level Security em todas as tabelas do app.
-- =============================================================

-- ---------------------------------------------------------------
-- 1. VERIFICAR STATUS ATUAL DAS TABELAS
-- ---------------------------------------------------------------
SELECT
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ---------------------------------------------------------------
-- 2. VERIFICAR POLÍTICAS EXISTENTES
-- ---------------------------------------------------------------
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ---------------------------------------------------------------
-- 3. HABILITAR RLS EM TODAS AS TABELAS (se ainda não estiver)
-- ---------------------------------------------------------------
ALTER TABLE ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_fuel ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_catalog ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- 4. POLÍTICAS — ledger_transactions
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own transactions" ON ledger_transactions;
CREATE POLICY "Users can manage own transactions"
ON ledger_transactions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 5. POLÍTICAS — fixed_expenses
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own fixed expenses" ON fixed_expenses;
CREATE POLICY "Users can manage own fixed expenses"
ON fixed_expenses FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 6. POLÍTICAS — recurring_bills
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own recurring bills" ON recurring_bills;
CREATE POLICY "Users can manage own recurring bills"
ON recurring_bills FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 7. POLÍTICAS — credit_cards
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own credit cards" ON credit_cards;
CREATE POLICY "Users can manage own credit cards"
ON credit_cards FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 8. POLÍTICAS — credit_transactions
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own credit transactions" ON credit_transactions;
CREATE POLICY "Users can manage own credit transactions"
ON credit_transactions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 9. POLÍTICAS — car_fuel
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own fuel records" ON car_fuel;
CREATE POLICY "Users can manage own fuel records"
ON car_fuel FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 10. POLÍTICAS — car_maintenance
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own maintenance records" ON car_maintenance;
CREATE POLICY "Users can manage own maintenance records"
ON car_maintenance FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 11. POLÍTICAS — shopping_lists
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own shopping lists" ON shopping_lists;
CREATE POLICY "Users can manage own shopping lists"
ON shopping_lists FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 12. POLÍTICAS — shopping_items (via lista)
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage items in own lists" ON shopping_items;
CREATE POLICY "Users can manage items in own lists"
ON shopping_items FOR ALL
USING (
    list_id IN (
        SELECT id FROM shopping_lists WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    list_id IN (
        SELECT id FROM shopping_lists WHERE user_id = auth.uid()
    )
);

-- ---------------------------------------------------------------
-- 13. POLÍTICAS — monthly_goals
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own monthly goals" ON monthly_goals;
CREATE POLICY "Users can manage own monthly goals"
ON monthly_goals FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 14. POLÍTICAS — product_catalog (compartilhado — todos leem, mas só owner edita)
-- Se preferir que o catálogo seja por usuário, adicione user_id à tabela.
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read product catalog" ON product_catalog;
CREATE POLICY "Anyone can read product catalog"
ON product_catalog FOR SELECT
USING (true);

-- Opcional: Permitir que usuários autenticados insiram no catálogo
DROP POLICY IF EXISTS "Authenticated users can insert catalog" ON product_catalog;
CREATE POLICY "Authenticated users can insert catalog"
ON product_catalog FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- ---------------------------------------------------------------
-- 15. VERIFICAÇÃO FINAL — confirmar que todas as políticas existem
-- ---------------------------------------------------------------
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
