/**
 * CreatePresentationPage — Wizard de criação de apresentações institucionais.
 *
 * Etapa única: Contexto — evento, objetivo, público, enfoques
 * Pós-geração: ajuste de módulos na página de apresentação gerada
 */

import type { ChangeEvent, CSSProperties } from "react";
import { useContext, useEffect, useRef, useState } from "react";
import {
  FaChevronDown,
  FaSearch,
} from "react-icons/fa";
import {
  FiAlertCircle,
  FiArrowRight,
  FiAward,
  FiBookOpen,
  FiFileText,
  FiGlobe,
  FiImage,
  FiLink,
  FiLoader,
  FiTag,
  FiTarget,
  FiTrendingUp,
  FiX,
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
import { AdminConsoleContext } from "../../context/AdminConsoleContext";
import { useAuth } from "../../context";
import { canCreatePresentations } from "../../lib/accessControl";
import { getPresentationsRouteForUser } from "../../lib/authRouting";
import { templateService } from "../../services/templateService";
import type { EventType } from "../../types/institutionalPresentation";
import type { ProjectCategory } from "../../types/project";
import { authFetch } from "../../lib/apiClient";
import { ROUTE_PATHS } from "../../router/paths";
import { buildPresentationSearchParams } from "../../router/presentationSearchParams";

// ─── Dados estáticos ─────────────────────────────────────────────────────────


const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: "congresso",         label: "Congresso" },
  { value: "visita-tecnica",    label: "Visita Técnica" },
  { value: "premiacao",         label: "Premiação" },
  { value: "reuniao-interna",   label: "Reunião Interna" },
  { value: "feira",             label: "Feira / Expo" },
  { value: "audiencia-publica", label: "Audiência Pública" },
  { value: "outro",             label: "Outro" },
];

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

// ─── Componente principal ─────────────────────────────────────────────────────

function CreatePresentationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { logout, user } = useAuth();
  const adminConsole = useContext(AdminConsoleContext);
  const sectorOptions = (adminConsole?.setores ?? []).map((s) => ({ value: s.id, label: s.nome }));
  const canCreate = canCreatePresentations(user);

  // ── Editor de projeto integrado (sem auto-save) ──
  const ed = useProjectEditor(null, user?.id ?? "unknown", user?.department ?? "", { noAutoSave: true });

  // ── Scroll-spy para nav lateral ──
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState("section-context");

  // ── Etapa 1 — contexto da apresentação ──
  const [eventName, setEventName]   = useState("");
  const [eventType, setEventType]   = useState<EventType | "">("");
  const [audience, setAudience]     = useState("");
  const [search, setSearch]         = useState(DEFAULT_PRESENTATION_FILTERS.query);

  // Categoria primária = primeira da lista; secundárias = restantes
  const primaryCategory = (ed.draft.categories[0] ?? "Todos") as string;

  // ── Template pré-carregado ──
  const [templateBanner, setTemplateBanner] = useState<string | null>(null);

  // ── Validação etapa 1 ──
  const [step1Error, setStep1Error] = useState("");

  // ── Salvando ──
  const [isSaving, setIsSaving]   = useState(false);
  const [saveError, setSaveError] = useState("");

  // Pré-preenche o wizard a partir de um template (quando ?templateId= está na URL)
  useEffect(() => {
    const templateId = searchParams.get("templateId");
    if (!templateId) return;

    templateService.getTemplateById(templateId).then((template) => {
      if (!template) return;

      // Etapa 1 — contexto
      if (template.eventName) setEventName(template.eventName);
      if (template.eventType) setEventType(template.eventType);
      if (template.categories.length > 0) {
        ed.patch({ categories: template.categories });
      }

      setTemplateBanner(template.name);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll-spy: destaca seção ativa no nav lateral
  useEffect(() => {
    const container = mainContentRef.current;
    if (!container) return;
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
  }, []);

  // ── Handlers ──
  function handleLogout() {
    logout();
    navigate(ROUTE_PATHS.login);
  }

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  }

  async function handleSubmit() {
    if (ed.draft.categories.length === 0) {
      setStep1Error("Selecione pelo menos uma categoria temática antes de avançar.");
      document.getElementById("section-classification-top")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!ed.draft.name.trim()) {
      setStep1Error("O título do projeto é obrigatório.");
      document.getElementById("section-identity")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!ed.draft.shortDescription.trim()) {
      setStep1Error("A descrição curta do projeto é obrigatória.");
      document.getElementById("section-identity")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setStep1Error("");
    await handleGenerate();
  }

  // ── Geração ──
  async function handleGenerate() {
    setSaveError("");
    setIsSaving(true);
    try {
      if (!user?.teams?.length) {
        setSaveError("Você precisa estar associado a um time para criar um projeto. Entre em contato com o administrador.");
        return;
      }

      const teamId = parseInt((user.teams as Array<{ id: string }>)[0].id, 10);
      const userId = parseInt(user.id, 10);

      const iaPrompt = [
        search.trim(),
        eventName.trim(),
        eventType ? `Tipo de evento: ${eventType}` : "",
        audience.trim() ? `Público-alvo: ${audience.trim()}` : "",
        ed.draft.categories.length > 0 ? `Categoria: ${ed.draft.categories[0]}` : "",
      ].filter(Boolean).join(". ");

      // Sources: usa links oficiais como fontes, com fallback para site da prefeitura
      const sources =
        ed.draft.officialLinks.length > 0
          ? ed.draft.officialLinks.map((l) => l.url)
          : ["https://barueri.sp.gov.br"];

      const payload = {
        ia_prompt: iaPrompt || ed.draft.name,
        name: ed.draft.name.trim(),
        user: userId,
        team: teamId,
        family: 0,
        source: sources,
        main_department: ed.draft.mainDepartment || user.department || "Prefeitura de Barueri",
        related_departments: ed.draft.relatedDepartments,
        areas: ed.draft.categories as string[],
        ods: ed.draft.ods as number[],
        technologies: ed.draft.technologies,
        keywords: ed.draft.keywords,
        ...(ed.draft.shortDescription.trim() ? { short_description: ed.draft.shortDescription } : {}),
        ...(ed.draft.fullDescription.trim() ? { full_description: ed.draft.fullDescription } : {}),
        ...(eventName.trim() || primaryCategory ? { theme: eventName.trim() || primaryCategory } : {}),
        ...(audience.trim() ? { audience: audience.trim() } : {}),
        ...(ed.draft.implementationDate ? { implementation_date: ed.draft.implementationDate } : {}),
        ...(ed.draft.awards.length > 0 ? {
          awards: ed.draft.awards.map((a) => ({
            institution: a.organization || a.name,
            year: parseInt(a.year, 10),
            description: a.description,
            link: a.link,
          })),
        } : {}),
        ...(ed.draft.indicators.length > 0 ? {
          indicators: ed.draft.indicators.map((i) => ({
            label: i.label,
            value: i.value,
            measure: i.unit,
            source: i.source,
            year: parseInt(i.year, 10),
          })),
        } : {}),
      };

      const res = await authFetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { message?: string | string[] };
        const msg = Array.isArray(errData?.message) ? errData.message.join(", ") : (errData?.message ?? `Erro ${res.status}`);
        setSaveError(`Erro ao criar projeto: ${msg}`);
        return;
      }

      const project = await res.json() as { id: string; slides_url?: string };

      // Navega diretamente para a página de apresentação gerada
      const params = buildPresentationSearchParams({
        query:    search.trim() || DEFAULT_PRESENTATION_FILTERS.query,
        category: primaryCategory,
        year:     DEFAULT_PRESENTATION_FILTERS.year,
      });
      params.set("pid", project.id);
      if (project.slides_url) params.set("dlUrl", `/projects/${project.id}/pptx`);
      navigate(`${ROUTE_PATHS.generatedPresentation}?${params.toString()}`);
    } catch {
      setSaveError("Erro ao salvar o projeto. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

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
        {/* ── Dados do Projeto + Contexto ── */}
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
                    onKeyDown={(e) => { if (e.key === "Enter") void handleSubmit(); }}
                    placeholder="Tema, objetivo ou categoria da apresentação…"
                    className="h-[58px] w-full rounded-2xl border border-[#e2e8f0] bg-white pl-12 pr-4 text-[1rem] text-[#1e1e1e] placeholder:text-[#9ca3af] shadow-[0_2px_12px_rgba(20,33,51,0.07)] outline-none focus:border-[#1675b8] focus:ring-2 focus:ring-[#1675b8]/10 transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={isSaving}
                  className="hidden shrink-0 items-center gap-2 rounded-2xl bg-[#1675b8] px-7 py-3 text-[0.94rem] font-semibold text-white shadow-[0_6px_20px_-6px_rgba(22,117,184,0.55)] transition hover:bg-[#0d5e96] hover:-translate-y-0.5 disabled:opacity-60 sm:inline-flex"
                >
                  {isSaving ? "Gerando…" : "Gerar Apresentação"}
                  <FiArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* Categorias temáticas */}
              <div id="section-classification-top" className={`rounded-2xl border bg-white p-5 shadow-[0_2px_8px_rgba(20,33,51,0.05)] transition ${step1Error && ed.draft.categories.length === 0 ? "border-[#fca5a5] ring-2 ring-[#fca5a5]/30" : "border-[#e8e9f0]"}`}>
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
                      <p className="text-[0.78rem] text-[#9ca3af]">Evento e público-alvo</p>
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
                    <input
                      type="text"
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      placeholder="Público-alvo (ex: gestores, parceiros, imprensa)…"
                      className="h-[44px] w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-[0.9rem] text-[#1e1e1e] placeholder:text-[#bbb] outline-none focus:border-[#1675b8] focus:ring-2 focus:ring-[#1675b8]/10"
                    />
                  </div>
                </section>

                {/* Seções do projeto (componentes reutilizados do ProjectEditor) */}
                <IdentitySection
                  name={ed.draft.name}
                  shortDescription={ed.draft.shortDescription}
                  fullDescription={ed.draft.fullDescription}
                  implementationDate={ed.draft.implementationDate}
                  errors={ed.errors}
                  onChange={(field, value) => ed.patch({ [field]: value } as never)}
                />

                <ClassificationSection
                  categories={ed.draft.categories}
                  governmentArea={ed.draft.governmentArea}
                  mainDepartment={ed.draft.mainDepartment}
                  relatedDepartments={ed.draft.relatedDepartments}
                  technologies={ed.draft.technologies}
                  keywords={ed.draft.keywords}
                  errors={ed.errors}
                  onToggleCategory={ed.toggleCategory}
                  onAreaChange={ed.setGovernmentArea}
                  onFieldChange={(f, v) => ed.patch({ [f]: v } as never)}
                  onAddTag={ed.addTag}
                  onRemoveTag={ed.removeTag}
                  sectorOptions={sectorOptions.length > 0 ? sectorOptions : undefined}
                  hideCategories
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
                  onAddLink={ed.addLink}
                  onUpdateLink={ed.updateLink}
                  onRemoveLink={ed.removeLink}
                />

                <AwardsSection
                  awards={ed.draft.awards}
                  onAdd={ed.addAward}
                  onUpdate={ed.updateAward}
                  onRemove={ed.removeAward}
                />

                {/* ── Botão Avançar inferior ── */}
                <div className="flex flex-col items-end gap-2 pt-2">
                  {step1Error && (
                    <p className="flex items-center gap-2 text-[0.84rem] font-medium text-[#b91c1c]">
                      <FiAlertCircle className="h-4 w-4 shrink-0" />
                      {step1Error}
                    </p>
                  )}
                  {saveError && (
                    <p className="flex items-center gap-2 text-[0.84rem] font-medium text-[#b91c1c]">
                      <FiAlertCircle className="h-4 w-4 shrink-0" />
                      {saveError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleSubmit()}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#1675b8_0%,#1255a0_100%)] px-8 py-3.5 text-[0.94rem] font-bold text-white shadow-[0_10px_28px_-10px_rgba(22,117,184,0.55)] transition hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {isSaving ? (
                      <><FiLoader className="h-4 w-4 animate-spin" /> Gerando…</>
                    ) : (
                      <>Gerar Apresentação <FiArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                </div>

              </div>
            </div>
          </section>

      </main>
    </div>
  );
}

export default CreatePresentationPage;
