/**
 * AdminProjectsPage — "Minhas Apresentações"
 *
 * Migrado do formato legado (AdminPresentationSummary + filtros de IDH)
 * para o novo modelo InstitutionalPresentation via presentationService.
 * Exibe: evento, tipo, projetos incluídos, status e ações rápidas.
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
  FiZap,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context";
import { canCreatePresentations } from "../../lib/accessControl";
import { formatShortDate } from "../../lib/formatters";
import { presentationService } from "../../services/presentationService";
import { projectService } from "../../services/projectService";
import type { PresentationStatus, EventType } from "../../types/institutionalPresentation";
import type { PresentationSummary } from "../../types/institutionalPresentation";
import type { ProjectSummary } from "../../types/project";
import { ROUTE_PATHS } from "../../router/paths";
import { buildPresentationSearchParams } from "../../router/presentationSearchParams";

// ─── Metadados de exibição ────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PresentationStatus, { label: string; cls: string }> = {
  draft:     { label: "Rascunho",    cls: "bg-[#fef9c3] text-[#92400e]" },
  ready:     { label: "Pronto",      cls: "bg-[#dbeafe] text-[#1e40af]" },
  presented: { label: "Apresentado", cls: "bg-[#dcfce7] text-[#166534]" },
  archived:  { label: "Arquivado",   cls: "bg-[#f1f5f9] text-[#475569]" },
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

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canCreate = canCreatePresentations(user);

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

  // Mapa id→nome para exibição nos cards
  const projectMap = useMemo(
    () => new Map(allProjects.map((p) => [p.id, p.name])),
    [allProjects],
  );

  return (
    <section>
      {/* Cabeçalho */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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

      {/* Estado de carregamento */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <FiLoader className="h-8 w-8 animate-spin text-[#1675b8]" />
        </div>
      )}

      {/* Lista vazia */}
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

      {/* Grid de cards */}
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
    </section>
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
  const status = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.draft;
  const eventLabel = EVENT_LABELS[p.eventType] ?? p.eventType;

  // Nomes dos projetos (máx. 3 + contador)
  const projectNames = p.selectedProjects
    .map((id) => projectMap.get(id))
    .filter(Boolean) as string[];
  const shownProjects = projectNames.slice(0, 3);
  const hiddenCount  = projectNames.length - shownProjects.length;

  return (
    <div className="flex h-full flex-col gap-5 rounded-[22px] border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_16px_rgba(20,33,51,0.07)] transition hover:shadow-[0_6px_24px_rgba(20,33,51,0.11)]">

      {/* Topo: status + tipo de evento */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[0.76rem] font-bold ${status.cls}`}>
          {status.label}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f5f9] px-3 py-1 text-[0.76rem] font-semibold text-[#475569]">
          <FiTag className="h-3 w-3" />
          {eventLabel}
        </span>
      </div>

      {/* Título + evento */}
      <div>
        <h2 className="text-[1.2rem] font-bold leading-tight tracking-[-0.03em] text-[#1e1e1e]">
          {p.title}
        </h2>
        {p.eventName && p.eventName !== p.title && (
          <p className="mt-0.5 text-[0.88rem] text-[#878787]">{p.eventName}</p>
        )}
      </div>

      {/* Enfoque + público */}
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

      {/* Módulos ativos */}
      {p.totalModuleCount > 0 && (
        <div className="flex items-center gap-2">
          <FiGrid className="h-3.5 w-3.5 text-[#9ca3af]" />
          <span className="text-[0.78rem] font-semibold text-[#6b7280]">
            {p.activeModuleCount} de {p.totalModuleCount} módulos ativos
          </span>
        </div>
      )}

      {/* Projetos selecionados */}
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

      {/* Rodapé: data + ação */}
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
