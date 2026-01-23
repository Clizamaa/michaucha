'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentPeriod } from "./period";

export async function getFixedExpenses(periodId) {
    if (!periodId) {
        const currentPeriod = await getCurrentPeriod();
        periodId = currentPeriod.id;
    }

    const expenses = await prisma.fixedExpense.findMany({
        orderBy: { id: 'asc' }
    });

    const payments = await prisma.fixedExpensePayment.findMany({
        where: {
            periodId: parseInt(periodId)
        }
    });

    // Fusionar gastos con su estado de pago
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
    // Verificar si el registro de pago existe
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
    const expense = await prisma.fixedExpense.findFirst({
        where: { name: name }
    });

    if (!expense) {
        return { success: false, error: `Gasto no encontrado: ${name}` };
    }

    // Si no se provee periodId, buscar el actual
    if (!periodId) {
        const currentPeriod = await getCurrentPeriod();
        periodId = currentPeriod.id;
    }

    return await toggleFixedExpensePayment(expense.id, periodId, isPaid);
}
