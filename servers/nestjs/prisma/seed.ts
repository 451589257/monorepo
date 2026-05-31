import { hash } from '@node-rs/argon2';
import { PrismaClient, TodoStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 数据库种子脚本:幂等写入一个演示用户和几条示例 Todo。
 * 执行:pnpm prisma:seed
 */
async function main() {
  const username = 'demo';
  const passwordHash = await hash('demo123456');

  const user = await prisma.user.upsert({
    where: { username },
    update: {},
    create: { username, passwordHash, nickname: '演示账号' },
  });
  console.log(`✅ 演示用户已就绪: ${user.username} (id=${user.id}) 密码: demo123456`);

  const existing = await prisma.todo.count();
  if (existing === 0) {
    await prisma.todo.createMany({
      data: [
        {
          title: '熟悉项目结构',
          description: '阅读 README 与 docs',
          status: TodoStatus.DONE,
          userId: user.id,
        },
        {
          title: '跑通本地开发',
          description: 'pnpm dev:nest',
          status: TodoStatus.ACTIVE,
          userId: user.id,
        },
        { title: '编写第一个接口', status: TodoStatus.PENDING, userId: user.id },
      ],
    });
    console.log('✅ 已写入 3 条示例 Todo');
  } else {
    console.log(`ℹ️  已存在 ${existing} 条 Todo,跳过示例写入`);
  }
}

main()
  .catch((err) => {
    console.error('❌ 种子脚本执行失败:', err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
