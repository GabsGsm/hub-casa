// ── Valor por membro ──────────────────────────────────────────────────────────
export type MembroValor = {
    user_id: number;
    user_name: string | null;
    user_color: string | null;
    valor: number;
    status: 'pendente' | 'pago' | 'impossibilitado';
    ciclo_id: number | null;
};

// ── Ciclo ─────────────────────────────────────────────────────────────────────
export type Cycle = {
    id: number;
    name: string;
    expected_amount: number;
    paid: number;
    pending: number;
    committed: number;
    user_id?: number | null;
    user_color?: string | null;
    user_name?: string | null;
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
    responsaveis: { id: number; name: string; color: string | null }[];
    membros_valor: MembroValor[];
    sem_responsavel: boolean;
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
    responsaveis: { id: number; name: string; color: string | null }[];
    membros_valor: MembroValor[];
    sem_responsavel: boolean;
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
    members: { id: number; name: string; color: string | null }[];
    year: number;
    month: number; // 1-indexed
    visao: 'casa' | 'individual';
};

// ── Filtros ──────────────────────────────────────────────────────────────────
export type TxFilter = 'todos' | 'pago' | 'pendente' | 'recorrente' | 'parcela';
