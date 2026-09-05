/**
 * CreatePresentationPage — Wizard de criação de apresentações institucionais.
 *
 * Etapa 1: Contexto  — evento, objetivo, público, idioma, enfoques (10)
 * Etapa 2: Acervo    — projetos filtrados por enfoque
 * Etapa 3: Módulos   — 13 módulos padrão com ativar/desativar/reordenar/ocultar/duplicar (11)
 */

import type { ChangeEvent, CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaChevronDown,
  FaSearch,
} from "react-icons/fa";
import {
  FiArrowLeft,
  FiArrowRight,
  FiAward,
  FiBarChart2,
  FiBookOpen,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiCopy,
  FiCpu,
  FiEye,
  FiEyeOff,
  FiFileText,
  FiFlag,
  FiGlobe,
  FiGrid,
  FiHeart,
  FiImage,
  FiLink,
  FiLoader,
  FiMap,
  FiPackage,
  FiTag,
  FiTarget,
  FiTrendingUp,
  FiUser,
  FiVideo,
  FiX,
  FiZap,
} from "react-icons/fi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DEFAULT_PRESENTATION_FILTERS } from "../../api/presentation";
import AuthenticatedHeader from "../../components/AuthenticatedHeader";
import { AwardsSection } from "../../components/ProjectEditor/sections/AwardsSection";
import { ClassificationSection } from "../../components/ProjectEditor/sections/ClassificationSection";
import { IdentitySection } from "../../components/ProjectEditor/sections/IdentitySection";
import { IndicatorsSection } from "../../components/ProjectEditor/sections/IndicatorsSection";
import { LinksSection } from "../../components/ProjectEditor/sections/LinksSection";
import { MediaSection } from "../../components/ProjectEditor/sections/MediaSection";
import { OdsSection } from "../../components/ProjectEditor/sections/OdsSection";
import { useProjectEditor } from "../../components/ProjectEditor/useProjectEditor";
import { useAuth } from "../../context";
import { canCreatePresentations } from "../../lib/accessControl";
import { getPresentationsRouteForUser } from "../../lib/authRouting";
import { presentationService } from "../../services/presentationService";
import { projectService } from "../../services/projectService";
import {
  CANONICAL_MODULE_ORDER,
  MODULE_DEFINITIONS,
  suggestModules,
} from "../../services/suggestionEngine";
import type { ModuleCategory, ModuleInfo } from "../../services/suggestionEngine";
import { templateService } from "../../services/templateService";
import type { TemplateModuleType } from "../../types/template";
import type {
  EventType,
  PresentationLanguage,
  PresentationModuleConfig,
  PresentationModuleId,
} from "../../types/institutionalPresentation";
import type { ProjectCategory, ProjectSummary } from "../../types/project";
import { ROUTE_PATHS } from "../../router/paths";
import { buildPresentationSearchParams } from "../../router/presentationSearchParams";

// ─── Dados estáticos ─────────────────────────────────────────────────────────

const AVAILABLE_YEARS = [
  "Todos",
  ...Array.from({ length: 2026 - 1950 + 1 }, (_, i) => String(2026 - i)),
];

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: "congresso",         label: "Congresso" },
  { value: "visita-tecnica",    label: "Visita Técnica" },
  { value: "premiacao",         label: "Premiação" },
  { value: "reuniao-interna",   label: "Reunião Interna" },
  { value: "feira",             label: "Feira / Expo" },
  { value: "audiencia-publica", label: "Audiência Pública" },
  { value: "outro",             label: "Outro" },
];

const LANGUAGE_OPTIONS: { value: PresentationLanguage; label: string }[] = [
  { value: "pt-BR", label: "Português (BR)" },
  { value: "en-US", label: "English (US)" },
  { value: "es",    label: "Español" },
];

// ─── Ícones dos módulos ───────────────────────────────────────────────────────

const MODULE_ICONS: Record<PresentationModuleId, React.ComponentType<{ className?: string }>> = {
  "capa-institucional":      FiFlag,
  "dados-gerais-barueri":    FiMap,
  "dados-macro":             FiTrendingUp,
  "apresentacao-sit":        FiCpu,
  "apresentacao-secretario": FiUser,
  "visao-geral-projetos":    FiGrid,
  "projetos-selecionados":   FiPackage,
  "indicadores":             FiBarChart2,
  "premios":                 FiAward,
  "ods":                     FiGlobe,
  "videos":                  FiVideo,
  "encerramento":            FiHeart,
  "agradecimento":           FiZap,
};

const CATEGORY_STYLES: Record<ModuleCategory, { label: string; cls: string }> = {
  estrutura:    { label: "Estrutura",    cls: "bg-[#eff6ff] text-[#1d4ed8]" },
  institucional: { label: "Institucional", cls: "bg-[#f5f3ff] text-[#7c3aed]" },
  projetos:     { label: "Projetos",     cls: "bg-[#f0fdf4] text-[#166534]" },
  dados:        { label: "Dados",        cls: "bg-[#fff7ed] text-[#c2410c]" },
  encerramento: { label: "Encerramento", cls: "bg-[#f8fafc] text-[#475569]" },
};

const TOP_CATEGORIES: ProjectCategory[] = [
  "Saúde", "Educação", "Inovação", "Transformação Digital", "Cidades Inteligentes",
  "Governo Digital", "Inteligência Artificial", "Mobilidade Urbana", "Meio Ambiente",
  "Segurança Pública", "Infraestrutura", "Social", "Economia",
  "Cultura e Lazer", "Habitação", "Saneamento", "Esporte e Lazer", "Trabalho e Emprego",
];

const TOP_CATEGORY_COLORS: Partial<Record<ProjectCategory, string>> = {
  "Saúde":                   "bg-[#ecfeff] text-[#0e7490] border-[#a5f3fc]",
  "Educação":                "bg-[#f5f3ff] text-[#7c3aed] border-[#ddd6fe]",
  "Inovação":                "bg-[#fffbeb] text-[#d97706] border-[#fde68a]",
  "Transformação Digital":   "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]",
  "Cidades Inteligentes":    "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]",
  "Governo Digital":         "bg-[#eef2ff] text-[#4338ca] border-[#c7d2fe]",
  "Inteligência Artificial": "bg-[#fdf2f8] text-[#be185d] border-[#fbcfe8]",
  "Mobilidade Urbana":       "bg-[#fef3c7] text-[#b45309] border-[#fde68a]",
  "Meio Ambiente":           "bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]",
  "Segurança Pública":       "bg-[#fef2f2] text-[#991b1b] border-[#fecaca]",
  "Infraestrutura":          "bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]",
  "Social":                  "bg-[#fdf2f8] text-[#9d174d] border-[#fbcfe8]",
  "Economia":                "bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]",
  "Cultura e Lazer":         "bg-[#fdf4ff] text-[#a21caf] border-[#f0abfc]",
  "Habitação":               "bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]",
  "Saneamento":              "bg-[#eff6ff] text-[#1e40af] border-[#bfdbfe]",
  "Esporte e Lazer":         "bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]",
  "Trabalho e Emprego":      "bg-[#fffbeb] text-[#92400e] border-[#fde68a]",
};

// ─── Mapeamento TemplateModuleType → PresentationModuleId ────────────────────

const TEMPLATE_TYPE_TO_MODULE_ID: Partial<Record<TemplateModuleType, PresentationModuleId>> = {
  "intro":                "capa-institucional",
  "project-card":         "projetos-selecionados",
  "indicator-highlight":  "indicadores",
  "media-gallery":        "videos",
  "timeline":             "dados-macro",
  "comparison":           "dados-gerais-barueri",
  "map":                  "dados-gerais-barueri",
  "closing":              "encerramento",
  "custom":               "agradecimento",
};

// ─── Componente principal ─────────────────────────────────────────────────────

function CreatePresentationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { logout, user } = useAuth();
  const canCreate = canCreatePresentations(user);

  // ── Etapa atual ──
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // ── Editor de projeto integrado (sem auto-save) ──
  const ed = useProjectEditor(null, user?.id ?? "unknown", user?.department ?? "", { noAutoSave: true });

  // ── Scroll-spy para nav lateral ──
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState("section-context");

  // ── Etapa 1 — contexto da apresentação ──
  const [eventName, setEventName]   = useState("");
  const [eventType, setEventType]   = useState<EventType | "">("");
  const [audience, setAudience]     = useState("");
  const [language, setLanguage]     = useState<PresentationLanguage>("pt-BR");
  const [selectedYear, setYear]     = useState(DEFAULT_PRESENTATION_FILTERS.year);
  const [search, setSearch]         = useState(DEFAULT_PRESENTATION_FILTERS.query);

  // Categoria primária = primeira da lista; secundárias = restantes
  const primaryCategory = (ed.draft.categories[0] ?? "Todos") as string;

  // ── Etapa 2 — projetos ──
  const [allProjects, setAllProjects]         = useState<ProjectSummary[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedIds, setSelectedIds]         = useState<Set<string>>(new Set());
  const [projectFilter, setProjectFilter]     = useState("");

  // ── Etapa 3 — módulos ──
  const [moduleConfigs, setModuleConfigs] = useState<PresentationModuleConfig[]>([]);
  const [suggestedIds, setSuggestedIds]   = useState<Set<PresentationModuleId>>(new Set());

  // ── Template pré-carregado ──
  const [templateBanner, setTemplateBanner] = useState<string | null>(null);

  // ── Salvando ──
  const [isSaving, setIsSaving]   = useState(false);
  const [saveError, setSaveError] = useState("");

  // Carrega projetos ao entrar na etapa 2
  useEffect(() => {
    if (step !== 2 || allProjects.length > 0) return;
    setProjectsLoading(true);
    projectService
      .getProjects()
      .then(setAllProjects)
      .finally(() => setProjectsLoading(false));
  }, [step, allProjects.length]);

  // Pré-preenche o wizard a partir de um template (quando ?templateId= está na URL)
  useEffect(() => {
    const templateId = searchParams.get("templateId");
    if (!templateId) return;

    templateService.getTemplateById(templateId).then((template) => {
      if (!template) return;

      // Etapa 1 — contexto
      if (template.eventName) setEventName(template.eventName);
      if (template.eventType) setEventType(template.eventType);
      if (template.language)  setLanguage(template.language);
      if (template.categories.length > 0) {
        ed.patch({ categories: template.categories });
      }

      // Etapa 2 — projetos pré-selecionados
      if (template.projects.length > 0) {
        setSelectedIds(new Set(template.projects));
      }

      // Etapa 3 — módulos
      if (template.moduleConfigs && template.moduleConfigs.length > 0) {
        // Formato novo (salvo pelo wizard): usa direto
        setModuleConfigs(template.moduleConfigs);
      } else if (template.modules.length > 0) {
        // Formato legado (TemplateModule[]): converte para PresentationModuleConfig[]
        const enabledIds = new Set<PresentationModuleId>();
        const orderedIds: PresentationModuleId[] = [];

        for (const modId of template.moduleOrder) {
          const mod = template.modules.find((m) => m.id === modId);
          if (!mod) continue;
          const pid = TEMPLATE_TYPE_TO_MODULE_ID[mod.type];
          if (pid && !enabledIds.has(pid)) {
            enabledIds.add(pid);
            orderedIds.push(pid);
          }
        }

        // Módulos do template na frente (habilitados), restantes atrás (desabilitados)
        const remaining = CANONICAL_MODULE_ORDER.filter((id) => !enabledIds.has(id));
        const fullOrder = [...orderedIds, ...remaining];

        setModuleConfigs(
          fullOrder.map((moduleId) => ({
            instanceId: `inst-${moduleId}`,
            moduleId,
            enabled: enabledIds.has(moduleId),
            hidden: false,
          })),
        );
      }

      setTemplateBanner(template.name);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Inicializa módulos ao entrar na etapa 3
  useEffect(() => {
    if (step !== 3 || moduleConfigs.length > 0) return;
    const selectedProjs = allProjects.filter((p) => selectedIds.has(p.id));
    const secondaryFocuses = ed.draft.categories.slice(1) as string[];
    const suggested = suggestModules(selectedProjs, primaryCategory, eventType, secondaryFocuses);
    setModuleConfigs(suggested);
    setSuggestedIds(new Set(suggested.filter((m) => m.enabled).map((m) => m.moduleId)));
  }, [step, allProjects, selectedIds, primaryCategory, eventType, ed.draft.categories, moduleConfigs.length]);

  // Scroll-spy: destaca seção ativa no nav lateral
  useEffect(() => {
    const container = mainContentRef.current;
    if (!container || step !== 1) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveSection(visible.target.id);
      },
      { root: null, rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    const sections = container.querySelectorAll("section[id]");
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [step]);

  // Projetos filtrados para exibição na etapa 2
  const filteredProjects = useMemo(() => {
    let list = allProjects.filter((p) => p.status !== "archived");

    if (primaryCategory !== "Todos") {
      const byCategory = list.filter(
        (p) =>
          p.categories.includes(primaryCategory as ProjectCategory) ||
          p.governmentArea === primaryCategory,
      );
      if (byCategory.length > 0) list = byCategory;
    }

    if (projectFilter.trim()) {
      const q = projectFilter.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.mainDepartment.toLowerCase().includes(q),
      );
    }

    return list;
  }, [allProjects, primaryCategory, projectFilter]);

  // ── Handlers ──
  function handleLogout() {
    logout();
    navigate(ROUTE_PATHS.login);
  }

  function toggleProject(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  }

  function goToStep2() {
    setModuleConfigs([]);
    setStep(2);
  }

  // ── Ações nos módulos ──
  function toggleModuleEnabled(instanceId: string) {
    setModuleConfigs((prev) =>
      prev.map((m) => (m.instanceId === instanceId ? { ...m, enabled: !m.enabled } : m)),
    );
  }

  function toggleModuleHidden(instanceId: string) {
    setModuleConfigs((prev) =>
      prev.map((m) => (m.instanceId === instanceId ? { ...m, hidden: !m.hidden } : m)),
    );
  }

  function moveModule(instanceId: string, direction: -1 | 1) {
    setModuleConfigs((prev) => {
      const idx = prev.findIndex((m) => m.instanceId === instanceId);
      const target = idx + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function duplicateModule(instanceId: string) {
    setModuleConfigs((prev) => {
      const idx = prev.findIndex((m) => m.instanceId === instanceId);
      if (idx === -1) return prev;
      const source = prev[idx];
      const copy: PresentationModuleConfig = {
        ...source,
        instanceId: `${source.instanceId}-copy-${Date.now()}`,
        duplicatedFrom: instanceId,
      };
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
    });
  }

  function removeModule(instanceId: string) {
    setModuleConfigs((prev) => prev.filter((m) => m.instanceId !== instanceId));
  }

  // ── Geração ──
  async function handleGenerate() {
    setSaveError("");
    setIsSaving(true);
    try {
      const secondaryFocuses = ed.draft.categories.slice(1) as string[];
      const presentation = await presentationService.createPresentation({
        title:            eventName.trim() || ed.draft.name.trim() || `Apresentação — ${primaryCategory}`,
        eventName:        eventName.trim() || primaryCategory,
        eventType:        (eventType as EventType) || "outro",
        purpose:          search.trim(),
        audience:         audience.trim() || ed.draft.targetAudience.join(", "),
        mainFocus:        primaryCategory,
        secondaryFocuses,
        selectedProjects: [...selectedIds],
        moduleConfigs,
        language,
        status:           "draft",
        createdBy:        user?.id ?? "unknown",
        notes:            search.trim(),
      });

      // Se o usuário preencheu a identidade do projeto, persiste como projeto institucional
      if (ed.draft.name.trim()) {
        projectService.createProject({
          name:               ed.draft.name,
          shortDescription:   ed.draft.shortDescription,
          fullDescription:    ed.draft.fullDescription,
          mainDepartment:     ed.draft.mainDepartment,
          relatedDepartments: ed.draft.relatedDepartments,
          governmentArea:     ed.draft.governmentArea,
          categories:         ed.draft.categories,
          technologies:       ed.draft.technologies,
          keywords:           ed.draft.keywords,
          targetAudience:     ed.draft.targetAudience,
          status:             ed.draft.status,
          implementationDate: ed.draft.implementationDate,
          indicators:         ed.draft.indicators,
          images:             ed.draft.images,
          videos:             ed.draft.videos,
          officialLinks:      ed.draft.officialLinks,
          awards:             ed.draft.awards,
          ods:                ed.draft.ods,
          sources:            ed.draft.sources,
          updatedBy:          user?.id ?? "unknown",
          createdByUserId:    user?.id ?? "unknown",
        }).catch(() => {}); // não bloqueia a navegação
      }

      const params = buildPresentationSearchParams({
        query:    search.trim() || DEFAULT_PRESENTATION_FILTERS.query,
        category: primaryCategory,
        year:     selectedYear,
      });
      params.set("pid", presentation.id);
      navigate(`${ROUTE_PATHS.generatedPresentation}?${params.toString()}`);
    } catch {
      setSaveError("Erro ao salvar a apresentação. Tente novamente.");
      setIsSaving(false);
    }
  }

  const activeModuleCount = moduleConfigs.filter((m) => m.enabled && !m.hidden).length;

  // ── Renderização ──
  return (
    <div
      data-page-theme="create"
      className="min-h-screen bg-[#f8fafc] text-[#1e1e1e]"
    >
      <AuthenticatedHeader
        activeItem="create"
        canCreate={canCreate}
        logoTo={ROUTE_PATHS.createPresentation}
        onLogout={handleLogout}
        presentationsTo={getPresentationsRouteForUser(user)}
        showMobilePresentationsShortcut
        user={user}
      />

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-[1240px] px-5 pb-20 pt-24 sm:px-6 lg:px-8"
      >
        {/* Indicador de etapas */}
        <StepIndicator currentStep={step} />

        {/* ── Etapa 1 — Dados do Projeto + Contexto ── */}
        {step === 1 && (
          <section className="mx-auto flex max-w-[1210px] flex-col items-center">
            {/* Título */}
            <h1 className="page-title reveal-on-scroll max-w-[21ch] text-center text-[2.1rem] font-extrabold leading-[1.08] tracking-[-0.05em] text-[#1e1e1e] [text-wrap:balance] sm:max-w-[22ch] sm:text-[2.9rem] lg:max-w-[24ch] lg:text-[3.45rem] xl:text-[3.75rem]">
              Crie uma Apresentação{" "}
              <span className="relative inline-block text-left align-bottom">
                <span aria-hidden="true" className="invisible">Inteligente</span>
                <span
                  className="typewriter-word absolute left-0 top-0 bg-[linear-gradient(90deg,#0a3452_0%,#1675b8_25.962%)] bg-clip-text text-transparent"
                  style={{ "--typewriter-width": "11ch", "--typewriter-steps": 11 } as CSSProperties}
                >
                  Inteligente
                </span>
              </span>
            </h1>

            {/* Banner de template carregado */}
            {templateBanner && (
              <div className="mt-6 flex w-full items-center justify-between gap-3 rounded-2xl border border-[#fde68a] bg-[#fffbeb] px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <FiBookOpen className="h-4.5 w-4.5 shrink-0 text-[#d97706]" />
                  <p className="text-[0.86rem] text-[#92400e]">
                    Wizard pré-preenchido a partir do template{" "}
                    <strong className="font-bold">"{templateBanner}"</strong>.{" "}
                    Revise os campos abaixo e avance quando estiver pronto.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTemplateBanner(null)}
                  className="shrink-0 rounded-full p-1 text-[#d97706] hover:bg-[#fde68a]/40"
                  aria-label="Fechar aviso"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* ── TOP: Search bar + categoria pills + CTA ── */}
            <div className="mt-8 w-full space-y-4">
              {/* Barra de busca principal */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <FaSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9ca3af]" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && goToStep2()}
                    placeholder="Tema, objetivo ou categoria da apresentação…"
                    className="h-[58px] w-full rounded-2xl border border-[#e2e8f0] bg-white pl-12 pr-4 text-[1rem] text-[#1e1e1e] placeholder:text-[#9ca3af] shadow-[0_2px_12px_rgba(20,33,51,0.07)] outline-none focus:border-[#1675b8] focus:ring-2 focus:ring-[#1675b8]/10 transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={goToStep2}
                  className="hidden shrink-0 items-center gap-2 rounded-2xl bg-[#1675b8] px-7 py-3 text-[0.94rem] font-semibold text-white shadow-[0_6px_20px_-6px_rgba(22,117,184,0.55)] transition hover:bg-[#0d5e96] hover:-translate-y-0.5 sm:inline-flex"
                >
                  Avançar
                  <FiArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* Categorias temáticas */}
              <div className="rounded-2xl border border-[#e8e9f0] bg-white p-5 shadow-[0_2px_8px_rgba(20,33,51,0.05)]">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[0.72rem] font-bold uppercase tracking-widest text-[#9ca3af]">Categorias Temáticas</p>
                  {ed.draft.categories.length > 0 && (
                    <p className="text-[0.78rem] text-[#6b7280]">
                      Principal: <strong className="text-[#1e1e1e]">{ed.draft.categories[0]}</strong>
                      {ed.draft.categories.length > 1 && ` +${ed.draft.categories.length - 1} mais`}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {TOP_CATEGORIES.map((cat) => {
                    const selected = ed.draft.categories.includes(cat);
                    const isPrimary = ed.draft.categories[0] === cat;
                    const color = TOP_CATEGORY_COLORS[cat] ?? "bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]";
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => ed.toggleCategory(cat)}
                        className={`rounded-full border px-3.5 py-1.5 text-[0.8rem] font-semibold transition ${
                          selected
                            ? `${color} shadow-sm scale-[1.02]`
                            : "border-[#e5e7eb] bg-white text-[#9ca3af] hover:border-[#d1d5db] hover:text-[#6b7280]"
                        }`}
                      >
                        {isPrimary ? "★ " : selected ? "✓ " : ""}
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ano de referência + CTA principal */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[0.84rem] font-medium text-[#6b7280]">Ano de referência:</span>
                  <div className="relative">
                    <select
                      value={selectedYear}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setYear(e.target.value)}
                      className="appearance-none rounded-xl border border-[#e2e8f0] bg-white py-2 pl-3 pr-8 text-[0.84rem] font-medium text-[#1e1e1e] outline-none focus:border-[#1675b8]"
                    >
                      {AVAILABLE_YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-[#8a9ab0]" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={goToStep2}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#1675b8_0%,#1255a0_100%)] px-8 py-3 text-[0.94rem] font-bold text-white shadow-[0_10px_28px_-10px_rgba(22,117,184,0.55)] transition hover:-translate-y-0.5"
                >
                  Selecionar Projetos
                  <FiArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Divisor — Detalhes opcionais */}
            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#e8e9f0]" />
              <span className="shrink-0 rounded-full border border-[#e8e9f0] bg-white px-4 py-1.5 text-[0.72rem] font-bold uppercase tracking-widest text-[#9ca3af]">
                Detalhes do projeto (opcional)
              </span>
              <div className="h-px flex-1 bg-[#e8e9f0]" />
            </div>

            {/* Layout: sidebar + seções */}
            <div className="flex w-full items-start gap-6">

              {/* ── Sidebar nav (sticky, desktop only) ── */}
              <aside className="hidden w-52 shrink-0 md:block">
                <div className="sticky top-24 space-y-3">
                  <div className="rounded-2xl border border-[#e8e9f0] bg-white p-4 shadow-[0_2px_8px_rgba(20,33,51,0.05)]">
                    <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-widest text-[#9ca3af]">Seções</p>
                    <div className="space-y-0.5">
                      {[
                        { id: "section-context",        label: "Contexto",        icon: <FiTarget className="h-4 w-4" />,     filled: !!(eventName || eventType || audience) },
                        { id: "section-identity",       label: "Identidade",      icon: <FiFileText className="h-4 w-4" />,   filled: !!ed.draft.name, required: true },
                        { id: "section-classification", label: "Classificação",   icon: <FiTag className="h-4 w-4" />,        filled: ed.draft.categories.length > 0, required: true },
                        { id: "section-indicators",     label: "Indicadores",     icon: <FiTrendingUp className="h-4 w-4" />, filled: ed.draft.indicators.length > 0 },
                        { id: "section-media",          label: "Mídia",           icon: <FiImage className="h-4 w-4" />,      filled: ed.draft.images.length + ed.draft.videos.length > 0 },
                        { id: "section-ods",            label: "ODS",             icon: <FiGlobe className="h-4 w-4" />,      filled: ed.draft.ods.length > 0 },
                        { id: "section-links",          label: "Links e Fontes",  icon: <FiLink className="h-4 w-4" />,       filled: ed.draft.officialLinks.length + ed.draft.sources.length > 0 },
                        { id: "section-awards",         label: "Prêmios",         icon: <FiAward className="h-4 w-4" />,      filled: ed.draft.awards.length > 0 },
                      ].map((sec) => (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => scrollToSection(sec.id)}
                          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[0.82rem] font-medium transition ${
                            activeSection === sec.id
                              ? "bg-[#eff6ff] text-[#1d4ed8]"
                              : "text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1e1e1e]"
                          }`}
                        >
                          <span className={activeSection === sec.id ? "text-[#1d4ed8]" : "text-[#9ca3af]"}>
                            {sec.icon}
                          </span>
                          <span className="flex-1 truncate">{sec.label}</span>
                          {sec.filled ? (
                            <span className="h-2 w-2 rounded-full bg-[#4ade80]" />
                          ) : sec.required ? (
                            <span className="h-2 w-2 rounded-full bg-[#fca5a5]" />
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Legenda */}
                  <div className="rounded-2xl border border-[#e8e9f0] bg-white p-3 shadow-[0_2px_8px_rgba(20,33,51,0.05)]">
                    <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-wide text-[#9ca3af]">Legenda</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[0.73rem] text-[#6b7280]">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[#4ade80]" /> Preenchido
                      </div>
                      <div className="flex items-center gap-2 text-[0.73rem] text-[#6b7280]">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[#fca5a5]" /> Obrigatório
                      </div>
                    </div>
                  </div>

                </div>
              </aside>

              {/* ── Main content ── */}
              <div ref={mainContentRef} className="min-w-0 flex-1 space-y-4">

                {/* Contexto */}
                <section id="section-context" className="scroll-mt-6 rounded-2xl border border-[#e8e9f0] bg-white shadow-[0_2px_12px_rgba(20,33,51,0.06)]">
                  <div className="flex items-center gap-3 border-b border-[#f0f1f5] px-6 py-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f0f4ff] text-[#4f84c4]">
                      <FiTarget className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[0.95rem] font-bold text-[#1e1e1e]">Contexto da Apresentação</p>
                      <p className="text-[0.78rem] text-[#9ca3af]">Evento, público-alvo e idioma</p>
                    </div>
                  </div>
                  <div className="space-y-3 px-6 py-5">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        type="text"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        placeholder="Nome do evento ou ocasião…"
                        className="h-[44px] flex-1 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-[0.9rem] text-[#1e1e1e] placeholder:text-[#bbb] outline-none focus:border-[#1675b8] focus:ring-2 focus:ring-[#1675b8]/10"
                      />
                      <div className="relative shrink-0">
                        <select
                          value={eventType}
                          onChange={(e) => setEventType(e.target.value as EventType | "")}
                          className="h-[44px] w-[192px] appearance-none rounded-xl border border-[#e2e8f0] bg-[#f8fafc] pl-4 pr-9 text-[0.88rem] text-[#5a6a7e] outline-none focus:border-[#1675b8]"
                        >
                          <option value="">Tipo de evento</option>
                          {EVENT_TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-[#8a9ab0]" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        type="text"
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        placeholder="Público-alvo (ex: gestores, parceiros, imprensa)…"
                        className="h-[44px] flex-1 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-[0.9rem] text-[#1e1e1e] placeholder:text-[#bbb] outline-none focus:border-[#1675b8] focus:ring-2 focus:ring-[#1675b8]/10"
                      />
                      <div className="relative shrink-0">
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value as PresentationLanguage)}
                          className="h-[44px] w-[192px] appearance-none rounded-xl border border-[#e2e8f0] bg-[#f8fafc] pl-4 pr-9 text-[0.88rem] text-[#5a6a7e] outline-none focus:border-[#1675b8]"
                        >
                          {LANGUAGE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-[#8a9ab0]" />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Seções do projeto (componentes reutilizados do ProjectEditor) */}
                <IdentitySection
                  name={ed.draft.name}
                  shortDescription={ed.draft.shortDescription}
                  fullDescription={ed.draft.fullDescription}
                  status={ed.draft.status}
                  implementationDate={ed.draft.implementationDate}
                  errors={ed.errors}
                  onChange={(field, value) => ed.patch({ [field]: value } as never)}
                  onStatusChange={ed.setStatus}
                />

                <ClassificationSection
                  categories={ed.draft.categories}
                  governmentArea={ed.draft.governmentArea}
                  mainDepartment={ed.draft.mainDepartment}
                  relatedDepartments={ed.draft.relatedDepartments}
                  technologies={ed.draft.technologies}
                  keywords={ed.draft.keywords}
                  targetAudience={ed.draft.targetAudience}
                  errors={ed.errors}
                  onToggleCategory={ed.toggleCategory}
                  onAreaChange={ed.setGovernmentArea}
                  onFieldChange={(f, v) => ed.patch({ [f]: v } as never)}
                  onAddTag={ed.addTag}
                  onRemoveTag={ed.removeTag}
                />

                <IndicatorsSection
                  indicators={ed.draft.indicators}
                  onAdd={ed.addIndicator}
                  onUpdate={ed.updateIndicator}
                  onRemove={ed.removeIndicator}
                />

                <MediaSection
                  images={ed.draft.images}
                  videos={ed.draft.videos}
                  onAddImage={ed.addImage}
                  onUpdateImage={ed.updateImage}
                  onRemoveImage={ed.removeImage}
                  onSetPrimary={ed.setPrimaryImage}
                  onAddVideo={ed.addVideo}
                  onUpdateVideo={ed.updateVideo}
                  onRemoveVideo={ed.removeVideo}
                />

                <OdsSection
                  selected={ed.draft.ods}
                  onToggle={ed.toggleOds}
                />

                <LinksSection
                  links={ed.draft.officialLinks}
                  sources={ed.draft.sources}
                  onAddLink={ed.addLink}
                  onUpdateLink={ed.updateLink}
                  onRemoveLink={ed.removeLink}
                  onAddSource={(v) => ed.addTag("sources", v)}
                  onRemoveSource={(v) => ed.removeTag("sources", v)}
                />

                <AwardsSection
                  awards={ed.draft.awards}
                  onAdd={ed.addAward}
                  onUpdate={ed.updateAward}
                  onRemove={ed.removeAward}
                />

              </div>
            </div>
          </section>
        )}

        {/* ── Etapa 2 — Acervo de Projetos ── */}
        {step === 2 && (
          <section className="mx-auto max-w-[1100px]">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[1.8rem] font-extrabold tracking-[-0.04em] text-[#1e1e1e] sm:text-[2.4rem]">
                  Selecionar Projetos
                </h2>
                <p className="mt-1 text-[0.94rem] text-[#706e6e]">
                  Escolha os projetos do acervo institucional para esta apresentação.
                  {primaryCategory !== "Todos" && (
                    <> Exibindo projetos de <strong>{primaryCategory}</strong>.</>
                  )}
                </p>
              </div>
              {selectedIds.size > 0 && (
                <span className="inline-flex h-9 shrink-0 items-center rounded-full bg-[#1675b8] px-4 text-[0.88rem] font-bold text-white">
                  {selectedIds.size} selecionado{selectedIds.size !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Busca */}
            <div className="mb-5 flex items-center gap-3">
              <div className="relative flex-1">
                <FaSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                <input
                  type="search"
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  placeholder="Buscar por nome, secretaria…"
                  className="h-12 w-full rounded-full border border-[#e2e8f0] bg-white pl-11 pr-4 text-[0.94rem] shadow-sm outline-none focus:border-[#1675b8] focus:ring-2 focus:ring-[#1675b8]/15"
                />
              </div>
              <span className="shrink-0 text-[0.86rem] text-[#9ca3af]">
                {filteredProjects.length} projeto{filteredProjects.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Grid */}
            {projectsLoading ? (
              <div className="flex items-center justify-center py-20">
                <FiLoader className="h-8 w-8 animate-spin text-[#1675b8]" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[#d1d5db] bg-[#f9fafb] py-16 text-center">
                <p className="text-[1rem] font-semibold text-[#6b7280]">Nenhum projeto encontrado</p>
                <p className="mt-1 text-[0.88rem] text-[#9ca3af]">Ajuste os filtros ou avance sem selecionar projetos.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((project) => {
                  const isSelected = selectedIds.has(project.id);
                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => toggleProject(project.id)}
                      aria-pressed={isSelected}
                      className={`relative rounded-[20px] border-2 bg-white p-5 text-left shadow-[0_2px_12px_rgba(0,0,0,0.07)] transition hover:-translate-y-0.5 ${
                        isSelected
                          ? "border-[#1675b8] shadow-[0_4px_20px_rgba(22,117,184,0.2)]"
                          : "border-[#e2e8f0] hover:border-[#93c5fd]"
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-[#1675b8]">
                          <FiCheck className="h-3.5 w-3.5 text-white" />
                        </span>
                      )}
                      <p className="pr-8 text-[0.98rem] font-bold leading-tight text-[#1e1e1e]">
                        {project.name}
                      </p>
                      <p className="mt-1.5 line-clamp-2 text-[0.84rem] leading-6 text-[#6b7280]">
                        {project.shortDescription}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[0.74rem] font-semibold text-[#475569]">
                          {project.mainDepartment}
                        </span>
                        {project.categories.slice(0, 2).map((cat) => (
                          <span
                            key={cat}
                            className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[0.74rem] font-semibold text-[#1d4ed8]"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <StepNav
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
              nextLabel="Montar Módulos"
              skipLabel="Avançar sem selecionar projetos"
              onSkip={() => setStep(3)}
            />
          </section>
        )}

        {/* ── Etapa 3 — Módulos ── */}
        {step === 3 && (
          <section className="mx-auto max-w-[1100px]">
            <div className="mb-6">
              <h2 className="text-[1.8rem] font-extrabold tracking-[-0.04em] text-[#1e1e1e] sm:text-[2.4rem]">
                Módulos da Apresentação
              </h2>
              <p className="mt-1 text-[0.94rem] text-[#706e6e]">
                O sistema sugeriu módulos com base nos projetos e no tipo de evento.
                Ajuste, reordene, oculte ou duplique conforme necessário.
              </p>
            </div>

            {moduleConfigs.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <FiLoader className="h-8 w-8 animate-spin text-[#1675b8]" />
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                {/* Lista de módulos */}
                <div className="space-y-2">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[0.82rem] font-bold uppercase tracking-widest text-[#9ca3af]">
                      Módulos ({activeModuleCount} ativos)
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const selectedProjs = allProjects.filter((p) => selectedIds.has(p.id));
                        const suggested = suggestModules(selectedProjs, primaryCategory, eventType, ed.draft.categories.slice(1) as string[]);
                        setModuleConfigs(suggested);
                        setSuggestedIds(new Set(suggested.filter((m) => m.enabled).map((m) => m.moduleId)));
                      }}
                      className="text-[0.8rem] font-semibold text-[#1675b8] hover:underline"
                    >
                      Redefinir sugestões
                    </button>
                  </div>

                  {moduleConfigs.map((config, index) => {
                    const info = MODULE_DEFINITIONS[config.moduleId];
                    const isSuggested = suggestedIds.has(config.moduleId) && !config.duplicatedFrom;
                    const Icon = MODULE_ICONS[config.moduleId];
                    const catStyle = CATEGORY_STYLES[info.category];

                    return (
                      <ModuleRow
                        key={config.instanceId}
                        config={config}
                        info={info}
                        icon={<Icon className="h-4.5 w-4.5" />}
                        catStyle={catStyle}
                        isSuggested={isSuggested}
                        isFirst={index === 0}
                        isLast={index === moduleConfigs.length - 1}
                        isDuplicate={!!config.duplicatedFrom}
                        onToggleEnabled={() => toggleModuleEnabled(config.instanceId)}
                        onToggleHidden={() => toggleModuleHidden(config.instanceId)}
                        onMoveUp={() => moveModule(config.instanceId, -1)}
                        onMoveDown={() => moveModule(config.instanceId, 1)}
                        onDuplicate={() => duplicateModule(config.instanceId)}
                        onRemove={() => removeModule(config.instanceId)}
                      />
                    );
                  })}
                </div>

                {/* Resumo lateral */}
                <div className="lg:sticky lg:top-24 lg:self-start">
                  <div className="rounded-[24px] border border-[#e2e8f0] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.07)]">
                    <p className="text-[0.82rem] font-bold uppercase tracking-widest text-[#9ca3af]">
                      Resumo da apresentação
                    </p>

                    <div className="mt-4 space-y-3">
                      <SummaryRow
                        icon={<FiZap className="h-4 w-4" />}
                        label="Enfoque principal"
                        value={primaryCategory !== "Todos" ? primaryCategory : "Não definido"}
                      />
                      {ed.draft.categories.length > 1 && (
                        <SummaryRow
                          icon={<FiTag className="h-4 w-4" />}
                          label="Enfoques secundários"
                          value={ed.draft.categories.slice(1).join(", ")}
                        />
                      )}
                      {audience && (
                        <SummaryRow
                          icon={<FiUser className="h-4 w-4" />}
                          label="Público-alvo"
                          value={audience}
                        />
                      )}
                      <SummaryRow
                        icon={<FiGlobe className="h-4 w-4" />}
                        label="Idioma"
                        value={LANGUAGE_OPTIONS.find((o) => o.value === language)?.label ?? language}
                      />
                      {(eventName || eventType) && (
                        <SummaryRow
                          icon={<FiFileText className="h-4 w-4" />}
                          label="Evento"
                          value={[eventName, EVENT_TYPE_OPTIONS.find((o) => o.value === eventType)?.label].filter(Boolean).join(" · ")}
                        />
                      )}
                      <SummaryRow
                        icon={<FiTarget className="h-4 w-4" />}
                        label="Projetos"
                        value={selectedIds.size === 0 ? "Nenhum selecionado" : `${selectedIds.size} projeto${selectedIds.size !== 1 ? "s" : ""}`}
                        highlight={selectedIds.size > 0}
                      />
                      <SummaryRow
                        icon={<FiGrid className="h-4 w-4" />}
                        label="Módulos ativos"
                        value={`${activeModuleCount} de ${moduleConfigs.length}`}
                        highlight={activeModuleCount > 0}
                      />
                    </div>

                    {saveError && (
                      <p className="mt-4 rounded-xl bg-[#fef2f2] px-3 py-2 text-[0.84rem] text-[#b91c1c]">
                        {saveError}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={isSaving || activeModuleCount === 0}
                      className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full bg-[linear-gradient(90deg,#1675b8_0%,#1255a0_100%)] py-3.5 text-[1rem] font-bold text-white shadow-[0_10px_24px_-10px_rgba(22,117,184,0.6)] transition hover:-translate-y-0.5 disabled:opacity-60"
                    >
                      {isSaving ? (
                        <><FiLoader className="h-4.5 w-4.5 animate-spin" /> Gerando…</>
                      ) : (
                        <><FiZap className="h-4.5 w-4.5" /> Gerar Apresentação</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <StepNav onBack={goToStep2} />
          </section>
        )}
      </main>
    </div>
  );
}

// ─── ModuleRow ────────────────────────────────────────────────────────────────

function ModuleRow({
  config,
  info,
  icon,
  catStyle,
  isSuggested,
  isFirst,
  isLast,
  isDuplicate,
  onToggleEnabled,
  onToggleHidden,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
}: {
  config: PresentationModuleConfig;
  info: ModuleInfo;
  icon: React.ReactNode;
  catStyle: { label: string; cls: string };
  isSuggested: boolean;
  isFirst: boolean;
  isLast: boolean;
  isDuplicate: boolean;
  onToggleEnabled: () => void;
  onToggleHidden: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const { enabled, hidden } = config;
  const inactive = !enabled || hidden;

  return (
    <div
      className={`flex items-center gap-3 rounded-[18px] border-2 bg-white px-4 py-3.5 transition-all ${
        inactive
          ? "border-[#e2e8f0] opacity-50"
          : "border-[#1675b8] shadow-[0_2px_12px_rgba(22,117,184,0.10)]"
      }`}
    >
      {/* Reordenar */}
      <div className="flex shrink-0 flex-col gap-0.5">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          aria-label="Mover para cima"
          className="flex h-6 w-6 items-center justify-center rounded-md text-[#9ca3af] transition hover:bg-[#f3f4f6] hover:text-[#374151] disabled:opacity-30"
        >
          <FiChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          aria-label="Mover para baixo"
          className="flex h-6 w-6 items-center justify-center rounded-md text-[#9ca3af] transition hover:bg-[#f3f4f6] hover:text-[#374151] disabled:opacity-30"
        >
          <FiChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Ícone do módulo */}
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
          enabled && !hidden ? "bg-[#eff6ff] text-[#1675b8]" : "bg-[#f3f4f6] text-[#9ca3af]"
        }`}
      >
        {icon}
      </span>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-[0.94rem] font-bold text-[#1e1e1e]">{info.title}</p>
          <span className={`rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${catStyle.cls}`}>
            {catStyle.label}
          </span>
          {isSuggested && (
            <span className="rounded-full bg-[#f0fdf4] px-2 py-0.5 text-[0.68rem] font-bold text-[#16a34a]">
              Sugerido
            </span>
          )}
          {isDuplicate && (
            <span className="rounded-full bg-[#fef3c7] px-2 py-0.5 text-[0.68rem] font-bold text-[#92400e]">
              Cópia
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[0.8rem] leading-relaxed text-[#6b7280]">{info.description}</p>
      </div>

      {/* Ações */}
      <div className="flex shrink-0 items-center gap-1">
        {/* Ocultar */}
        <ModuleAction
          label={hidden ? "Exibir módulo" : "Ocultar módulo"}
          onClick={onToggleHidden}
          active={!hidden}
          icon={hidden ? <FiEyeOff className="h-3.5 w-3.5" /> : <FiEye className="h-3.5 w-3.5" />}
        />

        {/* Duplicar */}
        <ModuleAction
          label="Duplicar módulo"
          onClick={onDuplicate}
          icon={<FiCopy className="h-3.5 w-3.5" />}
        />

        {/* Remover duplicata */}
        {isDuplicate && (
          <ModuleAction
            label="Remover cópia"
            onClick={onRemove}
            icon={<FiX className="h-3.5 w-3.5" />}
            danger
          />
        )}

        {/* Ativar/Desativar */}
        <button
          type="button"
          onClick={onToggleEnabled}
          aria-pressed={enabled}
          aria-label={enabled ? "Desativar módulo" : "Ativar módulo"}
          className={`relative ml-1 h-6 w-11 rounded-full border-2 transition-colors ${
            enabled
              ? "border-[#1675b8] bg-[#1675b8]"
              : "border-[#d1d5db] bg-[#f3f4f6]"
          }`}
        >
          <span
            className={`absolute top-[1px] h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
              enabled ? "left-[22px]" : "left-[1px]"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

function ModuleAction({
  label,
  onClick,
  icon,
  active,
  danger,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
        danger
          ? "text-[#9ca3af] hover:bg-[#fef2f2] hover:text-[#b91c1c]"
          : active === false
            ? "text-[#d1d5db] hover:bg-[#f3f4f6] hover:text-[#374151]"
            : "text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#374151]"
      }`}
    >
      {icon}
    </button>
  );
}

// ─── Sub-componentes gerais ───────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Contexto" },
    { n: 2, label: "Projetos" },
    { n: 3, label: "Módulos" },
  ];

  return (
    <div className="mb-10 flex items-center justify-center gap-0">
      {steps.map((s, i) => {
        const done    = currentStep > s.n;
        const current = currentStep === s.n;
        return (
          <div key={s.n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-[0.86rem] font-bold transition ${
                  done
                    ? "bg-[#1675b8] text-white"
                    : current
                      ? "border-2 border-[#1675b8] bg-white text-[#1675b8]"
                      : "border-2 border-[#d1d5db] bg-white text-[#9ca3af]"
                }`}
              >
                {done ? <FiCheck className="h-4.5 w-4.5" /> : s.n}
              </div>
              <span
                className={`mt-1.5 text-[0.74rem] font-semibold ${
                  current ? "text-[#1675b8]" : done ? "text-[#1675b8]" : "text-[#9ca3af]"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mx-3 mb-5 h-0.5 w-[60px] sm:w-[100px] ${
                  currentStep > s.n ? "bg-[#1675b8]" : "bg-[#e2e8f0]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepNav({
  onBack,
  onNext,
  nextLabel,
  skipLabel,
  onSkip,
}: {
  onBack: () => void;
  onNext?: () => void;
  nextLabel?: string;
  skipLabel?: string;
  onSkip?: () => void;
}) {
  return (
    <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-5 py-2.5 text-[0.94rem] font-semibold text-[#475569] transition hover:bg-[#f8fafc]"
      >
        <FiArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      <div className="flex flex-col items-center gap-2 sm:items-end">
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-2.5 rounded-full bg-[linear-gradient(90deg,#1675b8_0%,#1255a0_100%)] px-6 py-2.5 text-[0.94rem] font-bold text-white shadow-[0_8px_20px_-8px_rgba(22,117,184,0.5)] transition hover:-translate-y-0.5"
          >
            {nextLabel ?? "Próximo"}
            <FiArrowRight className="h-4 w-4" />
          </button>
        )}
        {skipLabel && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="text-[0.82rem] text-[#9ca3af] underline-offset-2 hover:text-[#1675b8] hover:underline"
          >
            {skipLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-0.5 shrink-0 ${highlight ? "text-[#1675b8]" : "text-[#9ca3af]"}`}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.76rem] uppercase tracking-wide text-[#9ca3af]">{label}</p>
        <p className={`truncate text-[0.88rem] font-semibold ${highlight ? "text-[#1675b8]" : "text-[#374151]"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default CreatePresentationPage;
