export interface SendMessageRequest {
  message: string;
  sessionId?: string;
}

export interface SendMessageResponse {
  success: boolean;
  data?: {
    sessionId: string;
    reply: string;
  };
  error?: string;
}

export interface SessionSummary {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  lastMessage?: string;
}

export interface MessageResponse {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: Date;
}
