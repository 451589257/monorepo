import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma 5+ 已是惰性连接，进程退出时自动 disconnect。
 * 这里只需继承 PrismaClient，无需再实现 OnModuleInit/OnModuleDestroy。
 */
@Injectable()
export class PrismaService extends PrismaClient {}
