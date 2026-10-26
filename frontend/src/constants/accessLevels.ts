import type { UserAccessLevel } from "../types/auth";

export const ACCESS_LEVEL_LABELS: Record<UserAccessLevel, string> = {
  employee: "Funcionário",
  admin_level_1: "Admin nível 1",
  admin_level_2: "Admin nível 2",
};

export const ACCESS_LEVEL_ORDER: UserAccessLevel[] = [
  "employee",
  "admin_level_1",
  "admin_level_2",
];

export const INSTITUTIONAL_EMAIL_DOMAIN = "@barueri.sp.gov.br";
