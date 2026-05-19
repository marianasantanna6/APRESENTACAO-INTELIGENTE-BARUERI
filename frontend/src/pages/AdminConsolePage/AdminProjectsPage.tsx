import { Link } from "react-router-dom";
import { FiEye, FiMonitor } from "react-icons/fi";
import { AdminPanel, AdminStatusChip } from "../../components/AdminConsole";
import { useAdminConsole, useAuth } from "../../context";
import { canCreatePresentations } from "../../lib/accessControl";
import { formatShortDate } from "../../lib/formatters";
import { ROUTE_PATHS } from "../../router/paths";
import { buildPresentationSearchParams } from "../../router/presentationSearchParams";

export default function AdminProjectsPage() {
  const { presentations } = useAdminConsole();
  const { user } = useAuth();
  const canCreate = canCreatePresentations(user);

  return (
    <section>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-[2.2rem] font-extrabold tracking-[-0.05em] text-[#1e1e1e] sm:text-[2.8rem]">
            Minhas Apresentações
          </h1>
          <p className="mt-1 text-[1rem] font-medium text-[#878787]">
            {presentations.length} projetos
          </p>
        </div>

        {canCreate ? (
          <Link
            to={ROUTE_PATHS.createPresentation}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#7fb4db_0%,#6ea7d4_100%)] px-5 text-[0.98rem] font-semibold text-white shadow-[0_10px_24px_rgba(103,156,203,0.26)] transition hover:-translate-y-0.5"
          >
            <FiMonitor className="h-4.5 w-4.5" />
            Nova Apresentação
          </Link>
        ) : null}
      </div>

      <div className="grid gap-7 xl:grid-cols-2">
        {presentations.map((presentation) => {
          const query = buildPresentationSearchParams(presentation.filters);

          return (
            <AdminPanel
              key={presentation.id}
              className="flex h-full flex-col gap-5 p-5 sm:p-6"
            >
              <div className="h-[138px] rounded-[18px] bg-[linear-gradient(135deg,#d3d4d9_0%,#ececf1_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]" />

              <div className="space-y-1">
                <h2 className="max-w-[280px] text-[1.35rem] leading-tight font-bold tracking-[-0.03em] text-[#262626]">
                  {presentation.title}
                </h2>
                <p className="text-[0.95rem] font-medium text-[#aaaaaa]">
                  {presentation.category}
                </p>
              </div>

              <div className="mt-auto flex items-center justify-between gap-4">
                <AdminStatusChip
                  tone={presentation.status}
                  label={
                    presentation.status === "presented" ? "Apresentado" : "Pronto"
                  }
                />

                <Link
                  to={`${ROUTE_PATHS.generatedPresentation}?${query.toString()}`}
                  className="inline-flex items-center gap-2 rounded-full bg-[#e8e8e8] px-4 py-1.5 text-[0.88rem] font-semibold text-[#7a7a7a] transition hover:bg-[#dfe7ef] hover:text-[#1675b8]"
                >
                  <FiEye className="h-4 w-4" />
                  Ver
                </Link>
              </div>

              <p className="text-right text-[0.9rem] font-medium text-[#939393]">
                {formatShortDate(presentation.date)}
              </p>
            </AdminPanel>
          );
        })}
      </div>
    </section>
  );
}
