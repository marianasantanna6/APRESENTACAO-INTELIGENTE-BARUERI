import type { I18nTranslations } from "./pt-BR";

const es: I18nTranslations = {
  accessibility: {
    skipToMain: "Saltar al contenido principal",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    sidebarNav: "Navegación principal",
    userMenu: "Menú de usuario",
    logoLink: "Ir a la página de inicio",
  },

  nav: {
    projetos: "Presentaciones",
    projetosInstitucionais: "Proyectos Institucionales",
    templates: "Plantillas",
    analytics: "Analítica",
    dados: "Datos (API)",
    administracao: "Administración",
    configuracoes: "Configuración",
    minhaConta: "Mi Cuenta",
    criarApresentacao: "Crear Presentación",
    sair: "Cerrar sesión",
  },

  common: {
    salvar: "Guardar",
    cancelar: "Cancelar",
    criar: "Crear",
    editar: "Editar",
    remover: "Eliminar",
    excluir: "Eliminar",
    confirmar: "Confirmar",
    fechar: "Cerrar",
    buscar: "Buscar",
    todos: "Todos",
    todas: "Todas",
    carregando: "Cargando...",
    salvando: "Guardando...",
    emBreve: "Próximamente",
    ativo: "Activo",
    inativo: "Inactivo",
    sim: "Sí",
    nao: "No",
    voltar: "Volver",
    avancar: "Siguiente",
    concluir: "Finalizar",
    limpar: "Limpiar",
    copiar: "Copiar",
    ver: "Ver",
    anterior: "Anterior",
    proximo: "Siguiente",
  },

  status: {
    draft: "Borrador",
    ready: "Listo",
    presented: "Presentado",
    archived: "Archivado",
    active: "Activo",
    inactive: "Inactivo",
  },

  languages: {
    "pt-BR": "Português (BR)",
    "en-US": "English (US)",
    es: "Español",
  },

  settings: {
    title: "Configuración",
    subtitle: "Gestione sus preferencias del sistema",

    aparencia: "Apariencia",
    aparenciaDesc: "Elija el tema preferido para su experiencia en el sistema.",
    temaClaro: "Tema claro",
    temaEscuro: "Tema oscuro",
    temaInfo:
      "El tema se aplica en tiempo real. Use el botón guardar para mantener la preferencia en el navegador.",
    temaAplicado:
      "Tema {{tema}} aplicado. Haga clic en guardar para mantener esta preferencia.",
    temaBaseAltoContraste:
      "Tema {{tema}} definido como base. El alto contraste sigue activo.",
    temaEscuroLabel: "oscuro",
    temaClaroLabel: "claro",

    idioma: "Idioma",
    idiomaDesc: "Seleccione el idioma de la interfaz del sistema.",
    idiomaAtualizado: "Idioma de la interfaz actualizado a {{idioma}}.",

    acessibilidade: "Accesibilidad",
    acessibilidadeDesc:
      "Ajuste los recursos de apoyo para mejorar su navegación.",
    altoContraste: "Alto contraste",
    altoContrasteDesc:
      "Aumenta el contraste entre textos, botones y fondos para mejorar la lectura.",
    altoContrasteAtivado:
      "Alto contraste activado. Haga clic en guardar para mantener esta preferencia.",
    altoContrasteDesativado:
      "Alto contraste desactivado. El tema {{tema}} volvió a mostrarse.",
    navegacaoTeclado: "Navegación por teclado",
    navegacaoTecladoDesc:
      "Facilita el uso del sistema sin ratón, con enfoque visual reforzado y atajos de navegación.",
    navTecladoAtivado:
      "Navegación por teclado reforzada. Use Tab, Esc y los atajos Alt+1 a Alt+5.",
    navTecladoDesativado:
      "Navegación por teclado reforzada desactivada. El sitio sigue siendo navegable con Tab.",
    atalhosTitulo: "Atajos activos",
    atalhosTeclas:
      "Alt+1 Proyectos, Alt+2 Mi cuenta, Alt+3 Configuración, Alt+4 Crear presentación, Alt+5 Datos (cuando disponible).",
    acessibilidadeInfo:
      "Cuando está activa, la navegación por teclado refuerza el foco visible y habilita los atajos Alt+1 a Alt+5 para navegar por el sistema.",

    termos: "Términos y privacidad",
    termosDesc:
      "Acceda a documentos importantes del sistema y del equipo del proyecto.",
    verTermos: "Ver términos de uso",
    verTermosDesc: "Contenido provisional preparado para el texto oficial.",
    verPrivacidade: "Ver política de privacidad",
    verPrivacidadeDesc:
      "Estructura lista para recibir el contenido definitivo.",
    termosTitle: "Términos de uso",
    termosIntro: "Contenido preliminar para los términos de uso del sistema.",
    privacidadeTitle: "Política de privacidad",
    privacidadeIntro:
      "Contenido preliminar para la política de privacidad del sistema.",
    documentoInfo:
      "Este espacio puede recibir la redacción oficial, versiones, fecha de vigencia e información legal del proyecto Presentación Inteligente Barueri sin alterar la estructura de la interfaz.",
    documentoFuturo:
      "Mientras tanto, la pantalla permanece preparada para una integración futura con contenido dinámico proveniente de una API o CMS institucional.",
    documentoProvisorio: "Contenido provisional listo para recibir el material oficial del equipo.",

    contato: "Contacto",
    contatoDesc: "Canal directo del equipo responsable del proyecto.",
    contatoMensagem: "Contacte al equipo del proyecto",
    copiarEmail: "Copiar correo",
    emailCopiado: "Correo copiado con éxito.",
    erroEmail: "No se pudo copiar el correo.",

    salvarConfigs: "Guardar configuración",
    configsSalvas: "Configuración guardada",
    salvando: "Guardando...",
    configsAplicadas: "Configuración aplicada y guardada con éxito.",
    configsErro: "No se pudo guardar la configuración localmente.",

    fecharModal: "Cerrar modal de {{titulo}}",
    selecionarTema: "Selección de tema",
  },

  pages: {
    projetos: {
      title: "Mis Presentaciones",
      subtitle: "Gestione y cree presentaciones institucionales",
    },
    projetosInstitucionais: {
      title: "Proyectos Institucionales",
      subtitle: "Biblioteca de contenido para presentaciones",
    },
    templates: {
      title: "Plantillas",
      subtitle: "Modelos de presentación",
    },
    analytics: {
      title: "Analítica",
      subtitle: "Indicadores de uso de la plataforma",
    },
    administracao: {
      title: "Administración",
      subtitle: "Registro de actividades y gestión de usuarios",
    },
    dados: {
      title: "Datos (API)",
      subtitle: "Visualización de datos conectados",
    },
    minhaConta: {
      title: "Mi Cuenta",
      subtitle: "Gestione su perfil y datos de acceso",
    },
    configuracoes: {
      title: "Configuración",
      subtitle: "Preferencias del sistema",
    },
  },

  landing: {
    heroTitle: "Presentaciones Inteligentes",
    heroSubtitle:
      "Plataforma institucional de presentaciones dinámicas para la Alcaldía de Barueri",
    getStarted: "Acceder a la plataforma",
    login: "Iniciar sesión",
    features: "Funcionalidades",
    howItWorks: "Cómo Funciona",
    about: "Acerca de",
    help: "Ayuda",
  },

  login: {
    title: "Acceda a su cuenta",
    subtitle: "Use su usuario, CPF o correo institucional",
    user: "Usuario, CPF o correo",
    password: "Contraseña",
    submit: "Ingresar",
    loading: "Ingresando...",
    errorUser: "Ingrese su usuario, CPF o correo.",
    errorPassword: "Ingrese su contraseña.",
    errorPasswordLength: "La contraseña debe tener al menos 6 caracteres.",
    errorInvalid: "Usuario o contraseña inválidos.",
    domain: "@barueri.sp.gov.br",
  },
} as const;

export default es;
