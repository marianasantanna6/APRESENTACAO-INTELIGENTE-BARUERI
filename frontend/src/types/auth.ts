export type UserAccessLevel = "employee" | "admin_level_1" | "admin_level_2";

export type AccountStatus = "active" | "inactive";

export type MockUser = {
  id: string;
  name: string;
  cpf: string;
  email: string;
  username: string;
  password: string;
  accessLevel: UserAccessLevel;
  /** Cargo explícito no novo modelo RBAC. Quando presente, tem prioridade sobre accessLevel. */
  role?: string;
  department: string;
  team: string;
  status: AccountStatus;
  avatarDataUrl?: string | null;
  master_admin?: boolean;
  head_manager?: boolean;
  approver?: boolean;
  teams?: Array<{ id: string; name: string; sectorId: string; sectorName: string; areaManager: boolean; approver: boolean }>;
};

export type AuthSessionUser = Omit<MockUser, "password">;
