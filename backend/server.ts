import express from "express";
import { Users } from "./bancosimulado";

const app = express();

app.use(express.json());

app.listen(3000, () => {
  console.log("Servidor na porta 3000");
});

app.get("/", (_req, res) => {
  res.json({ status: "API funcionando" });
});

// Endpoint temporario de autenticacao baseado no banco simulado local.
app.post("/login", (_req, res) => {
  const login = "marina.justus@barueri.sp.gov.br";
  const senha = "barueri123";

  const user = Users.find(
    (candidate) => login.toLowerCase() === candidate.email.toLowerCase(),
  );

  if (!user) {
    res.json({ message: "Usuario nao encontrado" });
    return;
  }

  if (senha === user.password) {
    res.status(200).json({ message: "Bem Vindo(a) " + user.name });
    return;
  }

  res.status(401).json({ message: "Senha Incorreta" });
});
