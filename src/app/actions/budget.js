'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentPeriod } from "./period";

export async function setPeriodBudget(amount, periodId) {
    if (!periodId) {
        const currentPeriod = await getCurrentPeriod();
        periodId = currentPeriod.id;
    }

    try {
        const budget = await prisma.monthlyBudget.upsert({
            where: {
                periodId: parseInt(periodId)
            },
            update: {
                amount: parseInt(amount)
            },
            create: {
                periodId: parseInt(periodId),
                amount: parseInt(amount)
            }
        });

        revalidatePath('/');
        return { success: true, data: budget };
    } catch (error) {
        console.error("Error setting budget:", error);
        return { success: false, error: error.message };
    }
}

export async function getPeriodBudget(periodId) {
    if (!periodId) {
        const currentPeriod = await getCurrentPeriod();
        periodId = currentPeriod.id;
    }

    const budget = await prisma.monthlyBudget.findUnique({
        where: {
            periodId: parseInt(periodId)
        }
    });

    return budget ? budget.amount : 0;
}
