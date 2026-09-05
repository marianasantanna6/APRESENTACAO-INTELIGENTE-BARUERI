/**
 * presentationService — Gestão de Apresentações Institucionais
 *
 * Implementação mock com store em memória.
 * Para conectar ao backend real: crie realPresentationService.ts
 * implementando PresentationServiceContract e troque o export em index.ts.
 */

import { institutionalPresentationsMock } from "../mocks/presentationsMock";
import type {
  InstitutionalPresentation,
  NewPresentationPayload,
  PresentationFiltersNew,
  PresentationSummary,
  UpdatePresentationPayload,
} from "../types/institutionalPresentation";

// ─── Contrato ────────────────────────────────────────────────────────────────

export interface PresentationServiceContract {
  getPresentations(filters?: PresentationFiltersNew): Promise<PresentationSummary[]>;
  getPresentationById(id: string): Promise<InstitutionalPresentation | null>;
  getPresentationsByUser(userId: string): Promise<PresentationSummary[]>;
  createPresentation(data: NewPresentationPayload): Promise<InstitutionalPresentation>;
  updatePresentation(id: string, data: UpdatePresentationPayload): Promise<InstitutionalPresentation>;
  deletePresentation(id: string): Promise<void>;
  markAsPresented(id: string): Promise<InstitutionalPresentation>;
  generatePublicLink(id: string): Promise<{ publicLink: string; qrCode: string }>;
}

// ─── Implementação mock ──────────────────────────────────────────────────────

let store: InstitutionalPresentation[] = [...institutionalPresentationsMock];

function toSummary(p: InstitutionalPresentation): PresentationSummary {
  const activeModuleCount = p.moduleConfigs.filter((m) => m.enabled && !m.hidden).length;
  return {
    id: p.id,
    title: p.title,
    eventName: p.eventName,
    eventType: p.eventType,
    status: p.status,
    language: p.language,
    mainFocus: p.mainFocus,
    audience: p.audience,
    selectedProjects: p.selectedProjects,
    activeModuleCount,
    totalModuleCount: p.moduleConfigs.length,
    createdBy: p.createdBy,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    version: p.version,
  };
}

const mockPresentationService: PresentationServiceContract = {
  async getPresentations(filters = {}) {
    await delay(300);
    return store
      .filter((p) => {
        if (filters.status && p.status !== filters.status) return false;
        if (filters.eventType && p.eventType !== filters.eventType) return false;
        if (filters.language && p.language !== filters.language) return false;
        if (filters.createdBy && p.createdBy !== filters.createdBy) return false;
        if (filters.query) {
          const q = filters.query.toLowerCase();
          if (
            !p.title.toLowerCase().includes(q) &&
            !p.eventName.toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      })
      .map(toSummary);
  },

  async getPresentationById(id) {
    await delay(200);
    return store.find((p) => p.id === id) ?? null;
  },

  async getPresentationsByUser(userId) {
    await delay(250);
    return store.filter((p) => p.createdBy === userId).map(toSummary);
  },

  async createPresentation(data) {
    await delay(400);
    const now = new Date().toISOString();
    const presentation: InstitutionalPresentation = {
      ...data,
      id: `pres-${Date.now()}`,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    store = [...store, presentation];
    return presentation;
  },

  async updatePresentation(id, data) {
    await delay(350);
    const index = store.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Apresentação não encontrada: ${id}`);
    const updated: InstitutionalPresentation = {
      ...store[index],
      ...data,
      updatedAt: new Date().toISOString(),
      version: store[index].version + 1,
    };
    store = [...store.slice(0, index), updated, ...store.slice(index + 1)];
    return updated;
  },

  async deletePresentation(id) {
    await delay(300);
    store = store.filter((p) => p.id !== id);
  },

  async markAsPresented(id) {
    await delay(200);
    return mockPresentationService.updatePresentation(id, { status: "presented" });
  },

  async generatePublicLink(id) {
    await delay(500);
    const publicLink = `https://sit.barueri.sp.gov.br/p/${id}`;
    const qrCode = `data:image/png;base64,mockQrCode_${id}`;
    await mockPresentationService.updatePresentation(id, { publicLink, qrCode });
    return { publicLink, qrCode };
  },
};

export const presentationService: PresentationServiceContract = mockPresentationService;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
