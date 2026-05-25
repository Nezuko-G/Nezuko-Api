import rateLimit from "express-rate-limit";

const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    error: "Please slow down — too many requests.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default chatbotLimiter;
