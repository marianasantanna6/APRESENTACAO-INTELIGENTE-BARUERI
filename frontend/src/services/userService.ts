/**
 * userService — Gestão de Usuários da Plataforma
 *
 * Implementação mock com store em memória.
 * Para conectar ao backend real: crie realUserService.ts
 * implementando UserServiceContract e troque o export em index.ts.
 */

import { platformUsersMock } from "../mocks/usersMock";
import { organizationMock } from "../mocks/integrationsMock";
import type { PlatformUser, NewUserPayload, UpdateUserPayload } from "../types/user";
import type { OrganizationDirectoryEntry } from "../types/admin";

// ─── Tipos de resposta ────────────────────────────────────────────────────────

export type UserMutationResult =
  | { success: true; user: PlatformUser }
  | { success: false; error: string };

// ─── Contrato ─────────────────────────────────────────────────────────────────

export interface UserServiceContract {
  getUsers(department?: string): Promise<PlatformUser[]>;
  getUserById(id: string): Promise<PlatformUser | null>;
  getUserByEmail(email: string): Promise<PlatformUser | null>;
  createUser(data: NewUserPayload): Promise<UserMutationResult>;
  updateUser(id: string, data: UpdateUserPayload): Promise<UserMutationResult>;
  deleteUser(id: string): Promise<UserMutationResult>;
  getOrganization(): Promise<OrganizationDirectoryEntry[]>;
}

// ─── Implementação mock ──────────────────────────────────────────────────────

let store: PlatformUser[] = [...platformUsersMock];

const mockUserService: UserServiceContract = {
  async getUsers(department) {
    await delay(300);
    if (!department) return [...store];
    return store.filter((u) => u.department === department);
  },

  async getUserById(id) {
    await delay(200);
    return store.find((u) => u.id === id) ?? null;
  },

  async getUserByEmail(email) {
    await delay(200);
    return store.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  },

  async createUser(data) {
    await delay(400);
    const exists = store.some((u) => u.email === data.email);
    if (exists) return { success: false, error: "E-mail já cadastrado na plataforma." };

    const user: PlatformUser = {
      ...data,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    store = [...store, user];
    return { success: true, user };
  },

  async updateUser(id, data) {
    await delay(350);
    const index = store.findIndex((u) => u.id === id);
    if (index === -1) return { success: false, error: "Usuário não encontrado." };
    const updated = { ...store[index], ...data };
    store = [...store.slice(0, index), updated, ...store.slice(index + 1)];
    return { success: true, user: updated };
  },

  async deleteUser(id) {
    await delay(300);
    const user = store.find((u) => u.id === id);
    if (!user) return { success: false, error: "Usuário não encontrado." };
    store = store.filter((u) => u.id !== id);
    return { success: true, user };
  },

  async getOrganization() {
    await delay(200);
    return [...organizationMock];
  },
};

export const userService: UserServiceContract = mockUserService;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
