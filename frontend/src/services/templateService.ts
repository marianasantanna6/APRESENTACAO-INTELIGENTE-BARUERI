/**
 * templateService — Gestão de Templates de Apresentação
 *
 * Implementação mock com store em memória.
 * Para conectar ao backend real: crie realTemplateService.ts
 * implementando TemplateServiceContract e troque o export em index.ts.
 */

import { templatesMock } from "../mocks/templatesMock";
import type { PresentationTemplate, NewTemplatePayload, UpdateTemplatePayload, TemplateStatus } from "../types/template";
import type { ProjectCategory } from "../types/project";
import type { EventType } from "../types/institutionalPresentation";

// ─── Contrato ────────────────────────────────────────────────────────────────

export interface TemplateServiceContract {
  getTemplates(filters?: TemplateFilters): Promise<PresentationTemplate[]>;
  getTemplateById(id: string): Promise<PresentationTemplate | null>;
  getOfficialTemplates(): Promise<PresentationTemplate[]>;
  createTemplate(data: NewTemplatePayload): Promise<PresentationTemplate>;
  updateTemplate(id: string, data: UpdateTemplatePayload): Promise<PresentationTemplate>;
  deleteTemplate(id: string): Promise<void>;
  archiveTemplate(id: string): Promise<PresentationTemplate>;
  generateShareLink(id: string): Promise<string>;
  duplicateTemplate(id: string, createdBy: string, createdByName?: string): Promise<PresentationTemplate>;
}

export type TemplateFilters = {
  category?: ProjectCategory | "";
  eventType?: EventType | "";
  isOfficial?: boolean;
  status?: TemplateStatus;
};

// ─── Implementação mock ──────────────────────────────────────────────────────

let store: PresentationTemplate[] = [...templatesMock];

const mockTemplateService: TemplateServiceContract = {
  async getTemplates(filters = {}) {
    await delay(250);
    return store.filter((t) => {
      if (filters.status && t.status !== filters.status) return false;
      if (filters.isOfficial !== undefined && t.isOfficial !== filters.isOfficial) return false;
      if (filters.eventType && t.eventType !== filters.eventType) return false;
      if (filters.category && !t.categories.includes(filters.category as ProjectCategory)) return false;
      return true;
    });
  },

  async getTemplateById(id) {
    await delay(200);
    return store.find((t) => t.id === id) ?? null;
  },

  async getOfficialTemplates() {
    await delay(200);
    return store.filter((t) => t.isOfficial && t.status === "active");
  },

  async createTemplate(data) {
    await delay(400);
    const now = new Date().toISOString();
    const template: PresentationTemplate = {
      ...data,
      id: `template-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    store = [...store, template];
    return template;
  },

  async updateTemplate(id, data) {
    await delay(350);
    const index = store.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Template não encontrado: ${id}`);
    const updated: PresentationTemplate = {
      ...store[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    store = [...store.slice(0, index), updated, ...store.slice(index + 1)];
    return updated;
  },

  async deleteTemplate(id) {
    await delay(300);
    store = store.filter((t) => t.id !== id);
  },

  async archiveTemplate(id) {
    await delay(250);
    const index = store.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Template não encontrado: ${id}`);
    const updated: PresentationTemplate = {
      ...store[index],
      status: "archived",
      updatedAt: new Date().toISOString(),
    };
    store = [...store.slice(0, index), updated, ...store.slice(index + 1)];
    return updated;
  },

  async generateShareLink(id) {
    await delay(200);
    const template = store.find((t) => t.id === id);
    if (!template) throw new Error(`Template não encontrado: ${id}`);
    const link = `https://apresentacoes.barueri.sp.gov.br/templates/${id}`;
    const index = store.findIndex((t) => t.id === id);
    store = [
      ...store.slice(0, index),
      { ...store[index], shareLink: link, updatedAt: new Date().toISOString() },
      ...store.slice(index + 1),
    ];
    return link;
  },

  async duplicateTemplate(id, createdBy, createdByName) {
    await delay(400);
    const original = store.find((t) => t.id === id);
    if (!original) throw new Error(`Template não encontrado: ${id}`);
    const now = new Date().toISOString();
    const copy: PresentationTemplate = {
      ...original,
      id: `template-${Date.now()}`,
      name: `Cópia de ${original.name}`,
      status: "draft",
      isOfficial: false,
      shareLink: undefined,
      createdBy,
      createdByName,
      createdAt: now,
      updatedAt: now,
    };
    store = [...store, copy];
    return copy;
  },
};

export const templateService: TemplateServiceContract = mockTemplateService;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
