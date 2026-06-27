import prisma from "@/shared/config/prisma.js";
import { NotificationType, NotificationPriority } from "@prisma/client";

export const notificationRepository = {

  async getNotifications(params: {
    tenantId?: string;
    userId?: string;
    superAdminId?: string;
    page: number;
    limit: number;
    filter: string;
    type?: NotificationType;
  }) {
    const { tenantId, userId, superAdminId, page, limit, filter, type } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      tenantId: tenantId ?? null,
      userId: userId ?? null,
      superAdminId: superAdminId ?? null,
    };

    if (filter === "SEEN") {
      where.isSeen = true;
    } else if (filter === "UNSEEN") {
      where.isSeen = false;
    }

    if (type) {
      where.type = type;
    }

    const [notifications, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          superAdmin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  },

  async getUnreadCount(params: {
    tenantId?: string;
    userId?: string;
    superAdminId?: string;
  }) {
    const { tenantId, userId, superAdminId } = params;
    return prisma.notification.count({
      where: {
        tenantId: tenantId ?? null,
        userId: userId ?? null,
        superAdminId: superAdminId ?? null,
        isSeen: false,
        deletedAt: null,
      },
    });
  },

  async markAsSeen(id: string, params: { tenantId?: string; userId?: string; superAdminId?: string }) {
    const { tenantId, userId, superAdminId } = params;
    return prisma.notification.updateMany({
      where: {
        id,
        tenantId: tenantId ?? null,
        userId: userId ?? null,
        superAdminId: superAdminId ?? null,
        isSeen: false,
        deletedAt: null,
      },
      data: {
        isSeen: true,
        seenAt: new Date(),
      },
    });
  },

  async markAllAsSeen(params: { tenantId?: string; userId?: string; superAdminId?: string }) {
    const { tenantId, userId, superAdminId } = params;
    return prisma.notification.updateMany({
      where: {
        tenantId: tenantId ?? null,
        userId: userId ?? null,
        superAdminId: superAdminId ?? null,
        isSeen: false,
        deletedAt: null,
      },
      data: {
        isSeen: true,
        seenAt: new Date(),
      },
    });
  },

  async softDelete(id: string, params: { tenantId?: string; userId?: string; superAdminId?: string }) {
    const { tenantId, userId, superAdminId } = params;
    return prisma.notification.updateMany({
      where: {
        id,
        tenantId: tenantId ?? null,
        userId: userId ?? null,
        superAdminId: superAdminId ?? null,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  },

  async createNotification(data: {
    tenantId?: string | null;
    userId?: string | null;
    superAdminId?: string | null;
    title: string;
    message: string;
    type: NotificationType;
    priority?: NotificationPriority;
    actionUrl?: string | null;
    metadata?: any;
  }) {
    return prisma.notification.create({
      data: {
        tenantId: data.tenantId ?? null,
        userId: data.userId ?? null,
        superAdminId: data.superAdminId ?? null,
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority ?? "MEDIUM",
        actionUrl: data.actionUrl ?? null,
        metadata: data.metadata ?? null,
      },
    });
  },
};
