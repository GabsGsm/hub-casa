import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthLayout description="Informe seu e-mail para redefinir a senha">
            <Head title="Esqueci minha senha" />
            {status && (
                <div className="mb-4 rounded-[8px] bg-[#F0FDF4] px-4 py-3 text-center text-sm font-medium text-[#15803D]">
                    {status}
                </div>
            )}
            <Form {...email.form()} className="flex flex-col gap-5">
                {({ processing, errors }) => (
                    <>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-sm font-medium text-[#3D3C3A]">E-mail</Label>
                            <Input type="email" name="email" autoComplete="off" autoFocus placeholder="seu@email.com" />
                            <InputError message={errors.email} />
                        </div>
                        <Button className="w-full" disabled={processing}>
                            {processing && <Spinner />}
                            Enviar link de redefinição
                        </Button>
                    </>
                )}
            </Form>
            <p className="mt-5 text-center text-sm text-[#9B9A96]">
                Lembrou a senha?{' '}
                <TextLink href={login()}>Entrar</TextLink>
            </p>
        </AuthLayout>
    );
}
