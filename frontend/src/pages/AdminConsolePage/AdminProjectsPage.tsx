/**
 * AdminProjectsPage — "Minhas Apresentações"
 *
 * Duas abas:
 * - Minhas: apresentações criadas pelo usuário autenticado
 * - Times: apresentações de todos os membros do mesmo time (ou todos os times para master_admin)
 */

import { useEffect, useMemo, useState } from "react";
import {
  FiArrowRight,
  FiCalendar,
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
import { presentationsMock } from "../../mocks/presentationsMock";
import { presentationService } from "../../services/presentationService";
import { projectService } from "../../services/projectService";
import type { AdminPresentationSummary } from "../../types/admin";
import type { PresentationStatus, EventType } from "../../types/institutionalPresentation";
import type { PresentationSummary } from "../../types/institutionalPresentation";
import type { ProjectSummary } from "../../types/project";
import { ROUTE_PATHS } from "../../router/paths";
import { buildPresentationSearchParams } from "../../router/presentationSearchParams";

// ─── Metadados de exibição ────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PresentationStatus, { label: string; cls: string }> = {
  draft:  { label: "Rascunho", cls: "bg-[#fef9c3] text-[#92400e]" },
  active: { label: "Ativo",    cls: "bg-[#dcfce7] text-[#166534]" },
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

type TabId = "minhas" | "times";

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canCreate = canCreatePresentations(user);
  const isAdmin = canAccessAdminModules(user);
  const [activeTab, setActiveTab] = useState<TabId>("minhas");

  const [presentations, setPresentations] = useState<PresentationSummary[]>([]);
  const [allProjects, setAllProjects]     = useState<ProjectSummary[]>([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      presentationService.getPresentationsByUser(user.id),
      projectService.getProjects(),
    ])
      .then(([pres, projs]) => {
        setPresentations(pres);
        setAllProjects(projs);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const projectMap = useMemo(
    () => new Map(allProjects.map((p) => [p.id, p.name])),
    [allProjects],
  );

  // Dados para aba Times
  const teamPresentations = useMemo(() => {
    if (!user) return [];
    const teamFilter = searchParams.get("time");
    const sectorFilter = searchParams.get("setor");

    if (user.master_admin) {
      // Master admin: vê todos, com filtro opcional por setor/time via URL params
      return presentationsMock.filter((p) => {
        if (teamFilter && !p.team.toLowerCase().includes(teamFilter.toLowerCase())) return false;
        if (sectorFilter && !p.department.toLowerCase().includes(sectorFilter.toLowerCase())) return false;
        return true;
      });
    }

    if (isAdmin) {
      // Admin de time: vê todos os projetos do seu time
      return presentationsMock.filter((p) => p.team === user.team);
    }

    // Usuário comum: vê apenas seus próprios projetos (em todos os times em que está)
    return presentationsMock.filter(
      (p) => p.ownerUserId === user.id || p.ownerName === user.name,
    );
  }, [user, isAdmin, searchParams]);

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "minhas", label: "Minhas", count: presentations.length },
    { id: "times", label: "Times", count: teamPresentations.length },
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
            {loading ? "Carregando…" : `${presentations.length} apresentação${presentations.length !== 1 ? "s" : ""}`}
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
            ) : (
              <FiUsers className="h-4 w-4" />
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

      {/* Aba Times */}
      {activeTab === "times" && (
        <TeamsPresentationsTab
          presentations={teamPresentations}
          userTeam={user?.team ?? ""}
          isMasterAdmin={!!user?.master_admin}
          isAdmin={isAdmin}
        />
      )}
    </section>
  );
}

// ─── Aba Times ────────────────────────────────────────────────────────────────

function TeamsPresentationsTab({
  presentations,
  userTeam,
  isMasterAdmin,
  isAdmin,
}: {
  presentations: AdminPresentationSummary[];
  userTeam: string;
  isMasterAdmin: boolean;
  isAdmin: boolean;
}) {
  const showTeamHeader = isMasterAdmin || !isAdmin;

  if (presentations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-[24px] border border-dashed border-[#d1d5db] bg-[#f9fafb] py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f0fdf4]">
          <FiUsers className="h-7 w-7 text-[#16a34a]" />
        </div>
        <div>
          <p className="text-[1.05rem] font-semibold text-[#374151]">
            {isAdmin && !isMasterAdmin ? "Nenhuma apresentação do time" : "Nenhum projeto nos seus times"}
          </p>
          <p className="mt-1 text-[0.9rem] text-[#9ca3af]">
            {isMasterAdmin
              ? "Nenhuma apresentação encontrada para os filtros selecionados."
              : isAdmin
              ? `Nenhuma apresentação do time "${userTeam}" ainda.`
              : "Você ainda não tem projetos em nenhum time."}
          </p>
        </div>
      </div>
    );
  }

  // Agrupa por time — útil para master_admin e para usuário comum (pode estar em vários times)
  const grouped = useMemo(() => {
    const map = new Map<string, AdminPresentationSummary[]>();
    for (const p of presentations) {
      const list = map.get(p.team) ?? [];
      list.push(p);
      map.set(p.team, list);
    }
    return map;
  }, [presentations]);

  return (
    <div className="space-y-8">
      {[...grouped.entries()].map(([teamName, items]) => (
        <div key={teamName}>
          {showTeamHeader && (
            <div className="mb-4 flex items-center gap-2">
              <FiUsers className="h-4 w-4 text-[#9ca3af]" />
              <h2 className="text-[0.92rem] font-bold uppercase tracking-wider text-[#9ca3af]">
                {teamName}
              </h2>
              <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[0.72rem] font-semibold text-[#6b7280]">
                {items.length}
              </span>
            </div>
          )}
          <div className="grid gap-4 xl:grid-cols-2">
            {items.map((p) => (
              <TeamPresentationCard key={p.id} presentation={p} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TeamPresentationCard({ presentation: p }: { presentation: AdminPresentationSummary }) {
  const statusCls =
    p.status === "active"
      ? "bg-[#dcfce7] text-[#166534]"
      : "bg-[#fef9c3] text-[#92400e]";
  const statusLabel = p.status === "active" ? "Ativo" : "Rascunho";

  return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_10px_rgba(20,33,51,0.06)]">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold ${statusCls}`}>
          {statusLabel}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[0.72rem] font-semibold text-[#475569]">
          <FiTag className="h-3 w-3" />
          {p.category}
        </span>
      </div>
      <h3 className="text-[1rem] font-bold text-[#1e1e1e] leading-tight">{p.title}</h3>
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[0.82rem] text-[#9ca3af]">
        <span className="flex items-center gap-1.5">
          <FiUser className="h-3.5 w-3.5" />
          {p.ownerName}
        </span>
        <span className="flex items-center gap-1.5">
          <FiCalendar className="h-3.5 w-3.5" />
          {formatShortDate(p.date)}
        </span>
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
