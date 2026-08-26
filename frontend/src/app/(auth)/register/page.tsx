'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';

const registerSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const registerAction = useAuthStore((state) => state.register);
  const router = useRouter();
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerAction(data.name, data.email, data.password);
      toast.success('Cadastro realizado com sucesso!');
      router.push('/boards');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Erro ao cadastrar usuário'));
    }
  };

  return (
    <div>
      <h2 className="text-center text-3xl font-extrabold text-slate-900 mb-6">Crie sua conta</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Nome</label>
          <input
            {...register('name')}
            name="name"
            type="text"
            className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            {...register('email')}
            name="email"
            type="email"
            className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Senha</label>
          <input
            {...register('password')}
            name="password"
            type="password"
            className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm"
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Confirmar Senha</label>
          <input
            {...register('confirmPassword')}
            name="confirmPassword"
            type="password"
            className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm"
          />
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
        </div>
        <Button type="submit" className="w-full mt-6" isLoading={isSubmitting}>
          Registrar
        </Button>
      </form>
      <div className="mt-4 text-center text-sm">
        <span className="text-slate-600">Já tem uma conta? </span>
        <Link href="/login" className="font-medium text-violet-600 hover:text-violet-500">
          Entrar
        </Link>
      </div>
    </div>
  );
}
