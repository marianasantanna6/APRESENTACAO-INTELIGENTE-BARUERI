import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { mockUsers } from "../mocks/authMockData";
import type { AuthSessionUser, MockUser } from "../types/auth";

const AUTH_STORAGE_KEY = "barueri-inteligente:auth-session";

type LoginInput = {
  identifier: string;
  password: string;
};

type LoginResult =
  | { ok: true; user: AuthSessionUser }
  | { ok: false; message: string };

type AuthContextValue = {
  isAuthenticated: boolean;
  user: AuthSessionUser | null;
  login: (input: LoginInput) => LoginResult;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function buildSessionUser(user: MockUser): AuthSessionUser {
  const { password: _password, ...sessionUser } = user;

  return sessionUser;
}

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase();
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

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthSessionUser | null>(readStoredSession);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!user) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  }, [user]);

  function login({ identifier, password }: LoginInput): LoginResult {
    const normalizedIdentifier = normalizeIdentifier(identifier);
    const normalizedPassword = password.trim();
    const matchingUser = mockUsers.find((candidate) => {
      const loginKeys = [candidate.username, candidate.email].map((value) =>
        value.toLowerCase(),
      );

      return (
        loginKeys.includes(normalizedIdentifier)
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

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(user),
        user,
        login,
        logout,
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
