/**
 * useProjectEditor — estado central do editor de projetos.
 *
 * Mantém o rascunho local, executa auto-save simulado e expõe
 * helpers tipados para cada seção do formulário.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { generateId } from "../../utils/slugify";
import { projectService } from "../../services/projectService";
import type {
  InstitutionalProject,
  OdsGoal,
  ProjectAward,
  ProjectCategory,
  ProjectImage,
  ProjectIndicator,
  ProjectOfficialLink,
  ProjectVideo,
  GovernmentArea,
  ProjectStatus,
} from "../../types/project";

// ─── Tipos exportados ─────────────────────────────────────────────────────────

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export type EditorErrors = Partial<Record<string, string>>;

export type ProjectEditorState = {
  draft: InstitutionalProject;
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  isDirty: boolean;
  errors: EditorErrors;
};

// ─── Draft vazio (para criação) ───────────────────────────────────────────────

function emptyDraft(userId: string, department: string): InstitutionalProject {
  const now = new Date().toISOString();
  return {
    id: generateId("proj", "novo"),
    name: "",
    shortDescription: "",
    fullDescription: "",
    mainDepartment: department,
    relatedDepartments: [],
    governmentArea: "Tecnologia e Inovação",
    categories: [],
    technologies: [],
    keywords: [],
    targetAudience: [],
    status: "draft",
    implementationDate: now.slice(0, 10),
    indicators: [],
    images: [],
    videos: [],
    officialLinks: [],
    awards: [],
    ods: [],
    sources: [],
    relatedProjectIds: [],
    lastUpdatedAt: now,
    updatedBy: userId,
    versionHistory: [],
    createdByUserId: userId,
    createdAt: now,
  };
}

// ─── Validação ────────────────────────────────────────────────────────────────

function validate(draft: InstitutionalProject): EditorErrors {
  const errors: EditorErrors = {};
  if (!draft.name.trim()) errors.name = "O título é obrigatório.";
  if (draft.name.trim().length > 80) errors.name = "Máximo 80 caracteres.";
  if (!draft.shortDescription.trim()) errors.shortDescription = "A descrição curta é obrigatória.";
  if (draft.shortDescription.trim().length > 200) errors.shortDescription = "Máximo 200 caracteres.";
  if (draft.categories.length === 0) errors.categories = "Selecione ao menos uma categoria.";
  return errors;
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useProjectEditor(
  initial: InstitutionalProject | null,
  userId: string,
  department: string,
  opts?: { noAutoSave?: boolean },
) {
  const [draft, setDraft] = useState<InstitutionalProject>(
    initial ?? emptyDraft(userId, department),
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<EditorErrors>({});

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNew = initial === null;

  // ── Auto-save: 2 s após última mudança ──
  useEffect(() => {
    if (!isDirty || opts?.noAutoSave) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      triggerSave("auto");
    }, 2000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [draft, isDirty]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Patch genérico ──
  const patch = useCallback(
    (changes: Partial<InstitutionalProject>) => {
      setDraft((prev) => ({
        ...prev,
        ...changes,
        lastUpdatedAt: new Date().toISOString(),
        updatedBy: userId,
      }));
      setIsDirty(true);
      setErrors((prev) => {
        const next = { ...prev };
        (Object.keys(changes) as Array<keyof InstitutionalProject>).forEach((k) => {
          delete next[k as string];
        });
        return next;
      });
    },
    [userId],
  );

  // ── Salvar ──
  async function triggerSave(mode: "auto" | "manual" = "manual"): Promise<boolean> {
    const errs = validate(draft);
    if (Object.keys(errs).length > 0 && mode === "manual") {
      setErrors(errs);
      return false;
    }
    setSaveStatus("saving");
    try {
      if (isNew) {
        await projectService.createProject({
          name: draft.name,
          shortDescription: draft.shortDescription,
          fullDescription: draft.fullDescription,
          mainDepartment: draft.mainDepartment,
          relatedDepartments: draft.relatedDepartments,
          governmentArea: draft.governmentArea,
          categories: draft.categories,
          technologies: draft.technologies,
          keywords: draft.keywords,
          targetAudience: draft.targetAudience,
          status: draft.status,
          implementationDate: draft.implementationDate,
          indicators: draft.indicators,
          images: draft.images,
          videos: draft.videos,
          officialLinks: draft.officialLinks,
          awards: draft.awards,
          ods: draft.ods,
          sources: draft.sources,
          updatedBy: userId,
          createdByUserId: userId,
        });
      } else {
        await projectService.updateProject(draft.id, draft);
      }
      setSaveStatus("saved");
      setLastSaved(new Date());
      setIsDirty(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
      return true;
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 4000);
      return false;
    }
  }

  // ── Helpers de seções ──

  // Indicadores
  function addIndicator() {
    const ind: ProjectIndicator = {
      id: generateId("ind", draft.name || "proj"),
      label: "",
      value: "",
      unit: "",
      source: "",
      year: String(new Date().getFullYear()),
    };
    patch({ indicators: [...draft.indicators, ind] });
  }
  function updateIndicator(id: string, changes: Partial<ProjectIndicator>) {
    patch({
      indicators: draft.indicators.map((i) => (i.id === id ? { ...i, ...changes } : i)),
    });
  }
  function removeIndicator(id: string) {
    patch({ indicators: draft.indicators.filter((i) => i.id !== id) });
  }

  // Imagens (mock upload — data URL simulada)
  function addImage(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const img: ProjectImage = {
        id: generateId("img", file.name),
        url,
        caption: "",
        isPrimary: draft.images.length === 0,
        uploadedAt: new Date().toISOString(),
      };
      patch({ images: [...draft.images, img] });
    };
    reader.readAsDataURL(file);
  }
  function updateImage(id: string, changes: Partial<ProjectImage>) {
    patch({ images: draft.images.map((i) => (i.id === id ? { ...i, ...changes } : i)) });
  }
  function removeImage(id: string) {
    patch({ images: draft.images.filter((i) => i.id !== id) });
  }
  function setPrimaryImage(id: string) {
    patch({
      images: draft.images.map((i) => ({ ...i, isPrimary: i.id === id })),
    });
  }

  // Vídeos
  function addVideo() {
    const vid: ProjectVideo = {
      id: generateId("vid", draft.name || "proj"),
      url: "",
      title: "",
      caption: "",
    };
    patch({ videos: [...draft.videos, vid] });
  }
  function updateVideo(id: string, changes: Partial<ProjectVideo>) {
    patch({ videos: draft.videos.map((v) => (v.id === id ? { ...v, ...changes } : v)) });
  }
  function removeVideo(id: string) {
    patch({ videos: draft.videos.filter((v) => v.id !== id) });
  }

  // Links oficiais
  function addLink() {
    const link: ProjectOfficialLink = {
      id: generateId("link", draft.name || "proj"),
      label: "",
      url: "",
      type: "portal",
    };
    patch({ officialLinks: [...draft.officialLinks, link] });
  }
  function updateLink(id: string, changes: Partial<ProjectOfficialLink>) {
    patch({
      officialLinks: draft.officialLinks.map((l) => (l.id === id ? { ...l, ...changes } : l)),
    });
  }
  function removeLink(id: string) {
    patch({ officialLinks: draft.officialLinks.filter((l) => l.id !== id) });
  }

  // Prêmios
  function addAward() {
    const award: ProjectAward = {
      id: generateId("award", draft.name || "proj"),
      name: "",
      organization: "",
      year: String(new Date().getFullYear()),
      description: "",
    };
    patch({ awards: [...draft.awards, award] });
  }
  function updateAward(id: string, changes: Partial<ProjectAward>) {
    patch({ awards: draft.awards.map((a) => (a.id === id ? { ...a, ...changes } : a)) });
  }
  function removeAward(id: string) {
    patch({ awards: draft.awards.filter((a) => a.id !== id) });
  }

  // Tags genéricas
  function toggleCategory(cat: ProjectCategory) {
    const has = draft.categories.includes(cat);
    patch({ categories: has ? draft.categories.filter((c) => c !== cat) : [...draft.categories, cat] });
  }
  function toggleOds(n: OdsGoal) {
    const has = draft.ods.includes(n);
    patch({ ods: has ? draft.ods.filter((o) => o !== n) : [...draft.ods, n] });
  }

  function addTag(field: "technologies" | "keywords" | "targetAudience" | "sources" | "relatedDepartments", value: string) {
    if (!value.trim() || (draft[field] as string[]).includes(value.trim())) return;
    patch({ [field]: [...(draft[field] as string[]), value.trim()] });
  }
  function removeTag(field: "technologies" | "keywords" | "targetAudience" | "sources" | "relatedDepartments", value: string) {
    patch({ [field]: (draft[field] as string[]).filter((t) => t !== value) });
  }

  // Status
  function setStatus(status: ProjectStatus) {
    patch({ status });
  }
  function setGovernmentArea(area: GovernmentArea) {
    patch({ governmentArea: area });
  }

  return {
    draft,
    saveStatus,
    lastSaved,
    isDirty,
    errors,
    isNew,
    patch,
    triggerSave,
    // Indicadores
    addIndicator, updateIndicator, removeIndicator,
    // Imagens
    addImage, updateImage, removeImage, setPrimaryImage,
    // Vídeos
    addVideo, updateVideo, removeVideo,
    // Links
    addLink, updateLink, removeLink,
    // Prêmios
    addAward, updateAward, removeAward,
    // Tags/multi-select
    toggleCategory, toggleOds, addTag, removeTag,
    // Status / área
    setStatus, setGovernmentArea,
  };
}
