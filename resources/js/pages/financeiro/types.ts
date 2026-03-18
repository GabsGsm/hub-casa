export type Cycle = {
    id: number;
    name: string;
    day_of_month: number | null;
    expected_amount: number;
    paid: number;
    pending: number;
};

export type Transaction = {
    id: number;
    title: string;
    amount: number;
    type: string;       // 'gasto' | 'ganho' | 'divida'
    status: string;     // 'aberto' | 'pago' | 'impossibilitado'
    created_at: string; // YYYY-MM-DD
    due_date: string | null;
    recurrence: string | null;   // 'mensal' | null
    installments_count: number | null;
    cycle: { id: number; name: string; day_of_month: number | null } | null;
    category: { id: number; name: string; color: string | null } | null;
    assignees: { id: number; name: string }[];
};

// Transação "resolvida" para um mês específico
export type ResolvedTransaction = Transaction & {
    resolvedDate: string;        // due_date projetado para o mês alvo
    installmentNum?: number;     // parcela atual (1-based)
    installmentsTotal?: number;
};

export type MonthProjection = {
    year: number;
    month: number;
    label: string;
    phase: 'past' | 'current' | 'future';
    transactions: ResolvedTransaction[];
    totalExpected: number;
    totalPaid: number;
    totalPending: number;
};

export type FinanceiroProps = {
    house: { id: number; name: string };
    cycles: Cycle[];
    transactions: Transaction[];
    categories: { id: number; name: string; color: string | null }[];
    members: { id: number; name: string }[];
};

export type MainTab = 'visao-geral' | 'historico';
export type TxFilter = 'todos' | 'pago' | 'pendente' | 'recorrente' | 'divida';
