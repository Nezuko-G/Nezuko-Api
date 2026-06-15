import prisma from "@/shared/config/prisma";
import { getModel, getSystemPrompt, generationConfig } from "@/shared/config/gemini";
import { BadRequestError, BadGatewayError } from "@/shared/errors/errors";
import type {
  SendMessageResponse,
  SessionSummary,
  MessageResponse,
} from "./chatbot.types";
import { toolDeclarations, executeToolCall } from "./chatbot.tools";

export class ChatbotService {
  async findOrCreateSession(
    tenantId: string,
    userId: string,
    sessionId?: string,
  ) {
    if (sessionId) {
      const session = await prisma.chatSession.findFirst({
        where: { id: sessionId, tenantId, userId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 20,
          },
        },
      });
      if (session) return session;
    }

    return prisma.chatSession.create({
      data: { tenantId, userId },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 0 } },
    });
  }

  async getSessions(tenantId: string, userId: string): Promise<SessionSummary[]> {
    const sessions = await prisma.chatSession.findMany({
      where: { tenantId, userId },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return sessions.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      messageCount: s.messages.length,
      lastMessage: s.messages[0]?.content,
    }));
  }

  async getSessionMessages(
    sessionId: string,
    tenantId: string,
    userId: string,
  ): Promise<MessageResponse[]> {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, tenantId, userId },
    });
    if (!session) throw new BadRequestError("Session not found");

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });

    return messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    }));
  }

  async sendMessage(
    tenantId: string,
    userId: string,
    role: string,
    message: string,
    sessionId?: string,
  ): Promise<SendMessageResponse> {
    const session = await this.findOrCreateSession(tenantId, userId, sessionId);

    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "USER",
        content: message,
      },
    });

    const model = getModel();
    if (!model) {
      throw new Error("Chatbot is not available ");
    }

    const history = session.messages.map((m) => ({
      role: m.role === "USER" ? "user" as const : "model" as const,
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      systemInstruction: { role: "user", parts: [{ text: getSystemPrompt({ role, employeeId: userId, tenantId }) }] },
      history,
      generationConfig,
      tools: [{ functionDeclarations: toolDeclarations }],
    });

    let responseText: string;
    try {
      const result = await chat.sendMessage(message);
      const response = result.response;
      const functionCalls = response.functionCalls();

      if (functionCalls && functionCalls.length > 0) {
        const toolResults = await Promise.all(
          functionCalls.map(async (fc: any) => {
            const result = await executeToolCall(fc.name, fc.args as Record<string, unknown>);
            return {
              functionResponse: {
                name: fc.name,
                response: result,
              },
            };
          }),
        );

        const finalResult = await chat.sendMessage(toolResults);
        responseText = finalResult.response.text();
      } else {
        responseText = response.text();
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      if (msg.includes("API_KEY") || msg.includes("not found") || msg.includes("quota") || msg.includes("safety") || msg.includes("exceeded")) {
        throw new BadGatewayError(`AI service error`);
      }
      throw new BadGatewayError("Chatbot service is temporarily unavailable");
    }

    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "ASSISTANT",
        content: responseText,
      },
    });

    return {
      success: true,
      data: {
        sessionId: session.id,
        reply: responseText,
      },
    };
  }
}
