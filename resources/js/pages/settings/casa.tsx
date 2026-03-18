import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';
import { Crown, Trash2, UserCheck, UserX } from 'lucide-react';
import HouseSettingsController from '@/actions/App/Http/Controllers/Settings/HouseSettingsController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';

type House = {
    id: number;
    name: string;
    description: string | null;
};

type Member = {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user';
};

type Props = {
    house: House;
    members: Member[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Configurações da casa',
        href: '/settings/casa',
    },
];

export default function CasaSettings({ house, members }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configurações da casa" />

            <h1 className="sr-only">Configurações da casa</h1>

            <SettingsLayout>
                {/* Informações da casa */}
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Informações da casa"
                        description="Atualize o nome e a descrição da sua casa"
                    />

                    <Form
                        {...HouseSettingsController.update.form()}
                        options={{ preserveScroll: true }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nome da casa</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        className="mt-1 block w-full"
                                        defaultValue={house.name}
                                        required
                                        placeholder="Nome da casa"
                                    />
                                    <InputError className="mt-2" message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description">Descrição</Label>
                                    <Input
                                        id="description"
                                        name="description"
                                        className="mt-1 block w-full"
                                        defaultValue={house.description ?? ''}
                                        placeholder="Uma breve descrição (opcional)"
                                    />
                                    <InputError className="mt-2" message={errors.description} />
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button disabled={processing}>
                                        Salvar
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">Salvo</p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                {/* Membros da casa */}
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Membros da casa"
                        description="Gerencie os moradores e seus níveis de acesso"
                    />

                    <div className="space-y-3">
                        {members.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between rounded-lg border p-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium uppercase">
                                        {member.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="flex items-center gap-1.5 text-sm font-medium">
                                            {member.name}
                                            {member.role === 'admin' && (
                                                <Crown className="h-3.5 w-3.5 text-amber-500" />
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {member.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Promover / Rebaixar */}
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                title={
                                                    member.role === 'admin'
                                                        ? 'Tornar morador'
                                                        : 'Tornar administrador'
                                                }
                                            >
                                                {member.role === 'admin' ? (
                                                    <UserX className="h-4 w-4" />
                                                ) : (
                                                    <UserCheck className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogTitle>
                                                {member.role === 'admin'
                                                    ? 'Remover administrador'
                                                    : 'Promover a administrador'}
                                            </DialogTitle>
                                            <DialogDescription>
                                                {member.role === 'admin'
                                                    ? `${member.name} perderá os privilégios de administrador da casa.`
                                                    : `${member.name} passará a ter acesso de administrador da casa.`}
                                            </DialogDescription>

                                            <Form
                                                {...HouseSettingsController.updateMember.form(
                                                    member.id,
                                                )}
                                                options={{ preserveScroll: true }}
                                            >
                                                {({ processing }) => (
                                                    <>
                                                        <input
                                                            type="hidden"
                                                            name="role"
                                                            value={
                                                                member.role === 'admin'
                                                                    ? 'user'
                                                                    : 'admin'
                                                            }
                                                        />
                                                        <DialogFooter className="gap-2">
                                                            <DialogClose asChild>
                                                                <Button variant="secondary">
                                                                    Cancelar
                                                                </Button>
                                                            </DialogClose>
                                                            <Button
                                                                type="submit"
                                                                disabled={processing}
                                                                variant={
                                                                    member.role === 'admin'
                                                                        ? 'destructive'
                                                                        : 'default'
                                                                }
                                                            >
                                                                {member.role === 'admin'
                                                                    ? 'Remover admin'
                                                                    : 'Tornar admin'}
                                                            </Button>
                                                        </DialogFooter>
                                                    </>
                                                )}
                                            </Form>
                                        </DialogContent>
                                    </Dialog>

                                    {/* Remover membro */}
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                title="Remover da casa"
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogTitle>Remover membro</DialogTitle>
                                            <DialogDescription>
                                                {member.name} será removido da casa e perderá
                                                acesso a todos os dados. Esta ação não pode ser
                                                desfeita.
                                            </DialogDescription>

                                            <Form
                                                {...HouseSettingsController.removeMember.form(
                                                    member.id,
                                                )}
                                                options={{ preserveScroll: true }}
                                            >
                                                {({ processing }) => (
                                                    <DialogFooter className="gap-2">
                                                        <DialogClose asChild>
                                                            <Button variant="secondary">
                                                                Cancelar
                                                            </Button>
                                                        </DialogClose>
                                                        <Button
                                                            type="submit"
                                                            variant="destructive"
                                                            disabled={processing}
                                                        >
                                                            Remover membro
                                                        </Button>
                                                    </DialogFooter>
                                                )}
                                            </Form>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
