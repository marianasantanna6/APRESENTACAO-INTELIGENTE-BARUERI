/**
 * AnalyticsPage — Fase 16
 *
 * Dashboard de analytics institucional para administradores.
 * Dados estatísticos e institucionais — nenhum dado pessoal sensível.
 */

import { useEffect, useState } from "react";
import {
  FiActivity,
  FiBarChart2,
  FiBookOpen,
  FiCalendar,
  FiClock,
  FiGlobe,
  FiGrid,
  FiLayers,
  FiLink,
  FiLoader,
  FiMonitor,
  FiSmartphone,
  FiTablet,
  FiTrendingUp,
  FiUser,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { analyticsService } from "../../services/analyticsService";
import type { AnalyticsData, AnalyticsPeriod } from "../../types/analytics";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function maxOf(arr: number[]): number {
  return arr.length ? Math.max(...arr) : 1;
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[0.72rem] font-bold uppercase tracking-wider text-[#9ca3af]">{label}</p>
        <p className="mt-0.5 text-[1.5rem] font-extrabold leading-none tracking-[-0.03em] text-[#1e1e1e]">
          {value}
        </p>
        {sub && <p className="mt-0.5 text-[0.74rem] text-[#9ca3af]">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon, title, description, color = "bg-[linear-gradient(135deg,#1675b8,#1255a0)]",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  color?: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <h2 className="text-[1.05rem] font-extrabold tracking-[-0.02em] text-[#1e1e1e]">{title}</h2>
        {description && <p className="text-[0.78rem] text-[#9ca3af]">{description}</p>}
      </div>
    </div>
  );
}

// ─── Bar horizontal ───────────────────────────────────────────────────────────

function HBar({
  label, value, max, suffix = "", color = "bg-[#1675b8]", badge,
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
  color?: string;
  badge?: React.ReactNode;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-40 shrink-0 truncate text-[0.82rem] font-semibold text-[#374151]">{label}</div>
      <div className="flex-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="w-16 shrink-0 text-right text-[0.82rem] font-bold text-[#374151]">
        {value}{suffix}
      </div>
      {badge && <div className="shrink-0">{badge}</div>}
    </div>
  );
}

// ─── Mini pill distribution ───────────────────────────────────────────────────

function PillRow({ label, percentage, count, color }: { label: string; percentage: number; count: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />
      <span className="flex-1 text-[0.82rem] text-[#374151]">{label}</span>
      <span className="text-[0.78rem] font-bold text-[#374151]">{count}</span>
      <span className="w-12 text-right text-[0.74rem] text-[#9ca3af]">{percentage.toFixed(1)}%</span>
    </div>
  );
}

// ─── Period selector ──────────────────────────────────────────────────────────

const PERIODS: { id: AnalyticsPeriod; label: string }[] = [
  { id: "7d",  label: "7 dias"  },
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
  { id: "12m", label: "12 meses"},
  { id: "all", label: "Tudo"    },
];

// ─── Página ───────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState<AnalyticsPeriod>("30d");

  useEffect(() => {
    setLoading(true);
    analyticsService.getAnalytics({ period }).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [period]);

  if (loading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <FiLoader className="h-8 w-8 animate-spin text-[#1675b8]" />
      </div>
    );
  }

  const { summary, projectUsage, presentationUsage, categoryDistribution,
    moduleTimeStats, languageDistribution, deviceDistribution,
    accessSourceStats, versionEventStats, userActivityStats,
    templateUsageStats, activityByMonth } = data;

  const deviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    desktop: FiMonitor,
    mobile:  FiSmartphone,
    tablet:  FiTablet,
    unknown: FiGrid,
  };

  const deviceColors: Record<string, string> = {
    desktop: "bg-[#1675b8]",
    mobile:  "bg-[#7c3aed]",
    tablet:  "bg-[#d97706]",
    unknown: "bg-[#9ca3af]",
  };

  const sourceColors: Record<string, string> = {
    "direct":      "bg-[#1675b8]",
    "public-link": "bg-[#15803d]",
    "qr-code":     "bg-[#d97706]",
    "embed":       "bg-[#9ca3af]",
  };

  const catColors = [
    "bg-[#1675b8]", "bg-[#7c3aed]", "bg-[#15803d]",
    "bg-[#d97706]", "bg-[#b91c1c]", "bg-[#0e7490]",
  ];

  const maxActivity = maxOf(activityByMonth.map((m) => m.totalAccesses));

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-24 pt-8 sm:px-6 lg:px-8">

      {/* ── Título + período ────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[1.8rem] font-extrabold tracking-[-0.04em] text-[#1e1e1e]">
            Analytics
          </h1>
          <p className="mt-1 text-[0.88rem] text-[#9ca3af]">
            Métricas institucionais da plataforma — sem dados pessoais sensíveis
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`rounded-full px-3.5 py-1.5 text-[0.78rem] font-semibold transition ${
                period === p.id
                  ? "bg-[#1675b8] text-white shadow-[0_4px_12px_-4px_rgba(22,117,184,0.5)]"
                  : "border border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#1675b8] hover:text-[#1675b8]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPIs ────────────────────────────────────────────────────────────── */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total de Apresentações" value={summary.totalPresentations}   sub={`${summary.presentationsThisMonth} este mês`}   icon={FiLayers}    color="bg-[linear-gradient(135deg,#1675b8,#1255a0)]" />
        <KpiCard label="Projetos Cadastrados"   value={summary.totalProjectsRegistered}                                                    icon={FiGrid}      color="bg-[linear-gradient(135deg,#7c3aed,#5b21b6)]" />
        <KpiCard label="Usuários Ativos"        value={summary.activeUsers}                                                                icon={FiUsers}     color="bg-[linear-gradient(135deg,#15803d,#14532d)]" />
        <KpiCard label="Acessos via QR Code"    value={summary.totalQrCodeScans}     sub={`${summary.totalPublicLinkAccesses} por link`}   icon={FiZap}       color="bg-[linear-gradient(135deg,#d97706,#b45309)]" />
        <KpiCard label="Links Compartilhados"   value={summary.totalSharedLinks}                                                           icon={FiLink}      color="bg-[linear-gradient(135deg,#0e7490,#164e63)]" />
        <KpiCard label="Acessos Diretos"        value={summary.totalDirectAccesses}                                                        icon={FiActivity}  color="bg-[linear-gradient(135deg,#b91c1c,#7f1d1d)]" />
        <KpiCard label="Tempo Médio de Sessão"  value={fmtTime(summary.avgSessionSeconds)}                                                 icon={FiClock}     color="bg-[linear-gradient(135deg,#6b7280,#374151)]" />
        <KpiCard label="Categoria mais Usada"   value={summary.mostUsedCategory}                                                           icon={FiTrendingUp}color="bg-[linear-gradient(135deg,#1675b8,#7c3aed)]" />
      </div>

      {/* ── Grid de seções ──────────────────────────────────────────────────── */}
      <div className="space-y-10">

        {/* ── Atividade mensal ─────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
          <SectionHeader icon={FiTrendingUp} title="Atividade Mensal" description="Apresentações criadas, projetos atualizados e acessos totais por mês" />
          <div className="space-y-3">
            {activityByMonth.map((m) => (
              <div key={m.month} className="flex items-center gap-4">
                <span className="w-20 shrink-0 text-[0.76rem] font-semibold text-[#9ca3af]">{m.month}</span>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="h-2 overflow-hidden rounded-full bg-[#f1f5f9]" style={{ width: "100%" }}>
                      <div className="h-full rounded-full bg-[#1675b8] transition-all duration-500"
                        style={{ width: `${Math.round((m.totalAccesses / maxActivity) * 100)}%` }} />
                    </div>
                    <span className="w-8 shrink-0 text-right text-[0.72rem] font-bold text-[#374151]">{m.totalAccesses}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-3 text-[0.72rem]">
                  <span className="rounded-full bg-[#eff6ff] px-2 py-0.5 font-semibold text-[#1d4ed8]">{m.presentationsCreated} pres.</span>
                  <span className="rounded-full bg-[#f0fdf4] px-2 py-0.5 font-semibold text-[#166534]">{m.projectsUpdated} proj.</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Apresentações mais acessadas + versões em eventos ─────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Apresentações mais acessadas */}
          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
            <SectionHeader icon={FiBarChart2} title="Apresentações Mais Acessadas" description="Ranking por número de visualizações" />
            <div className="space-y-3">
              {presentationUsage.map((p, i) => (
                <div key={p.presentationId} className="flex items-start gap-3 rounded-xl border border-[#f1f5f9] bg-[#f8fafc] p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[0.7rem] font-extrabold text-[#1675b8]">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.82rem] font-bold text-[#1e1e1e]">{p.title}</p>
                    <p className="text-[0.72rem] text-[#9ca3af]">{p.ownerName}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[0.92rem] font-extrabold text-[#1675b8]">{p.viewCount}</p>
                    <p className="text-[0.68rem] text-[#9ca3af]">views</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Versões usadas em eventos */}
          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
            <SectionHeader icon={FiCalendar} title="Versões Usadas em Eventos" description="Histórico de versões apresentadas em eventos reais" color="bg-[linear-gradient(135deg,#d97706,#b45309)]" />
            <div className="space-y-2">
              {versionEventStats.map((v, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-[#f1f5f9] bg-[#f8fafc] p-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fef3c7] text-[0.7rem] font-extrabold text-[#d97706]">
                    v{v.version}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.8rem] font-bold text-[#1e1e1e]">{v.eventName}</p>
                    <p className="truncate text-[0.72rem] text-[#9ca3af]">{v.title}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[0.74rem] font-semibold text-[#374151]">{fmtDate(v.eventDate)}</p>
                    <p className="text-[0.68rem] text-[#9ca3af]">{v.ownerName}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Projetos + Categorias ────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Projetos mais usados */}
          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
            <SectionHeader icon={FiLayers} title="Projetos Mais Usados" description="Projetos institucionais mais incluídos em apresentações" color="bg-[linear-gradient(135deg,#7c3aed,#5b21b6)]" />
            <div className="space-y-3">
              {projectUsage.map((p) => (
                <HBar
                  key={p.projectId}
                  label={p.projectName}
                  value={p.usageCount}
                  max={maxOf(projectUsage.map((x) => x.usageCount))}
                  suffix=" usos"
                  color="bg-[#7c3aed]"
                />
              ))}
            </div>
          </section>

          {/* Categorias mais usadas */}
          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
            <SectionHeader icon={FiGrid} title="Categorias Mais Usadas" description="Distribuição das categorias temáticas nas apresentações" color="bg-[linear-gradient(135deg,#15803d,#14532d)]" />
            <div className="space-y-3">
              {categoryDistribution.map((c, i) => (
                <div key={c.category}>
                  <HBar
                    label={c.category}
                    value={c.count}
                    max={maxOf(categoryDistribution.map((x) => x.count))}
                    color={catColors[i % catColors.length]}
                  />
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-1.5 border-t border-[#f1f5f9] pt-4">
              {categoryDistribution.map((c, i) => (
                <PillRow
                  key={c.category}
                  label={c.category}
                  percentage={c.percentage}
                  count={c.count}
                  color={catColors[i % catColors.length]}
                />
              ))}
            </div>
          </section>
        </div>

        {/* ── Tempo médio por módulo ──────────────────────────────────────── */}
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
          <SectionHeader icon={FiClock} title="Tempo Médio por Módulo" description="Tempo médio que os espectadores passam em cada módulo da apresentação" color="bg-[linear-gradient(135deg,#0e7490,#164e63)]" />
          <div className="grid gap-3 sm:grid-cols-2">
            {moduleTimeStats.map((m) => (
              <HBar
                key={m.moduleId}
                label={m.moduleName}
                value={m.avgTimeSeconds}
                max={maxOf(moduleTimeStats.map((x) => x.avgTimeSeconds))}
                suffix="s"
                color="bg-[#0e7490]"
                badge={
                  <span className="text-[0.7rem] text-[#9ca3af]">{m.totalViews} views</span>
                }
              />
            ))}
          </div>
        </section>

        {/* ── Dispositivo + Idioma + Origens ──────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Dispositivo usado */}
          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
            <SectionHeader icon={FiMonitor} title="Dispositivo" description="Tipo de dispositivo nos acessos" color="bg-[linear-gradient(135deg,#374151,#111827)]" />
            <div className="space-y-4">
              {deviceDistribution.map((d) => {
                const Icon = deviceIcons[d.device] ?? FiMonitor;
                return (
                  <div key={d.device} className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${deviceColors[d.device]}`}>
                      <Icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[0.8rem] font-semibold text-[#374151]">{d.label}</span>
                        <span className="text-[0.78rem] font-bold text-[#374151]">{d.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
                        <div className={`h-full rounded-full ${deviceColors[d.device]}`} style={{ width: `${d.percentage}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Idioma utilizado */}
          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
            <SectionHeader icon={FiGlobe} title="Idioma" description="Idioma das apresentações acessadas" color="bg-[linear-gradient(135deg,#1675b8,#0e7490)]" />
            <div className="space-y-4">
              {languageDistribution.map((l, i) => (
                <div key={l.language}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[0.8rem] font-semibold text-[#374151]">{l.label}</span>
                    <span className="text-[0.78rem] font-bold text-[#374151]">{l.count} ({l.percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
                    <div className={`h-full rounded-full ${catColors[i]}`} style={{ width: `${l.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-1.5 border-t border-[#f1f5f9] pt-4">
              {languageDistribution.map((l, i) => (
                <PillRow key={l.language} label={l.label} percentage={l.percentage} count={l.count} color={catColors[i]} />
              ))}
            </div>
          </section>

          {/* Origens de acesso */}
          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
            <SectionHeader icon={FiLink} title="Origens de Acesso" description="Como os espectadores chegaram às apresentações" color="bg-[linear-gradient(135deg,#d97706,#b91c1c)]" />
            <div className="space-y-4">
              {accessSourceStats.map((s) => (
                <div key={s.source}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[0.8rem] font-semibold text-[#374151]">{s.label}</span>
                    <span className="text-[0.78rem] font-bold text-[#374151]">{s.count} ({s.percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
                    <div className={`h-full rounded-full ${sourceColors[s.source]}`} style={{ width: `${s.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#fde68a] bg-[#fffbeb] p-3 text-center">
                <p className="text-[1.3rem] font-extrabold text-[#d97706]">
                  {accessSourceStats.find((s) => s.source === "qr-code")?.count ?? 0}
                </p>
                <p className="text-[0.7rem] font-semibold text-[#92400e]">QR Code</p>
              </div>
              <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-3 text-center">
                <p className="text-[1.3rem] font-extrabold text-[#15803d]">
                  {accessSourceStats.find((s) => s.source === "public-link")?.count ?? 0}
                </p>
                <p className="text-[0.7rem] font-semibold text-[#166534]">Link Público</p>
              </div>
            </div>
          </section>
        </div>

        {/* ── Funcionários + Templates ─────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Quem mais criou */}
          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
            <SectionHeader icon={FiUser} title="Mais Criações" description="Funcionários que mais criaram apresentações" color="bg-[linear-gradient(135deg,#1675b8,#1255a0)]" />
            <div className="space-y-3">
              {[...userActivityStats]
                .sort((a, b) => b.createdCount - a.createdCount)
                .map((u, i) => (
                  <div key={u.userName} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[0.68rem] font-extrabold text-[#1675b8]">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.82rem] font-bold text-[#1e1e1e]">{u.userName}</p>
                      <p className="truncate text-[0.7rem] text-[#9ca3af]">{u.department}</p>
                    </div>
                    <span className="shrink-0 text-[1rem] font-extrabold text-[#1675b8]">{u.createdCount}</span>
                  </div>
                ))}
            </div>
          </section>

          {/* Quem mais revisou */}
          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
            <SectionHeader icon={FiUsers} title="Mais Revisões" description="Funcionários que mais revisaram conteúdo" color="bg-[linear-gradient(135deg,#7c3aed,#5b21b6)]" />
            <div className="space-y-3">
              {[...userActivityStats]
                .sort((a, b) => b.reviewedCount - a.reviewedCount)
                .map((u, i) => (
                  <div key={u.userName} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f5f3ff] text-[0.68rem] font-extrabold text-[#7c3aed]">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.82rem] font-bold text-[#1e1e1e]">{u.userName}</p>
                      <p className="truncate text-[0.7rem] text-[#9ca3af]">{u.department}</p>
                    </div>
                    <span className="shrink-0 text-[1rem] font-extrabold text-[#7c3aed]">{u.reviewedCount}</span>
                  </div>
                ))}
            </div>
          </section>

          {/* Templates mais usados */}
          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
            <SectionHeader icon={FiBookOpen} title="Templates Mais Usados" description="Receitas de apresentação mais reutilizadas" color="bg-[linear-gradient(135deg,#d97706,#b45309)]" />
            <div className="space-y-3">
              {templateUsageStats.map((t, i) => (
                <div key={t.templateId} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fef3c7] text-[0.68rem] font-extrabold text-[#d97706]">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.82rem] font-bold text-[#1e1e1e]">{t.templateName}</p>
                    <p className="truncate text-[0.7rem] text-[#9ca3af]">{t.eventType}</p>
                  </div>
                  <span className="shrink-0 text-[1rem] font-extrabold text-[#d97706]">{t.usageCount}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

      </div>

      {/* ── Nota de privacidade ─────────────────────────────────────────────── */}
      <div className="mt-10 rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] px-5 py-4">
        <p className="text-[0.76rem] text-[#9ca3af]">
          <strong className="text-[#374151]">Nota de privacidade:</strong> O painel de analytics exibe apenas dados
          estatísticos e institucionais agregados. Nomes exibidos referem-se a papéis funcionais públicos da plataforma,
          sem coleta de dados pessoais sensíveis como localização, comportamento fora da plataforma ou dados biométricos.
        </p>
      </div>
    </div>
  );
}
