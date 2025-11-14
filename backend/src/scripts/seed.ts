/* eslint-disable no-console */
import { getPrismaClient } from '../config';

const prisma = getPrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  try {
    // Clear existing data (in reverse order of dependencies)
    await prisma.activityLog.deleteMany({});
    await prisma.reminder.deleteMany({});
    await prisma.todoTag.deleteMany({});
    await prisma.attachment.deleteMany({});
    await prisma.subtask.deleteMany({});
    await prisma.todo.deleteMany({});
    await prisma.recurrenceRule.deleteMany({});
    await prisma.viewPreference.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('✅ Cleared existing data');

    // Create demo user
    const demoUser = await prisma.user.create({
      data: {
        email: 'demo@example.com',
        displayName: 'Demo User',
        timezone: 'UTC',
        settings: {
          theme: 'light',
          notifications: true,
        },
      },
    });

    console.log('✅ Created demo user:', demoUser.email);

    // Create categories
    const categories = await Promise.all([
      prisma.category.create({
        data: {
          userId: demoUser.id,
          name: 'Work',
          color: '#3b82f6',
          ordering: 0,
        },
      }),
      prisma.category.create({
        data: {
          userId: demoUser.id,
          name: 'Personal',
          color: '#10b981',
          ordering: 1,
        },
      }),
      prisma.category.create({
        data: {
          userId: demoUser.id,
          name: 'Shopping',
          color: '#f59e0b',
          ordering: 2,
        },
      }),
      prisma.category.create({
        data: {
          userId: demoUser.id,
          name: 'Health',
          color: '#ec4899',
          ordering: 3,
        },
      }),
    ]);

    console.log('✅ Created', categories.length, 'categories');

    // Create tags
    const tags = await Promise.all([
      prisma.tag.create({
        data: {
          userId: demoUser.id,
          name: 'Urgent',
          color: '#dc2626',
        },
      }),
      prisma.tag.create({
        data: {
          userId: demoUser.id,
          name: 'Important',
          color: '#f59e0b',
        },
      }),
      prisma.tag.create({
        data: {
          userId: demoUser.id,
          name: 'Review',
          color: '#8b5cf6',
        },
      }),
      prisma.tag.create({
        data: {
          userId: demoUser.id,
          name: 'Delegate',
          color: '#06b6d4',
        },
      }),
    ]);

    console.log('✅ Created', tags.length, 'tags');

    // Create recurrence rules
    const dailyRecurrence = await prisma.recurrenceRule.create({
      data: {
        frequency: 'DAILY',
        interval: 1,
      },
    });

    const weeklyRecurrence = await prisma.recurrenceRule.create({
      data: {
        frequency: 'WEEKLY',
        interval: 1,
        byWeekday: ['MO', 'WE', 'FR'],
      },
    });

    console.log('✅ Created recurrence rules');

    // Create sample todos
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const todos = await Promise.all([
      // High priority work todo
      prisma.todo.create({
        data: {
          userId: demoUser.id,
          categoryId: categories[0].id,
          title: 'Complete project presentation',
          description: 'Prepare and finalize the Q4 project presentation',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          startDate: now,
          dueDate: tomorrow,
          reminderLeadTime: 60,
        },
      }),
      // Urgent personal todo
      prisma.todo.create({
        data: {
          userId: demoUser.id,
          categoryId: categories[1].id,
          title: 'Buy groceries',
          description: 'Milk, bread, eggs, vegetables',
          status: 'TODO',
          priority: 'URGENT',
          dueDate: tomorrow,
          reminderLeadTime: 120,
        },
      }),
      // Medium priority shopping
      prisma.todo.create({
        data: {
          userId: demoUser.id,
          categoryId: categories[2].id,
          title: 'Order new shoes',
          description: 'Check available sizes and colors online',
          status: 'TODO',
          priority: 'MEDIUM',
          dueDate: nextWeek,
        },
      }),
      // Low priority personal todo
      prisma.todo.create({
        data: {
          userId: demoUser.id,
          categoryId: categories[1].id,
          title: 'Read book chapter',
          description: 'Read Chapter 5 of Clean Code',
          status: 'TODO',
          priority: 'LOW',
          dueDate: nextWeek,
        },
      }),
      // Health check - recurring daily
      prisma.todo.create({
        data: {
          userId: demoUser.id,
          categoryId: categories[3].id,
          title: 'Morning meditation',
          description: '10 minutes meditation',
          status: 'TODO',
          priority: 'MEDIUM',
          startDate: now,
          dueDate: tomorrow,
          recurrenceRuleId: dailyRecurrence.id,
        },
      }),
      // Work review - recurring weekly
      prisma.todo.create({
        data: {
          userId: demoUser.id,
          categoryId: categories[0].id,
          title: 'Weekly team standup',
          description: 'Team sync on project progress',
          status: 'TODO',
          priority: 'HIGH',
          startDate: now,
          dueDate: nextWeek,
          recurrenceRuleId: weeklyRecurrence.id,
        },
      }),
      // Completed todo
      prisma.todo.create({
        data: {
          userId: demoUser.id,
          categoryId: categories[0].id,
          title: 'Review code changes',
          description: 'Reviewed PR #123',
          status: 'DONE',
          priority: 'MEDIUM',
          completedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        },
      }),
    ]);

    console.log('✅ Created', todos.length, 'sample todos');

    // Add tags to todos
    await prisma.todoTag.create({
      data: {
        todoId: todos[0].id,
        tagId: tags[0].id, // Urgent
      },
    });
    await prisma.todoTag.create({
      data: {
        todoId: todos[0].id,
        tagId: tags[1].id, // Important
      },
    });
    await prisma.todoTag.create({
      data: {
        todoId: todos[1].id,
        tagId: tags[0].id, // Urgent
      },
    });
    await prisma.todoTag.create({
      data: {
        todoId: todos[4].id,
        tagId: tags[2].id, // Review
      },
    });

    console.log('✅ Added tags to todos');

    // Create subtasks for first todo
    await Promise.all([
      prisma.subtask.create({
        data: {
          todoId: todos[0].id,
          userId: demoUser.id,
          title: 'Create slides',
          ordering: 0,
        },
      }),
      prisma.subtask.create({
        data: {
          todoId: todos[0].id,
          userId: demoUser.id,
          title: 'Add data and charts',
          ordering: 1,
        },
      }),
      prisma.subtask.create({
        data: {
          todoId: todos[0].id,
          userId: demoUser.id,
          title: 'Practice presentation',
          completed: true,
          ordering: 2,
        },
      }),
    ]);

    console.log('✅ Created subtasks');

    // Create attachments for first todo
    await prisma.attachment.create({
      data: {
        todoId: todos[0].id,
        userId: demoUser.id,
        fileName: 'Q4_Presentation.pptx',
        fileSize: 2048000,
        mimeType:
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      },
    });

    console.log('✅ Created attachments');

    // Create reminders
    await Promise.all([
      prisma.reminder.create({
        data: {
          todoId: todos[0].id,
          userId: demoUser.id,
          scheduledAt: new Date(tomorrow.getTime() - 60 * 60 * 1000), // 1 hour before
          channel: 'IN_APP',
        },
      }),
      prisma.reminder.create({
        data: {
          todoId: todos[1].id,
          userId: demoUser.id,
          scheduledAt: new Date(tomorrow.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
          channel: 'IN_APP',
        },
      }),
    ]);

    console.log('✅ Created reminders');

    // Create view preferences
    await prisma.viewPreference.create({
      data: {
        userId: demoUser.id,
        viewType: 'LIST',
        filters: {
          status: 'TODO',
          priority: 'HIGH',
        },
        sorting: {
          field: 'dueDate',
          direction: 'asc',
        },
      },
    });

    await prisma.viewPreference.create({
      data: {
        userId: demoUser.id,
        viewType: 'BOARD',
        filters: {},
        sorting: {
          field: 'priority',
          direction: 'desc',
        },
      },
    });

    console.log('✅ Created view preferences');

    // Create activity logs
    await Promise.all([
      prisma.activityLog.create({
        data: {
          todoId: todos[0].id,
          userId: demoUser.id,
          type: 'CREATED',
          changes: {
            before: {},
            after: {
              title: 'Complete project presentation',
              status: 'IN_PROGRESS',
            },
          },
        },
      }),
      prisma.activityLog.create({
        data: {
          todoId: todos[6].id,
          userId: demoUser.id,
          type: 'COMPLETED',
          changes: {
            before: { status: 'IN_PROGRESS' },
            after: { status: 'DONE' },
          },
        },
      }),
    ]);

    console.log('✅ Created activity logs');

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
