import type {
  AuthApiContract,
  AuthLoginInput,
  AuthLoginResult,
} from "./authApiContract";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

type LoginResponsePayload = {
  message?: unknown;
};

type ParsedResponsePayload = {
  data: LoginResponsePayload | null;
  rawText: string | null;
};

function normalizeMessage(
  payload: LoginResponsePayload | null,
  fallbackMessage: string,
) {
  return typeof payload?.message === "string" && payload.message.trim().length > 0
    ? payload.message
    : fallbackMessage;
}

async function parseJsonSafely(response: Response) {
  const rawText = await response.text();

  if (!rawText) {
    return {
      data: null,
      rawText: null,
    } satisfies ParsedResponsePayload;
  }

  try {
    return {
      data: JSON.parse(rawText) as LoginResponsePayload,
      rawText,
    } satisfies ParsedResponsePayload;
  } catch {
    return {
      data: null,
      rawText,
    } satisfies ParsedResponsePayload;
  }
}

export const httpAuthApi: AuthApiContract = {
  async login({ identifier, password }: AuthLoginInput): Promise<AuthLoginResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          login: identifier.trim(),
          email: identifier.trim(),
          password: password.trim(),
          senha: password.trim(),
        }),
      });

      const payload = await parseJsonSafely(response);
      const responseLooksLikeFrontendHtml =
        payload.rawText?.includes("<!doctype html>") || payload.rawText?.includes("<html");

      if (!response.ok) {
        if (response.status === 404 || responseLooksLikeFrontendHtml) {
          return {
            ok: false,
            message:
              "O frontend provavelmente ainda esta sem o proxy ativo. Reinicie o npm run dev do frontend e mantenha o backend rodando na porta 3000.",
            status: response.status,
          };
        }

        return {
          ok: false,
          message: normalizeMessage(
            payload.data,
            "Nao foi possivel autenticar.",
          ),
          status: response.status,
        };
      }

      return {
        ok: true,
        message: normalizeMessage(
          payload.data,
          "Autenticacao realizada com sucesso.",
        ),
      };
    } catch {
      return {
        ok: false,
        message:
          "Nao foi possivel conectar ao backend. Verifique se o servidor da pasta backend esta rodando na porta 3000.",
        status: 0,
      };
    }
  },
};
