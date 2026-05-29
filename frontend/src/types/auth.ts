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
  department: string;
  team: string;
  status: AccountStatus;
  avatarDataUrl?: string | null;
};

export type AuthSessionUser = Omit<MockUser, "password">;
