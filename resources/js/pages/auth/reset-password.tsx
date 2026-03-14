import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { update } from '@/routes/password';

export default function ResetPassword({ token, email }: { token: string; email: string }) {
    return (
        <AuthLayout title="Redefinir senha" description="Digite sua nova senha abaixo">
            <Head title="Redefinir senha" />
            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
                className="flex flex-col gap-4"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-sm font-medium text-[#3D3C3A]">E-mail</Label>
                            <Input type="email" name="email" autoComplete="email" value={email} readOnly className="opacity-60" />
                            <InputError message={errors.email} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-sm font-medium text-[#3D3C3A]">Nova senha</Label>
                            <PasswordInput name="password" autoComplete="new-password" autoFocus placeholder="Mínimo 8 caracteres" />
                            <InputError message={errors.password} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-sm font-medium text-[#3D3C3A]">Confirmar nova senha</Label>
                            <PasswordInput name="password_confirmation" autoComplete="new-password" placeholder="Repita a nova senha" />
                            <InputError message={errors.password_confirmation} />
                        </div>
                        <Button type="submit" className="mt-1 w-full" disabled={processing}>
                            {processing && <Spinner />}
                            Redefinir senha
                        </Button>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
