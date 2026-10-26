import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { mockUsers } from "../mocks/authMockData";
import type { AuthSessionUser, MockUser, UserAccessLevel } from "../types/auth";

const AUTH_STORAGE_KEY = "barueri-inteligente:auth-session";
const USERS_STORAGE_KEY = "barueri-inteligente:auth-users";
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

type VerifyCurrentUserInput = {
  email: string;
  password: string;
};

type LoginResult =
  | { ok: true; user: AuthSessionUser; message?: never }
  | { ok: false; message: string };

type UpdateAccountResult =
  | { ok: true; user: AuthSessionUser }
  | { ok: false; message: string };

type ChangePasswordResult = { ok: true } | { ok: false; message: string };

type VerifyCurrentUserResult = { ok: true } | { ok: false; message: string };

type AuthContextValue = {
  isAuthenticated: boolean;
  user: AuthSessionUser | null;
  login: (input: LoginInput) => Promise<LoginResult>;
  logout: () => void;
  updateAccount: (input: UpdateAccountInput) => UpdateAccountResult;
  changePassword: (input: ChangePasswordInput) => ChangePasswordResult;
  verifyCurrentUser: (input: VerifyCurrentUserInput) => VerifyCurrentUserResult;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapAccessLevel(level: number): UserAccessLevel {
  if (level >= 3) return "admin_level_2";
  if (level >= 2) return "admin_level_1";
  return "employee";
}

function buildSessionUser(user: MockUser): AuthSessionUser {
  const { password: _password, ...sessionUser } = user;

  return sessionUser;
}

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase();
}

function normalizeCpf(value: string) {
  return value.replace(/\D/g, "");
}

function cloneUsers(source: MockUser[]) {
  return source.map((user) => ({ ...user }));
}

function findUserByIdentifier(usersDirectory: MockUser[], identifier: string) {
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const normalizedCpf = normalizeCpf(identifier);

  return usersDirectory.find((candidate) => {
    const loginKeys = [candidate.username, candidate.email].map((value) =>
      value.toLowerCase(),
    );

    return (
      loginKeys.includes(normalizedIdentifier)
      || (
        normalizedCpf.length > 0
        && normalizeCpf(candidate.cpf) === normalizedCpf
      )
    );
  });
}

function buildUsersDirectory(storedUsers?: MockUser[] | null) {
  const baseUsers = cloneUsers(mockUsers);

  if (!storedUsers?.length) {
    return baseUsers;
  }

  const mergedBaseUsers = baseUsers.map((baseUser) => {
    const storedUser = storedUsers.find((candidate) => candidate.id === baseUser.id);

    return storedUser ? { ...baseUser, ...storedUser } : baseUser;
  });
  const additionalUsers = storedUsers
    .filter((storedUser) =>
      !baseUsers.some((baseUser) => baseUser.id === storedUser.id),
    )
    .map((user) => ({ ...user }));

  return [...mergedBaseUsers, ...additionalUsers];
}

function readStoredUsers() {
  if (typeof window === "undefined") {
    return cloneUsers(mockUsers);
  }

  try {
    const rawUsers = window.localStorage.getItem(USERS_STORAGE_KEY);

    if (!rawUsers) {
      return cloneUsers(mockUsers);
    }

    return buildUsersDirectory(JSON.parse(rawUsers) as MockUser[]);
  } catch {
    return cloneUsers(mockUsers);
  }
}

function readStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!rawSession) {
      return null;
    }

    return JSON.parse(rawSession) as AuthSessionUser;
  } catch {
    return null;
  }
}

function syncSessionUser(
  sessionUser: AuthSessionUser | null,
  usersDirectory: MockUser[],
) {
  if (!sessionUser) {
    return null;
  }

  const matchingUser = usersDirectory.find(
    (candidate) => candidate.id === sessionUser.id,
  );

  if (!matchingUser) {
    return null;
  }

  return buildSessionUser(matchingUser);
}
function areSessionUsersEqual(
  left: AuthSessionUser | null,
  right: AuthSessionUser | null,
) {
  if (left === right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return (
    left.id === right.id
    && left.name === right.name
    && left.cpf === right.cpf
    && left.email === right.email
    && left.username === right.username
    && left.accessLevel === right.accessLevel
    && left.department === right.department
    && left.team === right.team
    && left.status === right.status
    && left.avatarDataUrl === right.avatarDataUrl
  );
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [users, setUsers] = useState<MockUser[]>(readStoredUsers);
  const [user, setUser] = useState<AuthSessionUser | null>(() =>
    syncSessionUser(readStoredSession(), readStoredUsers()),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch {
      // Profile editing remains local until dedicated account endpoints exist.
    }
  }, [users]);

  useEffect(() => {
    const syncedUser = syncSessionUser(user, users);

    if (user && !syncedUser) {
      setUser(null);
      return;
    }

    if (!areSessionUsersEqual(user, syncedUser)) {
      setUser(syncedUser);
    }
  }, [user, users]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      if (!user) {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        return;
      }

      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // Session persistence is optional if storage is unavailable.
    }
  }, [user]);

  function loginWithMock(identifier: string, password: string): LoginResult | null {
    const found = findUserByIdentifier(users, identifier);
    if (!found) return null;
    if (found.password !== password.trim()) return { ok: false, message: "Senha incorreta." };
    const sessionUser = buildSessionUser(found);
    setUser(sessionUser);
    return { ok: true, user: sessionUser };
  }

  async function login({
    identifier,
    password,
  }: LoginInput): Promise<LoginResult> {
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: identifier, password }),
      });

      if (!res.ok) {
        // Status >= 500 significa proxy/servidor offline — tenta mock
        if (res.status >= 500) {
          return loginWithMock(identifier, password)
            ?? { ok: false, message: "Servidor indisponível e usuário não encontrado nos dados locais." };
        }
        const err = await res.json().catch(() => ({})) as { message?: string };
        return { ok: false, message: err.message ?? "Credenciais inválidas." };
      }

      const data = await res.json() as {
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
          approver: boolean;
        };
      };

      try {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
      } catch {}

      // master_admin do backend → usa o perfil mock da Marina para demo
      if (data.user.master_admin) {
        const marinaMock = readStoredUsers().find((u) => u.id === "admin-marina");
        if (marinaMock) {
          const sessionUser = buildSessionUser({ ...marinaMock, master_admin: true });
          setUser(sessionUser);
          return { ok: true, user: sessionUser };
        }
      }

      const backendUser: MockUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        cpf: data.user.cpf,
        username: data.user.email,
        password: "__backend__",
        accessLevel: mapAccessLevel(data.user.accessLevel),
        department: data.user.sectorName ?? "",
        team: data.user.teamName ?? "",
        status: "active",
        avatarDataUrl: data.user.photo ?? null,
        master_admin: data.user.master_admin ?? false,
        approver: data.user.approver ?? false,
      };

      setUsers((prev) => {
        const exists = prev.some((u) => u.id === backendUser.id);
        return exists
          ? prev.map((u) => (u.id === backendUser.id ? backendUser : u))
          : [...prev, backendUser];
      });

      const sessionUser = buildSessionUser(backendUser);
      setUser(sessionUser);

      return { ok: true, user: sessionUser };
    } catch {
      // Backend indisponível — tenta autenticação local com os mocks
      return loginWithMock(identifier, password)
        ?? { ok: false, message: "Servidor indisponível e usuário não encontrado nos dados locais." };
    }
  }

  function logout() {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {}
    setUser(null);
  }

  function updateAccount({ avatarDataUrl }: UpdateAccountInput): UpdateAccountResult {
    if (!user) {
      return {
        ok: false,
        message: "Nenhum usuário autenticado para atualizar.",
      };
    }

    const nextUsers = users.map((candidate) =>
      candidate.id === user.id
        ? {
            ...candidate,
            ...(avatarDataUrl !== undefined ? { avatarDataUrl } : {}),
          }
        : candidate,
    );
    const updatedUser = nextUsers.find((candidate) => candidate.id === user.id);

    if (!updatedUser) {
      return {
        ok: false,
        message: "Usuário não encontrado no diretório local.",
      };
    }

    const nextSessionUser = buildSessionUser(updatedUser);

    setUsers(nextUsers);
    setUser(nextSessionUser);

    return {
      ok: true,
      user: nextSessionUser,
    };
  }

  function changePassword({
    currentPassword,
    newPassword,
  }: ChangePasswordInput): ChangePasswordResult {
    if (!user) {
      return {
        ok: false,
        message: "Nenhum usuário autenticado para alterar a senha.",
      };
    }

    const currentUser = users.find((candidate) => candidate.id === user.id);

    if (!currentUser) {
      return {
        ok: false,
        message: "Usuário não encontrado no diretório local.",
      };
    }

    if (currentUser.password !== currentPassword.trim()) {
      return {
        ok: false,
        message: "A senha atual informada não confere.",
      };
    }

    if (currentUser.password === newPassword.trim()) {
      return {
        ok: false,
        message: "A nova senha precisa ser diferente da senha atual.",
      };
    }

    setUsers((currentUsers) =>
      currentUsers.map((candidate) =>
        candidate.id === user.id
          ? { ...candidate, password: newPassword.trim() }
          : candidate,
      ),
    );

    return { ok: true };
  }

  function verifyCurrentUser({
    email,
    password,
  }: VerifyCurrentUserInput): VerifyCurrentUserResult {
    if (!user) {
      return {
        ok: false,
        message: "Nenhum usuário autenticado para confirmar a ação.",
      };
    }

    const currentUser = users.find((candidate) => candidate.id === user.id);

    if (!currentUser) {
      return {
        ok: false,
        message: "Usuário não encontrado no diretório local.",
      };
    }

    if (currentUser.email.toLowerCase() !== email.trim().toLowerCase()) {
      return {
        ok: false,
        message: "Informe o e-mail institucional do usuário logado.",
      };
    }

    if (currentUser.password !== "__backend__" && currentUser.password !== password.trim()) {
      return {
        ok: false,
        message: "A senha informada não confere.",
      };
    }

    return { ok: true };
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
        verifyCurrentUser,
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
