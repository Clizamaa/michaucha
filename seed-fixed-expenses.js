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
            where: { id: 0 }, // Forma "sucia" de forzar creación si no coincide único, pero el nombre no es único en el esquema.
            // Mejor verificar si existe por nombre o simplemente crear.
            // Dado que el esquema no tiene nombre único, upsert es complicado sin un campo único.
            // Cambiemos a createMany o verificar primero.
            update: {},
            create: expense,
        }).catch(async () => {
            // Retroceder si falla upsert o cambia lógica
            // En realidad, solo busquemos primero y creemos si falta
            const existing = await prisma.fixedExpense.findFirst({ where: { name: expense.name } });
            if (!existing) {
                await prisma.fixedExpense.create({ data: expense });
                console.log(`Created ${expense.name}`);
            } else {
                console.log(`Skipped ${expense.name}`);
            }
        });
    }

    // Reescribir main correctamente para evitar esa lógica fea de catch/upsert
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
