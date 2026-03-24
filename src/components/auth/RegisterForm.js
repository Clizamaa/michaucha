'use client';

import { useActionState, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { registerUser } from '@/app/actions/auth-actions';
import Toast from '@/components/shared/Toast';

const initialState = null;

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerUser, initialState);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (state?.error) setToast(state.error);
  }, [state]);

  const closeToast = useCallback(() => setToast(null), []);

  return (
    <>
      <Toast message={toast} onClose={closeToast} />

      <form action={formAction} className="space-y-4">
        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-2">
            Nombre <span className="text-slate-600 normal-case">(opcional)</span>
          </label>
          <input
            type="text"
            name="name"
            placeholder="Tu nombre"
            className="w-full bg-[#151621] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
          />
        </div>

        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder="tu@email.com"
            className="w-full bg-[#151621] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
          />
        </div>

        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-2">
            Contraseña
          </label>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            placeholder="Mínimo 8 caracteres"
            className="w-full bg-[#151621] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full mt-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0"
        >
          {pending ? 'Creando cuenta…' : 'Crear Cuenta'}
        </button>
      </form>

      <p className="text-slate-500 text-sm text-center mt-6">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
          Iniciar sesión
        </Link>
      </p>
    </>
  );
}
