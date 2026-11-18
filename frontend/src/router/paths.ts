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
  institutionalProjects: "/projetos",
  myAccount: "/minha-conta",
  settings: "/configuracoes",
  adminRoot: "/admin",
  adminProjects: "/admin/apresentacoes",
  adminAdministration: "/admin/administracao",
  createPresentation: "/criar",
  generatedPresentation: "/criar/resultado",
  teams: "/times",
  teamDetail: "/time/:teamId",
  forgotPassword: "/recuperar-senha",
  resetPassword: "/redefinir-senha",
  help: "/ajuda",
} as const;

export type AppRoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];
