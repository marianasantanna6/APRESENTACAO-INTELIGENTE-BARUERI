import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { authFetch } from "../lib/apiClient";
import type { AuthSessionUser, UserAccessLevel } from "../types/auth";

const AUTH_STORAGE_KEY = "barueri-inteligente:auth-session";
// Diretório de usuários fictícios usado pela versão anterior; removido no carregamento.
const LEGACY_USERS_STORAGE_KEY = "barueri-inteligente:auth-users";
const TOKEN_STORAGE_KEY = "barueri:token";

type LoginInput = {
  identifier: string;
  password: string;
};

type UpdateAccountInput = {
  avatarDataUrl?: string | null;
};

type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

type LoginResult =
  | { ok: true; user: AuthSessionUser; message?: never }
  | { ok: false; message: string };

type UpdateAccountResult =
  | { ok: true; user: AuthSessionUser }
  | { ok: false; message: string };

type ChangePasswordResult = { ok: true } | { ok: false; message: string };

type AuthContextValue = {
  isAuthenticated: boolean;
  user: AuthSessionUser | null;
  login: (input: LoginInput) => Promise<LoginResult>;
  logout: () => void;
  updateAccount: (input: UpdateAccountInput) => UpdateAccountResult;
  changePassword: (input: ChangePasswordInput) => Promise<ChangePasswordResult>;
};

type BackendLoginResponse = {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    cpf: string;
    photo: string | null;
    teamId: string | null;
    teamName: string | null;
    sectorName: string | null;
    accessLevel: number;
    master_admin: boolean;
    head_manager: boolean;
    approver: boolean;
    areaManager: boolean;
    sectorManager: boolean;
    teams?: Array<{ id: string; name: string; sectorId: string; sectorName: string; areaManager: boolean; approver: boolean }>;
  };
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapAccessLevel(level: number): UserAccessLevel {
  if (level >= 3) return "admin_level_2";
  if (level >= 2) return "admin_level_1";
  return "employee";
}

function toSessionUser(data: BackendLoginResponse["user"]): AuthSessionUser {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    cpf: data.cpf,
    username: data.email,
    accessLevel: data.master_admin ? "admin_level_2" : mapAccessLevel(data.accessLevel),
    department: data.sectorName ?? "",
    team: data.teamName ?? "",
    status: "active",
    avatarDataUrl: data.photo ?? null,
    master_admin: data.master_admin ?? false,
    head_manager: data.head_manager ?? false,
    approver: data.approver ?? false,
    areaManager: data.areaManager ?? false,
    sectorManager: data.sectorManager ?? false,
    teams: data.teams ?? [],
  };
}

/** Sessão salva só vale junto com o token do backend. */
function readStoredSession(): AuthSessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    window.localStorage.removeItem(LEGACY_USERS_STORAGE_KEY);
    if (!window.localStorage.getItem(TOKEN_STORAGE_KEY)) return null;
    const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return rawSession ? (JSON.parse(rawSession) as AuthSessionUser) : null;
  } catch {
    return null;
  }
}

async function readErrorMessage(res: Response, fallback: string) {
  const body = (await res.json().catch(() => ({}))) as { message?: string | string[] };
  if (Array.isArray(body.message)) return body.message.join(", ");
  return body.message ?? fallback;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthSessionUser | null>(readStoredSession);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (!user) {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        return;
      }
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // A persistência da sessão é opcional quando o armazenamento não está disponível.
    }
  }, [user]);

  async function login({ identifier, password }: LoginInput): Promise<LoginResult> {
    let res: Response;
    try {
      res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: identifier, password }),
      });
    } catch {
      return { ok: false, message: "Servidor indisponível. Tente novamente em instantes." };
    }

    if (!res.ok) {
      if (res.status >= 500) {
        return { ok: false, message: "Servidor indisponível. Tente novamente em instantes." };
      }
      return { ok: false, message: await readErrorMessage(res, "Credenciais inválidas.") };
    }

    const data = (await res.json()) as BackendLoginResponse;
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
    } catch {
      // Sem armazenamento, a sessão dura até o recarregamento da página.
    }
    const sessionUser = toSessionUser(data.user);
    setUser(sessionUser);
    return { ok: true, user: sessionUser };
  }

  function logout() {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // Nada a limpar.
    }
    setUser(null);
  }

  /** Atualiza a sessão depois que a alteração já foi salva no backend. */
  function updateAccount({ avatarDataUrl }: UpdateAccountInput): UpdateAccountResult {
    if (!user) {
      return { ok: false, message: "Nenhum usuário autenticado para atualizar." };
    }
    const nextUser = {
      ...user,
      ...(avatarDataUrl !== undefined ? { avatarDataUrl } : {}),
    };
    setUser(nextUser);
    return { ok: true, user: nextUser };
  }

  async function changePassword({
    currentPassword,
    newPassword,
  }: ChangePasswordInput): Promise<ChangePasswordResult> {
    if (!user) {
      return { ok: false, message: "Nenhum usuário autenticado para alterar a senha." };
    }
    try {
      const res = await authFetch(`/api/management/${encodeURIComponent(user.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      if (!res.ok) {
        if (res.status === 401) return { ok: false, message: "A senha atual informada não confere." };
        return { ok: false, message: await readErrorMessage(res, "Não foi possível alterar a senha.") };
      }
      return { ok: true };
    } catch {
      return { ok: false, message: "Servidor indisponível. Tente novamente em instantes." };
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(user),
        user,
        login,
        logout,
        updateAccount,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
