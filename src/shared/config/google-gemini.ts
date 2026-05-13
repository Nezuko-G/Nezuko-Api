import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
}

const genAI = new GoogleGenerativeAI(API_KEY);

type Translator = (key: string, options?: Record<string, unknown>) => string;

/**
 * Get localized system prompt for chatbot
 */
const getLocalizedSystemPrompt = (t: Translator): string => {
  return `You are a helpful HR and Employee Management Assistant for Nezuko Company. 
    You help employees with questions about leave policies, attendance, payroll, benefits, insurance, and general HR inquiries.
    Be professional, friendly, and always provide accurate information.
    If you don't know something, ask the user to contact HR directly.`;
};

/**
 * Initialize Gemini Chatbot Model
 * Using gemini-pro which has better compatibility with startChat
 */
export const initializeChatbot = () => {
  return genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite",
  });
};

/**
 * Get chatbot configuration with localized messages
 */
export const getChatbotConfig = (t: Translator) => {
  return {
    model: "gemini-3.1-flash-lite",
    apiKey: API_KEY,
    systemPrompt: getLocalizedSystemPrompt(t),
    welcomeMessage: t("chatbot.welcome_message"),
    generalHelp: t("chatbot.general_help"),
    contactHR: t("chatbot.contact_hr"),
  };
};

/**
 * Send message to chatbot with localized responses
 * @param message - User's message
 * @param t - Translation function for localization
 * @returns Promise with chatbot response
 */
export const sendChatbotMessage = async (
  message: string,
  t: Translator,
): Promise<{
  success: boolean;
  message: string;
  data?: string;
  error?: string;
}> => {
  try {
    // Validate message
    if (!message || message.trim().length === 0) {
      return {
        success: false,
        message: t("chatbot.error_invalid_message"),
        error: t("chatbot.error_invalid_message"),
      };
    }

    // Validate API key
    if (!API_KEY) {
      return {
        success: false,
        message: t("chatbot.error_api_key_missing"),
        error: t("chatbot.error_api_key_missing"),
      };
    }

    const config = getChatbotConfig(t);
    const model = initializeChatbot();

    // Start a chat session with system context in the first message
    const chat = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    });

    // Include system prompt context with the user message
    const contextualMessage = `${config.systemPrompt}\n\nUser: ${message}`;
    const result = await chat.sendMessage(contextualMessage);
    const response = result.response;
    const responseText = response.text();

    return {
      success: true,
      message: t("chatbot.message_received"),
      data: responseText,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return {
      success: false,
      message: t("chatbot.error_sending_message"),
      error: `${t("chatbot.error_sending_message")}: ${errorMessage}`,
    };
  }
};

/**
 * Start a new chat session with localization
 * Note: System prompt is included in message context
 */
export const startChatSession = (t: Translator) => {
  const model = initializeChatbot();

  return model.startChat({
    history: [],
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.7,
    },
  });
};

export default {
  initializeChatbot,
  sendChatbotMessage,
  startChatSession,
  getChatbotConfig,
};
