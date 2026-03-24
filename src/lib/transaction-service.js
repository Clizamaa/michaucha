import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const TransactionService = {
    /**
     * Crea una nueva transacción con lógica de resolución de categoría
     * @param {Object} data - { amount, category, date, description, paymentMethod, userId }
     */
    async createTransaction(data) {
        try {
            if (!data.amount) throw new Error("Amount is required");
            if (!data.userId) throw new Error("userId is required");

            let finalCategoryId = data.categoryId;

            // Compatibilidad hacia atrás (por si se envía { category: "string" })
            if (!finalCategoryId) {
                const categoryName = data.category || "Gastos varios";
                let categoryObj = await prisma.category.findUnique({
                    where: { name_userId: { name: categoryName, userId: data.userId } }
                });

                if (!categoryObj) {
                    categoryObj = await prisma.category.findUnique({
                        where: { name_userId: { name: "Gastos varios", userId: data.userId } }
                    });
                    
                    if (!categoryObj) {
                        categoryObj = await prisma.category.create({
                            data: { name: categoryName, userId: data.userId }
                        });
                    }
                }

                if (!categoryObj) throw new Error("Category resolution failed.");
                finalCategoryId = categoryObj.id;
            }

            // 2. Crear Transacción
            const transaction = await prisma.transaction.create({
                data: {
                    amount: data.amount,
                    description: data.description,
                    date: data.date ? new Date(data.date) : new Date(),
                    categoryId: finalCategoryId,
                    paymentMethod: data.paymentMethod || "CASH",
                },
                include: { category: true }
            });

            // 3. Revalidar Rutas
            revalidatePath('/');
            revalidatePath('/gastos');
            revalidatePath('/visa');

            return { success: true, data: transaction };

        } catch (error) {
            console.error("[TransactionService] Error:", error);
            return { success: false, error: error.message };
        }
    },

    async deleteTransaction(id) {
        try {
            await prisma.transaction.delete({ where: { id } });

            revalidatePath('/');
            revalidatePath('/gastos');
            revalidatePath('/visa');

            return { success: true };
        } catch (error) {
            console.error("[TransactionService] Delete Error:", error);
            return { success: false, error: error.message };
        }
    }
};
