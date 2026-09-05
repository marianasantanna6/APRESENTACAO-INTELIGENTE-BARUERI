/**
 * Mock canônico: Templates de Apresentação
 *
 * Os services importam daqui. Componentes NÃO importam diretamente.
 */

import type { PresentationTemplate } from "../types/template";

export const templatesMock: PresentationTemplate[] = [
  {
    id: "template-evento-tecnico",
    name: "Evento Técnico",
    description:
      "Template para congressos, feiras e eventos de tecnologia e inovação. Destaque para indicadores técnicos e cases.",
    eventType: "congresso",
    focus: "Inovação e resultados técnicos dos projetos",
    categories: ["Inovação", "Transformação Digital", "Inteligência Artificial"],
    projects: ["project-bi-saude", "project-metaverso", "project-data-center"],
    moduleOrder: ["mod-et-1", "mod-et-2", "mod-et-3", "mod-et-4", "mod-et-5"],
    language: "pt-BR",
    createdBy: "admin-marina",
    createdAt: "2025-01-10T09:00:00",
    updatedAt: "2025-01-10T09:00:00",
    status: "active",
    isOfficial: true,
    estimatedDurationMinutes: 20,
    modules: [
      { id: "mod-et-1", type: "intro", title: "Abertura institucional", description: "Slide de identificação da Prefeitura e tema do evento.", isOptional: false },
      { id: "mod-et-2", type: "project-card", title: "Projetos em destaque", description: "Card detalhado de cada projeto selecionado.", isOptional: false },
      { id: "mod-et-3", type: "indicator-highlight", title: "Indicadores-chave", description: "Números e métricas de impacto dos projetos.", isOptional: false },
      { id: "mod-et-4", type: "timeline", title: "Linha do tempo", description: "Evolução histórica das iniciativas.", isOptional: true },
      { id: "mod-et-5", type: "closing", title: "Encerramento e contato", description: "Slide de agradecimento e canais de contato.", isOptional: false },
    ],
  },
  {
    id: "template-premiacao",
    name: "Premiação e Reconhecimento",
    description:
      "Template voltado para inscrição em premiações municipais, estaduais e nacionais. Ênfase em impacto social e resultados.",
    eventType: "premiacao",
    focus: "Impacto social e resultados mensuráveis",
    categories: ["Governo Digital", "Cidades Inteligentes", "Social"],
    projects: ["project-internet-social", "project-app-barueri", "project-edu-digital"],
    moduleOrder: ["mod-pr-1", "mod-pr-2", "mod-pr-3", "mod-pr-4", "mod-pr-5"],
    language: "pt-BR",
    createdBy: "admin-marina",
    createdAt: "2025-02-05T10:00:00",
    updatedAt: "2025-02-05T10:00:00",
    status: "active",
    isOfficial: true,
    estimatedDurationMinutes: 15,
    modules: [
      { id: "mod-pr-1", type: "intro", title: "Identificação da iniciativa", description: "Nome do projeto, órgão responsável e período.", isOptional: false },
      { id: "mod-pr-2", type: "project-card", title: "Descrição detalhada", description: "Contexto, problema resolvido e solução adotada.", isOptional: false },
      { id: "mod-pr-3", type: "indicator-highlight", title: "Resultados e impacto", description: "Indicadores quantitativos e qualitativos alcançados.", isOptional: false },
      { id: "mod-pr-4", type: "media-gallery", title: "Galeria de evidências", description: "Imagens e vídeos comprovando a execução.", isOptional: true },
      { id: "mod-pr-5", type: "closing", title: "Perspectivas futuras", description: "Próximos passos e potencial de replicação.", isOptional: false },
    ],
  },
  {
    id: "template-visita-tecnica",
    name: "Visita Técnica",
    description:
      "Template para apresentações em visitas técnicas de outras prefeituras, comitivas e delegações.",
    eventType: "visita-tecnica",
    focus: "Portfólio completo de transformação digital de Barueri",
    categories: ["Governo Digital", "Inovação", "Cidades Inteligentes", "Infraestrutura"],
    projects: ["project-app-barueri", "project-data-center", "project-internet-social", "project-bi-saude"],
    moduleOrder: ["mod-vt-1", "mod-vt-2", "mod-vt-3", "mod-vt-4", "mod-vt-5", "mod-vt-6"],
    language: "pt-BR",
    createdBy: "admin-marina",
    createdAt: "2025-03-01T11:00:00",
    updatedAt: "2025-03-01T11:00:00",
    status: "active",
    isOfficial: true,
    estimatedDurationMinutes: 30,
    modules: [
      { id: "mod-vt-1", type: "intro", title: "Barueri em números", description: "Dados do município: população, área, IDH, PIB.", isOptional: false },
      { id: "mod-vt-2", type: "map", title: "Mapa da cidade inteligente", description: "Distribuição geográfica das iniciativas.", isOptional: true },
      { id: "mod-vt-3", type: "project-card", title: "Portfólio de projetos", description: "Visão geral de todos os projetos ativos.", isOptional: false },
      { id: "mod-vt-4", type: "indicator-highlight", title: "Principais indicadores", description: "Métricas de transformação digital da cidade.", isOptional: false },
      { id: "mod-vt-5", type: "comparison", title: "Comparativo com referências nacionais", description: "Posicionamento de Barueri frente a outros municípios.", isOptional: true },
      { id: "mod-vt-6", type: "closing", title: "Contato e parcerias", description: "Oportunidades de colaboração interinstitucional.", isOptional: false },
    ],
  },
  {
    id: "template-interno",
    name: "Reunião Interna",
    description:
      "Template simplificado para reuniões internas de equipe, atualizações de status e alinhamentos gerenciais.",
    eventType: "reuniao-interna",
    focus: "Status e próximos passos",
    categories: ["Governo Digital", "Transformação Digital"],
    projects: [],
    moduleOrder: ["mod-int-1", "mod-int-2", "mod-int-3"],
    language: "pt-BR",
    createdBy: "admin-joao",
    createdAt: "2025-04-10T14:00:00",
    updatedAt: "2025-04-10T14:00:00",
    status: "active",
    isOfficial: false,
    estimatedDurationMinutes: 10,
    modules: [
      { id: "mod-int-1", type: "project-card", title: "Status dos projetos", description: "Situação atual de cada iniciativa.", isOptional: false },
      { id: "mod-int-2", type: "indicator-highlight", title: "Indicadores do período", description: "Números relevantes do mês ou trimestre.", isOptional: false },
      { id: "mod-int-3", type: "closing", title: "Próximos passos", description: "Ações e responsáveis definidos na reunião.", isOptional: false },
    ],
  },
];
