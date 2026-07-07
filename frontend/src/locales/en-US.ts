import type { I18nTranslations } from "./pt-BR";

const enUS: I18nTranslations = {
  accessibility: {
    skipToMain: "Skip to main content",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    sidebarNav: "Main navigation",
    userMenu: "User menu",
    logoLink: "Go to home page",
  },

  nav: {
    projetos: "Presentations",
    projetosInstitucionais: "Institutional Projects",
    templates: "Templates",
    analytics: "Analytics",
    dados: "Data (API)",
    administracao: "Administration",
    configuracoes: "Settings",
    minhaConta: "My Account",
    criarApresentacao: "Create Presentation",
    sair: "Sign Out",
  },

  common: {
    salvar: "Save",
    cancelar: "Cancel",
    criar: "Create",
    editar: "Edit",
    remover: "Remove",
    excluir: "Delete",
    confirmar: "Confirm",
    fechar: "Close",
    buscar: "Search",
    todos: "All",
    todas: "All",
    carregando: "Loading...",
    salvando: "Saving...",
    emBreve: "Coming soon",
    ativo: "Active",
    inativo: "Inactive",
    sim: "Yes",
    nao: "No",
    voltar: "Back",
    avancar: "Next",
    concluir: "Finish",
    limpar: "Clear",
    copiar: "Copy",
    ver: "View",
    anterior: "Previous",
    proximo: "Next",
  },

  status: {
    draft: "Draft",
    ready: "Ready",
    presented: "Presented",
    archived: "Archived",
    active: "Active",
    inactive: "Inactive",
  },

  languages: {
    "pt-BR": "Português (BR)",
    "en-US": "English (US)",
    es: "Español",
  },

  settings: {
    title: "Settings",
    subtitle: "Manage your system preferences",

    aparencia: "Appearance",
    aparenciaDesc: "Choose your preferred theme for the system experience.",
    temaClaro: "Light theme",
    temaEscuro: "Dark theme",
    temaInfo:
      "The theme is applied in real time. Use the save button to persist the preference in the browser.",
    temaAplicado:
      "{{tema}} theme applied. Click save to keep this preference.",
    temaBaseAltoContraste:
      "{{tema}} theme set as base. High contrast remains active.",
    temaEscuroLabel: "dark",
    temaClaroLabel: "light",

    idioma: "Language",
    idiomaDesc: "Select the system interface language.",
    idiomaAtualizado: "Interface language updated to {{idioma}}.",

    acessibilidade: "Accessibility",
    acessibilidadeDesc:
      "Adjust support features to improve your navigation.",
    altoContraste: "High contrast",
    altoContrasteDesc:
      "Increases contrast between texts, buttons, and backgrounds to improve readability.",
    altoContrasteAtivado:
      "High contrast enabled. Click save to keep this preference.",
    altoContrasteDesativado:
      "High contrast disabled. The {{tema}} theme is now displayed.",
    navegacaoTeclado: "Keyboard navigation",
    navegacaoTecladoDesc:
      "Facilitates system use without a mouse, with enhanced visual focus and navigation shortcuts.",
    navTecladoAtivado:
      "Keyboard navigation enhanced. Use Tab, Esc and shortcuts Alt+1 to Alt+5.",
    navTecladoDesativado:
      "Enhanced keyboard navigation disabled. The site remains navigable by Tab.",
    atalhosTitulo: "Active shortcuts",
    atalhosTeclas:
      "Alt+1 Projects, Alt+2 My Account, Alt+3 Settings, Alt+4 Create Presentation, Alt+5 Data (when available).",
    acessibilidadeInfo:
      "When active, keyboard navigation reinforces visible focus and enables shortcuts Alt+1 through Alt+5 to navigate the system.",

    termos: "Terms and privacy",
    termosDesc:
      "Access important documents from the system and the project team.",
    verTermos: "View terms of use",
    verTermosDesc: "Provisional content prepared for the official text.",
    verPrivacidade: "View privacy policy",
    verPrivacidadeDesc: "Structure ready to receive the definitive content.",
    termosTitle: "Terms of use",
    termosIntro: "Preliminary content for the system terms of use.",
    privacidadeTitle: "Privacy policy",
    privacidadeIntro: "Preliminary content for the system privacy policy.",
    documentoInfo:
      "This space can receive the official text, versions, effective date, and legal information for the Barueri Intelligent Presentation project without changing the interface structure.",
    documentoFuturo:
      "In the meantime, the screen remains prepared for future integration with dynamic content from an API or institutional CMS.",
    documentoProvisorio: "Provisional content ready to receive the official material from the team.",

    contato: "Contact",
    contatoDesc: "Direct channel of the team responsible for the project.",
    contatoMensagem: "Get in touch with the project team",
    copiarEmail: "Copy email",
    emailCopiado: "Email copied successfully.",
    erroEmail: "Could not copy email.",

    salvarConfigs: "Save settings",
    configsSalvas: "Settings saved",
    salvando: "Saving...",
    configsAplicadas: "Settings applied and saved successfully.",
    configsErro: "Could not save settings locally.",

    fecharModal: "Close {{titulo}} modal",
    selecionarTema: "Theme selection",
  },

  pages: {
    projetos: {
      title: "My Presentations",
      subtitle: "Manage and create institutional presentations",
    },
    projetosInstitucionais: {
      title: "Institutional Projects",
      subtitle: "Content library for presentations",
    },
    templates: {
      title: "Templates",
      subtitle: "Presentation templates",
    },
    analytics: {
      title: "Analytics",
      subtitle: "Platform usage indicators",
    },
    administracao: {
      title: "Administration",
      subtitle: "Activity log and user management",
    },
    dados: {
      title: "Data (API)",
      subtitle: "Connected data visualization",
    },
    minhaConta: {
      title: "My Account",
      subtitle: "Manage your profile and access data",
    },
    configuracoes: {
      title: "Settings",
      subtitle: "System preferences",
    },
  },

  landing: {
    heroTitle: "Smart Presentations",
    heroSubtitle:
      "Institutional platform for dynamic presentations for the City of Barueri",
    getStarted: "Access platform",
    login: "Login",
    features: "Features",
    howItWorks: "How It Works",
    about: "About",
    help: "Help",
  },

  login: {
    title: "Sign in to your account",
    subtitle: "Use your username, CPF, or institutional email",
    user: "Username, CPF, or email",
    password: "Password",
    submit: "Sign in",
    loading: "Signing in...",
    errorUser: "Please enter your username, CPF, or email.",
    errorPassword: "Please enter your password.",
    errorPasswordLength: "Password must be at least 6 characters.",
    errorInvalid: "Invalid username or password.",
    domain: "@barueri.sp.gov.br",
  },
} as const;

export default enUS;
