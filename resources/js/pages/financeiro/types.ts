export type Cycle = {
    id: number;
    name: string;
    expected_amount: number;
    paid: number;
    pending: number;
    committed: number;
};

export type Transaction = {
    id: number;
    title: string;
    amount: number;
    type: 'gasto' | 'ganho' | 'divida';
    status: 'aberto' | 'pago' | 'impossibilitado';
    created_at: string; // YYYY-MM-DD
    due_date: string | null;
    is_recurring: boolean;
    recurrence_day: number | null;
    installments_total:  number | null;
    installment_current: number;
    installment_amount:  number | null;
    notes: string | null;
    cycle: { id: number; name: string } | null;
    category: { id: number; name: string; color: string | null } | null;
    assignees: { id: number; name: string }[];
};

// Transação resolvida para um mês específico (retornada pelo backend)
export type ResolvedTransaction = Transaction & {
    resolved_date: string;       // due_date projetado para o mês alvo
    installment_num?: number;    // parcela atual (1-based), apenas para dívidas
};

export type PaginatedTransactions = {
    data: ResolvedTransaction[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

export type FinanceiroProps = {
    house: { id: number; name: string };
    cycles: Cycle[];
    transactions: ResolvedTransaction[];
    categories: { id: number; name: string; color: string | null }[];
    members: { id: number; name: string }[];
    year: number;
    month: number; // 1-indexed
    allTransactions?: PaginatedTransactions;
    filters?: Record<string, string>;
};

export type MainTab = 'visao-geral' | 'historico' | 'todos';
export type TxFilter = 'todos' | 'pago' | 'pendente' | 'recorrente' | 'divida';
