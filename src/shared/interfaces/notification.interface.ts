import { NotificationType, NotificationPriority } from "@prisma/client";

export interface GetNotificationsQuery {
  page?: number;
  limit?: number;
  filter?: "ALL" | "SEEN" | "UNSEEN";
  type?: NotificationType;
}

export interface TriggerNotificationInput {
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
}
