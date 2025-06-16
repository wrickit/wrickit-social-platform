import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import {
  insertUserSchema,
  loginSchema,
  insertRelationshipSchema,
  insertPostSchema,
  insertMessageSchema,
} from "@shared/schema";
import session from "express-session";
import { ValidationError } from "zod-validation-error";

// Session configuration
const sessionConfig = session({
  secret: process.env.SESSION_SECRET || "wrickit-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
});

// Auth middleware
const requireAuth = (req: any, res: Response, next: any) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(sessionConfig);

  // Auth routes
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByAdmissionNumber(validatedData.admissionNumber);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this admission number" });
      }
      
      const user = await storage.createUser(validatedData);
      (req.session as any).userId = user.id;
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({ message: error.message });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const user = await storage.authenticateUser(
        validatedData.admissionNumber,
        validatedData.password
      );
      
      if (!user) {
        return res.status(401).json({ message: "Invalid admission number or password" });
      }
      
      (req.session as any).userId = user.id;
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({ message: error.message });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", requireAuth, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Relationship routes
  app.post("/api/relationships", requireAuth, async (req: any, res: Response) => {
    try {
      const validatedData = insertRelationshipSchema.parse(req.body);
      
      const relationship = await storage.createRelationship(
        req.session.userId,
        validatedData.toUserId,
        validatedData.type
      );
      
      res.json(relationship);
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({ message: error.message });
      }
      console.error("Create relationship error:", error);
      res.status(500).json({ message: "Failed to create relationship" });
    }
  });

  app.get("/api/relationships", requireAuth, async (req: any, res: Response) => {
    try {
      const relationships = await storage.getRelationshipsByUserId(req.session.userId);
      res.json(relationships);
    } catch (error) {
      console.error("Get relationships error:", error);
      res.status(500).json({ message: "Failed to get relationships" });
    }
  });

  // User search route
  app.get("/api/users/search", requireAuth, async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }
      
      // Simple search by admission number or name
      // In a real app, you'd want proper text search
      const allUsers = await storage.getPosts(100); // This is a placeholder
      // For now, return empty array as we don't have a proper search method
      res.json([]);
    } catch (error) {
      console.error("Search users error:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Post routes
  app.post("/api/posts", requireAuth, async (req: any, res: Response) => {
    try {
      const validatedData = insertPostSchema.parse(req.body);
      
      const post = await storage.createPost(
        req.session.userId,
        validatedData.content,
        validatedData.audience
      );
      
      res.json(post);
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({ message: error.message });
      }
      console.error("Create post error:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.get("/api/posts", requireAuth, async (req: Request, res: Response) => {
    try {
      const posts = await storage.getPosts();
      res.json(posts);
    } catch (error) {
      console.error("Get posts error:", error);
      res.status(500).json({ message: "Failed to get posts" });
    }
  });

  app.post("/api/posts/:id/like", requireAuth, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      await storage.likePost(postId);
      res.json({ message: "Post liked" });
    } catch (error) {
      console.error("Like post error:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  // Message routes
  app.post("/api/messages", requireAuth, async (req: any, res: Response) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      
      const message = await storage.createMessage(
        req.session.userId,
        validatedData.toUserId,
        validatedData.content
      );
      
      res.json(message);
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({ message: error.message });
      }
      console.error("Create message error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/messages/:userId", requireAuth, async (req: any, res: Response) => {
    try {
      const otherUserId = parseInt(req.params.userId);
      const messages = await storage.getMessagesBetweenUsers(req.session.userId, otherUserId);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  app.get("/api/messages", requireAuth, async (req: any, res: Response) => {
    try {
      const messages = await storage.getRecentMessagesByUserId(req.session.userId);
      res.json(messages);
    } catch (error) {
      console.error("Get recent messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  // Friend group routes
  app.get("/api/friend-groups", requireAuth, async (req: any, res: Response) => {
    try {
      const groups = await storage.getFriendGroupsByUserId(req.session.userId);
      res.json(groups);
    } catch (error) {
      console.error("Get friend groups error:", error);
      res.status(500).json({ message: "Failed to get friend groups" });
    }
  });

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req: any, res: Response) => {
    try {
      const notifications = await storage.getNotificationsByUserId(req.session.userId);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  app.post("/api/notifications/:id/read", requireAuth, async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket, req: any) => {
    console.log('New WebSocket connection');
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Broadcast message to all connected clients
        // In a real app, you'd want to send to specific users
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  return httpServer;
}
