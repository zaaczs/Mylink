import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Job, Queue, Worker } from "bullmq";
import IORedis from "ioredis";

export type CommentJob = {
  commentId: string;
  commentText: string;
  mediaId: string;
  /** `entry.id` do webhook Meta (IG user id ou page id) para escopo multi-tenant. */
  webhookAccountId?: string;
};

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private queue: Queue<CommentJob> | null = null;
  private worker: Worker<CommentJob> | null = null;
  private connection: IORedis | null = null;
  private handler: ((job: Job<CommentJob>) => Promise<void>) | null = null;

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.logger.warn("REDIS_URL não configurado. Processamento será em linha.");
      return;
    }

    this.connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
    this.queue = new Queue<CommentJob>("meta-comment-events", { connection: this.connection });
    this.worker = new Worker<CommentJob>(
      "meta-comment-events",
      async (job) => {
        if (!this.handler) return;
        await this.handler(job);
      },
      { connection: this.connection }
    );
    this.logger.log("Fila BullMQ ativa");
  }

  onModuleDestroy() {
    this.worker?.close();
    this.queue?.close();
    this.connection?.quit();
  }

  registerProcessor(handler: (job: Job<CommentJob>) => Promise<void>) {
    this.handler = handler;
  }

  async enqueue(job: CommentJob) {
    if (!this.queue) return this.runInline(job);
    await this.queue.add("process-comment", job, { attempts: 3, backoff: { type: "exponential", delay: 1000 } });
  }

  async runInline(job: CommentJob) {
    if (!this.handler) return;
    await this.handler({ data: job } as Job<CommentJob>);
  }
}
