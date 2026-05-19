/**
 * Fonte unica de verdade para os caminhos de navegacao do frontend.
 *
 * Sempre reutilize essas constantes em links e redirecionamentos para evitar
 * strings duplicadas espalhadas pelo projeto.
 */
export const ROUTE_PATHS = {
  home: "/",
  login: "/login",
  presentations: "/apresentacoes",
  adminRoot: "/admin",
  adminProjects: "/admin/apresentacoes",
  adminData: "/admin/dados",
  adminAdministration: "/admin/administracao",
  createPresentation: "/criar",
  generatedPresentation: "/criar/resultado",
} as const;

export type AppRoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];
