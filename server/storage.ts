import { User, Message, InsertUser, UserSettings } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserSettings(id: number, settings: UserSettings): Promise<User>;
  getMessages(userId: number): Promise<Message[]>;
  addMessage(message: Omit<Message, "id" | "timestamp">): Promise<Message>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message[]>;
  private currentUserId: number;
  private currentMessageId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.currentUserId = 1;
    this.currentMessageId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      aiName: "AI Friend",
      wakeTime: "08:00",
      waterInterval: 120,
      useVoice: false,
    };
    this.users.set(id, user);
    this.messages.set(id, []);
    return user;
  }

  async updateUserSettings(id: number, settings: UserSettings): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, ...settings };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getMessages(userId: number): Promise<Message[]> {
    return this.messages.get(userId) || [];
  }

  async addMessage(message: Omit<Message, "id" | "timestamp">): Promise<Message> {
    const id = this.currentMessageId++;
    const fullMessage: Message = {
      ...message,
      id,
      timestamp: new Date(),
    };
    
    const userMessages = this.messages.get(message.userId) || [];
    userMessages.push(fullMessage);
    this.messages.set(message.userId, userMessages);
    
    return fullMessage;
  }
}

export const storage = new MemStorage();
