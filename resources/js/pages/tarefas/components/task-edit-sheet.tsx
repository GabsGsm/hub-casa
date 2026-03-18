import InputError from '@/components/input-error';
import { AssigneeSelect } from '@/components/hub/assignee-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { COLOR_PRESETS, DAY_LABELS } from '../constants';

type EditData = {
    title: string;
    day_of_week: number;
    color: string;
    description: string;
};

type TaskEditSheetProps = {
    task: { id: number } | null;
    members: { id: number; name: string }[];
    data: EditData;
    errors: Partial<Record<keyof EditData, string>>;
    processing: boolean;
    assigneeIds: number[];
    setData: (key: string, value: string | number) => void;
    onAssigneesChange: (ids: number[]) => void;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    onDelete: (id: number) => void;
};

export function TaskEditSheet({
    task,
    members,
    data,
    errors,
    processing,
    assigneeIds,
    setData,
    onAssigneesChange,
    onClose,
    onSubmit,
    onDelete,
}: TaskEditSheetProps) {
    return (
        <Sheet open={!!task} onOpenChange={(o) => !o && onClose()}>
            <SheetContent side="right" className="w-full sm:max-w-sm">
                <SheetHeader>
                    <SheetTitle>Editar tarefa</SheetTitle>
                </SheetHeader>
                <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-2">
                    <div className="grid gap-2">
                        <Label>Título</Label>
                        <Input
                            autoFocus
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                        />
                        <InputError message={errors.title} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Dia</Label>
                        <select
                            className="h-9 rounded-md border border-[#E4E3E0] bg-white px-3 text-sm text-[#1A1917]"
                            value={data.day_of_week}
                            onChange={(e) => setData('day_of_week', Number(e.target.value))}
                        >
                            {DAY_LABELS.map((label, i) => (
                                <option key={label} value={i}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Cor</Label>
                        <div className="flex items-center gap-2">
                            {COLOR_PRESETS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setData('color', c)}
                                    className="size-6 rounded-full border-2 transition-transform hover:scale-110"
                                    style={{
                                        backgroundColor: c,
                                        borderColor: data.color === c ? c : 'transparent',
                                        outline: data.color === c ? `2px solid ${c}` : 'none',
                                        outlineOffset: '2px',
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Descrição (opcional)</Label>
                        <Textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Detalhes da tarefa..."
                            rows={3}
                        />
                        <InputError message={errors.description} />
                    </div>
                    {members.length > 0 && (
                        <div className="grid gap-2">
                            <Label>Responsáveis</Label>
                            <AssigneeSelect
                                members={members}
                                selected={assigneeIds}
                                onChange={onAssigneesChange}
                                accentColor="#7C3AED"
                            />
                        </div>
                    )}
                    {task && (
                        <div className="mt-2 border-t border-[#F0EFED] pt-4">
                            <button
                                type="button"
                                onClick={() => { onDelete(task.id); onClose(); }}
                                className="text-sm text-[#DC2626] hover:underline"
                            >
                                Remover tarefa
                            </button>
                        </div>
                    )}
                    <SheetFooter>
                        <Button
                            type="submit"
                            disabled={!data.title.trim() || processing}
                        >
                            Salvar alterações
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
