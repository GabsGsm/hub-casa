import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { EventFormData } from '../types';

type EventFormFieldsProps = {
    data: EventFormData;
    errors?: Partial<Record<keyof EventFormData, string>>;
    setData: (key: keyof EventFormData, value: string) => void;
};

export function EventFormFields({ data, errors, setData }: EventFormFieldsProps) {
    return (
        <>
            <div className="grid gap-2">
                <Label>Título</Label>
                <Input
                    autoFocus
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    placeholder="Ex: Consulta médica"
                />
                <InputError message={errors?.title} />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label>Data</Label>
                    <Input
                        type="date"
                        value={data.date}
                        onChange={(e) => setData('date', e.target.value)}
                    />
                    <InputError message={errors?.date} />
                </div>
                <div className="grid gap-2">
                    <Label>Horário</Label>
                    <Input
                        type="time"
                        value={data.time}
                        onChange={(e) => setData('time', e.target.value)}
                    />
                </div>
            </div>
            <div className="grid gap-2">
                <Label>Descrição (opcional)</Label>
                <Textarea
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Detalhes do compromisso..."
                    rows={3}
                />
            </div>
        </>
    );
}
