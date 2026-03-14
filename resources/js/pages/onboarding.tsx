import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type OnboardingProps = {
    user: {
        name: string;
        email: string;
    };
};

export default function Onboarding({ user }: OnboardingProps) {
    const form = useForm({
        name: '',
        description: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/casas');
    }

    return (
        <AuthLayout
            title={`Olá, ${user.name}`}
            description="Vamos criar sua casa para começar a organizar tudo."
        >
            <Head title="Criar casa" />
            <form onSubmit={submit} className="flex flex-col gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="name">Nome da casa</Label>
                    <Input
                        id="name"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        placeholder="Casa dos Jardins"
                    />
                    <InputError message={form.errors.name} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                        id="description"
                        value={form.data.description}
                        onChange={(e) =>
                            form.setData('description', e.target.value)
                        }
                        placeholder="Apartamento 302"
                    />
                    <InputError message={form.errors.description} />
                </div>
                <Button type="submit" disabled={form.processing}>
                    Criar casa
                </Button>
            </form>
        </AuthLayout>
    );
}
