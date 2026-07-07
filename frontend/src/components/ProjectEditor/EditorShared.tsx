/**
 * EditorShared — primitivos reutilizáveis dentro do editor.
 * TagInput, FieldLabel, FieldError, SectionCard.
 */

import { useRef, useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";

// ─── SectionCard ─────────────────────────────────────────────────────────────

type SectionCardProps = {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function SectionCard({
  id,
  icon,
  title,
  subtitle,
  badge,
  children,
  defaultOpen = true,
}: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      id={id}
      className="scroll-mt-6 rounded-2xl border border-[#e8e9f0] bg-white shadow-[0_2px_12px_rgba(20,33,51,0.06)]"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-6 py-4 text-left"
        aria-expanded={open}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f0f4ff] text-[#4f84c4]">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.95rem] font-bold text-[#1e1e1e]">{title}</p>
          {subtitle && (
            <p className="mt-0.5 text-[0.78rem] text-[#9ca3af]">{subtitle}</p>
          )}
        </div>
        {badge && <span className="shrink-0">{badge}</span>}
        <span
          className={`shrink-0 text-[#9ca3af] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="border-t border-[#f0f1f5] px-6 py-5">
          {children}
        </div>
      )}
    </section>
  );
}

// ─── FieldLabel ───────────────────────────────────────────────────────────────

export function FieldLabel({
  htmlFor,
  children,
  required,
  hint,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="mb-1.5">
      <label
        htmlFor={htmlFor}
        className="text-[0.84rem] font-semibold text-[#374151]"
      >
        {children}
        {required && <span className="ml-1 text-[#b91c1c]">*</span>}
      </label>
      {hint && <p className="mt-0.5 text-[0.74rem] text-[#9ca3af]">{hint}</p>}
    </div>
  );
}

// ─── FieldError ───────────────────────────────────────────────────────────────

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-[0.76rem] font-medium text-[#b91c1c]">{message}</p>
  );
}

// ─── TextInput ────────────────────────────────────────────────────────────────

export function TextInput({
  id,
  value,
  onChange,
  placeholder,
  error,
  maxLength,
  className = "",
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  maxLength?: number;
  className?: string;
}) {
  return (
    <div>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full rounded-xl border px-4 py-2.5 text-[0.9rem] text-[#1e1e1e] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 transition ${
          error
            ? "border-[#fca5a5] focus:border-[#b91c1c] focus:ring-[#b91c1c]/20"
            : "border-[#e5e7eb] focus:border-[#6fa8d6] focus:ring-[#6fa8d6]/20"
        } ${className}`}
      />
      {maxLength && (
        <p className="mt-1 text-right text-[0.7rem] text-[#d1d5db]">
          {value.length}/{maxLength}
        </p>
      )}
      <FieldError message={error} />
    </div>
  );
}

// ─── TextArea ────────────────────────────────────────────────────────────────

export function TextArea({
  id,
  value,
  onChange,
  placeholder,
  rows = 4,
  error,
  maxLength,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  error?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={`w-full resize-none rounded-xl border px-4 py-3 text-[0.9rem] text-[#1e1e1e] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 transition leading-relaxed ${
          error
            ? "border-[#fca5a5] focus:border-[#b91c1c] focus:ring-[#b91c1c]/20"
            : "border-[#e5e7eb] focus:border-[#6fa8d6] focus:ring-[#6fa8d6]/20"
        }`}
      />
      {maxLength && (
        <p className="mt-1 text-right text-[0.7rem] text-[#d1d5db]">
          {value.length}/{maxLength}
        </p>
      )}
      <FieldError message={error} />
    </div>
  );
}

// ─── TagInput ─────────────────────────────────────────────────────────────────

export function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder = "Adicionar…",
  suggestions = [],
  tagColor = "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]",
}: {
  tags: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  placeholder?: string;
  suggestions?: string[];
  tagColor?: string;
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s),
  );

  function commit(value: string) {
    const v = value.trim();
    if (!v) return;
    onAdd(v);
    setInput("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(input);
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      onRemove(tags[tags.length - 1]);
    }
  }

  return (
    <div>
      {/* Tags existentes */}
      {tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.78rem] font-medium ${tagColor}`}
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                aria-label={`Remover ${tag}`}
                className="opacity-60 hover:opacity-100 transition"
              >
                <FiX className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-[0.88rem] text-[#1e1e1e] placeholder:text-[#9ca3af] focus:border-[#6fa8d6] focus:outline-none focus:ring-2 focus:ring-[#6fa8d6]/20 transition"
        />
        {input.trim() && (
          <button
            type="button"
            onClick={() => commit(input)}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-lg bg-[#eff6ff] px-2.5 py-1 text-[0.74rem] font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe]"
          >
            <FiPlus className="h-3 w-3" /> Adicionar
          </button>
        )}

        {/* Sugestões */}
        {input.trim() && filtered.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-44 overflow-y-auto rounded-xl border border-[#e5e7eb] bg-white shadow-[0_8px_24px_rgba(20,33,51,0.12)]">
            {filtered.slice(0, 8).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => commit(s)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[0.86rem] text-[#374151] hover:bg-[#f3f4f6] transition"
              >
                <FiPlus className="h-3.5 w-3.5 text-[#9ca3af]" />
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="mt-1.5 text-[0.72rem] text-[#9ca3af]">
        Pressione Enter ou vírgula para adicionar
      </p>
    </div>
  );
}

// ─── SelectInput ─────────────────────────────────────────────────────────────

export function SelectInput<T extends string>({
  id,
  value,
  onChange,
  options,
  className = "",
}: {
  id?: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={`w-full rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-[0.9rem] text-[#1e1e1e] focus:border-[#6fa8d6] focus:outline-none focus:ring-2 focus:ring-[#6fa8d6]/20 transition bg-white ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ─── AddButton ────────────────────────────────────────────────────────────────

export function AddButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[#bfdbfe] bg-[#f8fbff] px-4 py-2.5 text-[0.84rem] font-semibold text-[#1d4ed8] transition hover:border-[#93c5fd] hover:bg-[#eff6ff]"
    >
      <FiPlus className="h-4 w-4" />
      {children}
    </button>
  );
}

// ─── RemoveButton ─────────────────────────────────────────────────────────────

export function RemoveButton({ onClick, label }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? "Remover"}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#9ca3af] transition hover:bg-[#fef2f2] hover:text-[#b91c1c]"
    >
      <FiX className="h-4 w-4" />
    </button>
  );
}

// ─── CompletionBadge ──────────────────────────────────────────────────────────

export function CompletionBadge({ count, required }: { count: number; required?: boolean }) {
  if (count === 0)
    return (
      <span className={`rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${required ? "bg-[#fef2f2] text-[#b91c1c]" : "bg-[#f3f4f6] text-[#9ca3af]"}`}>
        {required ? "Obrigatório" : "Vazio"}
      </span>
    );
  return (
    <span className="rounded-full bg-[#f0fdf4] px-2 py-0.5 text-[0.7rem] font-semibold text-[#166534]">
      {count} {count === 1 ? "item" : "itens"}
    </span>
  );
}
