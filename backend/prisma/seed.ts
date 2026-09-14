import "dotenv/config";
import * as bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  // Setor
  let setor = await prisma.sectors.findFirst({
    where: { name: "Comunicação" },
  });
  if (!setor) {
    setor = await prisma.sectors.create({ data: { name: "Comunicação" } });
    console.log("Setor criado:", setor.name);
  } else {
    console.log("Setor já existe:", setor.name);
  }

  // Time
  let time = await prisma.teams.findFirst({
    where: { name: "Comunicação Institucional", sector: setor.id },
  });
  if (!time) {
    time = await prisma.teams.create({
      data: {
        name: "Comunicação Institucional",
        sector: setor.id,
        level_acess: 2,
      },
    });
    console.log("Time criado:", time.name);
  } else {
    console.log("Time já existe:", time.name);
  }

  // Usuário
  const cpf = "11122233344";
  const email = "lucas.ferreira@barueri.sp.gov.br";

  let user = await prisma.users.findFirst({
    where: { OR: [{ email }, { cpf }] },
  });
  if (!user) {
    const hashedPassword = await bcrypt.hash("barueri123", 10);
    user = await prisma.users.create({
      data: {
        name: "Lucas Ferreira",
        email,
        cpf,
        password: hashedPassword,
        master_admin: false,
      },
    });
    console.log("Usuário criado:", user.name, user.email);
  } else {
    console.log("Usuário já existe:", user.name, user.email);
  }

  // Vínculo usuário ↔ time com area_manager=true
  const vinculo = await prisma.users_teams.findFirst({
    where: { user: user.id, team: time.id },
  });
  if (!vinculo) {
    await prisma.users_teams.create({
      data: {
        user: user.id,
        team: time.id,
        area_manager: true,
        approver: false,
      },
    });
    console.log("Vínculo criado: area_manager=true");
  } else {
    console.log("Vínculo já existe");
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
