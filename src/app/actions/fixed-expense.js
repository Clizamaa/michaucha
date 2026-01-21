'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getFixedExpenses(month, year) {
    const expenses = await prisma.fixedExpense.findMany({
        orderBy: { id: 'asc' }
    });

    const payments = await prisma.fixedExpensePayment.findMany({
        where: {
            month: parseInt(month),
            year: parseInt(year)
        }
    });

    // Merge expenses with their payment status
    return expenses.map(expense => {
        const payment = payments.find(p => p.fixedExpenseId === expense.id);
        return {
            ...expense,
            isPaid: payment ? payment.isPaid : false,
            paymentId: payment ? payment.id : null
        };
    });
}

export async function toggleFixedExpensePayment(expenseId, month, year, isPaid) {
    // Check if payment record exists
    const existingPayment = await prisma.fixedExpensePayment.findUnique({
        where: {
            fixedExpenseId_month_year: {
                fixedExpenseId: parseInt(expenseId),
                month: parseInt(month),
                year: parseInt(year)
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
                month: parseInt(month),
                year: parseInt(year),
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
