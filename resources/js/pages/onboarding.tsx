import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';

export default function Onboarding({ user }: { user: { name: string; email: string } }) {
    const form = useForm({ name: '', description: '' });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/casas');
    }

    return (
        <AuthLayout description={`Olá, ${user.name.split(' ')[0]}! Configure sua casa.`}>
            <Head title="Criar casa" />
            <form onSubmit={submit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium text-[#3D3C3A]">Nome da casa</Label>
                    <Input
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        placeholder="Ex: Casa dos Jardins"
                        autoFocus
                    />
                    <InputError message={form.errors.name} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium text-[#3D3C3A]">
                        Descrição{' '}
                        <span className="font-normal text-[#9B9A96]">(opcional)</span>
                    </Label>
                    <Input
                        value={form.data.description}
                        onChange={(e) => form.setData('description', e.target.value)}
                        placeholder="Ex: Apartamento 302, Bloco B"
                    />
                    <InputError message={form.errors.description} />
                </div>
                <Button type="submit" className="mt-1 w-full" disabled={form.processing}>
                    {form.processing && <Spinner />}
                    Criar casa e entrar
                </Button>
            </form>
            <p className="mt-4 text-center text-xs text-[#9B9A96]">
                Você será o administrador e poderá convidar outras pessoas depois.
            </p>
        </AuthLayout>
    );
}
