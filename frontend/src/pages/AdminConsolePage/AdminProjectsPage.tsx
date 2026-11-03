/**
 * AdminProjectsPage — "Minhas Apresentações"
 *
 * Duas abas:
 * - Minhas: apresentações criadas pelo usuário autenticado
 * - Times: apresentações de todos os membros do mesmo time (ou todos os times para master_admin)
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiArchive,
  FiArrowRight,
  FiCalendar,
  FiFolder,
  FiGrid,
  FiLayers,
  FiLoader,
  FiMonitor,
  FiPlus,
  FiTag,
  FiUser,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context";
import { canAccessAdminModules, canCreatePresentations } from "../../lib/accessControl";
import { formatShortDate } from "../../lib/formatters";
import { authFetch } from "../../lib/apiClient";
import { presentationService } from "../../services/presentationService";
import { projectService } from "../../services/projectService";
import type { PresentationStatus, EventType } from "../../types/institutionalPresentation";
import type { PresentationSummary } from "../../types/institutionalPresentation";
import type { ProjectStatus, ProjectSummary } from "../../types/project";
import type { AuthSessionUser } from "../../types/auth";
import { ROUTE_PATHS } from "../../router/paths";
import { buildPresentationSearchParams } from "../../router/presentationSearchParams";

// ─── Metadados de exibição ────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PresentationStatus | ProjectStatus, { label: string; cls: string }> = {
  draft:    { label: "Rascunho",  cls: "bg-[#fef9c3] text-[#92400e]" },
  active:   { label: "Ativo",     cls: "bg-[#dcfce7] text-[#166534]" },
  archived: { label: "Arquivado", cls: "bg-[#f3f4f6] text-[#6b7280]" },
};

const EVENT_LABELS: Record<EventType, string> = {
  "congresso":        "Congresso",
  "visita-tecnica":   "Visita Técnica",
  "premiacao":        "Premiação",
  "reuniao-interna":  "Reunião Interna",
  "feira":            "Feira / Expo",
  "audiencia-publica": "Audiência Pública",
  "outro":            "Outro",
};

type TabId = "minhas" | "projetos" | "times";
type StatusFilter = "all" | ProjectStatus;

// Projeto bruto da API (com teamId)
type RawApiProject = {
  id: string;
  name: string;
  short_description: string | null;
  status: number;
  main_department: string | null;
  team: string;
  last_update: string | null;
  areas: string[];
};

function mapStatusNum(s: number): ProjectStatus {
  if (s === 2) return "active";
  if (s === 3) return "archived";
  return "draft";
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canCreate = canCreatePresentations(user);
  const isAdmin = canAccessAdminModules(user);
  const [activeTab, setActiveTab] = useState<TabId>("minhas");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [timesStatusFilter, setTimesStatusFilter] = useState<StatusFilter>("all");

  const [presentations, setPresentations] = useState<PresentationSummary[]>([]);
  const [allProjects, setAllProjects]     = useState<ProjectSummary[]>([]);
  const [rawApiProjects, setRawApiProjects] = useState<RawApiProject[]>([]);
  const [loadingPres, setLoadingPres]     = useState(true);
  const [loadingProj, setLoadingProj]     = useState(true);
  const [loadingTimes, setLoadingTimes]   = useState(false);
  const [archivingId, setArchivingId]     = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoadingPres(true);
    presentationService.getPresentationsByUser(user.id)
      .then(setPresentations)
      .finally(() => setLoadingPres(false));
  }, [user]);

  const reloadProjects = useCallback(() => {
    setLoadingProj(true);
    projectService.getProjects()
      .then(setAllProjects)
      .finally(() => setLoadingProj(false));
  }, []);

  useEffect(() => { reloadProjects(); }, [reloadProjects]);

  useEffect(() => {
    if (activeTab !== "times" || !user) return;
    if (rawApiProjects.length > 0) return; // já carregado
    setLoadingTimes(true);
    authFetch("/api/projects")
      .then((r) => r.ok ? r.json() as Promise<RawApiProject[]> : Promise.resolve([]))
      .then(setRawApiProjects)
      .catch(() => {})
      .finally(() => setLoadingTimes(false));
  }, [activeTab, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loading = loadingPres;

  const projectMap = useMemo(
    () => new Map(allProjects.map((p) => [p.id, p.name])),
    [allProjects],
  );

  const filteredProjects = useMemo(() => {
    if (statusFilter === "all") return allProjects;
    return allProjects.filter((p) => p.status === statusFilter);
  }, [allProjects, statusFilter]);

  async function handleArchive(id: string) {
    setArchivingId(id);
    try {
      await projectService.archiveProject(id);
      reloadProjects();
    } catch {
      // silent — reload anyway to show current state
      reloadProjects();
    } finally {
      setArchivingId(null);
    }
  }

  const userTeams = user?.teams ?? [];
  const userTeamCount = userTeams.length || (user?.team ? 1 : 0);

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "minhas",   label: "Minhas",   count: presentations.length },
    ...(!isAdmin ? [{ id: "projetos" as TabId, label: "Projetos", count: allProjects.length }] : []),
    { id: "times",    label: "Times",    count: userTeamCount || undefined },
  ];

  return (
    <section>
      {/* Cabeçalho */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="page-title text-[2.2rem] font-extrabold tracking-[-0.05em] text-[#1e1e1e] sm:text-[2.8rem]">
            Minhas Apresentações
          </h1>
          <p className="page-subtitle mt-1 text-[1rem] font-medium text-[#878787]">
            {loading ? "Carregando…" : `${presentations.length} ${presentations.length !== 1 ? "apresentações" : "apresentação"}`}
          </p>
        </div>

        {canCreate && (
          <Link
            to={ROUTE_PATHS.createPresentation}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#7fb4db_0%,#6ea7d4_100%)] px-5 text-[0.98rem] font-semibold !text-white shadow-[0_10px_24px_rgba(103,156,203,0.26)] transition hover:-translate-y-0.5"
          >
            <FiPlus className="h-4.5 w-4.5 !text-white" />
            <span className="!text-white">Nova Apresentação</span>
          </Link>
        )}
      </div>

      {/* Abas */}
      <div className="mb-6 flex gap-1 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[0.92rem] font-semibold transition ${
              activeTab === tab.id
                ? "bg-white text-[#1e1e1e] shadow-[0_1px_4px_rgba(20,33,51,0.10)]"
                : "text-[#6b7280] hover:text-[#374151]"
            }`}
          >
            {tab.id === "minhas" ? (
              <FiMonitor className="h-4 w-4" />
            ) : tab.id === "times" ? (
              <FiUsers className="h-4 w-4" />
            ) : (
              <FiFolder className="h-4 w-4" />
            )}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[0.72rem] font-bold ${
                activeTab === tab.id ? "bg-[#eff6ff] text-[#1675b8]" : "bg-[#e5e7eb] text-[#6b7280]"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Aba Minhas */}
      {activeTab === "minhas" && (
        <>
          {loading && (
            <div className="flex items-center justify-center py-20">
              <FiLoader className="h-8 w-8 animate-spin text-[#1675b8]" />
            </div>
          )}
          {!loading && presentations.length === 0 && (
            <div className="flex flex-col items-center gap-5 rounded-[24px] border border-dashed border-[#d1d5db] bg-[#f9fafb] py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eff6ff]">
                <FiMonitor className="h-7 w-7 text-[#1675b8]" />
              </div>
              <div>
                <p className="text-[1.05rem] font-semibold text-[#374151]">Nenhuma apresentação ainda</p>
                <p className="mt-1 text-[0.9rem] text-[#9ca3af]">
                  Crie sua primeira apresentação inteligente com projetos e indicadores.
                </p>
              </div>
              {canCreate && (
                <Link
                  to={ROUTE_PATHS.createPresentation}
                  className="inline-flex items-center gap-2 rounded-full bg-[#1675b8] px-5 py-2.5 text-[0.94rem] font-bold text-white shadow-[0_8px_20px_-8px_rgba(22,117,184,0.5)] transition hover:-translate-y-0.5"
                >
                  <FiPlus className="h-4 w-4" /> Criar apresentação
                </Link>
              )}
            </div>
          )}
          {!loading && presentations.length > 0 && (
            <div className="grid gap-6 xl:grid-cols-2">
              {presentations.map((pres) => (
                <PresentationCard
                  key={pres.id}
                  presentation={pres}
                  projectMap={projectMap}
                  onOpen={() => {
                    const params = buildPresentationSearchParams({
                      query: pres.eventName,
                      category: pres.title,
                      year: "Todos",
                    });
                    params.set("pid", pres.id);
                    navigate(`${ROUTE_PATHS.generatedPresentation}?${params.toString()}`);
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Aba Projetos */}
      {activeTab === "projetos" && (
        <ProjectsTab
          projects={filteredProjects}
          allCount={allProjects.length}
          loading={loadingProj}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          archivingId={archivingId}
          onArchive={handleArchive}
          canArchive={!!user?.approver}
        />
      )}

      {/* Aba Times */}
      {activeTab === "times" && (
        <TimesTab
          user={user}
          rawProjects={rawApiProjects}
          loading={loadingTimes}
          statusFilter={timesStatusFilter}
          onStatusFilter={setTimesStatusFilter}
        />
      )}
    </section>
  );
}

// ─── Filtro de status (compartilhado) ────────────────────────────────────────

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all",      label: "Todos"     },
  { value: "draft",    label: "Rascunho"  },
  { value: "active",   label: "Ativo"     },
  { value: "archived", label: "Arquivado" },
];

// ─── Aba Times ────────────────────────────────────────────────────────────────

function TimesTab({
  user,
  rawProjects,
  loading,
  statusFilter,
  onStatusFilter,
}: {
  user: AuthSessionUser | null;
  rawProjects: RawApiProject[];
  loading: boolean;
  statusFilter: StatusFilter;
  onStatusFilter: (s: StatusFilter) => void;
}) {
  const teams = user?.teams ?? [];
  const hasTeams = teams.length > 0;

  // Projetos filtrados por status
  const filtered = useMemo(
    () => statusFilter === "all" ? rawProjects : rawProjects.filter((p) => mapStatusNum(p.status) === statusFilter),
    [rawProjects, statusFilter],
  );

  // Projetos agrupados por teamId
  const byTeam = useMemo(() => {
    const map = new Map<string, RawApiProject[]>();
    for (const p of filtered) {
      if (!p.team) continue;
      const list = map.get(p.team) ?? [];
      list.push(p);
      map.set(p.team, list);
    }
    return map;
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FiLoader className="h-8 w-8 animate-spin text-[#1675b8]" />
      </div>
    );
  }

  if (!hasTeams) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[24px] border border-dashed border-[#d1d5db] bg-[#f9fafb] py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f3f4f6]">
          <FiUsers className="h-7 w-7 text-[#9ca3af]" />
        </div>
        <div>
          <p className="text-[1.05rem] font-semibold text-[#374151]">
            Você não está associado a nenhum time
          </p>
          <p className="mt-1 text-[0.9rem] text-[#9ca3af]">
            {user?.department
              ? `Secretaria: ${user.department}`
              : "Entre em contato com seu administrador para ser incluído em um time."}
          </p>
        </div>
      </div>
    );
  }

  const totalProjectsInUserTeams = teams.reduce(
    (acc, t) => acc + (byTeam.get(t.id)?.length ?? 0), 0
  );

  return (
    <div className="space-y-6">
      {/* Filtro de status */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTER_OPTIONS.map((opt) => {
          const count = opt.value === "all"
            ? totalProjectsInUserTeams
            : teams.reduce((acc, t) => acc + (byTeam.get(t.id)?.filter((p) => mapStatusNum(p.status) === opt.value).length ?? 0), 0);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onStatusFilter(opt.value)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.8rem] font-semibold transition ${
                statusFilter === opt.value
                  ? "bg-[#1e3a52] text-white"
                  : "bg-[#f0f2f4] text-[#6a7a88] hover:bg-[#e4e8ec]"
              }`}
            >
              {opt.label}
              {opt.value !== "all" && (
                <span className={`rounded-full px-1.5 py-0.5 text-[0.68rem] font-bold ${
                  statusFilter === opt.value ? "bg-white/20 text-white" : "bg-white text-[#6a7a88]"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Seções por time */}
      {teams.map((team) => {
        const projects = byTeam.get(team.id) ?? [];
        return (
          <TeamSection
            key={team.id}
            team={team}
            projects={projects}
          />
        );
      })}
    </div>
  );
}

function TeamSection({
  team,
  projects,
}: {
  team: { id: string; name: string; sectorId: string; sectorName: string };
  projects: RawApiProject[];
}) {
  return (
    <section className="rounded-[20px] border border-[#e5e7eb] bg-white shadow-[0_2px_12px_rgba(20,33,51,0.05)]">
      {/* Cabeçalho do time */}
      <div className="flex items-center gap-3 border-b border-[#f3f4f6] px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eff6ff]">
          <FiUsers className="h-5 w-5 text-[#1675b8]" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[1rem] font-bold text-[#1e1e1e]">{team.name}</h2>
          <p className="text-[0.8rem] text-[#9ca3af]">{team.sectorName}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#eff6ff] px-3 py-1 text-[0.76rem] font-bold text-[#1675b8]">
          {projects.length} {projects.length !== 1 ? "projetos" : "projeto"}
        </span>
      </div>

      {/* Projetos do time */}
      {projects.length === 0 ? (
        <div className="flex items-center justify-center gap-3 py-8 text-[0.88rem] text-[#9ca3af]">
          <FiFolder className="h-5 w-5" />
          Nenhum projeto neste time com o filtro selecionado
        </div>
      ) : (
        <div className="grid gap-4 p-5 xl:grid-cols-2">
          {projects.map((p) => (
            <TeamProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </section>
  );
}

function TeamProjectCard({ project: p }: { project: RawApiProject }) {
  const status = mapStatusNum(p.status);
  const st = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <div className="flex flex-col gap-2 rounded-[14px] border border-[#f0f2f4] bg-[#f9fafb] p-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold ${st.cls}`}>
          {st.label}
        </span>
        {p.areas[0] && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[0.72rem] font-semibold text-[#475569]">
            <FiTag className="h-3 w-3" />
            {p.areas[0]}
          </span>
        )}
      </div>
      <h3 className="text-[0.95rem] font-bold leading-snug text-[#1e1e1e]">{p.name}</h3>
      {p.short_description && (
        <p className="line-clamp-2 text-[0.82rem] text-[#6b7280] leading-snug">{p.short_description}</p>
      )}
      <div className="flex items-center gap-3 pt-1 text-[0.76rem] text-[#9ca3af]">
        {p.main_department && (
          <span className="flex items-center gap-1.5">
            <FiUsers className="h-3.5 w-3.5" />
            {p.main_department}
          </span>
        )}
        {p.last_update && (
          <span className="flex items-center gap-1.5">
            <FiCalendar className="h-3.5 w-3.5" />
            {formatShortDate(p.last_update)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Aba Projetos ─────────────────────────────────────────────────────────────

function ProjectsTab({
  projects,
  allCount,
  loading,
  statusFilter,
  onStatusFilter,
  archivingId,
  onArchive,
  canArchive,
}: {
  projects: ProjectSummary[];
  allCount: number;
  loading: boolean;
  statusFilter: StatusFilter;
  onStatusFilter: (s: StatusFilter) => void;
  archivingId: string | null;
  onArchive: (id: string) => void;
  canArchive: boolean;
}) {
  return (
    <div className="space-y-5">
      {/* Filtro de status */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTER_OPTIONS.map((opt) => {
          const count = opt.value === "all"
            ? allCount
            : projects.filter((p) => p.status === opt.value).length;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onStatusFilter(opt.value)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.8rem] font-semibold transition ${
                statusFilter === opt.value
                  ? "bg-[#1e3a52] text-white"
                  : "bg-[#f0f2f4] text-[#6a7a88] hover:bg-[#e4e8ec]"
              }`}
            >
              {opt.label}
              {opt.value !== "all" && (
                <span className={`rounded-full px-1.5 py-0.5 text-[0.68rem] font-bold ${
                  statusFilter === opt.value ? "bg-white/20 text-white" : "bg-white text-[#6a7a88]"
                }`}>
                  {projects.filter((p) => p.status === opt.value).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <FiLoader className="h-8 w-8 animate-spin text-[#1675b8]" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center gap-5 rounded-[24px] border border-dashed border-[#d1d5db] bg-[#f9fafb] py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eff6ff]">
            <FiLayers className="h-7 w-7 text-[#1675b8]" />
          </div>
          <p className="text-[1.05rem] font-semibold text-[#374151]">Nenhum projeto encontrado</p>
          <p className="text-[0.9rem] text-[#9ca3af]">
            {statusFilter !== "all" ? "Tente selecionar outro filtro de status." : "Nenhum projeto cadastrado ainda."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              archiving={archivingId === p.id}
              canArchive={canArchive && p.status === "active"}
              onArchive={() => onArchive(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({
  project: p,
  archiving,
  canArchive,
  onArchive,
}: {
  project: ProjectSummary;
  archiving: boolean;
  canArchive: boolean;
  onArchive: () => void;
}) {
  const st = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.draft;

  return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_10px_rgba(20,33,51,0.06)]">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold ${st.cls}`}>
            {st.label}
          </span>
          {p.governmentArea && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[0.72rem] font-semibold text-[#475569]">
              <FiTag className="h-3 w-3" />
              {p.governmentArea}
            </span>
          )}
        </div>
        {canArchive && (
          <button
            type="button"
            onClick={onArchive}
            disabled={archiving}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#fff7ed] px-3 py-1 text-[0.76rem] font-semibold text-[#c2410c] transition hover:bg-[#ffedd5] disabled:opacity-50"
          >
            {archiving ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : <FiArchive className="h-3.5 w-3.5" />}
            Arquivar
          </button>
        )}
      </div>

      <h3 className="text-[1rem] font-bold text-[#1e1e1e] leading-tight">{p.name}</h3>
      {p.shortDescription && (
        <p className="text-[0.85rem] text-[#6b7280] leading-snug line-clamp-2">{p.shortDescription}</p>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1 text-[0.8rem] text-[#9ca3af]">
        {p.mainDepartment && (
          <span className="flex items-center gap-1.5">
            <FiUsers className="h-3.5 w-3.5" />
            {p.mainDepartment}
          </span>
        )}
        {p.lastUpdatedAt && (
          <span className="flex items-center gap-1.5">
            <FiCalendar className="h-3.5 w-3.5" />
            {formatShortDate(p.lastUpdatedAt)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Card de apresentação (aba Minhas) ────────────────────────────────────────

function PresentationCard({
  presentation: p,
  projectMap,
  onOpen,
}: {
  presentation: PresentationSummary;
  projectMap: Map<string, string>;
  onOpen: () => void;
}) {
  const status = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.draft;
  const eventLabel = EVENT_LABELS[p.eventType] ?? p.eventType;

  const projectNames = p.selectedProjects
    .map((id) => projectMap.get(id))
    .filter(Boolean) as string[];
  const shownProjects = projectNames.slice(0, 3);
  const hiddenCount  = projectNames.length - shownProjects.length;

  return (
    <div className="flex h-full flex-col gap-5 rounded-[22px] border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_16px_rgba(20,33,51,0.07)] transition hover:shadow-[0_6px_24px_rgba(20,33,51,0.11)]">

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[0.76rem] font-bold ${status.cls}`}>
          {status.label}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f5f9] px-3 py-1 text-[0.76rem] font-semibold text-[#475569]">
          <FiTag className="h-3 w-3" />
          {eventLabel}
        </span>
      </div>

      <div>
        <h2 className="text-[1.2rem] font-bold leading-tight tracking-[-0.03em] text-[#1e1e1e]">
          {p.title}
        </h2>
        {p.eventName && p.eventName !== p.title && (
          <p className="mt-0.5 text-[0.88rem] text-[#878787]">{p.eventName}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {p.mainFocus && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f0fdf4] px-2.5 py-1 text-[0.76rem] font-semibold text-[#166534]">
            <FiZap className="h-3 w-3" />
            {p.mainFocus}
          </span>
        )}
        {p.audience && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f8fafc] px-2.5 py-1 text-[0.76rem] font-semibold text-[#475569]">
            <FiUser className="h-3 w-3" />
            {p.audience}
          </span>
        )}
      </div>

      {p.totalModuleCount > 0 && (
        <div className="flex items-center gap-2">
          <FiGrid className="h-3.5 w-3.5 text-[#9ca3af]" />
          <span className="text-[0.78rem] font-semibold text-[#6b7280]">
            {p.activeModuleCount} de {p.totalModuleCount} módulos ativos
          </span>
        </div>
      )}

      {projectNames.length > 0 ? (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[0.76rem] font-bold uppercase tracking-wide text-[#9ca3af]">
            <FiLayers className="h-3.5 w-3.5" />
            Projetos incluídos
          </p>
          <div className="flex flex-wrap gap-2">
            {shownProjects.map((name) => (
              <span
                key={name}
                className="rounded-full bg-[#eff6ff] px-2.5 py-1 text-[0.78rem] font-semibold text-[#1d4ed8]"
              >
                {name}
              </span>
            ))}
            {hiddenCount > 0 && (
              <span className="rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[0.78rem] font-semibold text-[#6b7280]">
                +{hiddenCount} mais
              </span>
            )}
          </div>
        </div>
      ) : (
        <p className="text-[0.84rem] italic text-[#d1d5db]">Sem projetos vinculados</p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-2">
        <span className="flex items-center gap-1.5 text-[0.82rem] text-[#9ca3af]">
          <FiCalendar className="h-3.5 w-3.5" />
          {formatShortDate(p.updatedAt)}
        </span>

        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#eff6ff] px-4 py-1.5 text-[0.86rem] font-semibold text-[#1675b8] transition hover:bg-[#dbeafe]"
        >
          Abrir <FiArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
