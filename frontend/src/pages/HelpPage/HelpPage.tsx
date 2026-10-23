import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiChevronDown, FiMail } from "react-icons/fi";
import AuthenticatedHeader from "../../components/AuthenticatedHeader";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context";
import { canCreatePresentations } from "../../lib/accessControl";
import { ROUTE_PATHS } from "../../router/paths";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqCategory = {
  title: string;
  items: FaqItem[];
};

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    title: "Primeiros Passos",
    items: [
      {
        question: "O que é o sistema de Apresentações Inteligentes?",
        answer:
          "É uma plataforma desenvolvida pela Prefeitura de Barueri para criar apresentações institucionais de forma rápida e padronizada. Com o auxílio de inteligência artificial, o sistema gera slides automaticamente a partir das informações fornecidas, seguindo a identidade visual oficial do município.",
      },
      {
        question: "Como faço para acessar o sistema?",
        answer:
          "O acesso é realizado pela página de login com e-mail e senha cadastrados. Caso ainda não tenha acesso, entre em contato com o administrador do sistema da sua secretaria para solicitar um cadastro.",
      },
      {
        question: "Esqueci minha senha. O que faço?",
        answer:
          "Na tela de login, clique em 'Esqueci minha senha'. Digite o e-mail cadastrado e você receberá um link de redefinição em até alguns minutos. O link expira em 30 minutos, então acesse-o logo após receber o e-mail.",
      },
      {
        question: "O sistema funciona em dispositivos móveis?",
        answer:
          "Sim. O sistema é responsivo e pode ser acessado por smartphones e tablets. Para uma experiência completa de criação e edição de apresentações, recomendamos o uso em computador.",
      },
    ],
  },
  {
    title: "Criação de Apresentações",
    items: [
      {
        question: "Como crio uma nova apresentação?",
        answer:
          "Após fazer login, clique em 'Criar Apresentação' no menu lateral. Preencha as informações solicitadas — tema, público-alvo, idioma e outros detalhes de contexto — e o sistema irá gerar os slides automaticamente.",
      },
      {
        question: "Quanto tempo leva para gerar uma apresentação?",
        answer:
          "O tempo de geração varia conforme a complexidade e o número de slides solicitados. Em geral, o processo leva entre 5 e 7 minutos. Aguarde na tela de resultado sem fechar o navegador.",
      },
      {
        question: "Posso editar a apresentação depois de gerada?",
        answer:
          "Não. Após a apresentação ser gerada e salva, o conteúdo não pode ser alterado. Revise bem as informações antes de confirmar a geração.",
      },
      {
        question: "Quais formatos de exportação estão disponíveis?",
        answer:
          "As apresentações são exportadas no formato .pptx (PowerPoint), compatível com Microsoft Office e Google Slides. Outros formatos como PDF podem ser gerados a partir dessas ferramentas.",
      },
    ],
  },
  {
    title: "Templates e Projetos",
    items: [
      {
        question: "O que são templates?",
        answer:
          "Um template é um esqueleto de apresentação pronto para reutilizar. Ele define a sequência de seções (abertura, projetos, indicadores, encerramento...), o tipo de evento e a duração estimada — mas não o conteúdo em si. Ao clicar em 'Usar este Template', o assistente de criação é iniciado com essa estrutura já configurada. Diferente dos Projetos Institucionais (que são o acervo de conteúdo da prefeitura), os templates são receitas de como montar uma apresentação para cada ocasião.",
      },
      {
        question: "O que são Projetos Institucionais?",
        answer:
          "Projetos Institucionais são apresentações já finalizadas e aprovadas que ficam disponíveis para consulta e reutilização. Eles servem como referência para novos trabalhos ou podem ser compartilhados diretamente.",
      },
      {
        question: "Posso criar meu próprio template?",
        answer:
          "A criação e gestão de templates é restrita a usuários com perfil de administrador. Se precisar de um template específico para sua secretaria, entre em contato com o administrador do sistema.",
      },
    ],
  },
  {
    title: "Permissões e Acesso",
    items: [
      {
        question: "Quais são os perfis de usuário do sistema?",
        answer:
          "O sistema possui três perfis principais: Usuário (cria e visualiza apresentações), Aprovador (revisa e aprova conteúdos gerados) e Administrador (gerencia usuários, templates e configurações do sistema).",
      },
      {
        question: "Como solicito alteração do meu perfil de acesso?",
        answer:
          "Entre em contato com o administrador do sistema da sua secretaria informando sua necessidade. Somente administradores podem alterar perfis de usuário.",
      },
      {
        question: "O que fazer se minha conta foi bloqueada?",
        answer:
          "Contas bloqueadas precisam ser reativadas por um administrador. Entre em contato com o responsável pelo sistema na sua secretaria para solicitar a reativação.",
      },
    ],
  },
];

function AccordionItem({ item }: { item: FaqItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-[#e8edf2] last:border-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex w-full items-start justify-between gap-4 py-5 text-left transition-colors hover:text-[#1675b8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1675b8]/40"
      >
        <span className="text-[0.97rem] font-semibold leading-snug text-[#1e1e1e]">
          {item.question}
        </span>
        <FiChevronDown
          className={`mt-0.5 h-5 w-5 shrink-0 text-[#1675b8] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <p className="pb-5 pr-9 text-[0.94rem] leading-relaxed text-[#555]">
          {item.answer}
        </p>
      )}
    </div>
  );
}

function HelpPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = Boolean(user);

  function handleLogout() {
    logout();
    navigate(ROUTE_PATHS.login);
  }

  return (
    <div data-page-theme="public" className="min-h-screen bg-[#f8fafc] text-[#1e1e1e]">
      {isLoggedIn ? (
        <AuthenticatedHeader
          canCreate={canCreatePresentations(user)}
          logoTo={ROUTE_PATHS.presentations}
          onLogout={handleLogout}
          presentationsTo={ROUTE_PATHS.presentations}
          showDesktopLogo
          showMobileLogo
          user={user}
        />
      ) : (
        <Navbar />
      )}

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8">

        <div className="mb-12 text-center">
          <h1 className="text-[2rem] font-extrabold tracking-[-0.03em] text-[#1e1e1e] sm:text-[2.5rem]">
            Central de Ajuda
          </h1>
          <p className="mt-3 text-[1rem] leading-relaxed text-[#706e6e]">
            Encontre respostas para as dúvidas mais comuns sobre o sistema.
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {FAQ_CATEGORIES.map((category) => (
            <section key={category.title}>
              <h2 className="mb-3 text-[0.78rem] font-bold uppercase tracking-[0.1em] text-[#1675b8]">
                {category.title}
              </h2>
              <div className="rounded-[16px] bg-white px-6 shadow-[0_2px_10px_rgba(0,0,0,0.07)]">
                {category.items.map((item) => (
                  <AccordionItem key={item.question} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-14 rounded-[16px] bg-[#1675b8] px-8 py-8 text-center text-white shadow-[0_4px_20px_rgba(22,117,184,0.25)]">
          <h2 className="text-[1.2rem] font-bold">Não encontrou o que procurava?</h2>
          <p className="mt-2 text-[0.94rem] text-white/80">
            Entre em contato com o suporte ou acesse o sistema para criar sua apresentação.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a
              href="mailto:apresentacoes.inteligentes.bru@gmail.com"
              className="inline-flex items-center gap-2 rounded-[12px] bg-white px-5 py-2.5 text-[0.92rem] font-semibold text-[#1675b8] transition-transform hover:-translate-y-0.5"
            >
              <FiMail className="h-4 w-4" aria-hidden="true" />
              Enviar e-mail
            </a>
            <Link
              to={ROUTE_PATHS.login}
              className="inline-flex items-center rounded-[12px] border border-white/40 px-5 py-2.5 text-[0.92rem] font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              Acessar o sistema
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}

export default HelpPage;
