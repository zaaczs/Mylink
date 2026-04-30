import { ConflictException, Injectable, Logger, OnModuleInit, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  async onModuleInit() {
    await this.ensureDemoUserForLocalDev();
  }

  /** Cria ou completa usuário de demonstração para testes (não roda em production). */
  private async ensureDemoUserForLocalDev() {
    if (process.env.NODE_ENV === "production") return;
    if (process.env.SEED_DEMO_USER === "0") return;

    const email = process.env.DEMO_USER_EMAIL || "teste@local.dev";
    const password = process.env.DEMO_USER_PASSWORD || "teste123";

    const existing = await this.prisma.user.findUnique({ where: { email } });
    const passwordHash = await bcrypt.hash(password, 10);

    if (existing?.passwordHash) return;

    if (existing) {
      await this.prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash }
      });
      this.logger.log(`Usuário demo ${email}: senha definida (a conta existia sem senha).`);
      return;
    }

    await this.prisma.user.create({ data: { email, passwordHash } });
    this.logger.log(`Usuário demo ${email} criado para testes locais.`);
  }

  async register(email: string, password: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException("E-mail já cadastrado");
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({ data: { email, passwordHash } });
    return this.issueToken(user.id, user.email);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) throw new UnauthorizedException("Credenciais inválidas");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Credenciais inválidas");
    return this.issueToken(user.id, user.email);
  }

  private issueToken(userId: string, email: string) {
    return { access_token: this.jwt.sign({ sub: userId, email }) };
  }
}
