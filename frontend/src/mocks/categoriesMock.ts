/**
 * Mock canônico: Categorias de Projetos
 *
 * Metadados ricos das categorias: cor, descrição e contagem de projetos.
 * Os components de UI importam via service; nunca diretamente.
 */

import type { ProjectCategory } from "../types/project";

export type CategoryMeta = {
  id: ProjectCategory;
  label: string;
  description: string;
  color: string;          // hex para exibição visual
  bgColor: string;        // cor de fundo suave
  projectCount: number;
};

export const categoriesMock: CategoryMeta[] = [
  {
    id: "Saúde",
    label: "Saúde",
    description: "Iniciativas digitais aplicadas à saúde pública e ao bem-estar do cidadão.",
    color: "#e53935",
    bgColor: "#fff5f5",
    projectCount: 1,
  },
  {
    id: "Educação",
    label: "Educação",
    description: "Plataformas e ferramentas para modernizar o ensino público municipal.",
    color: "#1e88e5",
    bgColor: "#f0f7ff",
    projectCount: 1,
  },
  {
    id: "Inovação",
    label: "Inovação",
    description: "Projetos pioneiros que posicionam Barueri como referência em inovação pública.",
    color: "#8e24aa",
    bgColor: "#faf0ff",
    projectCount: 3,
  },
  {
    id: "Transformação Digital",
    label: "Transformação Digital",
    description: "Digitalização de processos e serviços para aumentar eficiência e transparência.",
    color: "#00897b",
    bgColor: "#f0faf9",
    projectCount: 5,
  },
  {
    id: "Cidades Inteligentes",
    label: "Cidades Inteligentes",
    description: "Uso de tecnologia para tornar a gestão urbana mais inteligente e sustentável.",
    color: "#43a047",
    bgColor: "#f0faf0",
    projectCount: 2,
  },
  {
    id: "Governo Digital",
    label: "Governo Digital",
    description: "Serviços públicos digitais acessíveis e eficientes para o cidadão.",
    color: "#1675b8",
    bgColor: "#f0f7ff",
    projectCount: 5,
  },
  {
    id: "Inteligência Artificial",
    label: "Inteligência Artificial",
    description: "Aplicações de IA para otimizar processos e decisões municipais.",
    color: "#f57c00",
    bgColor: "#fff8f0",
    projectCount: 1,
  },
  {
    id: "Mobilidade",
    label: "Mobilidade",
    description: "Soluções para transporte, trânsito e mobilidade urbana sustentável.",
    color: "#039be5",
    bgColor: "#f0f9ff",
    projectCount: 0,
  },
  {
    id: "Meio Ambiente",
    label: "Meio Ambiente",
    description: "Iniciativas voltadas para sustentabilidade e gestão ambiental.",
    color: "#558b2f",
    bgColor: "#f4faf0",
    projectCount: 0,
  },
  {
    id: "Segurança",
    label: "Segurança",
    description: "Projetos de segurança pública e cibersegurança municipal.",
    color: "#c62828",
    bgColor: "#fff5f5",
    projectCount: 1,
  },
  {
    id: "Infraestrutura",
    label: "Infraestrutura",
    description: "Infraestrutura tecnológica que sustenta os sistemas da Prefeitura.",
    color: "#546e7a",
    bgColor: "#f5f7f8",
    projectCount: 1,
  },
  {
    id: "Social",
    label: "Social",
    description: "Programas digitais de inclusão social e assistência ao cidadão.",
    color: "#6d4c41",
    bgColor: "#faf5f3",
    projectCount: 1,
  },
];
