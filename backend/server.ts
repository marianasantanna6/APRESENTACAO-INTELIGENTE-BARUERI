import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

app.listen(3000, () => {console.log("Servidor Na Porta 3000");});

app.get("/", (req, res) => { res.json ({status: "API funcionando 🚀"}); });