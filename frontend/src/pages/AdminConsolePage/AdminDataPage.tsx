import { FiArrowRight, FiDatabase, FiLayout } from "react-icons/fi";
import { AdminPanel, AdminStatusChip } from "../../components/AdminConsole";
import { useAdminConsole } from "../../context";
import { formatDateTime } from "../../lib/formatters";

const dataFlowSteps = [
  { label: "Banco de Dados", icon: FiDatabase },
  { label: "API", icon: FiDatabase },
  { label: "Sistema", icon: FiDatabase },
  { label: "Dashboard", icon: FiLayout },
];

export default function AdminDataPage() {
  const { apiIntegrations } = useAdminConsole();

  return (
    <section>
      <div className="mb-7">
        <h1 className="text-[2.2rem] font-extrabold tracking-[-0.05em] text-[#1e1e1e] sm:text-[2.8rem]">
          Integração de Dados
        </h1>
        <p className="mt-1 text-[1rem] font-medium text-[#878787]">
          Gerencie suas fontes de dados e APIs conectadas
        </p>
      </div>

      <AdminPanel className="mb-7 px-5 py-6 sm:px-7">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-7">
          {dataFlowSteps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div key={step.label} className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[12px] bg-[linear-gradient(180deg,#6eadde_0%,#1574b8_100%)] text-white shadow-[0_12px_24px_rgba(22,117,184,0.22)]">
                    <Icon className="h-7 w-7" />
                  </div>
                  <span className="text-[0.88rem] font-medium text-[#929292]">
                    {step.label}
                  </span>
                </div>

                {index < dataFlowSteps.length - 1 ? (
                  <FiArrowRight className="h-5 w-5 text-[#8f8f8f]" />
                ) : null}
              </div>
            );
          })}
        </div>
      </AdminPanel>

      <div className="grid gap-6 xl:grid-cols-2">
        {apiIntegrations.map((integration) => (
          <AdminPanel key={integration.id} className="space-y-4 px-5 py-5">
            <AdminStatusChip
              tone={integration.status}
              label={
                integration.status === "active"
                  ? "Ativo"
                  : integration.status === "maintenance"
                    ? "Em manutenção"
                    : "Inativo"
              }
            />

            <div>
              <h2 className="text-[1.42rem] font-bold tracking-[-0.03em] text-[#262626]">
                {integration.name}
              </h2>
              <p className="mt-1 text-[0.84rem] font-medium text-[#9a9a9a]">
                Última atualização: {formatDateTime(integration.lastUpdated)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {integration.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#dcebfa] px-3 py-1 text-[0.78rem] font-semibold text-[#3d83bc]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </AdminPanel>
        ))}
      </div>
    </section>
  );
}
