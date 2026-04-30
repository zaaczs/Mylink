import "reflect-metadata";
import * as path from "path";
import { config as loadEnv } from "dotenv";
import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import express, { type Application, type Request, type Response } from "express";
import { AppModule } from "./app.module";

/** Carrega `.env` antes do Nest (ConfigModule só aplica depois); necessário para o Prisma no bootstrap. */
loadEnv({ path: path.join(__dirname, "..", ".env") });

function ensureDatabaseUrl(): void {
  if (process.env.DATABASE_URL?.trim()) return;
  throw new Error(
    "DATABASE_URL não está definida. Na Vercel: Project → Settings → Environment Variables → " +
      "adicione DATABASE_URL (Production e Preview). Em serverless, use uma base remota " +
      "(ex.: Neon ou Supabase com Postgres — ajuste o provider no schema Prisma se migrar de SQLite)."
  );
}

function configureApp(app: import("@nestjs/common").INestApplication) {
  app.enableCors({ origin: "*" });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
}

let expressAppPromise: Promise<Application> | undefined;

async function getExpressApp(): Promise<Application> {
  if (!expressAppPromise) {
    expressAppPromise = (async () => {
      ensureDatabaseUrl();
      const server = express();
      const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
        logger: ["error", "warn", "log"]
      });
      configureApp(app);
      await app.init();
      return server;
    })();
  }
  return expressAppPromise;
}

/** Vercel serverless exige `export default` com assinatura (req, res). */
export default async function handler(req: Request, res: Response): Promise<void> {
  const server = await getExpressApp();
  server(req, res);
}

const bootstrapLogger = new Logger("Bootstrap");

if (!process.env.VERCEL) {
  void (async () => {
    const server = await getExpressApp();
    const port = Number(process.env.PORT || 3333);
    server.listen(port, () => {
      bootstrapLogger.log(`API listening on http://localhost:${port}`);
    });
  })().catch((err) => {
    bootstrapLogger.error(err);
    process.exit(1);
  });
}
