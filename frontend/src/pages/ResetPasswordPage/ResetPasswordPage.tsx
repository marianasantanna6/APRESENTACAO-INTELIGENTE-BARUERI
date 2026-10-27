import type { CSSProperties, ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import loginLogo from "../../assets/images/create-logo.png";
import { ROUTE_PATHS } from "../../router/paths";

type FormState = "idle" | "submitting" | "success";

type FormValues = {
  newPassword: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormValues | "general", string>>;

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

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") ?? "";

  const [formValues, setFormValues] = useState<FormValues>({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formState, setFormState] = useState<FormState>("idle");
  const [errors, setErrors] = useState<FormErrors>({});

  function updateField(field: keyof FormValues, value: string) {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "", general: "" }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (!formValues.newPassword.trim()) {
      nextErrors.newPassword = "Informe a nova senha.";
    } else if (formValues.newPassword.trim().length < 8) {
      nextErrors.newPassword = "A senha deve ter pelo menos 8 caracteres.";
    }

    if (!formValues.confirmPassword.trim()) {
      nextErrors.confirmPassword = "Confirme a nova senha.";
    } else if (formValues.newPassword.trim() !== formValues.confirmPassword.trim()) {
      nextErrors.confirmPassword = "As senhas não coincidem.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!token) {
      setErrors({ general: "Link de recuperação inválido. Solicite um novo." });
      return;
    }

    setFormState("submitting");

    try {
      const res = await fetch("/api/password-reset/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: formValues.newPassword.trim() }),
      });

      const body = await res.json().catch(() => ({})) as { message?: string };

      if (!res.ok) {
        setErrors({
          general: body.message ?? "Não foi possível redefinir a senha. O link pode ter expirado.",
        });
        setFormState("idle");
        return;
      }

      setFormState("success");
    } catch {
      setErrors({ general: "Servidor indisponível. Tente novamente mais tarde." });
      setFormState("idle");
    }
  }

  if (!token) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        data-page-theme="login"
        className="relative min-h-screen overflow-hidden bg-white px-4 py-8 sm:px-6 lg:px-8"
      >
        {backgroundShapes.map((shape) => (
          <div key={shape.className} aria-hidden="true" data-login-decor className={shape.className} />
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
            <img src={loginLogo} alt="Logo Barueri" className="h-auto w-50 drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)] sm:w-64" />
          </Link>

          <div className="mt-4 flex flex-col items-center gap-5 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fff0f0]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#d64545" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className="text-[1.8rem] font-extrabold tracking-[-0.04em] text-[#1e1e1e]">
              Link inválido
            </h1>
            <p className="max-w-sm text-[0.97rem] leading-relaxed text-[#555]">
              Este link de recuperação é inválido ou está incompleto.
              Solicite um novo link para redefinir sua senha.
            </p>
            <Link
              to={ROUTE_PATHS.forgotPassword}
              className="mt-2 h-14 rounded-[20px] bg-[#1675b8] px-8 text-[1rem] font-semibold text-white shadow-[0_4px_10px_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-0.5 flex items-center"
            >
              Solicitar novo link
            </Link>
            <Link to={ROUTE_PATHS.login} className="text-sm font-semibold text-[#706e6e] transition-opacity hover:opacity-80">
              ← Voltar para o login
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      data-page-theme="login"
      className="relative min-h-screen overflow-hidden bg-white px-4 py-8 sm:px-6 lg:px-8"
    >
      {backgroundShapes.map((shape) => (
        <div key={shape.className} aria-hidden="true" data-login-decor className={shape.className} />
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
          <img src={loginLogo} alt="Logo Barueri" className="h-auto w-50 drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)] sm:w-64" />
        </Link>

        {formState === "success" ? (
          <div className="mt-4 flex flex-col items-center gap-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e6f4ea]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>

            <h1 className="text-[1.95rem] font-extrabold tracking-[-0.04em] text-[#1e1e1e] sm:text-[2.4rem]">
              Senha redefinida!
            </h1>

            <p className="max-w-sm text-[1rem] leading-relaxed text-[#555]">
              Sua senha foi alterada com sucesso. Agora você pode fazer login
              com a nova senha.
            </p>

            <button
              type="button"
              onClick={() => navigate(ROUTE_PATHS.login, { replace: true })}
              className="mt-2 h-16.5 w-full rounded-[20px] bg-[#1675b8] text-[1.05rem] font-semibold tracking-[0.02em] text-white shadow-[0_4px_10px_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-0.5 sm:text-[1.4rem]"
            >
              Ir para o login
            </button>
          </div>
        ) : (
          <>
            <h1
              className="mt-4 text-center text-[1.95rem] font-extrabold tracking-[-0.04em] text-[#1e1e1e] sm:mt-5 sm:text-[2.4rem]"
              style={{ "--reveal-delay": "100ms" } as CSSProperties}
            >
              Nova Senha
            </h1>

            <p className="mt-3 text-center text-[0.97rem] leading-relaxed text-[#706e6e] sm:mt-4">
              Escolha uma senha forte com pelo menos 8 caracteres.
            </p>

            <form className="mt-6 flex w-full flex-col gap-4.5 sm:mt-7 sm:gap-5" onSubmit={handleSubmit}>
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formValues.newPassword}
                    disabled={formState === "submitting"}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      updateField("newPassword", event.target.value)
                    }
                    placeholder="Nova senha"
                    autoComplete="new-password"
                    className={`h-15.25 w-full rounded-[20px] border bg-[#f8fafc] px-5 pr-24 text-[0.98rem] font-medium text-[#1e1e1e] shadow-[0_4px_10px_rgba(0,0,0,0.25)] outline-none transition focus:-translate-y-0.5 focus:border-[#1675b8] focus:ring-4 focus:ring-[#1675b8]/15 disabled:cursor-not-allowed disabled:opacity-70 sm:text-[1.15rem] ${
                      errors.newPassword ? "border-[#d64545]" : "border-[#d5d5d5]"
                    }`}
                  />
                  <button
                    type="button"
                    disabled={formState === "submitting"}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#1675b8] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                {errors.newPassword ? (
                  <p className="mt-2 px-2 text-sm font-medium text-[#d64545]">{errors.newPassword}</p>
                ) : null}
              </div>

              <div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formValues.confirmPassword}
                  disabled={formState === "submitting"}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    updateField("confirmPassword", event.target.value)
                  }
                  placeholder="Confirmar nova senha"
                  autoComplete="new-password"
                  className={`h-15.25 w-full rounded-[20px] border bg-[#f8fafc] px-5 text-[0.98rem] font-medium text-[#1e1e1e] shadow-[0_4px_10px_rgba(0,0,0,0.25)] outline-none transition focus:-translate-y-0.5 focus:border-[#1675b8] focus:ring-4 focus:ring-[#1675b8]/15 disabled:cursor-not-allowed disabled:opacity-70 sm:text-[1.15rem] ${
                    errors.confirmPassword ? "border-[#d64545]" : "border-[#d5d5d5]"
                  }`}
                />
                {errors.confirmPassword ? (
                  <p className="mt-2 px-2 text-sm font-medium text-[#d64545]">{errors.confirmPassword}</p>
                ) : null}
              </div>

              {errors.general ? (
                <p className="rounded-[16px] bg-[#fff5f5] px-4 py-3 text-sm font-medium text-[#d64545]">
                  {errors.general}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={formState === "submitting"}
                className="mt-1 h-16.5 rounded-[20px] bg-[#1675b8] text-[1.05rem] font-semibold tracking-[0.02em] text-white shadow-[0_4px_10px_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 sm:text-[1.55rem]"
              >
                {formState === "submitting" ? "Salvando..." : "Redefinir senha"}
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

export default ResetPasswordPage;
