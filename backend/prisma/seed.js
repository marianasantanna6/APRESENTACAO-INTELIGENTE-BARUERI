"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bcrypt = __importStar(require("bcrypt"));
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("../src/generated/prisma/client");
const prisma = new client_1.PrismaClient({
    adapter: new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
async function main() {
    let setor = await prisma.sectors.findFirst({
        where: { name: "Comunicação" },
    });
    if (!setor) {
        setor = await prisma.sectors.create({
            data: {
                name: "Comunicação",
            },
        });
        console.log("Setor criado:", setor.name);
    }
    else {
        console.log("Setor já existe:", setor.name);
    }
    let time = await prisma.teams.findFirst({
        where: {
            name: "Comunicação Institucional",
            sector: setor.id,
        },
    });
    if (!time) {
        time = await prisma.teams.create({
            data: {
                name: "Comunicação Institucional",
                sector: setor.id,
            },
        });
        console.log("Time criado:", time.name);
    }
    else {
        console.log("Time já existe:", time.name);
    }
    const cpf = "11122233344";
    const email = "lucas.ferreira@barueri.sp.gov.br";
    let user = await prisma.users.findFirst({
        where: {
            OR: [
                { email },
                { cpf },
            ],
        },
    });
    if (!user) {
        const hashedPassword = await bcrypt.hash("barueri123", 10);
        user = await prisma.users.create({
            data: {
                name: "Lucas Ferreira",
                email,
                cpf,
                password: hashedPassword,
                head_manager: false,
            },
        });
        console.log("Usuário criado:", user.name, user.email);
    }
    else {
        console.log("Usuário já existe:", user.name, user.email);
    }
    const vinculo = await prisma.users_role.findFirst({
        where: {
            user: user.id,
            sector: setor.id,
            team: time.id,
        },
    });
    if (!vinculo) {
        await prisma.users_role.create({
            data: {
                user: user.id,
                sector: setor.id,
                team: time.id,
                sector_manager: false,
                team_manager: true,
                team_approver: false,
            },
        });
        console.log("Vínculo criado: team_manager=true");
    }
    else {
        console.log("Vínculo já existe");
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map