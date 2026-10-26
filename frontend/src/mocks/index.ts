/**
 * Ponto de entrada único para todos os mocks canônicos.
 *
 * Services e hooks importam daqui (ou do arquivo específico).
 * Componentes NUNCA importam mocks diretamente.
 */

export { institutionalProjectsMock } from "./institutionalProjectsMock";
export { presentationsMock, institutionalPresentationsMock } from "./presentationsMock";
export { templatesMock } from "./templatesMock";
export { authUsersMock, platformUsersMock } from "./usersMock";
export { analyticsMock, analyticsEventsMock } from "./analyticsMock";
export { categoriesMock } from "./categoriesMock";
export type { CategoryMeta } from "./categoriesMock";
export { integrationsMock, activityLogMock, organizationMock } from "./integrationsMock";
export { roleDefinitionsMock, roleLabelsMock, permissionsMock, getPermissionsForRole } from "./permissionsMock";
export type { PermissionMeta } from "./permissionsMock";
