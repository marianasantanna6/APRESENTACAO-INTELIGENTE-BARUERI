/**
 * integrationService — Gestão de Fontes de Integração
 *
 * Implementação mock com store em memória.
 * Para conectar ao backend real: crie realIntegrationService.ts
 * implementando IntegrationServiceContract e troque o export em index.ts.
 */

import { integrationsMock } from "../mocks/integrationsMock";
import type { IntegrationSource, NewIntegrationPayload, UpdateIntegrationPayload } from "../types/integration";

// ─── Contrato ─────────────────────────────────────────────────────────────────

export interface IntegrationServiceContract {
  getIntegrations(): Promise<IntegrationSource[]>;
  getIntegrationById(id: string): Promise<IntegrationSource | null>;
  createIntegration(data: NewIntegrationPayload): Promise<IntegrationSource>;
  updateIntegration(id: string, data: UpdateIntegrationPayload): Promise<IntegrationSource>;
  deleteIntegration(id: string): Promise<void>;
  syncIntegration(id: string): Promise<{ syncedAt: string }>;
}

// ─── Implementação mock ──────────────────────────────────────────────────────

let store: IntegrationSource[] = [...integrationsMock];

const mockIntegrationService: IntegrationServiceContract = {
  async getIntegrations() {
    await delay(250);
    return [...store];
  },

  async getIntegrationById(id) {
    await delay(200);
    return store.find((i) => i.id === id) ?? null;
  },

  async createIntegration(data) {
    await delay(400);
    const integration: IntegrationSource = {
      ...data,
      id: `integration-${Date.now()}`,
    };
    store = [...store, integration];
    return integration;
  },

  async updateIntegration(id, data) {
    await delay(350);
    const index = store.findIndex((i) => i.id === id);
    if (index === -1) throw new Error(`Integração não encontrada: ${id}`);
    const updated = { ...store[index], ...data };
    store = [...store.slice(0, index), updated, ...store.slice(index + 1)];
    return updated;
  },

  async deleteIntegration(id) {
    await delay(300);
    store = store.filter((i) => i.id !== id);
  },

  async syncIntegration(id) {
    await delay(600);
    const syncedAt = new Date().toISOString();
    await mockIntegrationService.updateIntegration(id, {
      status: "active",
      lastSync: syncedAt,
    });
    return { syncedAt };
  },
};

export const integrationService: IntegrationServiceContract = mockIntegrationService;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
