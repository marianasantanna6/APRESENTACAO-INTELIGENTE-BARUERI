import brasao from "../assets/images/brasao-barueri.webp";

type Props = {
  /** "dark" = header azul (texto branco). "light" = fundo claro (texto escuro). */
  variant?: "dark" | "light";
  /** Altura do brasão em px. Default 40. */
  brasaoSize?: number;
  className?: string;
};

export function BarueriLogo({ variant = "dark", brasaoSize = 40, className = "" }: Props) {
  const isDark = variant === "dark";
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src={brasao}
        alt="Brasão de Barueri"
        style={{ height: brasaoSize, width: "auto" }}
        className="shrink-0 drop-shadow-[0_2px_6px_rgba(0,0,0,0.18)]"
      />
      <div
        className="flex flex-col leading-none"
        style={isDark ? { filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.45))" } : undefined}
      >
        <span
          className={`text-[0.65rem] font-semibold uppercase tracking-[0.14em] ${
            isDark ? "text-white/80" : "text-[#1675b8]/80"
          }`}
        >
          Prefeitura de
        </span>
        <span
          className={`text-[1.05rem] font-extrabold tracking-tight leading-tight ${
            isDark ? "text-white" : "text-[#1675b8]"
          }`}
        >
          BARUERI
        </span>
        <span
          className={`text-[0.6rem] font-medium uppercase tracking-[0.1em] ${
            isDark ? "text-white/70" : "text-[#1675b8]/60"
          }`}
        >
          Apresentações
        </span>
      </div>
    </div>
  );
}
