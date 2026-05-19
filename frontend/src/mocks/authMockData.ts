import type { MockUser } from "../types/auth";

export const mockUsers: MockUser[] = [
  {
    id: "admin-marina",
    name: "Marina Justus",
    email: "marina.justus@barueri.sp.gov.br",
    username: "admin.nivel2",
    password: "barueri123",
    accessLevel: "admin_level_2",
    department: "Gabinete de Dados",
    team: "Plataforma Analítica",
    status: "active",
  },
  {
    id: "admin-joao",
    name: "João Lemes",
    email: "joao.lemes@barueri.sp.gov.br",
    username: "admin.nivel1",
    password: "barueri123",
    accessLevel: "admin_level_1",
    department: "Planejamento",
    team: "Planejamento Territorial",
    status: "active",
  },
  {
    id: "employee-bianca",
    name: "Bianca Souza",
    email: "bianca.souza@barueri.sp.gov.br",
    username: "funcionario.demo",
    password: "barueri123",
    accessLevel: "employee",
    department: "Planejamento",
    team: "Planejamento Territorial",
    status: "active",
  },
];
