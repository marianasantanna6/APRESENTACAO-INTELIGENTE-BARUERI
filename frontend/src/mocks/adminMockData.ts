/**
 * @deprecated Imports legados mantidos para compatibilidade com
 * AdminConsoleContext. Novos arquivos devem importar dos mocks canônicos.
 */

export {
  activityLogMock as mockActivityLog,
  organizationMock as organizationDirectory,
} from "./integrationsMock";

// ApiIntegration mantém formato legado usado pelo AdminDataPage e AdminConsoleContext
import type { ApiIntegration } from "../types/admin";

export const mockApiIntegrations: ApiIntegration[] = [
  { id: "api-ibge-indicadores", name: "IBGE - Indicadores", status: "active", lastUpdated: "2026-06-30T14:30:00", tags: ["PIB", "População", "Área"] },
  { id: "api-ibge-idh", name: "IBGE - IDH", status: "active", lastUpdated: "2026-06-30T14:30:00", tags: ["IDH Nacional", "IDH Regional", "Expectativa de Vida"] },
  { id: "api-cep", name: "CEP API", status: "maintenance", lastUpdated: "2026-06-21T09:15:00", tags: ["Endereço", "Logradouro", "Região"] },
  { id: "api-receita", name: "Receita Municipal", status: "inactive", lastUpdated: "2026-05-20T17:00:00", tags: ["Arrecadação", "ISS", "IPTU"] },
];

export { presentationsMock as mockPresentations } from "./presentationsMock";

// mockEmployeeDirectory: extraído dos usuários da plataforma
import type { EmployeeDirectoryEntry } from "../types/admin";

export const mockEmployeeDirectory: EmployeeDirectoryEntry[] = [
  { id: "admin-marina", name: "Marina Justus", email: "marina.justus@barueri.sp.gov.br", department: "Gabinete de Dados", team: "Plataforma Analítica", accessLevel: "admin_level_2", status: "active" },
  { id: "admin-joao", name: "João Lemes", email: "joao.lemes@barueri.sp.gov.br", department: "Planejamento", team: "Planejamento Territorial", accessLevel: "admin_level_1", status: "active" },
  { id: "employee-bianca", name: "Bianca Souza", email: "bianca.souza@barueri.sp.gov.br", department: "Planejamento", team: "Planejamento Territorial", accessLevel: "employee", status: "active" },
  { id: "employee-amanda", name: "Amanda Araújo", email: "amanda.araujo@barueri.sp.gov.br", department: "Planejamento", team: "Planejamento Territorial", accessLevel: "employee", status: "active" },
  { id: "employee-armando", name: "Armando Gomes", email: "armando.gomes@barueri.sp.gov.br", department: "Planejamento", team: "Planejamento Territorial", accessLevel: "employee", status: "inactive" },
  { id: "employee-bernardo", name: "Bernardo Carvalho", email: "bernardo.carvalho@barueri.sp.gov.br", department: "Financeiro", team: "Orçamento Municipal", accessLevel: "employee", status: "inactive" },
  { id: "employee-carlos", name: "Carlos Francisco", email: "carlos.francisco@barueri.sp.gov.br", department: "Recursos Humanos", team: "Gestão de Pessoas", accessLevel: "employee", status: "active" },
  { id: "employee-celine", name: "Celine Ramos", email: "celine.ramos@barueri.sp.gov.br", department: "Jurídico", team: "Consultivo Interno", accessLevel: "employee", status: "inactive" },
];
