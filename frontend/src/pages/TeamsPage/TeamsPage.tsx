import { useEffect, useMemo, useState } from "react";
import {
  FiAward,
  FiBarChart2,
  FiCheck,
  FiClock,
  FiExternalLink,
  FiFilter,
  FiFolder,
  FiGlobe,
  FiHash,
  FiLayers,
  FiLink,
  FiMonitor,
  FiSettings,
  FiTag,
  FiTarget,
  FiUser,
  FiUsers,
  FiX,
  FiZap,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import AuthenticatedHeader from "../../components/AuthenticatedHeader";
import { useAuth } from "../../context";
import { ROUTE_PATHS } from "../../router/paths";
import type { ProjectCategory } from "../../types/project";

// ─── Tipos da API ─────────────────────────────────────────────────────────────

type ApiProject = {
  id: string;
  name: string;
  user: string | null;
  team: string | null;
  short_description: string | null;
  full_description: string | null;
  source: { url: string; name: string }[];
  main_department: string | null;
  related_departments: string[];
  areas: string[];
  ods: number[];
  theme: string | null;
  audience: string | null;
  technologies: string[];
  implementation_date: string | null;
  last_update: string | null;
  keywords: string[];
  status: number;
  awards: { institution: string; year: number; description: string | null; link: string | null }[];
  indicators: { label: string; value: string; measure: string | null; source: string; year: number }[];
};

type ApiTeam = { id: string; name: string; sectorId: string; sectorName: string };
type ApiUser = { id: string; name: string; email: string };

function authHeader(): HeadersInit {
  const token = localStorage.getItem("barueri:token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

type DraftStatus = "pending" | "approved" | "rejected";

type MockSlide = {
  id: string;
  title: string;
  type: "capa" | "dados" | "projeto" | "indicadores" | "ods" | "encerramento";
};

type DraftProject = {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  team: string;
  sector: string;
  submittedBy: string;
  submittedAt: string;
  categories: ProjectCategory[];
  status: DraftStatus;
  // Campos do formulário
  mainDepartment: string;
  relatedDepartments: string[];
  areas: string[];
  ods: number[];
  theme: string;
  audience: string;
  technologies: string[];
  implementationDate: string;
  keywords: string[];
  sources: string[];
  awards: { institution: string; year: number; description: string; link?: string }[];
  indicators: { label: string; value: string; measure: string; source: string; year: number }[];
  slides: MockSlide[];
};

// ─── ODS ──────────────────────────────────────────────────────────────────────

const ODS_LABELS: Record<number, string> = {
  1: "Erradicação da Pobreza", 2: "Fome Zero", 3: "Saúde e Bem-Estar",
  4: "Educação de Qualidade", 5: "Igualdade de Gênero", 6: "Água e Saneamento",
  7: "Energia Limpa", 8: "Trabalho Decente", 9: "Indústria e Inovação",
  10: "Redução das Desigualdades", 11: "Cidades Sustentáveis",
  12: "Consumo Responsável", 13: "Ação Climática", 14: "Vida na Água",
  15: "Vida Terrestre", 16: "Paz e Justiça", 17: "Parcerias",
};

const SLIDE_STYLES: Record<MockSlide["type"], { bg: string; icon: React.ReactNode; label: string }> = {
  capa:         { bg: "bg-[#142133]",  icon: <FiLayers className="h-5 w-5" />,    label: "Capa" },
  dados:        { bg: "bg-[#1d4ed8]",  icon: <FiBarChart2 className="h-5 w-5" />, label: "Dados" },
  projeto:      { bg: "bg-[#15803d]",  icon: <FiFolder className="h-5 w-5" />,    label: "Projeto" },
  indicadores:  { bg: "bg-[#7c3aed]",  icon: <FiTarget className="h-5 w-5" />,    label: "Indicadores" },
  ods:          { bg: "bg-[#b45309]",  icon: <FiGlobe className="h-5 w-5" />,     label: "ODS" },
  encerramento: { bg: "bg-[#374151]",  icon: <FiMonitor className="h-5 w-5" />,   label: "Encerramento" },
};

// ─── Mock de projetos ─────────────────────────────────────────────────────────

const INITIAL_DRAFTS: DraftProject[] = [
  {
    id: "draft-1",
    name: "Sistema de Monitoramento de Indicadores Sociais",
    shortDescription: "Plataforma integrada para monitoramento em tempo real de indicadores sociais da cidade de Barueri.",
    fullDescription: "O sistema propõe uma plataforma centralizada que agrega dados de diferentes secretarias e exibe indicadores como IDH, acesso a saneamento, taxa de escolaridade e cobertura de saúde em dashboards interativos. A solução permitirá que gestores públicos acompanhem a evolução dos índices mês a mês e tomem decisões baseadas em evidências, reduzindo o tempo de análise de semanas para horas.",
    team: "Planejamento Territorial",
    sector: "Planejamento",
    submittedBy: "Bianca Souza",
    submittedAt: "2026-09-10T14:30:00",
    categories: ["Social", "Transformação Digital"],
    status: "pending",
    mainDepartment: "Secretaria de Planejamento Urbano",
    relatedDepartments: ["Secretaria de Saúde", "Secretaria de Educação", "Secretaria de Assistência Social"],
    areas: ["Social", "Tecnologia da Informação", "Gestão Pública"],
    ods: [3, 10, 11, 16],
    theme: "Monitoramento social e governança baseada em dados",
    audience: "Gestores públicos municipais e secretários",
    technologies: ["React", "Node.js", "PostgreSQL", "Power BI"],
    implementationDate: "2026-11-01",
    keywords: ["indicadores sociais", "monitoramento", "gestão pública", "dados"],
    sources: ["https://barueri.sp.gov.br/planejamento", "https://ibge.gov.br"],
    awards: [],
    indicators: [
      { label: "Secretarias integradas", value: "8", measure: "secretarias", source: "Prefeitura de Barueri", year: 2026 },
      { label: "Tempo de análise reduzido", value: "85", measure: "%", source: "Estudo interno", year: 2026 },
    ],
    slides: [
      { id: "s1-1", title: "Capa Institucional", type: "capa" },
      { id: "s1-2", title: "Dados do Município", type: "dados" },
      { id: "s1-3", title: "Monitoramento em Tempo Real", type: "projeto" },
      { id: "s1-4", title: "Indicadores de Resultado", type: "indicadores" },
      { id: "s1-5", title: "ODS Relacionados", type: "ods" },
      { id: "s1-6", title: "Encerramento", type: "encerramento" },
    ],
  },
  {
    id: "draft-2",
    name: "App de Saúde Comunitária",
    shortDescription: "Aplicativo mobile para agentes de saúde registrarem visitas domiciliares e reportarem indicadores de saúde pública.",
    fullDescription: "O aplicativo funciona offline e sincroniza os dados quando o agente tem conexão à internet. Cada visita gera um registro georreferenciado com dados do paciente, medicamentos prescritos e alertas de risco. Um painel web centralizado exibe mapas de calor por bairro para identificar áreas prioritárias de intervenção, integrando-se ao sistema nacional de saúde do município.",
    team: "Planejamento Territorial",
    sector: "Planejamento",
    submittedBy: "Amanda Araújo",
    submittedAt: "2026-09-11T09:15:00",
    categories: ["Saúde", "Governo Digital"],
    status: "pending",
    mainDepartment: "Secretaria de Saúde",
    relatedDepartments: ["Secretaria de Planejamento Urbano", "Atenção Básica Municipal"],
    areas: ["Saúde Pública", "Tecnologia Mobile", "Georreferenciamento"],
    ods: [3, 11],
    theme: "Saúde preventiva e atenção básica digital",
    audience: "Agentes comunitários de saúde e coordenadores de UBS",
    technologies: ["React Native", "PostgreSQL", "PostGIS", "NestJS"],
    implementationDate: "2026-10-15",
    keywords: ["saúde comunitária", "agentes de saúde", "mobile", "UBS"],
    sources: ["https://aps.saude.gov.br", "https://barueri.sp.gov.br/saude"],
    awards: [{ institution: "Prêmio Inovação em Saúde Pública SP", year: 2026, description: "Destaque em solução digital para atenção básica", link: "https://exemplo.com" }],
    indicators: [
      { label: "Visitas domiciliares registradas/mês", value: "4.200", measure: "visitas", source: "Secretaria de Saúde", year: 2026 },
      { label: "Redução no tempo de registro", value: "70", measure: "%", source: "Relatório piloto", year: 2026 },
    ],
    slides: [
      { id: "s2-1", title: "Capa Institucional", type: "capa" },
      { id: "s2-2", title: "Panorama de Saúde Barueri", type: "dados" },
      { id: "s2-3", title: "App Saúde Comunitária", type: "projeto" },
      { id: "s2-4", title: "Resultados do Piloto", type: "indicadores" },
      { id: "s2-5", title: "Encerramento", type: "encerramento" },
    ],
  },
  {
    id: "draft-3",
    name: "Painel de Arrecadação Municipal",
    shortDescription: "Dashboard interativo para acompanhamento da arrecadação de ISS, IPTU e demais impostos municipais em tempo real.",
    fullDescription: "O painel consolida dados dos sistemas tributários do município e apresenta comparativos mensais e anuais de arrecadação por categoria de imposto e por bairro. Alertas automáticos notificam a equipe de fiscalização quando há queda relevante em determinada área. O sistema inclui módulo de projeção de receita para auxiliar no planejamento orçamentário do exercício seguinte.",
    team: "Orçamento Municipal",
    sector: "Financeiro",
    submittedBy: "Bernardo Carvalho",
    submittedAt: "2026-09-09T16:45:00",
    categories: ["Economia", "Governo Digital"],
    status: "pending",
    mainDepartment: "Secretaria de Finanças",
    relatedDepartments: ["Secretaria de Planejamento", "Receita Municipal"],
    areas: ["Finanças Públicas", "Business Intelligence", "Fiscalização"],
    ods: [8, 16, 17],
    theme: "Transparência fiscal e eficiência na arrecadação",
    audience: "Secretários de Finanças, equipe de fiscalização e prefeito",
    technologies: ["Power BI", "SQL Server", "Python", "Azure"],
    implementationDate: "2026-12-01",
    keywords: ["arrecadação", "IPTU", "ISS", "finanças municipais", "dashboard"],
    sources: ["https://prefeitura.sp.gov.br/financas", "https://sefin.barueri.sp.gov.br"],
    awards: [],
    indicators: [
      { label: "Receitas monitoradas em tempo real", value: "12", measure: "categorias", source: "Secretaria de Finanças", year: 2026 },
      { label: "Melhora na previsão orçamentária", value: "92", measure: "% acurácia", source: "Projeção interna", year: 2026 },
    ],
    slides: [
      { id: "s3-1", title: "Capa Institucional", type: "capa" },
      { id: "s3-2", title: "Arrecadação Municipal 2026", type: "dados" },
      { id: "s3-3", title: "Painel Tributário Integrado", type: "projeto" },
      { id: "s3-4", title: "Projeções e Resultados", type: "indicadores" },
      { id: "s3-5", title: "ODS 8 e 16", type: "ods" },
      { id: "s3-6", title: "Encerramento", type: "encerramento" },
    ],
  },
  {
    id: "draft-4",
    name: "Mapa de Riscos Ambientais",
    shortDescription: "Sistema de georreferenciamento para identificação e monitoramento de áreas de risco ambiental no município.",
    fullDescription: "Utilizando dados de satélite, sensores de qualidade do ar e histórico de desastres, a plataforma cria camadas de risco ambiental sobrepostas ao mapa da cidade. A equipe de Gestão Ambiental pode cadastrar vistorias e laudos técnicos diretamente no sistema, criar alertas automáticos para moradores de áreas críticas e gerar relatórios para órgãos reguladores como CETESB e IBAMA.",
    team: "Gestão Ambiental",
    sector: "Meio Ambiente",
    submittedBy: "Fábio Costa",
    submittedAt: "2026-09-08T11:00:00",
    categories: ["Meio Ambiente", "Cidades Inteligentes"],
    status: "pending",
    mainDepartment: "Secretaria de Meio Ambiente",
    relatedDepartments: ["Defesa Civil", "Secretaria de Obras", "Secretaria de Saúde"],
    areas: ["Meio Ambiente", "Georreferenciamento", "Defesa Civil"],
    ods: [11, 13, 15],
    theme: "Gestão ambiental inteligente e prevenção de riscos",
    audience: "Equipe de fiscalização ambiental, Defesa Civil e gestores",
    technologies: ["GIS", "QGIS", "Python", "API Google Maps", "PostgreSQL PostGIS"],
    implementationDate: "2026-11-15",
    keywords: ["risco ambiental", "georreferenciamento", "CETESB", "sustentabilidade"],
    sources: ["https://cetesb.sp.gov.br", "https://ibama.gov.br", "https://barueri.sp.gov.br/meioambiente"],
    awards: [],
    indicators: [
      { label: "Áreas de risco mapeadas", value: "47", measure: "áreas", source: "Secretaria de Meio Ambiente", year: 2026 },
      { label: "Tempo de emissão de laudo", value: "3", measure: "dias (antes: 15)", source: "Defesa Civil", year: 2026 },
    ],
    slides: [
      { id: "s4-1", title: "Capa Institucional", type: "capa" },
      { id: "s4-2", title: "Dados Ambientais Barueri", type: "dados" },
      { id: "s4-3", title: "Mapa de Riscos Integrado", type: "projeto" },
      { id: "s4-4", title: "ODS 11, 13 e 15", type: "ods" },
      { id: "s4-5", title: "Indicadores Ambientais", type: "indicadores" },
      { id: "s4-6", title: "Encerramento", type: "encerramento" },
    ],
  },
  {
    id: "draft-5",
    name: "Programa de Capacitação Digital",
    shortDescription: "Iniciativa de letramento digital para servidores públicos municipais com trilhas de aprendizado personalizadas.",
    fullDescription: "O programa oferece trilhas de capacitação em ferramentas de escritório, segurança da informação, uso de sistemas internos e alfabetização em dados. Cada servidor tem um plano de desenvolvimento individual gerado automaticamente com base no cargo e nas lacunas identificadas em avaliação diagnóstica. Certificados digitais são emitidos ao término de cada trilha e ficam vinculados ao prontuário funcional.",
    team: "Gestão de Pessoas",
    sector: "Recursos Humanos",
    submittedBy: "Mariana Lima",
    submittedAt: "2026-09-07T13:20:00",
    categories: ["Educação", "Inovação"],
    status: "pending",
    mainDepartment: "Secretaria de Gestão de Pessoas",
    relatedDepartments: ["Secretaria de Tecnologia", "Escola de Governo Municipal"],
    areas: ["Gestão de Pessoas", "Educação Corporativa", "Transformação Digital"],
    ods: [4, 8, 10],
    theme: "Capacitação digital e desenvolvimento de servidores públicos",
    audience: "Servidores públicos municipais de todos os níveis",
    technologies: ["LMS Moodle", "Microsoft 365", "Power Automate", "Node.js"],
    implementationDate: "2026-10-01",
    keywords: ["capacitação", "letramento digital", "servidores", "treinamento"],
    sources: ["https://escola.sp.gov.br", "https://barueri.sp.gov.br/gestao-pessoas"],
    awards: [{ institution: "Prêmio Gestão Pública Eficiente", year: 2026, description: "Melhor programa de capacitação em município paulista", link: "https://exemplo.com" }],
    indicators: [
      { label: "Servidores capacitados", value: "1.200", measure: "servidores", source: "RH Municipal", year: 2026 },
      { label: "Horas de treinamento entregues", value: "8.400", measure: "horas", source: "LMS interno", year: 2026 },
      { label: "Taxa de conclusão", value: "87", measure: "%", source: "LMS interno", year: 2026 },
    ],
    slides: [
      { id: "s5-1", title: "Capa Institucional", type: "capa" },
      { id: "s5-2", title: "Perfil dos Servidores Municipais", type: "dados" },
      { id: "s5-3", title: "Programa de Capacitação Digital", type: "projeto" },
      { id: "s5-4", title: "Resultados e Certificações", type: "indicadores" },
      { id: "s5-5", title: "ODS 4, 8 e 10", type: "ods" },
      { id: "s5-6", title: "Encerramento", type: "encerramento" },
    ],
  },
  {
    id: "draft-6",
    name: "Central de Atendimento Digital ao Cidadão",
    shortDescription: "Portal unificado de serviços municipais com atendimento via chatbot e integração com sistemas de protocolo.",
    fullDescription: "O portal centraliza mais de 80 serviços municipais em um único endereço digital, com autenticação via Gov.br. Um chatbot com IA guia o cidadão até o serviço correto e pode resolver demandas simples sem intervenção humana. Casos complexos são encaminhados para atendentes com todo o histórico do cidadão já preenchido, reduzindo o tempo médio de atendimento de 25 para 8 minutos.",
    team: "Gestão de Pessoas",
    sector: "Recursos Humanos",
    submittedBy: "Roberto Alves",
    submittedAt: "2026-09-06T10:00:00",
    categories: ["Governo Digital", "Inovação"],
    status: "pending",
    mainDepartment: "Secretaria de Governo Digital",
    relatedDepartments: ["Todas as secretarias", "Central de Atendimento ao Cidadão"],
    areas: ["Governo Digital", "Inteligência Artificial", "Atendimento ao Cidadão"],
    ods: [11, 16, 17],
    theme: "Digitalização de serviços públicos e melhoria no atendimento",
    audience: "Cidadãos de Barueri e servidores de atendimento",
    technologies: ["React", "NestJS", "OpenAI API", "Gov.br OAuth", "Redis"],
    implementationDate: "2027-02-01",
    keywords: ["portal cidadão", "chatbot", "serviços digitais", "Gov.br"],
    sources: ["https://gov.br/servicos", "https://barueri.sp.gov.br/cidadao"],
    awards: [],
    indicators: [
      { label: "Serviços digitalizados", value: "80+", measure: "serviços", source: "Sec. Governo Digital", year: 2026 },
      { label: "Redução no tempo de atendimento", value: "68", measure: "%", source: "Central de Atendimento", year: 2026 },
      { label: "Satisfação do cidadão", value: "4.7", measure: "/5", source: "Pesquisa NPS", year: 2026 },
    ],
    slides: [
      { id: "s6-1", title: "Capa Institucional", type: "capa" },
      { id: "s6-2", title: "Demanda por Serviços Digitais", type: "dados" },
      { id: "s6-3", title: "Central Digital ao Cidadão", type: "projeto" },
      { id: "s6-4", title: "Indicadores de Satisfação", type: "indicadores" },
      { id: "s6-5", title: "Encerramento", type: "encerramento" },
    ],
  },
  {
    id: "draft-7",
    name: "Plataforma de Mobilidade Urbana Integrada",
    shortDescription: "Integração de dados de transporte público, ciclovias e estacionamentos para otimização do tráfego.",
    fullDescription: "A plataforma agrega dados em tempo real de ônibus, metrô, bicicletas compartilhadas e vagas de estacionamento, exibindo um mapa multimodal acessível pelo site e aplicativo municipal. Um algoritmo de otimização sugere rotas com menor tempo de deslocamento e menor emissão de carbono. O sistema também alimenta painéis de informação instalados em terminais de ônibus e estações de metrô.",
    team: "Infraestrutura e Obras",
    sector: "Infraestrutura",
    submittedBy: "Cláudio Santos",
    submittedAt: "2026-09-05T15:30:00",
    categories: ["Mobilidade Urbana", "Cidades Inteligentes"],
    status: "pending",
    mainDepartment: "Secretaria de Mobilidade Urbana",
    relatedDepartments: ["Secretaria de Obras", "Empresa Municipal de Transportes", "Secretaria de Meio Ambiente"],
    areas: ["Mobilidade Urbana", "Smart City", "Transporte Público"],
    ods: [7, 11, 13],
    theme: "Mobilidade sustentável e cidades inteligentes",
    audience: "Cidadãos, gestores de transporte e secretaria de obras",
    technologies: ["React Native", "APIs de Trânsito", "IoT Sensors", "Elasticsearch", "Python"],
    implementationDate: "2027-03-01",
    keywords: ["mobilidade urbana", "transporte público", "smart city", "tráfego"],
    sources: ["https://cetsp.com.br", "https://barueri.sp.gov.br/mobilidade"],
    awards: [],
    indicators: [
      { label: "Modais integrados", value: "5", measure: "modais", source: "Sec. Mobilidade", year: 2026 },
      { label: "Redução de emissões prevista", value: "22", measure: "%", source: "Estudo técnico", year: 2026 },
      { label: "Usuários esperados/mês", value: "180.000", measure: "cidadãos", source: "Projeção", year: 2026 },
    ],
    slides: [
      { id: "s7-1", title: "Capa Institucional", type: "capa" },
      { id: "s7-2", title: "Mobilidade em Barueri", type: "dados" },
      { id: "s7-3", title: "Plataforma Multimodal", type: "projeto" },
      { id: "s7-4", title: "Projeções de Impacto", type: "indicadores" },
      { id: "s7-5", title: "ODS 7, 11 e 13", type: "ods" },
      { id: "s7-6", title: "Encerramento", type: "encerramento" },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function groupByTeam(drafts: DraftProject[]): Map<string, DraftProject[]> {
  const map = new Map<string, DraftProject[]>();
  for (const d of drafts) {
    if (d.status !== "pending") continue;
    const list = map.get(d.team) ?? [];
    list.push(d);
    map.set(d.team, list);
  }
  return map;
}

const CATEGORY_COLORS: Partial<Record<ProjectCategory, string>> = {
  Saúde: "bg-[#ecfeff] text-[#0e7490] border-[#a5f3fc]",
  Educação: "bg-[#f5f3ff] text-[#7c3aed] border-[#ddd6fe]",
  Inovação: "bg-[#fffbeb] text-[#d97706] border-[#fde68a]",
  "Transformação Digital": "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]",
  "Cidades Inteligentes": "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]",
  "Governo Digital": "bg-[#eef2ff] text-[#4338ca] border-[#c7d2fe]",
  "Mobilidade Urbana": "bg-[#fef3c7] text-[#b45309] border-[#fde68a]",
  "Meio Ambiente": "bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]",
  Social: "bg-[#fdf2f8] text-[#9d174d] border-[#fbcfe8]",
  Economia: "bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]",
  Infraestrutura: "bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]",
};

// ─── Nav central do approver (Times + Configurações) ─────────────────────────

const navPillClass =
  "flex h-10 items-center justify-center rounded-[50px] border border-transparent px-3 text-[1rem] font-semibold whitespace-nowrap !text-white transition-all hover:-translate-y-0.5 hover:border-[#1675b8] hover:bg-[rgba(22,117,184,0.5)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] focus:outline-none focus:ring-4 focus:ring-white/25 lg:h-11 lg:px-3.5 lg:text-[1.05rem]";
const activeNavPillClass = "border-[#1675b8] bg-[rgba(22,117,184,0.5)] shadow-[0_4px_12px_rgba(0,0,0,0.12)]";

function ApproverCenterNav({ isSettings }: { isSettings: boolean }) {
  return (
    <>
      <Link
        to={ROUTE_PATHS.teams}
        className={`${navPillClass} ${!isSettings ? activeNavPillClass : ""}`}
      >
        Times
      </Link>
      <div aria-hidden="true" className="h-6 w-0.5 bg-white/30" />
      <Link
        to={ROUTE_PATHS.settings}
        className={`${navPillClass} ${isSettings ? activeNavPillClass : ""}`}
      >
        <FiSettings className="mr-1.5 inline-block h-4 w-4" />
        Configurações
      </Link>
    </>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function TeamsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<DraftProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmReject, setConfirmReject] = useState<DraftProject | null>(null);
  const [detailProject, setDetailProject] = useState<DraftProject | null>(null);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("");

  // Carrega projetos em rascunho (status=1) do backend real
  useEffect(() => {
    async function load() {
      try {
        const [projectsRes, teamsRes, usersRes] = await Promise.all([
          fetch("/api/projects?status=1"),
          fetch("/api/teams"),
          fetch("/api/management"),
        ]);

        if (!projectsRes.ok) throw new Error("backend indisponível");

        const projects: ApiProject[] = await projectsRes.json();
        const teams: ApiTeam[] = teamsRes.ok ? await teamsRes.json() : [];
        const users: ApiUser[] = usersRes.ok ? await usersRes.json() : [];

        const teamMap = new Map(teams.map((t) => [t.id, t]));
        const userMap = new Map(users.map((u) => [u.id, u]));

        const mapped: DraftProject[] = projects.map((p) => {
          const teamData = p.team ? teamMap.get(p.team) : undefined;
          const userData = p.user ? userMap.get(p.user) : undefined;
          return {
            id: p.id,
            name: p.name,
            shortDescription: p.short_description ?? "",
            fullDescription: p.full_description ?? "",
            team: teamData?.name ?? p.team ?? "—",
            sector: teamData?.sectorName ?? "—",
            submittedBy: userData?.name ?? p.user ?? "—",
            submittedAt: p.last_update ?? new Date().toISOString(),
            categories: (p.areas.slice(0, 2) as ProjectCategory[]),
            status: "pending" as const,
            mainDepartment: p.main_department ?? "—",
            relatedDepartments: p.related_departments,
            areas: p.areas,
            ods: p.ods,
            theme: p.theme ?? "",
            audience: p.audience ?? "",
            technologies: p.technologies,
            implementationDate: p.implementation_date ?? "",
            keywords: p.keywords,
            sources: p.source.map((s) => s.url),
            awards: p.awards.map((a) => ({
              institution: a.institution,
              year: a.year,
              description: a.description ?? "",
              link: a.link ?? undefined,
            })),
            indicators: p.indicators.map((i) => ({
              label: i.label,
              value: i.value,
              measure: i.measure ?? "",
              source: i.source,
              year: i.year,
            })),
            // slides ainda não existem no backend — mock padrão
            slides: [
              { id: `${p.id}-capa`, title: "Capa Institucional", type: "capa" as const },
              { id: `${p.id}-dados`, title: "Dados do Projeto", type: "dados" as const },
              { id: `${p.id}-projeto`, title: p.name, type: "projeto" as const },
              ...(p.ods.length > 0 ? [{ id: `${p.id}-ods`, title: `ODS ${p.ods.join(", ")}`, type: "ods" as const }] : []),
              ...(p.indicators.length > 0 ? [{ id: `${p.id}-ind`, title: "Indicadores", type: "indicadores" as const }] : []),
              { id: `${p.id}-enc`, title: "Encerramento", type: "encerramento" as const },
            ],
          };
        });

        setDrafts(mapped.length > 0 ? mapped : INITIAL_DRAFTS);
      } catch {
        // Backend fora do ar — usa dados mock para demonstração
        setDrafts(INITIAL_DRAFTS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const pendingDrafts = drafts.filter((d) => d.status === "pending");
  const pendingCount = pendingDrafts.length;

  const teamGroups = useMemo(() => {
    const filtered = selectedTeamFilter
      ? pendingDrafts.filter((d) => d.team === selectedTeamFilter)
      : pendingDrafts;
    return groupByTeam(filtered);
  }, [drafts, selectedTeamFilter]);

  const allTeams = useMemo(
    () => [...new Set(pendingDrafts.map((d) => d.team))].sort(),
    [drafts],
  );

  async function handleApprove(id: string) {
    try {
      const res = await fetch(`/api/projects/${id}/approve`, {
        method: "PATCH",
        headers: authHeader(),
      });
      if (!res.ok) throw new Error();
    } catch {
      // continua a atualização local mesmo se o backend falhar (demo)
    }
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, status: "approved" as const } : d)));
    if (detailProject?.id === id) setDetailProject(null);
  }

  function handleReject(project: DraftProject) {
    setConfirmReject(project);
    setDetailProject(null);
  }

  async function confirmRejectAction() {
    if (!confirmReject) return;
    try {
      await fetch(`/api/projects/${confirmReject.id}/reject`, {
        method: "DELETE",
        headers: authHeader(),
      });
    } catch {
      // continua localmente em modo demo
    }
    setDrafts((prev) =>
      prev.map((d) => (d.id === confirmReject.id ? { ...d, status: "rejected" as const } : d)),
    );
    setConfirmReject(null);
  }

  function handleLogout() {
    logout();
    navigate(ROUTE_PATHS.login);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.92)_0%,rgba(239,240,250,0.96)_46%,rgba(226,227,247,0.96)_100%)] text-[#1e1e1e]">
      <AuthenticatedHeader
        canCreate={false}
        customCenterNav={<ApproverCenterNav isSettings={false} />}
        logoTo={ROUTE_PATHS.teams}
        onLogout={handleLogout}
        presentationsTo={ROUTE_PATHS.teams}
        showDesktopLogo
        showMobileLogo
        user={user}
      />

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        {/* Título + filtro */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#eff6ff] px-3 py-1.5 text-[0.78rem] font-bold uppercase tracking-wider text-[#1675b8]">
              <FiUsers className="h-3.5 w-3.5" />
              Painel do Aprovador
            </div>
            <h1 className="text-[2.2rem] font-extrabold tracking-[-0.05em] text-[#1e1e1e] sm:text-[2.8rem]">
              Times
            </h1>
            <p className="mt-1 text-[1rem] font-medium text-[#878787]">
              {pendingCount === 0
                ? "Nenhum projeto aguardando aprovação"
                : `${pendingCount} projeto${pendingCount !== 1 ? "s" : ""} aguardando aprovação`}
            </p>
          </div>

          {allTeams.length > 1 && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <FiFilter className="h-4 w-4 shrink-0 text-[#6b7280]" />
              <select
                value={selectedTeamFilter}
                onChange={(e) => setSelectedTeamFilter(e.target.value)}
                className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-[0.88rem] font-medium text-[#1e1e1e] shadow-[0_1px_4px_rgba(20,33,51,0.06)] focus:outline-none focus:ring-2 focus:ring-[#1675b8]/30"
              >
                <option value="">Todos os times</option>
                {allTeams.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {selectedTeamFilter && (
                <button type="button" onClick={() => setSelectedTeamFilter("")} className="text-[0.82rem] font-semibold text-[#1675b8] underline">
                  Limpar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1675b8] border-t-transparent" />
            <span className="ml-3 text-[1rem] font-medium text-[#6b7280]">Carregando projetos...</span>
          </div>
        )}

        {/* Estado vazio geral */}
        {!loading && pendingCount === 0 && (
          <div className="flex flex-col items-center gap-5 rounded-[24px] border border-dashed border-[#d1d5db] bg-[#f9fafb] py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#dcfce7]">
              <FiCheck className="h-8 w-8 text-[#16a34a]" />
            </div>
            <div>
              <p className="text-[1.1rem] font-bold text-[#374151]">Tudo em dia!</p>
              <p className="mt-1 text-[0.92rem] text-[#9ca3af]">Não há projetos aguardando aprovação.</p>
            </div>
          </div>
        )}

        {/* Times */}
        {!loading && teamGroups.size > 0 && (
          <div className="space-y-8">
            {[...teamGroups.entries()].map(([teamName, projects]) => (
              <TeamSection
                key={teamName}
                teamName={teamName}
                sector={projects[0]?.sector ?? ""}
                projects={projects}
                onViewDetail={setDetailProject}
              />
            ))}
          </div>
        )}

        {!loading && pendingCount > 0 && teamGroups.size === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-[24px] border border-dashed border-[#d1d5db] bg-[#f9fafb] py-16 text-center">
            <FiFilter className="h-8 w-8 text-[#9ca3af]" />
            <p className="text-[0.96rem] font-semibold text-[#374151]">
              Nenhum projeto encontrado para o filtro selecionado.
            </p>
            <button type="button" onClick={() => setSelectedTeamFilter("")} className="text-[0.88rem] font-semibold text-[#1675b8] underline">
              Ver todos os times
            </button>
          </div>
        )}
      </main>

      {/* Modal de detalhes completo */}
      {detailProject && (
        <DetailModal
          project={detailProject}
          onClose={() => setDetailProject(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Modal de confirmação de rejeição */}
      {confirmReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#142133]/60 px-4 backdrop-blur-[3px]">
          <div className="w-full max-w-md rounded-[20px] bg-white p-7 shadow-[0_24px_64px_rgba(20,33,51,0.22)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fef2f2]">
              <FiX className="h-6 w-6 text-[#dc2626]" />
            </div>
            <h2 className="mt-4 text-[1.15rem] font-bold text-[#1e1e1e]">Rejeitar projeto?</h2>
            <p className="mt-2 text-[0.92rem] text-[#6b7280]">
              O projeto{" "}
              <span className="font-semibold text-[#1e1e1e]">"{confirmReject.name}"</span>{" "}
              será removido da fila e o autor será notificado. Esta ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmReject(null)}
                className="flex-1 rounded-full border border-[#e5e7eb] bg-white py-2.5 text-[0.92rem] font-semibold text-[#374151] transition hover:bg-[#f9fafb]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmRejectAction}
                className="flex-1 rounded-full bg-[#dc2626] py-2.5 text-[0.92rem] font-bold text-white shadow-[0_4px_12px_rgba(220,38,38,0.3)] transition hover:bg-[#b91c1c]"
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal de detalhes completo ───────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 border-b border-[#f3f4f6] pb-2">
        <span className="text-[#1675b8]">{icon}</span>
        <h3 className="text-[0.78rem] font-bold uppercase tracking-widest text-[#9ca3af]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Badge({ text, color = "bg-[#f1f5f9] text-[#475569]" }: { text: string; color?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.78rem] font-semibold ${color}`}>
      {text}
    </span>
  );
}

function DetailModal({
  project: p,
  onClose,
  onApprove,
  onReject,
}: {
  project: DraftProject;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (p: DraftProject) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#142133]/60 backdrop-blur-[3px] sm:items-center sm:p-4">
      <div
        className="flex w-full flex-col bg-white shadow-[0_24px_64px_rgba(20,33,51,0.24)] sm:max-w-2xl sm:rounded-[22px]"
        style={{ maxHeight: "calc(100dvh - 32px)" }}
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4 border-b border-[#f3f4f6] p-5 pb-4">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap gap-1.5">
              {p.categories.map((cat) => {
                const color = CATEGORY_COLORS[cat] ?? "bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]";
                return (
                  <span key={cat} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.72rem] font-semibold ${color}`}>
                    <FiTag className="h-2.5 w-2.5" />{cat}
                  </span>
                );
              })}
            </div>
            <h2 className="text-[1.15rem] font-bold leading-snug text-[#1e1e1e]">{p.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f3f4f6] text-[#6b7280] transition hover:bg-[#e5e7eb]"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Corpo (scrollável) */}
        <div className="flex-1 space-y-6 overflow-y-auto p-5">

          {/* Metadados */}
          <Section title="Identificação" icon={<FiFolder className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#f9fafb] p-4 text-[0.84rem] sm:grid-cols-3">
              {[
                { label: "Time", value: p.team, icon: <FiUsers className="h-3.5 w-3.5 text-[#1675b8]" /> },
                { label: "Setor", value: p.sector, icon: <FiFolder className="h-3.5 w-3.5 text-[#6b7280]" /> },
                { label: "Secretaria Principal", value: p.mainDepartment, icon: <FiLayers className="h-3.5 w-3.5 text-[#6b7280]" /> },
                { label: "Submetido por", value: p.submittedBy, icon: <FiUser className="h-3.5 w-3.5 text-[#6b7280]" /> },
                { label: "Data de envio", value: fmtDate(p.submittedAt), icon: <FiClock className="h-3.5 w-3.5 text-[#6b7280]" /> },
                { label: "Implementação prevista", value: fmtDate(p.implementationDate), icon: <FiZap className="h-3.5 w-3.5 text-[#6b7280]" /> },
              ].map(({ label, value, icon }) => (
                <div key={label}>
                  <p className="mb-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-[#9ca3af]">{label}</p>
                  <p className="flex items-center gap-1.5 font-semibold text-[#374151]">{icon}{value}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Secretarias relacionadas */}
          {p.relatedDepartments.length > 0 && (
            <Section title="Secretarias Relacionadas" icon={<FiLayers className="h-4 w-4" />}>
              <div className="flex flex-wrap gap-2">
                {p.relatedDepartments.map((d) => <Badge key={d} text={d} />)}
              </div>
            </Section>
          )}

          {/* Contexto */}
          <Section title="Contexto" icon={<FiTarget className="h-4 w-4" />}>
            <div className="space-y-3 text-[0.9rem] text-[#374151]">
              <div>
                <span className="text-[0.72rem] font-bold uppercase tracking-wide text-[#9ca3af]">Tema </span>
                <span>{p.theme}</span>
              </div>
              <div>
                <span className="text-[0.72rem] font-bold uppercase tracking-wide text-[#9ca3af]">Público-alvo </span>
                <span>{p.audience}</span>
              </div>
            </div>
          </Section>

          {/* Descrições */}
          <Section title="Descrição" icon={<FiLayers className="h-4 w-4" />}>
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-[0.72rem] font-bold uppercase tracking-wide text-[#9ca3af]">Resumida</p>
                <p className="text-[0.9rem] leading-relaxed text-[#374151]">{p.shortDescription}</p>
              </div>
              <div>
                <p className="mb-1 text-[0.72rem] font-bold uppercase tracking-wide text-[#9ca3af]">Completa</p>
                <p className="text-[0.9rem] leading-relaxed text-[#374151]">{p.fullDescription}</p>
              </div>
            </div>
          </Section>

          {/* Áreas temáticas */}
          <Section title="Áreas Temáticas" icon={<FiHash className="h-4 w-4" />}>
            <div className="flex flex-wrap gap-2">
              {p.areas.map((a) => (
                <Badge key={a} text={a} color="bg-[#eff6ff] text-[#1d4ed8]" />
              ))}
            </div>
          </Section>

          {/* ODS */}
          {p.ods.length > 0 && (
            <Section title="ODS — Objetivos de Desenvolvimento Sustentável" icon={<FiGlobe className="h-4 w-4" />}>
              <div className="flex flex-wrap gap-2">
                {p.ods.map((num) => (
                  <span key={num} className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] px-3 py-1 text-[0.78rem] font-semibold text-[#059669]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#059669] text-[0.68rem] font-bold text-white">{num}</span>
                    {ODS_LABELS[num] ?? `ODS ${num}`}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Tecnologias */}
          {p.technologies.length > 0 && (
            <Section title="Tecnologias Utilizadas" icon={<FiZap className="h-4 w-4" />}>
              <div className="flex flex-wrap gap-2">
                {p.technologies.map((t) => <Badge key={t} text={t} color="bg-[#f5f3ff] text-[#7c3aed]" />)}
              </div>
            </Section>
          )}

          {/* Indicadores */}
          {p.indicators.length > 0 && (
            <Section title="Indicadores de Resultado" icon={<FiBarChart2 className="h-4 w-4" />}>
              <div className="space-y-2">
                {p.indicators.map((ind, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-[#f9fafb] px-4 py-3">
                    <div>
                      <p className="text-[0.86rem] font-semibold text-[#1e1e1e]">{ind.label}</p>
                      <p className="text-[0.76rem] text-[#9ca3af]">{ind.source} · {ind.year}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[1.15rem] font-extrabold text-[#1675b8]">{ind.value}</p>
                      <p className="text-[0.72rem] text-[#9ca3af]">{ind.measure}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Premiações */}
          {p.awards.length > 0 && (
            <Section title="Premiações" icon={<FiAward className="h-4 w-4" />}>
              <div className="space-y-2">
                {p.awards.map((aw, i) => (
                  <div key={i} className="rounded-xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[0.88rem] font-bold text-[#92400e]">{aw.institution}</p>
                        <p className="text-[0.8rem] text-[#78350f]">{aw.description}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#fef9c3] px-2 py-0.5 text-[0.72rem] font-bold text-[#92400e]">{aw.year}</span>
                    </div>
                    {aw.link && (
                      <a href={aw.link} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-[0.76rem] font-semibold text-[#b45309] hover:underline">
                        <FiExternalLink className="h-3 w-3" /> Ver premiação
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Fontes e Palavras-chave */}
          <Section title="Fontes e Palavras-chave" icon={<FiLink className="h-4 w-4" />}>
            {p.sources.length > 0 && (
              <div className="mb-3 space-y-1.5">
                {p.sources.map((src) => (
                  <a key={src} href={src} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[0.82rem] font-medium text-[#1675b8] hover:underline">
                    <FiExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">{src}</span>
                  </a>
                ))}
              </div>
            )}
            {p.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {p.keywords.map((kw) => (
                  <span key={kw} className="inline-flex items-center gap-1 rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[0.76rem] text-[#475569]">
                    <FiHash className="h-2.5 w-2.5" />{kw}
                  </span>
                ))}
              </div>
            )}
          </Section>

          {/* Preview dos slides */}
          <Section title="Preview dos Slides" icon={<FiMonitor className="h-4 w-4" />}>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {p.slides.map((slide, idx) => {
                const style = SLIDE_STYLES[slide.type];
                return (
                  <div key={slide.id} className="flex w-[120px] shrink-0 flex-col items-center gap-2">
                    <div className={`flex h-[75px] w-[120px] flex-col items-center justify-center gap-1 rounded-[10px] ${style.bg} text-white shadow-[0_2px_8px_rgba(0,0,0,0.18)]`}>
                      {style.icon}
                      <span className="text-[0.6rem] font-bold uppercase tracking-wide opacity-80">{style.label}</span>
                    </div>
                    <span className="text-center text-[0.68rem] font-semibold leading-tight text-[#6b7280]">
                      {idx + 1}. {slide.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>

        {/* Rodapé com ações */}
        <div className="flex gap-3 border-t border-[#f3f4f6] p-5 pt-4">
          <button
            type="button"
            onClick={() => onReject(p)}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#fecaca] bg-[#fef2f2] py-3 text-[0.92rem] font-semibold text-[#dc2626] transition hover:bg-[#fee2e2]"
          >
            <FiX className="h-4 w-4" /> Rejeitar
          </button>
          <button
            type="button"
            onClick={() => { onApprove(p.id); onClose(); }}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#16a34a] py-3 text-[0.92rem] font-bold text-white shadow-[0_4px_12px_rgba(22,163,74,0.3)] transition hover:bg-[#15803d]"
          >
            <FiCheck className="h-4 w-4" /> Aprovar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Seção de time ────────────────────────────────────────────────────────────

function TeamSection({ teamName, sector, projects, onViewDetail }: {
  teamName: string; sector: string; projects: DraftProject[];
  onViewDetail: (p: DraftProject) => void;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eff6ff]">
          <FiUsers className="h-5 w-5 text-[#1675b8]" />
        </div>
        <div>
          <h2 className="text-[1.1rem] font-bold text-[#1e1e1e]">{teamName}</h2>
          <p className="text-[0.82rem] text-[#9ca3af]">{sector}</p>
        </div>
        <span className="ml-auto rounded-full bg-[#fef9c3] px-3 py-1 text-[0.78rem] font-bold text-[#92400e]">
          {projects.length} pendente{projects.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="space-y-4 pl-0 sm:pl-[52px]">
        {projects.map((project) => (
          <DraftProjectCard key={project.id} project={project} onViewDetail={onViewDetail} />
        ))}
      </div>
    </section>
  );
}

// ─── Card de projeto ──────────────────────────────────────────────────────────

function DraftProjectCard({ project: p, onViewDetail }: {
  project: DraftProject;
  onViewDetail: (p: DraftProject) => void;
}) {
  return (
    <div className="rounded-[18px] border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_12px_rgba(20,33,51,0.06)] transition hover:shadow-[0_6px_20px_rgba(20,33,51,0.1)]">
      <div className="mb-3 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <FiFolder className="h-4 w-4 shrink-0 text-[#9ca3af]" />
            <h3 className="truncate text-[1rem] font-bold text-[#1e1e1e]">{p.name}</h3>
          </div>
          <p className="line-clamp-2 text-[0.88rem] leading-relaxed text-[#6b7280]">{p.shortDescription}</p>
        </div>
      </div>
      {p.categories.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {p.categories.map((cat) => {
            const color = CATEGORY_COLORS[cat] ?? "bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]";
            return (
              <span key={cat} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.74rem] font-semibold ${color}`}>
                <FiTag className="h-3 w-3" />{cat}
              </span>
            );
          })}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f3f4f6] pt-3">
        <div className="flex items-center gap-3 text-[0.82rem] text-[#9ca3af]">
          <span className="flex items-center gap-1.5"><FiUser className="h-3.5 w-3.5" />{p.submittedBy}</span>
          <span className="flex items-center gap-1.5"><FiClock className="h-3.5 w-3.5" />{fmtDateShort(p.submittedAt)}</span>
        </div>
        <button
          type="button"
          onClick={() => onViewDetail(p)}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-4 py-2 text-[0.84rem] font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe]"
        >
          Analisar projeto
        </button>
      </div>
    </div>
  );
}
