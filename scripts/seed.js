require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    const users = [
        {
            name: "Admin",
            email: "admin@wm.com",
            password: "1234",
            role: "admin",
        },


        {
            name: "HR 1",
            email: "hr1@wm.com",
            password: "1234",
            role: "level1",
        },
        {
            name: "HR 2",
            email: "hr2@wm.com",
            password: "1234",
            role: "level2",
        },
        {
            name: "HR 3",
            email: "hr3@wm.com",
            password: "1234",
            role: "level3",
        },
    ];

    for (const user of users) {
        const passwordHash = await bcrypt.hash(user.password, 10);

        await prisma.user.upsert({
            where: { email: user.email.toLowerCase() },
            update: {
                name: user.name,
                role: user.role,
                passwordHash,
            },
            create: {
                name: user.name,
                email: user.email.toLowerCase(),
                role: user.role,
                passwordHash,
            },
        });
    }

    console.log("Seed users created successfully.");
}

main()
    .catch((error) => {
        console.error("Seed error:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });