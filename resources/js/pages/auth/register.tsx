import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
//import { store } from '@/routes/register';

export default function Register() {
    return (
        <AuthLayout description="Crie sua conta para começar">
            <Head title="Criar conta" />
            <Form
                //{...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-sm font-medium text-[#3D3C3A]">Nome completo</Label>
                                <Input type="text" required autoFocus tabIndex={1} autoComplete="name" name="name" placeholder="Seu nome" />
                                <InputError message={errors.name} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-sm font-medium text-[#3D3C3A]">E-mail</Label>
                                <Input type="email" required tabIndex={2} autoComplete="email" name="email" placeholder="seu@email.com" />
                                <InputError message={errors.email} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-sm font-medium text-[#3D3C3A]">Senha</Label>
                                <PasswordInput required tabIndex={3} autoComplete="new-password" name="password" placeholder="Mínimo 8 caracteres" />
                                <InputError message={errors.password} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-sm font-medium text-[#3D3C3A]">Confirmar senha</Label>
                                <PasswordInput required tabIndex={4} autoComplete="new-password" name="password_confirmation" placeholder="Repita a senha" />
                                <InputError message={errors.password_confirmation} />
                            </div>
                            <Button type="submit" className="mt-1 w-full" tabIndex={5}>
                                {processing && <Spinner />}
                                Criar conta
                            </Button>
                        </div>
                        <div className="text-center text-sm text-[#9B9A96]">
                            Já tem uma conta?{' '}
                            <TextLink href={login()} tabIndex={6}>Entrar</TextLink>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
