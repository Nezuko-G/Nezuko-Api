import prisma from "@/shared/config/prisma.js";
import { NotFoundError } from "@/shared/errors/errors.js";
import { notificationRepository } from "./notification.repository.js";
import { NotificationType, NotificationPriority, UserRole } from "@prisma/client";
import i18n from "i18n";

function translate(key: string, locale: string, replacements?: Record<string, any>): string {
  return i18n.__({ phrase: key, locale }, replacements || {});
}

export const notificationService = {

  async getNotifications(userContext: { tenantId?: string; userId?: string; superAdminId?: string }, query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const filter = (query.filter as string || "ALL").toUpperCase();
    const type = query.type as NotificationType | undefined;

    const { notifications, total } = await notificationRepository.getNotifications({
      ...userContext,
      page,
      limit,
      filter,
      type,
    });

    return {
      notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getUnreadCount(userContext: { tenantId?: string; userId?: string; superAdminId?: string }) {
    const count = await notificationRepository.getUnreadCount(userContext);
    return { count };
  },

  async markAsSeen(id: string, userContext: { tenantId?: string; userId?: string; superAdminId?: string }, t: any) {
    const result = await notificationRepository.markAsSeen(id, userContext);
    if (result.count === 0) {
      throw new NotFoundError(t("notification.not_found"));
    }
    return { success: true };
  },

  async markAllAsSeen(userContext: { tenantId?: string; userId?: string; superAdminId?: string }) {
    await notificationRepository.markAllAsSeen(userContext);
    return { success: true };
  },

  async softDelete(id: string, userContext: { tenantId?: string; userId?: string; superAdminId?: string }, t: any) {
    const result = await notificationRepository.softDelete(id, userContext);
    if (result.count === 0) {
      throw new NotFoundError(t("notification.not_found"));
    }
    return { success: true };
  },

  async trigger(data: {
    tenantId?: string | null;
    userId?: string | null;
    superAdminId?: string | null;
    titleKey: string;
    messageKey: string;
    type: NotificationType;
    priority?: NotificationPriority;
    actionUrl?: string | null;
    metadata?: any;
    replacements?: Record<string, any>;
  }) {
    try {
      const locale = "en";

      const title = translate(data.titleKey, locale, data.replacements);
      const message = translate(data.messageKey, locale, data.replacements);

      return await notificationRepository.createNotification({
        tenantId: data.tenantId,
        userId: data.userId,
        superAdminId: data.superAdminId,
        title,
        message,
        type: data.type,
        priority: data.priority,
        actionUrl: data.actionUrl,
        metadata: data.metadata,
      });
    } catch (error) {
      console.error("Failed to trigger notification: ", error);
    }
  },

  // Utility to fetch active tenant users by role
  async getTenantUsersByRole(tenantId: string, role: UserRole) {
    return prisma.user.findMany({
      where: { tenantId, role, isActive: true },
      select: { id: true },
    });
  },

  // Role-specific trigger implementations
  async triggerTaskAssigned(tenantId: string, task: { id: string; title: string; assigneeId: string }) {
    await this.trigger({
      tenantId,
      userId: task.assigneeId,
      titleKey: "notification.task.assigned_title",
      messageKey: "notification.task.assigned_message",
      type: "TASK",
      priority: "MEDIUM",
      replacements: { title: task.title },
      metadata: { taskId: task.id },
    });
  },

  async triggerTaskStatusUpdated(tenantId: string, task: { id: string; title: string; createdById: string; assigneeId?: string | null }, oldStatus: string, newStatus: string, updaterName: string) {
    // Notify managers / project owner / creator
    const notificationPayload = {
      tenantId,
      titleKey: "notification.task.status_updated_title",
      messageKey: "notification.task.status_updated_message",
      type: "TASK" as NotificationType,
      priority: "MEDIUM" as NotificationPriority,
      replacements: { title: task.title, status: newStatus, userName: updaterName },
      metadata: { taskId: task.id, oldStatus, newStatus },
    };

    // 1. Notify creator if not the updater
    await this.trigger({
      ...notificationPayload,
      userId: task.createdById,
    });

    // 2. Notify assignee if not the updater
    if (task.assigneeId && task.assigneeId !== task.createdById) {
      await this.trigger({
        ...notificationPayload,
        userId: task.assigneeId,
      });
    }

    // 3. Notify MANAGER role users for team task updates
    const managers = await this.getTenantUsersByRole(tenantId, "MANAGER");
    for (const manager of managers) {
      if (manager.id !== task.assigneeId && manager.id !== task.createdById) {
        await this.trigger({
          ...notificationPayload,
          userId: manager.id,
        });
      }
    }
  },

  async triggerLeaveCreated(tenantId: string, leave: { id: string; userId: string }) {
    const user = await prisma.user.findUnique({
      where: { id: leave.userId },
      select: { firstName: true, lastName: true, email: true },
    });
    const employeeName = user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email) : "Employee";

    // HR_ADMIN gets "New leave requests"
    const hrAdmins = await this.getTenantUsersByRole(tenantId, "HR_ADMIN");
    for (const hr of hrAdmins) {
      await this.trigger({
        tenantId,
        userId: hr.id,
        titleKey: "notification.leave.new_title",
        messageKey: "notification.leave.new_message",
        type: "LEAVE",
        priority: "HIGH",
        replacements: { userName: employeeName },
        metadata: { leaveRequestId: leave.id },
      });
    }

    // MANAGER gets "Pending leave approvals"
    const managers = await this.getTenantUsersByRole(tenantId, "MANAGER");
    for (const mgr of managers) {
      await this.trigger({
        tenantId,
        userId: mgr.id,
        titleKey: "notification.leave.pending_title",
        messageKey: "notification.leave.pending_message",
        type: "LEAVE",
        priority: "HIGH",
        replacements: { userName: employeeName },
        metadata: { leaveRequestId: leave.id },
      });
    }
  },

  async triggerLeaveReviewed(tenantId: string, leave: { id: string; userId: string; status: string; startDate: Date; endDate: Date }) {
    const isApproved = leave.status === "APPROVED";
    const titleKey = isApproved ? "notification.leave.approved_title" : "notification.leave.rejected_title";
    const messageKey = isApproved ? "notification.leave.approved_message" : "notification.leave.rejected_message";

    const formatOptions = { year: "numeric", month: "2-digit", day: "2-digit" } as const;
    const startDateStr = leave.startDate.toLocaleDateString("en-US", formatOptions);
    const endDateStr = leave.endDate.toLocaleDateString("en-US", formatOptions);

    await this.trigger({
      tenantId,
      userId: leave.userId,
      titleKey,
      messageKey,
      type: "LEAVE",
      priority: isApproved ? "HIGH" : "MEDIUM",
      replacements: { startDate: startDateStr, endDate: endDateStr },
      metadata: { leaveRequestId: leave.id, status: leave.status },
    });
  },

  async triggerTimesheetReviewed(tenantId: string, timesheet: { id: string; userId: string; status: string; date: Date }) {
    const isApproved = timesheet.status === "APPROVED";
    const titleKey = isApproved ? "notification.timesheet.approved_title" : "notification.timesheet.rejected_title";
    const messageKey = isApproved ? "notification.timesheet.approved_message" : "notification.timesheet.rejected_message";

    const formatOptions = { year: "numeric", month: "2-digit", day: "2-digit" } as const;
    const dateStr = timesheet.date.toLocaleDateString("en-US", formatOptions);

    await this.trigger({
      tenantId,
      userId: timesheet.userId,
      titleKey,
      messageKey,
      type: "TIMESHEET",
      priority: "MEDIUM",
      replacements: { date: dateStr },
      metadata: { timesheetId: timesheet.id, status: timesheet.status },
    });
  },

  async triggerAssetAssigned(tenantId: string, asset: { id: string; name: string; serialNumber: string | null }, userId: string) {
    await this.trigger({
      tenantId,
      userId,
      titleKey: "notification.asset.assigned_title",
      messageKey: "notification.asset.assigned_message",
      type: "ASSET",
      priority: "MEDIUM",
      replacements: { name: asset.name, serial: asset.serialNumber || "" },
      metadata: { assetId: asset.id },
    });
  },

  async triggerInsuranceActivated(tenantId: string, planName: string, userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });
    const employeeName = user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email) : "Employee";

    // Notify Employee
    await this.trigger({
      tenantId,
      userId,
      titleKey: "notification.insurance.activated_title",
      messageKey: "notification.insurance.activated_message",
      type: "INSURANCE",
      priority: "MEDIUM",
      replacements: { planName },
      metadata: { planName },
    });

    // Notify HR_ADMINs
    const hrAdmins = await this.getTenantUsersByRole(tenantId, "HR_ADMIN");
    for (const hr of hrAdmins) {
      await this.trigger({
        tenantId,
        userId: hr.id,
        titleKey: "notification.insurance.new_enrollment_title",
        messageKey: "notification.insurance.new_enrollment_message",
        type: "INSURANCE",
        priority: "MEDIUM",
        replacements: { userName: employeeName, planName },
        metadata: { userId, planName },
      });
    }
  },

  async triggerPayrollCreated(tenantId: string, month: number, year: number) {
    const tenantOwners = await this.getTenantUsersByRole(tenantId, "TENANT_OWNER");
    for (const owner of tenantOwners) {
      await this.trigger({
        tenantId,
        userId: owner.id,
        titleKey: "notification.payroll.approval_title",
        messageKey: "notification.payroll.approval_message",
        type: "PAYROLL",
        priority: "HIGH",
        replacements: { month: String(month), year: String(year) },
        metadata: { month, year },
      });
    }
  },

  async triggerPayrollApproved(tenantId: string, runId: string, month: number, year: number) {
    // Get all payroll entries for this run
    const entries = await prisma.payrollEntry.findMany({
      where: { payrollRunId: runId, tenantId },
      select: { userId: true },
    });

    for (const entry of entries) {
      await this.trigger({
        tenantId,
        userId: entry.userId,
        titleKey: "notification.payroll.approved_title",
        messageKey: "notification.payroll.approved_message",
        type: "PAYROLL",
        priority: "HIGH",
        replacements: { month: String(month), year: String(year) },
        metadata: { payrollRunId: runId, month, year },
      });
    }
  },

  async triggerMissingDocumentsAlert(tenantId: string, userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });
    const employeeName = user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email) : "Employee";

    const hrAdmins = await this.getTenantUsersByRole(tenantId, "HR_ADMIN");
    for (const hr of hrAdmins) {
      await this.trigger({
        tenantId,
        userId: hr.id,
        titleKey: "notification.employee.missing_docs_title",
        messageKey: "notification.employee.missing_docs_message",
        type: "SYSTEM",
        priority: "MEDIUM",
        replacements: { userName: employeeName },
        metadata: { employeeUserId: userId },
      });
    }
  },

  async triggerNewTenantNotification(tenant: { id: string; name: string; slug: string }) {
    const superAdmins = await prisma.superAdmin.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    for (const admin of superAdmins) {
      await this.trigger({
        superAdminId: admin.id,
        titleKey: "notification.system.new_tenant_title",
        messageKey: "notification.system.new_tenant_message",
        type: "SYSTEM",
        priority: "HIGH",
        replacements: { name: tenant.name, slug: tenant.slug },
        metadata: { tenantId: tenant.id },
      });
    }
  },

  async checkTaskDeadlines() {
    const now = new Date();

    // Tomorrow start/end in UTC
    const tomorrowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const tomorrowEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 2));

    // Today start (for overdue)
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    try {
      // 1. Check tasks due tomorrow
      const tasksDueTomorrow = await prisma.task.findMany({
        where: {
          dueDate: {
            gte: tomorrowStart,
            lt: tomorrowEnd,
          },
          status: { not: "DONE" },
          assigneeId: { not: null },
        },
        select: { id: true, title: true, assigneeId: true, tenantId: true },
      });

      for (const task of tasksDueTomorrow) {
        if (!task.assigneeId) continue;

        // Check if already notified using JSON metadata path filter
        const existing = await prisma.notification.findFirst({
          where: {
            userId: task.assigneeId,
            type: "TASK",
            deletedAt: null,
            metadata: {
              path: ["taskId"],
              equals: task.id,
            },
          },
        });

        let alreadyNotified = false;
        if (existing && existing.metadata) {
          const meta = existing.metadata as any;
          if (meta.deadlineType === "DUE_TOMORROW" || meta.deadlineType === "OVERDUE") {
            alreadyNotified = true;
          }
        }

        if (!alreadyNotified) {
          await this.trigger({
            tenantId: task.tenantId,
            userId: task.assigneeId,
            titleKey: "notification.task.due_tomorrow_title",
            messageKey: "notification.task.due_tomorrow_message",
            type: "TASK",
            priority: "HIGH",
            replacements: { title: task.title },
            metadata: { taskId: task.id, deadlineType: "DUE_TOMORROW" },
          });
        }
      }

      // 2. Check overdue tasks
      const overdueTasks = await prisma.task.findMany({
        where: {
          dueDate: {
            lt: todayStart,
          },
          status: { not: "DONE" },
          assigneeId: { not: null },
        },
        select: { id: true, title: true, assigneeId: true, tenantId: true },
      });

      for (const task of overdueTasks) {
        if (!task.assigneeId) continue;

        const existing = await prisma.notification.findFirst({
          where: {
            userId: task.assigneeId,
            type: "TASK",
            deletedAt: null,
            metadata: {
              path: ["taskId"],
              equals: task.id,
            },
          },
        });

        let alreadyNotified = false;
        if (existing && existing.metadata) {
          const meta = existing.metadata as any;
          if (meta.deadlineType === "OVERDUE") {
            alreadyNotified = true;
          }
        }

        if (!alreadyNotified) {
          await this.trigger({
            tenantId: task.tenantId,
            userId: task.assigneeId,
            titleKey: "notification.task.overdue_title",
            messageKey: "notification.task.overdue_message",
            type: "TASK",
            priority: "URGENT",
            replacements: { title: task.title },
            metadata: { taskId: task.id, deadlineType: "OVERDUE" },
          });
        }
      }
    } catch (err) {
      console.error("Failed to run task deadline checks:", err);
    }
  }
};
