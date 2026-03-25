'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getCurrentPeriod } from "./period";

async function getSessionUserId() {
    const session = await auth();
    if (!session?.user) redirect('/api/auth/signout');
    
    // Si la sesión antigua no tiene ID pero sí email, buscar al usuario (fix 500 error en prod)
    if (!session.user.id && session.user.email) {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (user) return user.id;
    }
    
    if (!session.user.id) redirect('/api/auth/signout');
    return parseInt(session.user.id);
}

export async function getFixedExpenses(periodId) {
    const userId = await getSessionUserId();

    if (!periodId) {
        const currentPeriod = await getCurrentPeriod();
        periodId = currentPeriod.id;
    }

    const expenses = await prisma.fixedExpense.findMany({
        where: { userId },
        orderBy: { id: 'asc' }
    });

    const payments = await prisma.fixedExpensePayment.findMany({
        where: { periodId: parseInt(periodId) }
    });

    return expenses.map(expense => {
        const payment = payments.find(p => p.fixedExpenseId === expense.id);
        return {
            ...expense,
            isPaid: payment ? payment.isPaid : false,
            paymentId: payment ? payment.id : null
        };
    });
}

export async function toggleFixedExpensePayment(expenseId, periodId, isPaid) {
    const existingPayment = await prisma.fixedExpensePayment.findUnique({
        where: {
            fixedExpenseId_periodId: {
                fixedExpenseId: parseInt(expenseId),
                periodId: parseInt(periodId)
            }
        }
    });

    if (existingPayment) {
        await prisma.fixedExpensePayment.update({
            where: { id: existingPayment.id },
            data: { isPaid, paidAt: isPaid ? new Date() : null }
        });
    } else {
        await prisma.fixedExpensePayment.create({
            data: {
                fixedExpenseId: parseInt(expenseId),
                periodId: parseInt(periodId),
                isPaid,
                paidAt: isPaid ? new Date() : null
            }
        });
    }

    revalidatePath('/');
    return { success: true };
}

export async function updateFixedExpenseAmount(id, amount) {
    await prisma.fixedExpense.update({
        where: { id: parseInt(id) },
        data: { amount: parseInt(amount) }
    });

    revalidatePath('/');
    return { success: true };
}

export async function toggleFixedExpenseByName(name, periodId, isPaid) {
    const userId = await getSessionUserId();

    const expense = await prisma.fixedExpense.findFirst({
        where: { name, userId }
    });

    if (!expense) {
        return { success: false, error: `Gasto no encontrado: ${name}` };
    }

    if (!periodId) {
        const currentPeriod = await getCurrentPeriod();
        periodId = currentPeriod.id;
    }

    return await toggleFixedExpensePayment(expense.id, periodId, isPaid);
}

export async function createFixedExpense(prevState, formData) {
    try {
        const userId = await getSessionUserId();
        const rawName = formData.get('name')?.toString().trim();
        const rawAmount = formData.get('amount')?.toString();

        if (!rawName || !rawAmount) {
            return { error: 'El nombre y monto son requeridos.' };
        }

        const amount = parseInt(rawAmount.replace(/\D/g, ''));
        if (isNaN(amount) || amount <= 0) {
            return { error: 'El monto no es válido.' };
        }

        const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);

        const existing = await prisma.fixedExpense.findFirst({
            where: {
                userId,
                name: { equals: name }
            }
        });

        if (existing) {
            return { error: 'Ya tienes un gasto fijo con ese nombre.' };
        }

        await prisma.fixedExpense.create({
            data: {
                name,
                amount,
                userId
            }
        });

        revalidatePath('/');
        return { success: true, message: 'Gasto fijo creado con éxito.' };
    } catch (error) {
        console.error('Error creating fixed expense:', error);
        return { error: 'Ocurrió un error al crear el gasto fijo.' };
    }
}
