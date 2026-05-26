import type { CSSProperties, ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import loginLogo from "../../assets/images/create-logo.png";
import loginGovLogo from "../../assets/images/login-gov.png";
import { useAuth } from "../../context";
import {
  canAccessPathForUser,
  getDefaultRouteForUser,
} from "../../lib/authRouting";
import { ROUTE_PATHS } from "../../router/paths";

type BackgroundShape = {
  className: string;
};

type FormValues = {
  identifier: string;
  password: string;
  remember: boolean;
};

type FormField = keyof FormValues;

type FormErrors = Partial<
  Record<Exclude<FormField, "remember"> | "general", string>
>;

const backgroundShapes: BackgroundShape[] = [
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

const defaultValues: FormValues = {
  identifier: "",
  password: "",
  remember: false,
};

const mockedAccesses = [
  {
    label: "Admin nível 2",
    identifier: "admin.nivel2",
    password: "barueri123",
  },
  {
    label: "Admin nível 1",
    identifier: "admin.nivel1",
    password: "barueri123",
  },
  {
    label: "Funcionário comum",
    identifier: "funcionario.demo",
    password: "barueri123",
  },
];

function getMockedAccessDisplayName(identifier: string) {
  switch (identifier) {
    case "admin.nivel2":
      return "Marina Justus";
    case "admin.nivel1":
      return "João Lemes";
    case "funcionario.demo":
      return "Bianca Souza";
    default:
      return "Usuário";
  }
}

function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, login, user } = useAuth();
  const [formValues, setFormValues] = useState<FormValues>(defaultValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const stateFromLocation = location.state as { from?: string } | null;
    const requestedPath = stateFromLocation?.from;
    if (requestedPath) {
      if (canAccessPathForUser(user, requestedPath)) {
        navigate(requestedPath, { replace: true });
        return;
      }
    }

    navigate(getDefaultRouteForUser(user), { replace: true });
  }, [isAuthenticated, location.state, navigate, user]);

  function updateField<Field extends FormField>(
    field: Field,
    value: FormValues[Field],
  ) {
    setFormValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "", general: "" }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (!formValues.identifier.trim()) {
      nextErrors.identifier = "Informe seu usuário, CPF ou email.";
    }

    if (!formValues.password.trim()) {
      nextErrors.password = "Informe sua senha.";
    } else if (formValues.password.trim().length < 6) {
      nextErrors.password = "A senha precisa ter pelo menos 6 caracteres.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const result = login({
      identifier: formValues.identifier,
      password: formValues.password,
    });

    if ("message" in result) {
      const failureMessage = result.message;

      setErrors((current) => ({
        ...current,
        general: failureMessage,
      }));
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-white px-4 py-8 sm:px-6 lg:px-8">
      {backgroundShapes.map((shape) => (
        <div
          key={shape.className}
          aria-hidden="true"
          className={shape.className}
        />
      ))}

      <section className="relative z-10 mx-auto mt-28 flex w-full max-w-224.25 flex-col items-center rounded-[20px] bg-white/81 px-6 pb-14 pt-18 shadow-[0_4px_16px_rgba(0,0,0,0.25)] backdrop-blur-[2px] sm:mt-34 sm:px-12 sm:pb-16 sm:pt-22 lg:px-27">
        <Link
          to={ROUTE_PATHS.home}
          aria-label="Voltar para a pagina inicial"
          className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2"
        >
          <img
            src={loginLogo}
            alt="Logo Barueri"
            className="reveal-on-scroll h-auto w-56 drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)] sm:w-72"
          />
        </Link>

        <h1
          className="reveal-on-scroll mt-4 text-center text-[2.1rem] font-extrabold tracking-[-0.04em] text-[#1e1e1e] sm:mt-5 sm:text-[3rem]"
          style={{ "--reveal-delay": "100ms" } as CSSProperties}
        >
          Faça seu Login
        </h1>

        <form
          className="reveal-on-scroll mt-7 flex w-full flex-col gap-6 sm:mt-8"
          style={{ "--reveal-delay": "180ms" } as CSSProperties}
          onSubmit={handleSubmit}
        >
          <div>
            <input
              type="text"
              value={formValues.identifier}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                updateField("identifier", event.target.value)
              }
              placeholder="Usuário / CPF / Email"
              className={`h-16.25 w-full rounded-[20px] border bg-[#f8fafc] px-5 text-[1rem] font-medium text-[#1e1e1e] shadow-[0_4px_10px_rgba(0,0,0,0.25)] outline-none transition focus:-translate-y-0.5 focus:border-[#1675b8] focus:ring-4 focus:ring-[#1675b8]/15 sm:text-[1.3rem] ${
                errors.identifier ? "border-[#d64545]" : "border-[#d5d5d5]"
              }`}
            />
            {errors.identifier ? (
              <p className="mt-2 px-2 text-sm font-medium text-[#d64545]">
                {errors.identifier}
              </p>
            ) : null}
          </div>

          <div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formValues.password}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateField("password", event.target.value)
                }
                placeholder="Senha"
                className={`h-16.25 w-full rounded-[20px] border bg-[#f8fafc] px-5 pr-24 text-[1rem] font-medium text-[#1e1e1e] shadow-[0_4px_10px_rgba(0,0,0,0.25)] outline-none transition focus:-translate-y-0.5 focus:border-[#1675b8] focus:ring-4 focus:ring-[#1675b8]/15 sm:text-[1.3rem] ${
                  errors.password ? "border-[#d64545]" : "border-[#d5d5d5]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#1675b8] transition-opacity hover:opacity-80"
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {errors.password ? (
              <p className="mt-2 px-2 text-sm font-medium text-[#d64545]">
                {errors.password}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            className="mt-1 h-19.5 rounded-[20px] bg-[#1675b8] text-[1.15rem] font-semibold tracking-[0.02em] text-white shadow-[0_4px_10px_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-0.5 sm:text-[1.9rem]"
          >
            Entrar
          </button>

          {errors.general ? (
            <p className="rounded-[16px] bg-[#fff5f5] px-4 py-3 text-sm font-medium text-[#d64545]">
              {errors.general}
            </p>
          ) : null}

          <div className="flex flex-col gap-4 text-[0.95rem] font-medium text-[#706e6e] sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={formValues.remember}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateField("remember", event.target.checked)
                }
                className="h-6.5 w-6.5 appearance-none rounded-full border-[2.5px] border-[#1675b8] bg-transparent checked:bg-[#1675b8] checked:shadow-[inset_0_0_0_5px_white]"
              />
              <span>Lembrar de mim</span>
            </label>

            <a
              href="#recuperar-senha"
              className="transition-opacity hover:opacity-80"
            >
              Esqueci minha senha
            </a>
          </div>

          <button
            type="button"
            className="mt-2 flex h-19.5 items-center justify-between gap-4 rounded-[20px] border-[2.5px] border-[#1675b8] bg-white px-5 text-[#898989] shadow-[0_4px_10px_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-0.5"
          >
            <img
              src={loginGovLogo}
              alt="Entrar com GOV"
              className="h-7 w-19.5 object-contain"
            />
            <span className="flex-1 text-center text-[1.15rem] font-semibold sm:text-[1.9rem]">
              Entrar com o GOV
            </span>
            <span className="w-19.5" aria-hidden="true" />
          </button>

          <div className="rounded-[20px] border border-[#d7e7f3] bg-[#f7fbff] px-5 py-4 text-left text-[0.92rem] text-[#4f6980] shadow-[0_6px_14px_rgba(22,117,184,0.08)]">
            <p className="font-semibold text-[#2d5d83]">Acessos mockados</p>
            <div className="mt-3 space-y-2">
              {mockedAccesses.map((access) => (
                <p key={access.identifier} className="leading-6">
                  <span className="font-semibold">
                    {getMockedAccessDisplayName(access.identifier)}:
                  </span>{" "}
                  {access.identifier} / {access.password}
                </p>
              ))}
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;
