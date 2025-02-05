import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface MessageContext {
  recentMessages: Array<{ content: string; isAi: boolean }>;
  userPreferences: {
    aiName: string;
    wakeTime: string;
    waterInterval: number;
    useVoice: boolean;
  };
}

function getTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

export async function generateMessage(
  type: string,
  username: string,
  aiName: string,
  context?: Partial<MessageContext>
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured");
  }

  const timeOfDay = getTimeOfDay();
  const messageContext = {
    recentMessages: context?.recentMessages || [],
    userPreferences: context?.userPreferences || {
      aiName,
      wakeTime: "08:00",
      waterInterval: 120,
      useVoice: false
    }
  };

  const recentConversation = messageContext.recentMessages
    .map(m => `${m.isAi ? messageContext.userPreferences.aiName : username}: ${m.content}`)
    .join("\n");

  const systemPrompt = `You are ${aiName}, a highly personalized AI companion for ${username}. Your core characteristics are:

PERSONALITY & APPROACH:
- Empathetic and emotionally intelligent
- Warm and genuinely caring, like a close friend
- Proactive in providing support and understanding
- Natural and conversational in communication style
- Thoughtful and considerate in responses

CONVERSATION GUIDELINES:
1. Analyze the context and emotional tone of each message
2. Provide personalized, relevant responses that show you understand the user's needs
3. Remember and reference previous parts of the conversation when appropriate
4. Balance emotional support with practical advice when needed
5. Use natural language and appropriate emojis to convey warmth

IMPORTANT INSTRUCTIONS:
- Engage in natural conversation about any topic
- Analyze questions and provide thoughtful, relevant responses
- Show genuine interest in the user's thoughts and feelings
- Maintain consistent personality while being adaptable
- Keep responses concise but meaningful

CONTEXT:
- Time of day: ${timeOfDay}
- Previous conversation:
${recentConversation}

Remember that you are a companion first, here to engage in meaningful conversation and provide support. Analyze each message carefully and respond naturally as a friend would.`;

  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Start the chat
    const chat = model.startChat({
      history: [],
      generationConfig: {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 150,
      },
    });

    // Send the message and get the response
    const result = await chat.sendMessage(systemPrompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    return text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    if (error.message?.includes("quota exceeded")) {
      throw new Error("API quota exceeded. The system is currently unavailable due to high usage. Please try again later.");
    }
    if (error.message?.includes("invalid API key")) {
      throw new Error("API key is invalid or expired");
    }

    throw new Error("Failed to generate response. Please try again later.");
  }
}