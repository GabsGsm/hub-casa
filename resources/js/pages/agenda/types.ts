export type AgendaEvent = {
    id: number;
    title: string;
    description: string | null;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
};

export type AgendaProps = {
    events: AgendaEvent[];
};

export type View = 'monthly' | 'weekly' | 'list';

export type EventFormData = {
    title: string;
    description: string;
    date: string;
    time: string;
};
