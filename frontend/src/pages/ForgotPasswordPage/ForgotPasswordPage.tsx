import type { CSSProperties, ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import loginLogo from "../../assets/images/create-logo.png";
import { ROUTE_PATHS } from "../../router/paths";

type FormState = "idle" | "submitting" | "success" | "error";

const backgroundShapes = [
  {
    className:
      "absolute -left-[42rem] -top-[10rem] h-[77.5rem] w-[85.5rem] rounded-full bg-[radial-gradient(circle_at_35%_35%,#d9e7f2_0%,#bdd4e6_48%,#9fbfd8_100%)] shadow-[0_30px_80px_rgba(112,154,189,0.24)]",
  },
  {
    className:
      "absolute left-[15.5rem] top-[3rem] h-[12rem] w-[12rem] rounded-full bg-[radial-gradient(circle_at_30%_30%,#fff2a6_0%,#ffe052_52%,#f7b500_100%)] shadow-[0_18px_40px_rgba(247,166,30,0.28)] blur-[1px]",
  },
  {
    className:
      "absolute right-[3.5rem] top-[4.5rem] h-[17rem] w-[17rem] rounded-full bg-[radial-gradient(circle_at_30%_30%,#ff8dc8_0%,#ec3fa0_52%,#c61d73_100%)] shadow-[0_24px_48px_rgba(198,29,115,0.28)]",
  },
  {
    className:
      "absolute left-[1.5rem] top-[22rem] h-[19rem] w-[19rem] rounded-full bg-[radial-gradient(circle_at_30%_30%,#baff98_0%,#6de94e_48%,#3fa22b_100%)] shadow-[0_24px_52px_rgba(63,162,43,0.22)]",
  },
  {
    className:
      "absolute left-[23rem] top-[19.5rem] h-[8.5rem] w-[8.5rem] rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(201,224,241,0.96)_0%,rgba(134,177,209,0.88)_52%,rgba(75,135,182,0.76)_100%)] shadow-[0_18px_38px_rgba(66,120,164,0.26)]",
  },
  {
    className:
      "absolute right-[-7rem] bottom-[-6rem] h-[18rem] w-[18rem] rounded-full bg-[radial-gradient(circle_at_30%_30%,#ffd08a_0%,#ff9600_55%,#d56d00_100%)] shadow-[0_24px_50px_rgba(213,109,0,0.26)]",
  },
];

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setErrorMessage("Informe seu e-mail institucional.");
      return;
    }

    setFormState("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/password-reset/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok && res.status < 500) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        setErrorMessage(err.message ?? "Não foi possível processar a solicitação.");
        setFormState("error");
        return;
      }

      setFormState("success");
    } catch {
      setFormState("error");
      setErrorMessage("Servidor indisponível. Tente novamente mais tarde.");
    }
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      data-page-theme="login"
      className="relative min-h-screen overflow-hidden bg-white px-4 py-8 sm:px-6 lg:px-8"
    >
      {backgroundShapes.map((shape) => (
        <div
          key={shape.className}
          aria-hidden="true"
          data-login-decor
          className={shape.className}
        />
      ))}

      <section
        data-login-surface="card"
        className="relative z-10 mx-auto mt-26 flex w-full max-w-[50rem] flex-col items-center rounded-[20px] bg-white/81 px-5 pb-11 pt-15 shadow-[0_4px_16px_rgba(0,0,0,0.25)] backdrop-blur-[2px] sm:mt-32 sm:px-10 sm:pb-13 sm:pt-19 lg:px-18"
      >
        <Link
          to={ROUTE_PATHS.home}
          aria-label="Voltar para a página inicial"
          className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2"
        >
          <img
            src={loginLogo}
            alt="Logo Barueri"
            className="h-auto w-50 drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)] sm:w-64"
          />
        </Link>

        {formState === "success" ? (
          <div className="mt-4 flex flex-col items-center gap-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e6f4ea]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2e7d32"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8"
                aria-hidden="true"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>

            <h1 className="text-[1.95rem] font-extrabold tracking-[-0.04em] text-[#1e1e1e] sm:text-[2.4rem]">
              Verifique seu e-mail
            </h1>

            <p className="max-w-sm text-[1rem] leading-relaxed text-[#555]">
              Se o endereço informado estiver cadastrado, você receberá um e-mail
              com instruções para redefinir sua senha em breve.
            </p>

            <p className="text-sm text-[#706e6e]">
              Não recebeu?{" "}
              <button
                type="button"
                onClick={() => {
                  setFormState("idle");
                  setEmail("");
                }}
                className="font-semibold text-[#1675b8] transition-opacity hover:opacity-80"
              >
                Tentar novamente
              </button>
            </p>

            <Link
              to={ROUTE_PATHS.login}
              className="mt-2 text-sm font-semibold text-[#1675b8] transition-opacity hover:opacity-80"
            >
              ← Voltar para o login
            </Link>
          </div>
        ) : (
          <>
            <h1
              className="mt-4 text-center text-[1.95rem] font-extrabold tracking-[-0.04em] text-[#1e1e1e] sm:mt-5 sm:text-[2.4rem]"
              style={{ "--reveal-delay": "100ms" } as CSSProperties}
            >
              Recuperar Senha
            </h1>

            <p className="mt-3 text-center text-[0.97rem] leading-relaxed text-[#706e6e] sm:mt-4">
              Informe seu e-mail institucional e enviaremos um link para
              redefinir sua senha.
            </p>

            <form
              className="mt-6 flex w-full flex-col gap-4.5 sm:mt-7 sm:gap-5"
              onSubmit={handleSubmit}
            >
              <div>
                <input
                  type="email"
                  value={email}
                  disabled={formState === "submitting"}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setEmail(event.target.value);
                    setErrorMessage("");
                    if (formState === "error") setFormState("idle");
                  }}
                  placeholder="E-mail institucional"
                  autoComplete="email"
                  className={`h-15.25 w-full rounded-[20px] border bg-[#f8fafc] px-5 text-[0.98rem] font-medium text-[#1e1e1e] shadow-[0_4px_10px_rgba(0,0,0,0.25)] outline-none transition focus:-translate-y-0.5 focus:border-[#1675b8] focus:ring-4 focus:ring-[#1675b8]/15 disabled:cursor-not-allowed disabled:opacity-70 sm:text-[1.15rem] ${
                    errorMessage ? "border-[#d64545]" : "border-[#d5d5d5]"
                  }`}
                />
                {errorMessage ? (
                  <p className="mt-2 px-2 text-sm font-medium text-[#d64545]">
                    {errorMessage}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={formState === "submitting"}
                className="mt-1 h-16.5 rounded-[20px] bg-[#1675b8] text-[1.05rem] font-semibold tracking-[0.02em] text-white shadow-[0_4px_10px_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 sm:text-[1.55rem]"
              >
                {formState === "submitting" ? "Enviando..." : "Enviar link de recuperação"}
              </button>
            </form>

            <Link
              to={ROUTE_PATHS.login}
              className="mt-6 text-sm font-semibold text-[#706e6e] transition-opacity hover:opacity-80"
            >
              ← Voltar para o login
            </Link>
          </>
        )}
      </section>
    </main>
  );
}

export default ForgotPasswordPage;
