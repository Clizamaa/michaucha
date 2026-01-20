'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function setMonthlyBudget(amount) {
    const today = new Date();
    const month = today.getMonth() + 1; // 1-12
    const year = today.getFullYear();

    try {
        const budget = await prisma.monthlyBudget.upsert({
            where: {
                month_year: {
                    month,
                    year
                }
            },
            update: {
                amount: parseInt(amount)
            },
            create: {
                month,
                year,
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

export async function getMonthlyBudget() {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    const budget = await prisma.monthlyBudget.findUnique({
        where: {
            month_year: {
                month,
                year
            }
        }
    });

    return budget ? budget.amount : 0;
}
