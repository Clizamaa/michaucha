'use client';

import { useState, useCallback, useActionState, useEffect } from 'react';
import { Plus, X, ListPlus, CreditCard, Tag } from 'lucide-react';
import { createTransaction } from '@/app/actions/transaction';
import { createFixedExpense } from '@/app/actions/fixed-expense';
import { createCategory, getCategories } from '@/app/actions/category';
import Toast from '@/components/shared/Toast';

export default function AddExpenseFAB() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('varios'); // varios | fijas | categorias
    const [categories, setCategories] = useState([]);
    const [toast, setToast] = useState(null);

    // Load categories when modal opens
    useEffect(() => {
        if (isOpen && activeTab === 'varios') {
            getCategories().then(setCategories);
        }
    }, [isOpen, activeTab]);

    const closeToast = useCallback(() => setToast(null), []);

    const handleClose = () => {
        setIsOpen(false);
        setActiveTab('varios');
    };

    return (
        <>
            <Toast message={toast} onClose={closeToast} />

            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-pink-500 to-orange-400 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(236,72,153,0.4)] hover:scale-110 active:scale-95 transition-all z-40 group"
            >
                <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-[#1f2029] border border-white/10 rounded-3xl shadow-2xl shadow-black overflow-hidden animate-in slide-in-from-bottom-8 duration-300 relative">
                        
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-white/5">
                            <h2 className="text-xl font-bold text-white">Registrar</h2>
                            <button onClick={handleClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex p-2 bg-black/20 m-6 rounded-2xl gap-1">
                            <TabButton active={activeTab === 'varios'} onClick={() => setActiveTab('varios')} icon={<CreditCard size={14}/>}>Gasto Vario</TabButton>
                            <TabButton active={activeTab === 'fijas'} onClick={() => setActiveTab('fijas')} icon={<ListPlus size={14}/>}>Gasto Fijo</TabButton>
                            <TabButton active={activeTab === 'categorias'} onClick={() => setActiveTab('categorias')} icon={<Tag size={14}/>}>Categoría</TabButton>
                        </div>

                        {/* Forms */}
                        <div className="px-6 pb-6">
                            {activeTab === 'varios' && (
                                <TransactionForm 
                                    categories={categories} 
                                    onSuccess={() => { setIsOpen(false); setToast('Transacción registrada'); }} 
                                    onError={setToast} 
                                />
                            )}
                            {activeTab === 'fijas' && (
                                <FixedExpenseForm 
                                    onSuccess={() => { setIsOpen(false); setToast('Gasto fijo creado'); }} 
                                    onError={setToast} 
                                />
                            )}
                            {activeTab === 'categorias' && (
                                <CategoryForm 
                                    onSuccess={() => { setActiveTab('varios'); setToast('Categoría creada'); }} 
                                    onError={setToast} 
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function TabButton({ children, active, onClick, icon }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${
                active ? 'bg-white/10 text-white shadow-md' : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
        >
            {icon} {children}
        </button>
    );
}

function TransactionForm({ categories, onSuccess, onError }) {
    const [actionState, formAction, pending] = useActionState(async (prev, formData) => {
        // createTransaction doesn't follow (prev, formData) exactly, it takes a data object. Wait, let's look at what createTransaction expects.
        // It expects { amount, description, categoryId, paymentMethod }.
        try {
            const amount = parseInt(formData.get('amount'));
            const categoryId = parseInt(formData.get('categoryId'));
            const description = formData.get('description')?.toString();
            const paymentMethod = formData.get('paymentMethod')?.toString();

            if (!amount || !categoryId) return { error: 'Monto y Categoría son requeridos' };

            await createTransaction({ amount, categoryId, description: description || null, paymentMethod });
            onSuccess();
            return { success: true };
        } catch (e) {
            console.error(e);
            return { error: 'Ocurrió un error al registrar.' };
        }
    }, null);

    useEffect(() => {
        if (actionState?.error) onError(actionState.error);
    }, [actionState, onError]);

    return (
        <form action={formAction} className="space-y-4">
            <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-2">Monto</label>
                <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-500 font-bold">$</span>
                    <input type="number" name="amount" required className="w-full bg-[#151621] border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 outline-none" placeholder="0" />
                </div>
            </div>

            <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-2">Categoría</label>
                <select name="categoryId" required className="w-full bg-[#151621] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-pink-500/50 focus:ring-1 outline-none appearance-none">
                    <option value="">Selecciona una categoría...</option>
                    {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-2">Descripción (Opcional)</label>
                <input type="text" name="description" placeholder="Ej. Sushi" className="w-full bg-[#151621] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 outline-none" />
            </div>

            <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-2">Método de Pago</label>
                <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center justify-center p-3 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 has-[:checked]:bg-blue-500/20 has-[:checked]:border-blue-500/50 has-[:checked]:text-blue-400 text-slate-400 transition-colors">
                        <input type="radio" name="paymentMethod" value="DEBIT" className="hidden" defaultChecked />
                        <span className="text-sm font-bold">Débito / Cash</span>
                    </label>
                    <label className="flex items-center justify-center p-3 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 has-[:checked]:bg-orange-500/20 has-[:checked]:border-orange-500/50 has-[:checked]:text-orange-400 text-slate-400 transition-colors">
                        <input type="radio" name="paymentMethod" value="VISA" className="hidden" />
                        <span className="text-sm font-bold">Tarjeta VISA</span>
                    </label>
                </div>
            </div>

            <button type="submit" disabled={pending} className="w-full mt-4 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold py-3 rounded-xl disabled:opacity-50">
                {pending ? 'Registrando...' : 'Registrar Gasto'}
            </button>
        </form>
    );
}

function FixedExpenseForm({ onSuccess, onError }) {
    const [actionState, formAction, pending] = useActionState(createFixedExpense, null);

    useEffect(() => {
        if (actionState?.error) onError(actionState.error);
        else if (actionState?.success) onSuccess();
    }, [actionState, onError, onSuccess]);

    return (
        <form action={formAction} className="space-y-4">
            <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-2">Nombre del Gasto Fijo</label>
                <input type="text" name="name" required placeholder="Ej. Netflix" className="w-full bg-[#151621] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-pink-500/50 outline-none" />
            </div>

            <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-2">Monto Mensual</label>
                <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-500 font-bold">$</span>
                    <input type="number" name="amount" required className="w-full bg-[#151621] border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:border-pink-500/50 outline-none" placeholder="0" />
                </div>
            </div>

            <button type="submit" disabled={pending} className="w-full mt-4 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold py-3 rounded-xl disabled:opacity-50">
                {pending ? 'Guardando...' : 'Crear Gasto Fijo'}
            </button>
        </form>
    );
}

function CategoryForm({ onSuccess, onError }) {
    const [actionState, formAction, pending] = useActionState(createCategory, null);

    useEffect(() => {
        if (actionState?.error) onError(actionState.error);
        else if (actionState?.success) onSuccess();
    }, [actionState, onError, onSuccess]);

    return (
        <form action={formAction} className="space-y-4">
            <div>
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-2">Nombre de la Categoría</label>
                <input type="text" name="name" required placeholder="Ej. Mascotas" className="w-full bg-[#151621] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-pink-500/50 outline-none" />
            </div>

            <button type="submit" disabled={pending} className="w-full mt-4 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold py-3 rounded-xl disabled:opacity-50">
                {pending ? 'Creando...' : 'Crear Categoría'}
            </button>
        </form>
    );
}
