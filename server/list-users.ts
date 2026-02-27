import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.user.findMany({ select: { email: true, rol: true, nombre: true } }).then(users => {
  console.log(users);
  prisma.$disconnect();
});
