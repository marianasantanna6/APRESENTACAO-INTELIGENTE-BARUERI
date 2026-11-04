import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiArchive,
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiFolder,
  FiGrid,
  FiLayers,
  FiLoader,
  FiMonitor,
  FiPlus,
  FiTag,
  FiUser,
  FiUsers,
  FiX,
  FiZap,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useAdminConsole } from "../../context";
import { canCreatePresentations } from "../../lib/accessControl";
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

type TabId = "minhas" | "projetos";
type StatusFilter = "all" | ProjectStatus;

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

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all",      label: "Todos"     },
  { value: "draft",    label: "Rascunho"  },
  { value: "active",   label: "Ativo"     },
  { value: "archived", label: "Arquivado" },
];

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canCreate = canCreatePresentations(user);
  const isHeadManager = !!(user?.head_manager || user?.master_admin);

  const [activeTab, setActiveTab] = useState<TabId>("minhas");
  const [presentations, setPresentations] = useState<PresentationSummary[]>([]);
  const [allProjects, setAllProjects]       = useState<ProjectSummary[]>([]);
  const [rawApiProjects, setRawApiProjects] = useState<RawApiProject[]>([]);
  const [loadingPres, setLoadingPres]       = useState(true);
  const [loadingRaw, setLoadingRaw]         = useState(false);
  const [archivingId, setArchivingId]       = useState<string | null>(null);
  const [approvingId, setApprovingId]       = useState<string | null>(null);
  const [rejectingId, setRejectingId]       = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoadingPres(true);
    presentationService.getPresentationsByUser(user.id)
      .then(setPresentations)
      .finally(() => setLoadingPres(false));
  }, [user]);

  const reloadProjects = useCallback(() => {
    projectService.getProjects().then(setAllProjects);
  }, []);

  useEffect(() => { reloadProjects(); }, [reloadProjects]);

  useEffect(() => {
    if (!user) return;
    if (rawApiProjects.length > 0) return;
    setLoadingRaw(true);
    authFetch("/api/projects")
      .then((r) => r.ok ? r.json() as Promise<RawApiProject[]> : Promise.resolve([]))
      .then(setRawApiProjects)
      .catch(() => {})
      .finally(() => setLoadingRaw(false));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  function isApproverForTeam(teamId: string | undefined): boolean {
    if (!teamId || !user) return false;
    return user.teams?.some((t) => t.id === teamId && t.approver) ?? false;
  }

  const projectMap = useMemo(
    () => new Map(allProjects.map((p) => [p.id, p.name])),
    [allProjects],
  );

  async function handleArchive(id: string) {
    setArchivingId(id);
    try { await projectService.archiveProject(id); } catch { /* silent */ }
    reloadProjects();
    setArchivingId(null);
    setRawApiProjects([]);
  }

  async function handleApprove(id: string) {
    setApprovingId(id);
    try { await projectService.approveProject(id); } catch { /* silent */ }
    reloadProjects();
    setApprovingId(null);
    setRawApiProjects([]);
  }

  async function handleReject(id: string) {
    setRejectingId(id);
    try { await projectService.rejectProject(id); } catch { /* silent */ }
    reloadProjects();
    setRejectingId(null);
    setRawApiProjects([]);
  }

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "minhas",   label: "Minhas Apresentações", count: presentations.length },
    { id: "projetos", label: "Projetos Institucionais" },
  ];

  return (
    <section>
      {/* Cabeçalho */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="page-title text-[2.2rem] font-extrabold tracking-[-0.05em] text-[#1e1e1e] sm:text-[2.8rem]">
            {activeTab === "minhas" ? "Minhas Apresentações" : "Projetos Institucionais"}
          </h1>
          <p className="page-subtitle mt-1 text-[1rem] font-medium text-[#878787]">
            {activeTab === "minhas"
              ? (loadingPres ? "Carregando…" : `${presentations.length} ${presentations.length !== 1 ? "apresentações" : "apresentação"}`)
              : (isHeadManager ? "Visão geral de todos os setores e times" : "Projetos dos seus times")}
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
            {tab.id === "minhas" ? <FiMonitor className="h-4 w-4" /> : <FiLayers className="h-4 w-4" />}
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

      {/* Aba Minhas Apresentações */}
      {activeTab === "minhas" && (
        <MinhasTab
          loading={loadingPres}
          presentations={presentations}
          projectMap={projectMap}
          canCreate={canCreate}
          onOpen={(pres) => {
            const params = buildPresentationSearchParams({
              query: pres.eventName,
              category: pres.title,
              year: "Todos",
            });
            params.set("pid", pres.id);
            navigate(`${ROUTE_PATHS.generatedPresentation}?${params.toString()}`);
          }}
        />
      )}

      {/* Aba Projetos Institucionais */}
      {activeTab === "projetos" && (
        isHeadManager
          ? (
            <HeadManagerProjectsView
              rawProjects={rawApiProjects}
              loading={loadingRaw}
            />
          )
          : (
            <UserTeamsView
              user={user}
              rawProjects={rawApiProjects}
              loading={loadingRaw}
              isApproverForTeam={isApproverForTeam}
              archivingId={archivingId}
              approvingId={approvingId}
              rejectingId={rejectingId}
              onArchive={handleArchive}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )
      )}
    </section>
  );
}

// ─── Aba Minhas Apresentações ─────────────────────────────────────────────────

function MinhasTab({
  loading,
  presentations,
  projectMap,
  canCreate,
  onOpen,
}: {
  loading: boolean;
  presentations: PresentationSummary[];
  projectMap: Map<string, string>;
  canCreate: boolean;
  onOpen: (p: PresentationSummary) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FiLoader className="h-8 w-8 animate-spin text-[#1675b8]" />
      </div>
    );
  }

  if (presentations.length === 0) {
    return (
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
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {presentations.map((pres) => (
        <PresentationCard
          key={pres.id}
          presentation={pres}
          projectMap={projectMap}
          onOpen={() => onOpen(pres)}
        />
      ))}
    </div>
  );
}

// ─── View por times do usuário ────────────────────────────────────────────────

function UserTeamsView({
  user,
  rawProjects,
  loading,
  isApproverForTeam,
  archivingId,
  approvingId,
  rejectingId,
  onArchive,
  onApprove,
  onReject,
}: {
  user: AuthSessionUser | null;
  rawProjects: RawApiProject[];
  loading: boolean;
  isApproverForTeam: (teamId: string | undefined) => boolean;
  archivingId: string | null;
  approvingId: string | null;
  rejectingId: string | null;
  onArchive: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const teams = user?.teams ?? [];

  const byTeam = useMemo(() => {
    const map = new Map<string, RawApiProject[]>();
    for (const p of rawProjects) {
      if (!p.team) continue;
      const list = map.get(p.team) ?? [];
      list.push(p);
      map.set(p.team, list);
    }
    return map;
  }, [rawProjects]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FiLoader className="h-8 w-8 animate-spin text-[#1675b8]" />
      </div>
    );
  }

  if (teams.length === 0) {
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
            Entre em contato com seu administrador para ser incluído em um time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {teams.map((team) => {
        const projects = byTeam.get(team.id) ?? [];
        const canApprove = isApproverForTeam(team.id);
        const canCreate = !team.approver || team.areaManager;

        return (
          <TeamSection
            key={team.id}
            teamId={team.id}
            teamName={team.name}
            sectorName={team.sectorName}
            canApprove={canApprove}
            canCreate={canCreate}
            isApprover={team.approver}
            isManager={team.areaManager}
            projects={projects}
            archivingId={archivingId}
            approvingId={approvingId}
            rejectingId={rejectingId}
            onArchive={onArchive}
            onApprove={onApprove}
            onReject={onReject}
          />
        );
      })}
    </div>
  );
}

// ─── View head_manager (setor → time → projetos) ──────────────────────────────

function HeadManagerProjectsView({
  rawProjects,
  loading,
}: {
  rawProjects: RawApiProject[];
  loading: boolean;
}) {
  const { setores, times } = useAdminConsole();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(
    () => statusFilter === "all" ? rawProjects : rawProjects.filter((p) => mapStatusNum(p.status) === statusFilter),
    [rawProjects, statusFilter],
  );

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

  return (
    <div className="space-y-8">
      {/* Filtro de status */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatusFilter(opt.value)}
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
                {filtered.filter((p) => mapStatusNum(p.status) === opt.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {setores.map((setor) => {
        const sectorTimes = times.filter((t) => t.secretariaId === setor.id);
        if (sectorTimes.length === 0) return null;

        const sectorTotal = sectorTimes.reduce((acc, t) => acc + (byTeam.get(t.id)?.length ?? 0), 0);

        return (
          <div key={setor.id} className="space-y-4">
            {/* Cabeçalho do setor */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#1e3a52]">
                <FiGrid className="h-4.5 w-4.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[1.05rem] font-bold text-[#1e1e1e]">{setor.nome}</h2>
                <p className="text-[0.78rem] text-[#9ca3af]">{sectorTimes.length} {sectorTimes.length !== 1 ? "times" : "time"} · {sectorTotal} {sectorTotal !== 1 ? "projetos" : "projeto"}</p>
              </div>
            </div>

            {/* Times do setor */}
            <div className="space-y-3 pl-3 border-l-2 border-[#e5e7eb]">
              {sectorTimes.map((time) => {
                const projects = byTeam.get(time.id) ?? [];
                return (
                  <div key={time.id} className="rounded-[16px] border border-[#e5e7eb] bg-white overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f3f4f6]">
                      <FiUsers className="h-4 w-4 shrink-0 text-[#1675b8]" />
                      <span className="flex-1 text-[0.9rem] font-semibold text-[#1e1e1e]">{time.nome}</span>
                      <span className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[0.72rem] font-bold text-[#1675b8]">
                        {projects.length} {projects.length !== 1 ? "projetos" : "projeto"}
                      </span>
                    </div>
                    {projects.length === 0 ? (
                      <div className="flex items-center justify-center gap-2 py-5 text-[0.84rem] text-[#9ca3af]">
                        <FiFolder className="h-4 w-4" />
                        Nenhum projeto
                      </div>
                    ) : (
                      <div className="grid gap-3 p-4 xl:grid-cols-2">
                        {projects.map((p) => (
                          <TeamProjectCard
                            key={p.id}
                            project={p}
                            canApprove={false}
                            archiving={false}
                            approving={false}
                            rejecting={false}
                            onArchive={() => {}}
                            onApprove={() => {}}
                            onReject={() => {}}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {setores.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-[24px] border border-dashed border-[#d1d5db] bg-[#f9fafb] py-20 text-center">
          <FiLayers className="h-8 w-8 text-[#9ca3af]" />
          <p className="text-[1rem] font-semibold text-[#374151]">Carregando estrutura organizacional…</p>
        </div>
      )}
    </div>
  );
}

// ─── Seção de um time ─────────────────────────────────────────────────────────

function TeamSection({
  teamId,
  teamName,
  sectorName,
  canApprove,
  canCreate,
  isApprover,
  isManager,
  projects,
  archivingId,
  approvingId,
  rejectingId,
  onArchive,
  onApprove,
  onReject,
}: {
  teamId: string;
  teamName: string;
  sectorName: string;
  canApprove: boolean;
  canCreate: boolean;
  isApprover: boolean;
  isManager: boolean;
  projects: RawApiProject[];
  archivingId: string | null;
  approvingId: string | null;
  rejectingId: string | null;
  onArchive: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <section className="rounded-[20px] border border-[#e5e7eb] bg-white shadow-[0_2px_12px_rgba(20,33,51,0.05)]">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 border-b border-[#f3f4f6] px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eff6ff]">
          <FiUsers className="h-5 w-5 text-[#1675b8]" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[1rem] font-bold text-[#1e1e1e]">{teamName}</h2>
          <p className="text-[0.8rem] text-[#9ca3af]">{sectorName}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {/* Badge do papel do usuário */}
          {isManager && (
            <span className="rounded-full bg-[#d1fae5] px-2.5 py-0.5 text-[0.7rem] font-bold text-[#065f46]">
              Gerente
            </span>
          )}
          {isApprover && (
            <span className="rounded-full bg-[#dbeafe] px-2.5 py-0.5 text-[0.7rem] font-bold text-[#1d4ed8]">
              Aprovador
            </span>
          )}
          {!isManager && !isApprover && (
            <span className="rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-[0.7rem] font-bold text-[#6b7280]">
              Membro
            </span>
          )}
          <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-[0.76rem] font-bold text-[#1675b8]">
            {projects.length} {projects.length !== 1 ? "projetos" : "projeto"}
          </span>
          {canCreate && (
            <Link
              to={`${ROUTE_PATHS.createPresentation}?teamId=${teamId}`}
              className="inline-flex items-center gap-1 rounded-full bg-[#1675b8] px-3 py-1 text-[0.74rem] font-semibold text-white transition hover:bg-[#1255a0]"
            >
              <FiPlus className="h-3.5 w-3.5" />
              Nova
            </Link>
          )}
        </div>
      </div>

      {/* Projetos */}
      {projects.length === 0 ? (
        <div className="flex items-center justify-center gap-3 py-8 text-[0.88rem] text-[#9ca3af]">
          <FiFolder className="h-5 w-5" />
          Nenhum projeto neste time
        </div>
      ) : (
        <div className="grid gap-4 p-5 xl:grid-cols-2">
          {projects.map((p) => (
            <TeamProjectCard
              key={p.id}
              project={p}
              canApprove={canApprove}
              archiving={archivingId === p.id}
              approving={approvingId === p.id}
              rejecting={rejectingId === p.id}
              onArchive={() => onArchive(p.id)}
              onApprove={() => onApprove(p.id)}
              onReject={() => onReject(p.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Card de projeto (dentro de time) ────────────────────────────────────────

function TeamProjectCard({
  project: p,
  canApprove,
  archiving,
  approving,
  rejecting,
  onArchive,
  onApprove,
  onReject,
}: {
  project: RawApiProject;
  canApprove: boolean;
  archiving: boolean;
  approving: boolean;
  rejecting: boolean;
  onArchive: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const status = mapStatusNum(p.status);
  const st = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const busy = archiving || approving || rejecting;

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

      {canApprove && (
        <div className="flex gap-2 pt-1 flex-wrap">
          {status === "draft" && (
            <>
              <button type="button" onClick={onApprove} disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-3 py-1 text-[0.74rem] font-semibold text-[#166534] transition hover:bg-[#bbf7d0] disabled:opacity-50">
                {approving ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : <FiCheck className="h-3.5 w-3.5" />}
                Aprovar
              </button>
              <button type="button" onClick={onReject} disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#fee2e2] px-3 py-1 text-[0.74rem] font-semibold text-[#991b1b] transition hover:bg-[#fecaca] disabled:opacity-50">
                {rejecting ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : <FiX className="h-3.5 w-3.5" />}
                Rejeitar
              </button>
            </>
          )}
          {status === "active" && (
            <button type="button" onClick={onArchive} disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#fff7ed] px-3 py-1 text-[0.74rem] font-semibold text-[#c2410c] transition hover:bg-[#ffedd5] disabled:opacity-50">
              {archiving ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : <FiArchive className="h-3.5 w-3.5" />}
              Arquivar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Card de apresentação ─────────────────────────────────────────────────────

function PresentationCard({
  presentation: p,
  projectMap,
  onOpen,
}: {
  presentation: PresentationSummary;
  projectMap: Map<string, string>;
  onOpen: () => void;
}) {
  const navigate = useNavigate();
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
          <FiLayers className="h-4 w-4 text-[#9ca3af]" />
          <span className="text-[0.84rem] text-[#6b7280]">
            {p.totalModuleCount} módulo{p.totalModuleCount !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {shownProjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {shownProjects.map((name) => (
            <span key={name} className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[0.74rem] font-medium text-[#475569]">
              {name}
            </span>
          ))}
          {hiddenCount > 0 && (
            <span className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[0.74rem] font-medium text-[#9ca3af]">
              +{hiddenCount}
            </span>
          )}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-2">
        {p.updatedAt && (
          <span className="flex items-center gap-1.5 text-[0.78rem] text-[#9ca3af]">
            <FiCalendar className="h-3.5 w-3.5" />
            {formatShortDate(p.updatedAt)}
          </span>
        )}
        <button
          type="button"
          onClick={onOpen}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#eff6ff] px-4 py-2 text-[0.82rem] font-semibold text-[#1675b8] transition hover:bg-[#dbeafe]"
        >
          <FiArrowRight className="h-3.5 w-3.5" />
          Abrir
        </button>
      </div>
    </div>
  );
}
