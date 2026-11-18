import { useEffect, useMemo, useState } from "react";
import {
  FiAward,
  FiBarChart2,
  FiCheck,
  FiClock,
  FiExternalLink,
  FiFilter,
  FiFolder,
  FiGlobe,
  FiHash,
  FiLayers,
  FiLink,
  FiSettings,
  FiTag,
  FiTarget,
  FiUser,
  FiUsers,
  FiX,
  FiZap,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import AuthenticatedHeader from "../../components/AuthenticatedHeader";
import { useAuth } from "../../context";
import { ROUTE_PATHS } from "../../router/paths";
import type { ProjectCategory } from "../../types/project";

// ─── Tipos da API ─────────────────────────────────────────────────────────────

type ApiProject = {
  id: string;
  name: string;
  user: string | null;
  team: string | null;
  short_description: string | null;
  full_description: string | null;
  source: { url: string; name: string }[];
  main_department: string | null;
  related_departments: string[];
  areas: string[];
  ods: number[];
  theme: string | null;
  audience: string | null;
  technologies: string[];
  implementation_date: string | null;
  last_update: string | null;
  keywords: string[];
  status: number;
  slides_url: string | null;
  awards: { institution: string; year: number; description: string | null; link: string | null }[];
  indicators: { label: string; value: string; measure: string | null; source: string; year: number }[];
};

type ApiTeam = { id: string; name: string; sectorId: string; sectorName: string };
type ApiUser = { id: string; name: string; email: string };

function authHeader(): HeadersInit {
  const token = localStorage.getItem("barueri:token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

type DraftStatus = "pending" | "approved" | "rejected";

type DraftProject = {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  team: string;
  sector: string;
  submittedBy: string;
  submittedAt: string;
  categories: ProjectCategory[];
  status: DraftStatus;
  slidesUrl: string | null;
  // Campos do formulário
  mainDepartment: string;
  relatedDepartments: string[];
  areas: string[];
  ods: number[];
  theme: string;
  audience: string;
  technologies: string[];
  implementationDate: string;
  keywords: string[];
  sources: string[];
  awards: { institution: string; year: number; description: string; link?: string }[];
  indicators: { label: string; value: string; measure: string; source: string; year: number }[];
};

// ─── ODS ──────────────────────────────────────────────────────────────────────

const ODS_LABELS: Record<number, string> = {
  1: "Erradicação da Pobreza", 2: "Fome Zero", 3: "Saúde e Bem-Estar",
  4: "Educação de Qualidade", 5: "Igualdade de Gênero", 6: "Água e Saneamento",
  7: "Energia Limpa", 8: "Trabalho Decente", 9: "Indústria e Inovação",
  10: "Redução das Desigualdades", 11: "Cidades Sustentáveis",
  12: "Consumo Responsável", 13: "Ação Climática", 14: "Vida na Água",
  15: "Vida Terrestre", 16: "Paz e Justiça", 17: "Parcerias",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function groupByTeam(drafts: DraftProject[]): Map<string, DraftProject[]> {
  const map = new Map<string, DraftProject[]>();
  for (const d of drafts) {
    if (d.status !== "pending") continue;
    const list = map.get(d.team) ?? [];
    list.push(d);
    map.set(d.team, list);
  }
  return map;
}

const CATEGORY_COLORS: Partial<Record<ProjectCategory, string>> = {
  Saúde: "bg-[#ecfeff] text-[#0e7490] border-[#a5f3fc]",
  Educação: "bg-[#f5f3ff] text-[#7c3aed] border-[#ddd6fe]",
  Inovação: "bg-[#fffbeb] text-[#d97706] border-[#fde68a]",
  "Transformação Digital": "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]",
  "Cidades Inteligentes": "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]",
  "Governo Digital": "bg-[#eef2ff] text-[#4338ca] border-[#c7d2fe]",
  "Mobilidade Urbana": "bg-[#fef3c7] text-[#b45309] border-[#fde68a]",
  "Meio Ambiente": "bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]",
  Social: "bg-[#fdf2f8] text-[#9d174d] border-[#fbcfe8]",
  Economia: "bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]",
  Infraestrutura: "bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]",
};

// ─── Nav central do approver (Times + Configurações) ─────────────────────────

const navPillClass =
  "flex h-10 items-center justify-center rounded-[50px] border border-transparent px-3 text-[1rem] font-semibold whitespace-nowrap !text-white transition-all hover:-translate-y-0.5 hover:border-[#1675b8] hover:bg-[rgba(22,117,184,0.5)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] focus:outline-none focus:ring-4 focus:ring-white/25 lg:h-11 lg:px-3.5 lg:text-[1.05rem]";
const activeNavPillClass = "border-[#1675b8] bg-[rgba(22,117,184,0.5)] shadow-[0_4px_12px_rgba(0,0,0,0.12)]";

function ApproverCenterNav({ isSettings }: { isSettings: boolean }) {
  return (
    <>
      <Link
        to={ROUTE_PATHS.teams}
        className={`${navPillClass} ${!isSettings ? activeNavPillClass : ""}`}
      >
        Times
      </Link>
      <div aria-hidden="true" className="h-6 w-0.5 bg-white/30" />
      <Link
        to={ROUTE_PATHS.settings}
        className={`${navPillClass} ${isSettings ? activeNavPillClass : ""}`}
      >
        <FiSettings className="mr-1.5 inline-block h-4 w-4" />
        Configurações
      </Link>
    </>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function TeamsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<DraftProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmReject, setConfirmReject] = useState<DraftProject | null>(null);
  const [detailProject, setDetailProject] = useState<DraftProject | null>(null);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("");

  // Carrega projetos em rascunho (status=1) do backend real
  useEffect(() => {
    async function load() {
      try {
        const headers = authHeader();
        const [projectsRes, teamsRes, usersRes] = await Promise.all([
          fetch("/api/projects?status=1", { headers }),
          fetch("/api/teams", { headers }),
          fetch("/api/management", { headers }),
        ]);

        if (!projectsRes.ok) throw new Error("backend indisponível");

        const projects: ApiProject[] = await projectsRes.json();
        const teams: ApiTeam[] = teamsRes.ok ? await teamsRes.json() : [];
        const users: ApiUser[] = usersRes.ok ? await usersRes.json() : [];

        const teamMap = new Map(teams.map((t) => [t.id, t]));
        const userMap = new Map(users.map((u) => [u.id, u]));

        const mapped: DraftProject[] = projects.map((p) => {
          const teamData = p.team ? teamMap.get(p.team) : undefined;
          const userData = p.user ? userMap.get(p.user) : undefined;
          return {
            id: p.id,
            name: p.name,
            shortDescription: p.short_description ?? "",
            fullDescription: p.full_description ?? "",
            team: teamData?.name ?? p.team ?? "—",
            sector: teamData?.sectorName ?? "—",
            submittedBy: userData?.name ?? p.user ?? "—",
            submittedAt: p.last_update ?? new Date().toISOString(),
            categories: (p.areas.slice(0, 2) as ProjectCategory[]),
            status: "pending" as const,
            mainDepartment: p.main_department ?? "—",
            relatedDepartments: p.related_departments,
            areas: p.areas,
            ods: p.ods,
            theme: p.theme ?? "",
            audience: p.audience ?? "",
            technologies: p.technologies,
            implementationDate: p.implementation_date ?? "",
            keywords: p.keywords,
            sources: p.source.map((s) => s.url),
            awards: p.awards.map((a) => ({
              institution: a.institution,
              year: a.year,
              description: a.description ?? "",
              link: a.link ?? undefined,
            })),
            indicators: p.indicators.map((i) => ({
              label: i.label,
              value: i.value,
              measure: i.measure ?? "",
              source: i.source,
              year: i.year,
            })),
            slidesUrl: p.slides_url ?? null,
          };
        });

        setDrafts(mapped);
      } catch {
        setDrafts([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const pendingDrafts = drafts.filter((d) => d.status === "pending");
  const pendingCount = pendingDrafts.length;

  const teamGroups = useMemo(() => {
    const filtered = selectedTeamFilter
      ? pendingDrafts.filter((d) => d.team === selectedTeamFilter)
      : pendingDrafts;
    return groupByTeam(filtered);
  }, [drafts, selectedTeamFilter]);

  const allTeams = useMemo(
    () => [...new Set(pendingDrafts.map((d) => d.team))].sort(),
    [drafts],
  );

  async function handleApprove(id: string) {
    try {
      const res = await fetch(`/api/projects/${id}/approve`, {
        method: "PATCH",
        headers: authHeader(),
      });
      if (!res.ok) throw new Error();
    } catch {
      // continua a atualização local mesmo se o backend falhar (demo)
    }
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, status: "approved" as const } : d)));
    if (detailProject?.id === id) setDetailProject(null);
  }

  function handleReject(project: DraftProject) {
    setConfirmReject(project);
    setDetailProject(null);
  }

  function handleViewPresentation(project: DraftProject) {
    setDetailProject(null);
    navigate(`${ROUTE_PATHS.generatedPresentation}?pid=${project.id}&returnTo=${ROUTE_PATHS.teams}`);
  }

  async function confirmRejectAction() {
    if (!confirmReject) return;
    try {
      await fetch(`/api/projects/${confirmReject.id}/reject`, {
        method: "DELETE",
        headers: authHeader(),
      });
    } catch {
      // continua localmente em modo demo
    }
    setDrafts((prev) =>
      prev.map((d) => (d.id === confirmReject.id ? { ...d, status: "rejected" as const } : d)),
    );
    setConfirmReject(null);
  }

  function handleLogout() {
    logout();
    navigate(ROUTE_PATHS.login);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.92)_0%,rgba(239,240,250,0.96)_46%,rgba(226,227,247,0.96)_100%)] text-[#1e1e1e]">
      <AuthenticatedHeader
        canCreate={false}
        customCenterNav={<ApproverCenterNav isSettings={false} />}
        logoTo={ROUTE_PATHS.teams}
        onLogout={handleLogout}
        presentationsTo={ROUTE_PATHS.teams}
        showDesktopLogo
        showMobileLogo
        user={user}
      />

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        {/* Título + filtro */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#eff6ff] px-3 py-1.5 text-[0.78rem] font-bold uppercase tracking-wider text-[#1675b8]">
              <FiUsers className="h-3.5 w-3.5" />
              Painel do Aprovador
            </div>
            <h1 className="text-[2.2rem] font-extrabold tracking-[-0.05em] text-[#1e1e1e] sm:text-[2.8rem]">
              Times
            </h1>
            <p className="mt-1 text-[1rem] font-medium text-[#878787]">
              {pendingCount === 0
                ? "Nenhum projeto aguardando aprovação"
                : `${pendingCount} projeto${pendingCount !== 1 ? "s" : ""} aguardando aprovação`}
            </p>
          </div>

          {allTeams.length > 1 && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <FiFilter className="h-4 w-4 shrink-0 text-[#6b7280]" />
              <select
                value={selectedTeamFilter}
                onChange={(e) => setSelectedTeamFilter(e.target.value)}
                className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-[0.88rem] font-medium text-[#1e1e1e] shadow-[0_1px_4px_rgba(20,33,51,0.06)] focus:outline-none focus:ring-2 focus:ring-[#1675b8]/30"
              >
                <option value="">Todos os times</option>
                {allTeams.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {selectedTeamFilter && (
                <button type="button" onClick={() => setSelectedTeamFilter("")} className="text-[0.82rem] font-semibold text-[#1675b8] underline">
                  Limpar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1675b8] border-t-transparent" />
            <span className="ml-3 text-[1rem] font-medium text-[#6b7280]">Carregando projetos...</span>
          </div>
        )}

        {/* Estado vazio geral */}
        {!loading && pendingCount === 0 && (
          <div className="flex flex-col items-center gap-5 rounded-[24px] border border-dashed border-[#d1d5db] bg-[#f9fafb] py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#dcfce7]">
              <FiCheck className="h-8 w-8 text-[#16a34a]" />
            </div>
            <div>
              <p className="text-[1.1rem] font-bold text-[#374151]">Tudo em dia!</p>
              <p className="mt-1 text-[0.92rem] text-[#9ca3af]">Não há projetos aguardando aprovação.</p>
            </div>
          </div>
        )}

        {/* Times */}
        {!loading && teamGroups.size > 0 && (
          <div className="space-y-8">
            {[...teamGroups.entries()].map(([teamName, projects]) => (
              <TeamSection
                key={teamName}
                teamName={teamName}
                sector={projects[0]?.sector ?? ""}
                projects={projects}
                onViewDetail={setDetailProject}
              />
            ))}
          </div>
        )}

        {!loading && pendingCount > 0 && teamGroups.size === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-[24px] border border-dashed border-[#d1d5db] bg-[#f9fafb] py-16 text-center">
            <FiFilter className="h-8 w-8 text-[#9ca3af]" />
            <p className="text-[0.96rem] font-semibold text-[#374151]">
              Nenhum projeto encontrado para o filtro selecionado.
            </p>
            <button type="button" onClick={() => setSelectedTeamFilter("")} className="text-[0.88rem] font-semibold text-[#1675b8] underline">
              Ver todos os times
            </button>
          </div>
        )}
      </main>

      {/* Modal de detalhes completo */}
      {detailProject && (
        <DetailModal
          project={detailProject}
          onClose={() => setDetailProject(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onViewPresentation={handleViewPresentation}
        />
      )}

      {/* Modal de confirmação de rejeição */}
      {confirmReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#142133]/60 px-4 backdrop-blur-[3px]">
          <div className="w-full max-w-md rounded-[20px] bg-white p-7 shadow-[0_24px_64px_rgba(20,33,51,0.22)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fef2f2]">
              <FiX className="h-6 w-6 text-[#dc2626]" />
            </div>
            <h2 className="mt-4 text-[1.15rem] font-bold text-[#1e1e1e]">Rejeitar projeto?</h2>
            <p className="mt-2 text-[0.92rem] text-[#6b7280]">
              O projeto{" "}
              <span className="font-semibold text-[#1e1e1e]">"{confirmReject.name}"</span>{" "}
              será removido da fila e o autor será notificado. Esta ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmReject(null)}
                className="flex-1 rounded-full border border-[#e5e7eb] bg-white py-2.5 text-[0.92rem] font-semibold text-[#374151] transition hover:bg-[#f9fafb]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmRejectAction}
                className="flex-1 rounded-full bg-[#dc2626] py-2.5 text-[0.92rem] font-bold text-white shadow-[0_4px_12px_rgba(220,38,38,0.3)] transition hover:bg-[#b91c1c]"
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal de detalhes completo ───────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 border-b border-[#f3f4f6] pb-2">
        <span className="text-[#1675b8]">{icon}</span>
        <h3 className="text-[0.78rem] font-bold uppercase tracking-widest text-[#9ca3af]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Badge({ text, color = "bg-[#f1f5f9] text-[#475569]" }: { text: string; color?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.78rem] font-semibold ${color}`}>
      {text}
    </span>
  );
}

function DetailModal({
  project: p,
  onClose,
  onApprove,
  onReject,
  onViewPresentation,
}: {
  project: DraftProject;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (p: DraftProject) => void;
  onViewPresentation: (p: DraftProject) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#142133]/60 backdrop-blur-[3px] sm:items-center sm:p-4">
      <div
        className="flex w-full flex-col bg-white shadow-[0_24px_64px_rgba(20,33,51,0.24)] sm:max-w-2xl sm:rounded-[22px]"
        style={{ maxHeight: "calc(100dvh - 32px)" }}
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4 border-b border-[#f3f4f6] p-5 pb-4">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap gap-1.5">
              {p.categories.map((cat) => {
                const color = CATEGORY_COLORS[cat] ?? "bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]";
                return (
                  <span key={cat} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.72rem] font-semibold ${color}`}>
                    <FiTag className="h-2.5 w-2.5" />{cat}
                  </span>
                );
              })}
            </div>
            <h2 className="text-[1.15rem] font-bold leading-snug text-[#1e1e1e]">{p.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f3f4f6] text-[#6b7280] transition hover:bg-[#e5e7eb]"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Corpo (scrollável) */}
        <div className="flex-1 space-y-6 overflow-y-auto p-5">

          {/* Metadados */}
          <Section title="Identificação" icon={<FiFolder className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#f9fafb] p-4 text-[0.84rem] sm:grid-cols-3">
              {[
                { label: "Time", value: p.team, icon: <FiUsers className="h-3.5 w-3.5 text-[#1675b8]" /> },
                { label: "Setor", value: p.sector, icon: <FiFolder className="h-3.5 w-3.5 text-[#6b7280]" /> },
                { label: "Secretaria Principal", value: p.mainDepartment, icon: <FiLayers className="h-3.5 w-3.5 text-[#6b7280]" /> },
                { label: "Submetido por", value: p.submittedBy, icon: <FiUser className="h-3.5 w-3.5 text-[#6b7280]" /> },
                { label: "Data de envio", value: fmtDate(p.submittedAt), icon: <FiClock className="h-3.5 w-3.5 text-[#6b7280]" /> },
                { label: "Implementação prevista", value: fmtDate(p.implementationDate), icon: <FiZap className="h-3.5 w-3.5 text-[#6b7280]" /> },
              ].map(({ label, value, icon }) => (
                <div key={label}>
                  <p className="mb-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-[#9ca3af]">{label}</p>
                  <p className="flex items-center gap-1.5 font-semibold text-[#374151]">{icon}{value}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Secretarias relacionadas */}
          {p.relatedDepartments.length > 0 && (
            <Section title="Secretarias Relacionadas" icon={<FiLayers className="h-4 w-4" />}>
              <div className="flex flex-wrap gap-2">
                {p.relatedDepartments.map((d) => <Badge key={d} text={d} />)}
              </div>
            </Section>
          )}

          {/* Contexto */}
          <Section title="Contexto" icon={<FiTarget className="h-4 w-4" />}>
            <div className="space-y-3 text-[0.9rem] text-[#374151]">
              <div>
                <span className="text-[0.72rem] font-bold uppercase tracking-wide text-[#9ca3af]">Tema </span>
                <span>{p.theme}</span>
              </div>
              <div>
                <span className="text-[0.72rem] font-bold uppercase tracking-wide text-[#9ca3af]">Público-alvo </span>
                <span>{p.audience}</span>
              </div>
            </div>
          </Section>

          {/* Descrições */}
          <Section title="Descrição" icon={<FiLayers className="h-4 w-4" />}>
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-[0.72rem] font-bold uppercase tracking-wide text-[#9ca3af]">Resumida</p>
                <p className="text-[0.9rem] leading-relaxed text-[#374151]">{p.shortDescription}</p>
              </div>
              <div>
                <p className="mb-1 text-[0.72rem] font-bold uppercase tracking-wide text-[#9ca3af]">Completa</p>
                <p className="text-[0.9rem] leading-relaxed text-[#374151]">{p.fullDescription}</p>
              </div>
            </div>
          </Section>

          {/* Áreas temáticas */}
          <Section title="Áreas Temáticas" icon={<FiHash className="h-4 w-4" />}>
            <div className="flex flex-wrap gap-2">
              {p.areas.map((a) => (
                <Badge key={a} text={a} color="bg-[#eff6ff] text-[#1d4ed8]" />
              ))}
            </div>
          </Section>

          {/* ODS */}
          {p.ods.length > 0 && (
            <Section title="ODS — Objetivos de Desenvolvimento Sustentável" icon={<FiGlobe className="h-4 w-4" />}>
              <div className="flex flex-wrap gap-2">
                {p.ods.map((num) => (
                  <span key={num} className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] px-3 py-1 text-[0.78rem] font-semibold text-[#059669]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#059669] text-[0.68rem] font-bold text-white">{num}</span>
                    {ODS_LABELS[num] ?? `ODS ${num}`}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Tecnologias */}
          {p.technologies.length > 0 && (
            <Section title="Tecnologias Utilizadas" icon={<FiZap className="h-4 w-4" />}>
              <div className="flex flex-wrap gap-2">
                {p.technologies.map((t) => <Badge key={t} text={t} color="bg-[#f5f3ff] text-[#7c3aed]" />)}
              </div>
            </Section>
          )}

          {/* Indicadores */}
          {p.indicators.length > 0 && (
            <Section title="Indicadores de Resultado" icon={<FiBarChart2 className="h-4 w-4" />}>
              <div className="space-y-2">
                {p.indicators.map((ind, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-[#f9fafb] px-4 py-3">
                    <div>
                      <p className="text-[0.86rem] font-semibold text-[#1e1e1e]">{ind.label}</p>
                      <p className="text-[0.76rem] text-[#9ca3af]">{ind.source} · {ind.year}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[1.15rem] font-extrabold text-[#1675b8]">{ind.value}</p>
                      <p className="text-[0.72rem] text-[#9ca3af]">{ind.measure}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Premiações */}
          {p.awards.length > 0 && (
            <Section title="Premiações" icon={<FiAward className="h-4 w-4" />}>
              <div className="space-y-2">
                {p.awards.map((aw, i) => (
                  <div key={i} className="rounded-xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[0.88rem] font-bold text-[#92400e]">{aw.institution}</p>
                        <p className="text-[0.8rem] text-[#78350f]">{aw.description}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#fef9c3] px-2 py-0.5 text-[0.72rem] font-bold text-[#92400e]">{aw.year}</span>
                    </div>
                    {aw.link && (
                      <a href={aw.link} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-[0.76rem] font-semibold text-[#b45309] hover:underline">
                        <FiExternalLink className="h-3 w-3" /> Ver premiação
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Fontes e Palavras-chave */}
          <Section title="Fontes e Palavras-chave" icon={<FiLink className="h-4 w-4" />}>
            {p.sources.length > 0 && (
              <div className="mb-3 space-y-1.5">
                {p.sources.map((src) => (
                  <a key={src} href={src} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[0.82rem] font-medium text-[#1675b8] hover:underline">
                    <FiExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">{src}</span>
                  </a>
                ))}
              </div>
            )}
            {p.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {p.keywords.map((kw) => (
                  <span key={kw} className="inline-flex items-center gap-1 rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[0.76rem] text-[#475569]">
                    <FiHash className="h-2.5 w-2.5" />{kw}
                  </span>
                ))}
              </div>
            )}
          </Section>

        </div>

        {/* Rodapé com ações */}
        <div className="flex flex-col gap-2 border-t border-[#f3f4f6] p-5 pt-4">
          <button
            type="button"
            onClick={() => onViewPresentation(p)}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-[#1675b8] bg-[rgba(22,117,184,0.08)] py-3 text-[0.92rem] font-semibold text-[#1675b8] transition hover:bg-[rgba(22,117,184,0.15)]"
          >
            <FiExternalLink className="h-4 w-4" /> Ver apresentação completa
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onReject(p)}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#fecaca] bg-[#fef2f2] py-3 text-[0.92rem] font-semibold text-[#dc2626] transition hover:bg-[#fee2e2]"
            >
              <FiX className="h-4 w-4" /> Rejeitar
            </button>
            <button
              type="button"
              onClick={() => { onApprove(p.id); onClose(); }}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#16a34a] py-3 text-[0.92rem] font-bold text-white shadow-[0_4px_12px_rgba(22,163,74,0.3)] transition hover:bg-[#15803d]"
            >
              <FiCheck className="h-4 w-4" /> Aprovar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Seção de time ────────────────────────────────────────────────────────────

function TeamSection({ teamName, sector, projects, onViewDetail }: {
  teamName: string; sector: string; projects: DraftProject[];
  onViewDetail: (p: DraftProject) => void;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eff6ff]">
          <FiUsers className="h-5 w-5 text-[#1675b8]" />
        </div>
        <div>
          <h2 className="text-[1.1rem] font-bold text-[#1e1e1e]">{teamName}</h2>
          <p className="text-[0.82rem] text-[#9ca3af]">{sector}</p>
        </div>
        <span className="ml-auto rounded-full bg-[#fef9c3] px-3 py-1 text-[0.78rem] font-bold text-[#92400e]">
          {projects.length} pendente{projects.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="space-y-4 pl-0 sm:pl-[52px]">
        {projects.map((project) => (
          <DraftProjectCard key={project.id} project={project} onViewDetail={onViewDetail} />
        ))}
      </div>
    </section>
  );
}

// ─── Card de projeto ──────────────────────────────────────────────────────────

function DraftProjectCard({ project: p, onViewDetail }: {
  project: DraftProject;
  onViewDetail: (p: DraftProject) => void;
}) {
  return (
    <div className="rounded-[18px] border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_12px_rgba(20,33,51,0.06)] transition hover:shadow-[0_6px_20px_rgba(20,33,51,0.1)]">
      <div className="mb-3 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <FiFolder className="h-4 w-4 shrink-0 text-[#9ca3af]" />
            <h3 className="truncate text-[1rem] font-bold text-[#1e1e1e]">{p.name}</h3>
          </div>
          <p className="line-clamp-2 text-[0.88rem] leading-relaxed text-[#6b7280]">{p.shortDescription}</p>
        </div>
      </div>
      {p.categories.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {p.categories.map((cat) => {
            const color = CATEGORY_COLORS[cat] ?? "bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]";
            return (
              <span key={cat} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.74rem] font-semibold ${color}`}>
                <FiTag className="h-3 w-3" />{cat}
              </span>
            );
          })}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f3f4f6] pt-3">
        <div className="flex items-center gap-3 text-[0.82rem] text-[#9ca3af]">
          <span className="flex items-center gap-1.5"><FiUser className="h-3.5 w-3.5" />{p.submittedBy}</span>
          <span className="flex items-center gap-1.5"><FiClock className="h-3.5 w-3.5" />{fmtDateShort(p.submittedAt)}</span>
        </div>
        <button
          type="button"
          onClick={() => onViewDetail(p)}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-4 py-2 text-[0.84rem] font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe]"
        >
          Analisar projeto
        </button>
      </div>
    </div>
  );
}
