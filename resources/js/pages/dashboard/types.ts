export type DashboardProps = {
    house: { id: number; name: string };
    stats: {
        activeCycle: {
            id: number;
            name: string;
            expected_amount: number;
            paid: number;
            pending: number;
            committed: number;
        } | null;
        payable: { amount: number; count: number };
        tasks: { done: number; total: number };
        dispensa: { alerts: number };
    };
    cycles: {
        id: number;
        name: string;
        expected_amount: number;
        paid: number;
        pending: number;
        committed: number;
    }[];
    transactions: {
        id: number;
        title: string;
        amount: number;
        type: 'gasto' | 'ganho' | 'parcela';
        effective_date: string;
        category: { name: string; color: string | null } | null;
    }[];
    tasksToday: {
        id: number;
        title: string;
        completed: boolean;
        color: string | null;
        assignees: { id: number; name: string }[];
    }[];
    todayLabel: string;
    upcomingEvents: {
        id: number;
        title: string;
        date: string;
        time: string;
    }[];
};