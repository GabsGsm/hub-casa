// ── Ciclo ─────────────────────────────────────────────────────────────────────
export type Cycle = {
    id: number;
    name: string;
    expected_amount: number;
    paid: number;
    pending: number;
    committed: number;
};

// ── Tipos de registro (discriminated union) ──────────────────────────────────
export type TipoRegistro = 'gasto' | 'ganho' | 'parcela';

// Campos compartilhados por todos os lançamentos
type LancamentoBase = {
    id: number;
    tipo_registro: TipoRegistro;
    titulo: string;
    valor: number;
    status: 'aberto' | 'pago' | 'impossibilitado';
    vencimento_resolvido: string; // data usada para ordenação/exibição
    observacoes: string | null;
    categoria: { id: number; name: string; color: string | null } | null;
};

export type LancamentoGasto = LancamentoBase & {
    tipo_registro: 'gasto';
    vencimento: string | null;
    recorrente: boolean;
    dia_recorrencia: number | null;
    ciclo: { id: number; name: string } | null;
    responsaveis: { id: number; name: string }[];
};

export type LancamentoGanho = LancamentoBase & {
    tipo_registro: 'ganho';
    data_recebimento: string | null;
};

export type LancamentoParcela = LancamentoBase & {
    tipo_registro: 'parcela';
    parcelamento_id: number;
    numero_parcela: number;
    total_parcelas: number;
    vencimento: string;
    ciclo: { id: number; name: string } | null;
    responsaveis: { id: number; name: string }[];
};

export type Lancamento = LancamentoGasto | LancamentoGanho | LancamentoParcela;

// ── Resumo mensal (calculado no backend) ─────────────────────────────────────
export type ResumoMensal = {
    total_receitas: number;
    total_despesas: number;
    saldo: number;
};

// ── Props da página ──────────────────────────────────────────────────────────
export type FinanceiroProps = {
    house: { id: number; name: string };
    cycles: Cycle[];
    lancamentos: Lancamento[];
    resumo: ResumoMensal;
    categories: { id: number; name: string; color: string | null }[];
    members: { id: number; name: string }[];
    year: number;
    month: number; // 1-indexed
};

// ── Filtros ──────────────────────────────────────────────────────────────────
export type TxFilter = 'todos' | 'pago' | 'pendente' | 'recorrente' | 'parcela';
