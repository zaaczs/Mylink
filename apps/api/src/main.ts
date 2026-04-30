import "reflect-metadata";
import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import type { Request, Response } from "express";
import * as express from "express";
import { AppModule } from "./app.module";

function configureApp(app: import("@nestjs/common").INestApplication) {
  app.enableCors({ origin: "*" });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
}

let expressAppPromise: Promise<express.Application> | undefined;

async function getExpressApp(): Promise<express.Application> {
  if (!expressAppPromise) {
    expressAppPromise = (async () => {
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
