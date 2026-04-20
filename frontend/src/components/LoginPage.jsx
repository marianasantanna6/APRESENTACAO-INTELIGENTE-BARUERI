import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import loginLogo from "../assets/images/create-logo.png";

const backgroundShapes = [
  {
    className:
      "absolute -left-[42rem] -top-[10rem] h-[77.5rem] w-[85.5rem] rounded-full bg-[#bdd4e6]",
  },
  {
    className:
      "absolute left-[15.5rem] top-[3rem] h-[12rem] w-[12rem] rounded-full bg-[#ffe052]/70 blur-[1px]",
  },
  {
    className:
      "absolute right-[3.5rem] top-[4.5rem] h-[17rem] w-[17rem] rounded-full bg-[#ec3fa0]/90",
  },
  {
    className:
      "absolute left-[1.5rem] top-[22rem] h-[19rem] w-[19rem] rounded-full bg-[#4dff00]/55",
  },
  {
    className:
      "absolute left-[23rem] top-[19.5rem] h-[8.5rem] w-[8.5rem] rounded-full bg-[#bdd4e6]/55",
  },
  {
    className:
      "absolute right-[-7rem] bottom-[-6rem] h-[18rem] w-[18rem] rounded-full bg-[#ff9600]",
  },
];

const defaultValues = {
  identifier: "",
  password: "",
  remember: false,
};

function LoginPage() {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(defaultValues);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  function updateField(field, value) {
    setFormValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {};

    if (!formValues.identifier.trim()) {
      nextErrors.identifier = "Informe seu usuário, CPF ou email.";
    }

    if (!formValues.password.trim()) {
      nextErrors.password = "Informe sua senha.";
    } else if (formValues.password.trim().length < 6) {
      nextErrors.password = "A senha precisa ter pelo menos 6 caracteres.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      navigate("/criar");
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

      <section className="relative z-10 mx-auto mt-10 flex min-h-209.5 w-full max-w-224.25 flex-col items-center rounded-[20px] bg-white/81 px-6 pb-12 pt-16 shadow-[0_4px_16px_rgba(0,0,0,0.25)] backdrop-blur-[2px] sm:px-12 sm:pt-20 lg:px-27">
        <Link to="/" aria-label="Voltar para a página inicial">
          <img
            src={loginLogo}
            alt="Logo Barueri"
            className="h-auto w-45 sm:w-60"
          />
        </Link>

        <h1 className="mt-8 text-center text-[2.1rem] font-extrabold tracking-[-0.04em] text-[#1e1e1e] sm:mt-10 sm:text-[3rem]">
          Faça seu Login
        </h1>

        <form
          className="mt-8 flex w-full flex-col gap-7 sm:mt-10"
          onSubmit={handleSubmit}
        >
          <div>
            <input
              type="text"
              value={formValues.identifier}
              onChange={(event) =>
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
                onChange={(event) =>
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
            className="mt-1 h-19.5 rounded-[20px] bg-[#1675b8] text-[1.85rem] font-bold tracking-[0.02em] text-white shadow-[0_4px_10px_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-0.5"
          >
            Entrar
          </button>

          <div className="flex flex-col gap-4 text-[0.95rem] font-medium text-[#706e6e] sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={formValues.remember}
                onChange={(event) =>
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
            className="mt-2 flex h-19.5 items-center justify-between rounded-[20px] border-[2.5px] border-[#1675b8] bg-white px-6 text-[#898989] shadow-[0_4px_10px_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-0.5"
          >
            <img
              src="/login-gov.png"
              alt="Entrar com GOV"
              className="h-7 w-19.5 object-contain"
            />
            <span className="flex-1 text-center text-[1.15rem] font-semibold sm:text-[1.9rem]">
              Entrar com o GOV
            </span>
            <span className="w-19.5" aria-hidden="true" />
          </button>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;
