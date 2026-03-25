'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCurrentPeriod } from "./period";

async function getSessionUserId() {
    const session = await auth();
    if (!session?.user) redirect('/api/auth/signout');
    
    if (!session.user.id && session.user.email) {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (user) return user.id;
    }
    
    if (!session.user.id) redirect('/api/auth/signout');
    return parseInt(session.user.id);
}

export async function setPeriodBudget(amount, periodId) {
    const userId = await getSessionUserId();

    if (!periodId) {
        const currentPeriod = await getCurrentPeriod();
        periodId = currentPeriod.id;
    }

    // Ensure period belongs to this user
    const period = await prisma.period.findFirst({
        where: { id: parseInt(periodId), userId }
    });
    if (!period) return { success: false, error: 'Unauthorized' };

    try {
        const budget = await prisma.monthlyBudget.upsert({
            where: { periodId: parseInt(periodId) },
            update: { amount: parseInt(amount) },
            create: { periodId: parseInt(periodId), amount: parseInt(amount) }
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
        where: { periodId: parseInt(periodId) }
    });

    return budget ? budget.amount : 0;
}
