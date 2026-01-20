
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// FORCE LOAD .ENV
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log("DB URL:", process.env.DATABASE_URL ? "Defined" : "UNDEFINED");

// Workaround for Prisma 7?
// Try basic constructor
const prisma = new PrismaClient();

const CATEGORIES = [
    "Arriendo", "Almuerzos", "Locomoción", "Luz", "Celular",
    "Aseo Municipal", "Vtr", "Tio Felix", "Seguro Auto", "Gastos varios", "Visa"
];

async function main() {
    console.log('Seeding categories...');

    for (const name of CATEGORIES) {
        try {
            await prisma.category.upsert({
                where: { name },
                update: {},
                create: {
                    name,
                },
            });
            console.log(` - ${name} ok`);
        } catch (err) {
            console.error(`Failed to upsert ${name}:`, err.message);
        }
    }

    console.log('Categories seeded!');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
