export type AuthLoginInput = {
  identifier: string;
  password: string;
};

export type AuthLoginSuccess = {
  ok: true;
  message: string;
};

export type AuthLoginFailure = {
  ok: false;
  message: string;
  status: number;
};

export type AuthLoginResult = AuthLoginSuccess | AuthLoginFailure;

export interface AuthApiContract {
  login(input: AuthLoginInput): Promise<AuthLoginResult>;
}
