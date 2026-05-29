import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { mockUsers } from "../mocks/authMockData";
import type { AuthSessionUser, MockUser } from "../types/auth";

const AUTH_STORAGE_KEY = "barueri-inteligente:auth-session";
const USERS_STORAGE_KEY = "barueri-inteligente:auth-users";

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
  | { ok: true; user: AuthSessionUser }
  | { ok: false; message: string };

type UpdateAccountResult =
  | { ok: true; user: AuthSessionUser }
  | { ok: false; message: string };

type ChangePasswordResult = { ok: true } | { ok: false; message: string };

type VerifyCurrentUserResult = { ok: true } | { ok: false; message: string };

type AuthContextValue = {
  isAuthenticated: boolean;
  user: AuthSessionUser | null;
  login: (input: LoginInput) => LoginResult;
  logout: () => void;
  updateAccount: (input: UpdateAccountInput) => UpdateAccountResult;
  changePassword: (input: ChangePasswordInput) => ChangePasswordResult;
  verifyCurrentUser: (input: VerifyCurrentUserInput) => VerifyCurrentUserResult;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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
      !baseUsers.some((baseUser) => baseUser.id === storedUser.id)
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
      // Local persistence is only a mock bridge until the backend exists.
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
      // Session persistence is optional while the account module is mocked.
    }
  }, [user]);

  function login({ identifier, password }: LoginInput): LoginResult {
    const normalizedIdentifier = normalizeIdentifier(identifier);
    const normalizedCpf = normalizeCpf(identifier);
    const normalizedPassword = password.trim();
    const matchingUser = users.find((candidate) => {
      const loginKeys = [candidate.username, candidate.email].map((value) =>
        value.toLowerCase(),
      );

      return (
        (
          loginKeys.includes(normalizedIdentifier)
          || (
            normalizedCpf.length > 0
            && normalizeCpf(candidate.cpf) === normalizedCpf
          )
        )
        && candidate.password === normalizedPassword
      );
    });

    if (!matchingUser) {
      return {
        ok: false,
        message: "Usuário ou senha mock inválidos.",
      };
    }

    if (matchingUser.status !== "active") {
      return {
        ok: false,
        message: "Este usuário está marcado como inativo no mock.",
      };
    }

    const sessionUser = buildSessionUser(matchingUser);

    setUser(sessionUser);

    return { ok: true, user: sessionUser };
  }

  function logout() {
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
        message: "Usuário não encontrado no diretório mock.",
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
        message: "Usuário não encontrado no diretório mock.",
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
        message: "Usuário não encontrado no diretório mock.",
      };
    }

    if (currentUser.email.toLowerCase() !== email.trim().toLowerCase()) {
      return {
        ok: false,
        message: "Informe o email institucional do usuário logado.",
      };
    }

    if (currentUser.password !== password.trim()) {
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
