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
  updateUserSchema,
  changePasswordSchema,
  searchUserSchema,
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

  // User search route (by admission number)
  app.get("/api/users/search", requireAuth, async (req: Request, res: Response) => {
    try {
      const { admissionNumber } = req.query;
      if (!admissionNumber || typeof admissionNumber !== 'string') {
        return res.status(400).json({ message: "Admission number required" });
      }
      
      const user = await storage.getUserByAdmissionNumber(admissionNumber);
      if (user) {
        // Don't return password in search results
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error("Search users error:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // Search all users route (for messaging)
  app.get("/api/users/search-all", requireAuth, async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string' || q.length < 2) {
        return res.json([]);
      }
      
      const users = await storage.searchUsers(q);
      res.json(users);
    } catch (error) {
      console.error("Search all users error:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // Get specific user profile
  app.get("/api/users/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password to client
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user profile error:", error);
      res.status(500).json({ message: "Failed to get user profile" });
    }
  });

  // Update user profile
  app.put("/api/users/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUserId = req.session.userId;
      
      // Users can only update their own profile
      if (userId !== currentUserId) {
        return res.status(403).json({ message: "Cannot update other user's profile" });
      }
      
      const validatedData = updateUserSchema.parse(req.body);
      const updatedUser = await storage.updateUser(userId, validatedData);
      
      // Don't send password to client
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Search users by username
  app.get("/api/users/search-username", requireAuth, async (req: Request, res: Response) => {
    try {
      const { username } = req.query;
      if (!username) {
        return res.status(400).json({ message: "Username query parameter is required" });
      }
      
      const users = await storage.searchUsersByUsername(username as string);
      res.json(users);
    } catch (error) {
      console.error("Search users by username error:", error);
      res.status(500).json({ message: "Failed to search users by username" });
    }
  });

  // Change password
  app.post("/api/users/change-password", requireAuth, async (req: any, res: Response) => {
    try {
      const validatedData = changePasswordSchema.parse(req.body);
      await storage.changePassword(req.session.userId, validatedData.currentPassword, validatedData.newPassword);
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({ message: error.message });
      }
      if (error instanceof Error && error.message === "Current password is incorrect") {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      console.error("Change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Delete account
  app.delete("/api/users/delete-account", requireAuth, async (req: any, res: Response) => {
    try {
      await storage.deleteUser(req.session.userId);
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Session destroy error:", err);
        }
      });
      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Get user relationships for profile
  app.get("/api/users/:id/relationships", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const relationships = await storage.getRelationshipsByUserId(userId);
      res.json(relationships);
    } catch (error) {
      console.error("Get user relationships error:", error);
      res.status(500).json({ message: "Failed to get relationships" });
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

  app.get("/api/posts", requireAuth, async (req: any, res: Response) => {
    try {
      const currentUser = await storage.getUser(req.session.userId);
      const posts = await storage.getPosts(20, currentUser?.class);
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
      res.json({ success: true });
    } catch (error) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Disciplinary action routes
  app.post("/api/disciplinary-actions", requireAuth, async (req: any, res: Response) => {
    try {
      const { reportedUserId, reason, description, isAnonymous } = req.body;
      const reporterUserId = req.session.userId;
      
      if (!reportedUserId || !reason || !description) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const action = await storage.createDisciplinaryAction(
        reportedUserId,
        reporterUserId,
        reason,
        description,
        isAnonymous
      );
      
      res.json(action);
    } catch (error) {
      console.error("Create disciplinary action error:", error);
      res.status(500).json({ message: "Failed to create disciplinary action" });
    }
  });

  app.get("/api/disciplinary-actions", requireAuth, async (req: Request, res: Response) => {
    try {
      const actions = await storage.getDisciplinaryActions();
      res.json(actions);
    } catch (error) {
      console.error("Get disciplinary actions error:", error);
      res.status(500).json({ message: "Failed to get disciplinary actions" });
    }
  });

  app.post("/api/disciplinary-actions/:id/vote", requireAuth, async (req: any, res: Response) => {
    try {
      const actionId = parseInt(req.params.id);
      const { vote } = req.body;
      const voterId = req.session.userId;
      
      if (!vote || !["support", "oppose"].includes(vote)) {
        return res.status(400).json({ message: "Invalid vote" });
      }
      
      await storage.voteDisciplinaryAction(actionId, voterId, vote);
      res.json({ success: true });
    } catch (error) {
      console.error("Vote disciplinary action error:", error);
      res.status(500).json({ message: "Failed to vote on disciplinary action" });
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
