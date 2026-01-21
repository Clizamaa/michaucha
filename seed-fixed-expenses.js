const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const expenses = [
    { name: 'Arriendo', amount: 402420 },
    { name: 'Almuerzos', amount: 100000 },
    { name: 'Locomocion', amount: 21200 },
    { name: 'Luz', amount: 0 },
    { name: 'Celular', amount: 10990 },
    { name: 'Internet', amount: 9990 },
    { name: 'Tio Felix', amount: 80000 },
    { name: 'Seguro Auto', amount: 0 },
];

async function main() {
    console.log('Seeding fixed expenses...');
    for (const expense of expenses) {
        await prisma.fixedExpense.upsert({
            where: { id: 0 }, // Hacky way to force create if not matching unique, but name isn't unique in schema.
            // Better to check if exists by name or just create.
            // Since schema doesn't have unique name, upsert is tricky without a unique field.
            // Let's change to createMany or check first.
            update: {},
            create: expense,
        }).catch(async () => {
            // Fallback if upsert fails or logic change
            // Actually, let's just findFirst and create if missing
            const existing = await prisma.fixedExpense.findFirst({ where: { name: expense.name } });
            if (!existing) {
                await prisma.fixedExpense.create({ data: expense });
                console.log(`Created ${expense.name}`);
            } else {
                console.log(`Skipped ${expense.name}`);
            }
        });
    }

    // Re-write main properly to avoid that ugly catch/upsert logic
}

async function mainCorrect() {
    console.log('Seeding fixed expenses...');
    for (const expense of expenses) {
        const existing = await prisma.fixedExpense.findFirst({
            where: { name: expense.name }
        });

        if (!existing) {
            await prisma.fixedExpense.create({ data: expense });
            console.log(`✅ Created: ${expense.name}`);
        } else {
            console.log(`ℹ️ Already exists: ${expense.name}`);
        }
    }
}

mainCorrect()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
