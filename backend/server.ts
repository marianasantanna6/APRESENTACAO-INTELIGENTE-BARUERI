import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

app.listen(3000, () => {console.log("Servidor Na Porta 3000");});

app.get("/", (req, res) => { res.json ({status: "API funcionando 🚀"}); });

import {Users} from "./bancosimulado";

/*"/login" => Método a ser executado (POST)*/
app.post("/login", (req, res) => {

    const login = "marina.justus@barueri.sp.gov.br";
    const senha = "barueri123";

    const user = Users.find(
        (user) => login.toLowerCase() === user.email.toLowerCase()
    );

    if (!user) {
        res.json({message: "Usuário Não Encontrado"});
        }

        else if (senha === user.password) {
        res.status(200).json({message: "Bem Vindo(a) " + user.name});
        return;

        } else {
        res.status(401).json({message: "Senha Incorreta"});
    }
});