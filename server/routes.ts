import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { generateMessage } from "./openai";
import { userSettingsSchema } from "@shared/schema";

const MAX_CONTEXT_MESSAGES = 5; // Number of recent messages to include for context

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  app.get("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const messages = await storage.getMessages(req.user.id);
    res.json(messages);
  });

  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const message = await storage.addMessage({
      userId: req.user.id,
      content: req.body.content,
      isAi: false,
    });
    res.json(message);
  });

  app.post("/api/generate-message", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      // Get recent messages for context
      const recentMessages = (await storage.getMessages(req.user.id))
        .slice(-MAX_CONTEXT_MESSAGES)
        .map(({ content, isAi }) => ({ content, isAi }));

      const message = await generateMessage(
        "conversation",
        req.user.username,
        req.user.aiName || "AI Friend",
        {
          recentMessages,
          userPreferences: {
            aiName: req.user.aiName || "AI Friend",
            wakeTime: req.user.wakeTime || "08:00",
            waterInterval: req.user.waterInterval || 120,
            useVoice: req.user.useVoice || false
          }
        }
      );

      const savedMessage = await storage.addMessage({
        userId: req.user.id,
        content: message,
        isAi: true,
      });

      res.json(savedMessage);
    } catch (error: any) {
      console.error("Error generating AI response:", error);

      // Check if it's a rate limit error
      if (error.message?.includes("rate limit exceeded")) {
        return res.status(429).json({
          error: "Rate Limit Exceeded",
          message: "The AI is currently unavailable due to high usage. Please try again in a few moments."
        });
      }

      res.status(500).json({ 
        error: "Failed to generate AI response",
        message: "I'm having trouble responding right now. Please try again in a moment."
      });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const result = userSettingsSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid settings" });
    }

    const user = await storage.updateUserSettings(req.user.id, result.data);
    res.json(user);
  });

  const httpServer = createServer(app);
  return httpServer;
}