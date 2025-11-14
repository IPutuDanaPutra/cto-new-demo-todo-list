import { getPrismaClient } from '../config';

export async function setupTestDatabase() {
  const prisma = getPrismaClient();

  // Clean up all tables in order (considering foreign keys)
  await prisma.activityLog.deleteMany({});
  await prisma.reminder.deleteMany({});
  await prisma.todoTag.deleteMany({});
  await prisma.subtask.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.todo.deleteMany({});
  await prisma.recurrenceRule.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.viewPreference.deleteMany({});
  await prisma.user.deleteMany({});
}

export async function teardownTestDatabase() {
  const prisma = getPrismaClient();

  // Clean up all tables
  await prisma.activityLog.deleteMany({});
  await prisma.reminder.deleteMany({});
  await prisma.todoTag.deleteMany({});
  await prisma.subtask.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.todo.deleteMany({});
  await prisma.recurrenceRule.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.viewPreference.deleteMany({});
  await prisma.user.deleteMany({});
}

export async function createTestUser(
  email = 'test@example.com',
  displayName = 'Test User'
) {
  const prisma = getPrismaClient();

  return prisma.user.create({
    data: {
      email,
      displayName,
      timezone: 'UTC',
    },
  });
}
