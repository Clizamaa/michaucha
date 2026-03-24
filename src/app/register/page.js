import RegisterForm from '@/components/auth/RegisterForm';
import Image from 'next/image';
import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

export const metadata = {
  title: 'Crear Cuenta | Michaucha',
  description: 'Crea tu cuenta de control de gastos.',
};

export default function RegisterPage() {
  return (
    <div
      className={`${spaceGrotesk.className} min-h-screen bg-[#0f1023] flex items-center justify-center relative overflow-hidden`}
    >
      {/* Background blurs */}
      <div className="fixed top-[-10%] right-[-5%] w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden mb-4 shadow-lg shadow-purple-500/30 mx-auto">
            <Image src="/logo.png" alt="Michaucha Logo" fill className="object-cover" />
          </div>
          <h1 className="text-white text-3xl font-bold">Registrarse</h1>
          <p className="text-slate-500 text-sm mt-1">Crea tu cuenta gratuita</p>
        </div>

        {/* Card */}
        <div className="bg-[#1f2029] border border-white/5 rounded-[2rem] p-8 shadow-2xl shadow-black/40">
          <h2 className="text-white text-xl font-bold mb-6">Nueva Cuenta</h2>

          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
