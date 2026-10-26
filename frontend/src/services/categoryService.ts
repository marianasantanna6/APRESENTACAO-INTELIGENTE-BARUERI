/**
 * categoryService — Catálogo de Categorias
 *
 * Implementação mock. Para conectar ao backend real: crie
 * realCategoryService.ts implementando CategoryServiceContract
 * e troque o export em index.ts.
 */

import { categoriesMock } from "../mocks/categoriesMock";
import type { CategoryMeta } from "../mocks/categoriesMock";
import type { ProjectCategory } from "../types/project";

// ─── Contrato ─────────────────────────────────────────────────────────────────

export interface CategoryServiceContract {
  getCategories(): Promise<CategoryMeta[]>;
  getCategoryById(id: ProjectCategory): Promise<CategoryMeta | null>;
}

// ─── Implementação mock ──────────────────────────────────────────────────────

const mockCategoryService: CategoryServiceContract = {
  async getCategories() {
    await delay(150);
    return [...categoriesMock];
  },

  async getCategoryById(id) {
    await delay(100);
    return categoriesMock.find((c) => c.id === id) ?? null;
  },
};

export const categoryService: CategoryServiceContract = mockCategoryService;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
