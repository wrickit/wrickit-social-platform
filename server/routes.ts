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
  emailVerificationSchema,
  sendVerificationSchema,
  devRegisterSchema,
} from "@shared/schema";
import { sendEmail, generateVerificationCode, createVerificationEmail } from "./emailService";
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
const requireAuth = async (req: any, res: Response, next: any) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Only update user activity for meaningful interactions (not just background polls)
  const meaningfulRoutes = ['/api/posts', '/api/relationships'];
  const isBackgroundPoll = req.path.includes('/online') || 
                          req.path.includes('/notifications') ||
                          (req.method === 'GET' && req.path.includes('/messages'));
  
  // Update activity for POST requests (creating content) and specific meaningful routes
  const shouldUpdateActivity = (req.method === 'POST' && !isBackgroundPoll) || 
                              meaningfulRoutes.some(route => req.path.startsWith(route));
  
  if (shouldUpdateActivity) {
    try {
      await storage.updateUserActivity(req.session.userId);
    } catch (error) {
      // Don't fail the request if activity update fails
      console.warn("Failed to update user activity:", error);
    }
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(sessionConfig);

  // Registration disabled - users must be created manually after ID verification
  app.post("/api/register", async (req: Request, res: Response) => {
    res.status(403).json({ 
      message: "Self-registration is disabled. Please email your student ID card for account creation." 
    });
  });

  app.post("/api/send-verification", async (req: Request, res: Response) => {
    res.status(403).json({ 
      message: "Email verification is no longer available. Please contact admin for account creation." 
    });
  });

  app.post("/api/verify-email", async (req: Request, res: Response) => {
    res.status(403).json({ 
      message: "Email verification is no longer available. Please contact admin for account creation." 
    });
  });

  // Dev registration endpoint
  app.post("/api/dev-register", async (req: Request, res: Response) => {
    try {
      const validatedData = devRegisterSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByName(validatedData.name);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this name" });
      }
      
      const user = await storage.createDevUser(
        validatedData.name,
        validatedData.class,
        validatedData.password
      );
      
      res.json({ 
        message: "Account created successfully",
        user: { ...user, password: undefined } 
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({ message: error.message });
      }
      console.error("Dev registration error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const user = await storage.authenticateUserByName(
        validatedData.name,
        validatedData.password
      );
      
      if (!user) {
        return res.status(401).json({ message: "Invalid name or password" });
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
      
      // Prevent users from creating relationships with themselves
      if (req.session.userId === validatedData.toUserId) {
        return res.status(400).json({ message: "You cannot create a relationship with yourself" });
      }
      
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

  app.delete("/api/relationships/:userId", requireAuth, async (req: any, res: Response) => {
    try {
      const otherUserId = parseInt(req.params.userId);
      const currentUserId = req.session.userId;
      
      if (isNaN(otherUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Prevent users from trying to defriend themselves
      if (currentUserId === otherUserId) {
        return res.status(400).json({ message: "Cannot defriend yourself" });
      }
      
      await storage.deleteRelationship(currentUserId, otherUserId);
      res.json({ message: "Relationship removed successfully" });
    } catch (error) {
      console.error("Delete relationship error:", error);
      res.status(500).json({ message: "Failed to remove relationship" });
    }
  });

  // User search route (by name)
  app.get("/api/users/search", requireAuth, async (req: any, res: Response) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query required" });
      }
      
      const users = await storage.searchUsers(q);
      // Filter out current user and don't return passwords in search results
      const usersWithoutPasswords = users
        .filter(foundUser => foundUser.id !== req.session.userId)
        .map(foundUser => {
          const { password, ...userWithoutPassword } = foundUser;
          return userWithoutPassword;
        });
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Search users error:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // Search all users route (for messaging)
  app.get("/api/users/search-all", requireAuth, async (req: any, res: Response) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }
      
      const users = await storage.searchUsers(q);
      // Filter out current user and don't return passwords in search results
      const usersWithoutPasswords = users
        .filter(foundUser => foundUser.id !== req.session.userId)
        .map(foundUser => {
          const { password, ...userWithoutPassword } = foundUser;
          return userWithoutPassword;
        });
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Search all users error:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.get("/api/users/search-username", requireAuth, async (req: any, res: Response) => {
    try {
      const { username } = req.query;
      if (!username || typeof username !== 'string') {
        return res.json([]);
      }
      const users = await storage.searchUsersByUsername(username);
      // Filter out current user and don't return passwords
      const filteredUsers = users
        .filter(user => user.id !== req.session.userId)
        .map(user => {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        });
      res.json(filteredUsers);
    } catch (error) {
      console.error("Search users by username error:", error);
      res.status(500).json({ message: "Failed to search users by username" });
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

  // Check if user is online
  app.get("/api/users/:id/online", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const isOnline = await storage.isUserOnline(userId);
      res.json({ isOnline });
    } catch (error) {
      console.error("Check user online status error:", error);
      res.status(500).json({ message: "Failed to check online status" });
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
        validatedData.audience,
        validatedData.mediaUrls || undefined,
        validatedData.mediaTypes || undefined,
        validatedData.voiceMessageUrl || undefined,
        validatedData.voiceMessageDuration || undefined
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
      const posts = await storage.getPosts(20, currentUser?.class, req.session.userId);
      res.json(posts);
    } catch (error) {
      console.error("Get posts error:", error);
      res.status(500).json({ message: "Failed to get posts" });
    }
  });

  app.post("/api/posts/:id/like", requireAuth, async (req: any, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const result = await storage.likePost(postId, req.session.userId);
      res.json(result);
    } catch (error) {
      console.error("Like post error:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  app.post("/api/posts/:id/comments", requireAuth, async (req: any, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const { content } = req.body;
      
      if (!content?.trim()) {
        return res.status(400).json({ message: "Comment content is required" });
      }
      
      const comment = await storage.createComment(postId, req.session.userId, content.trim());
      res.json(comment);
    } catch (error) {
      console.error("Create comment error:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.get("/api/posts/:id/comments", requireAuth, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const comments = await storage.getCommentsByPostId(postId);
      res.json(comments);
    } catch (error) {
      console.error("Get comments error:", error);
      res.status(500).json({ message: "Failed to get comments" });
    }
  });

  // Message routes
  app.post("/api/messages", requireAuth, async (req: any, res: Response) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      
      const message = await storage.createMessage(
        req.session.userId,
        validatedData.toUserId,
        validatedData.content,
        validatedData.voiceMessageUrl || undefined,
        validatedData.voiceMessageDuration || undefined
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
      
      // Mark messages as read when viewing conversation
      await storage.markMessagesAsRead(req.session.userId, otherUserId);
      
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
  app.post("/api/friend-groups", requireAuth, async (req: any, res: Response) => {
    try {
      const { name, memberIds } = req.body;
      if (!name || !Array.isArray(memberIds) || memberIds.length === 0) {
        return res.status(400).json({ message: "Name and member IDs are required" });
      }
      
      // Add the current user to the group and remove duplicates
      const allMemberIds = [req.session.userId];
      for (const id of memberIds) {
        if (!allMemberIds.includes(id)) {
          allMemberIds.push(id);
        }
      }
      
      const friendGroup = await storage.createFriendGroup(name, allMemberIds);
      res.json(friendGroup);
    } catch (error) {
      console.error("Create friend group error:", error);
      res.status(500).json({ message: "Failed to create friend group" });
    }
  });

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

  // Track active WebSocket connections by user ID
  const activeConnections = new Map<number, Set<WebSocket>>();

  // WebSocket server for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket, req: any) => {
    console.log('New WebSocket connection');
    let userId: number | null = null;
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Handle user authentication for WebSocket
        if (data.type === 'auth' && data.userId) {
          userId = data.userId;
          
          // Add to active connections
          if (!activeConnections.has(userId)) {
            activeConnections.set(userId, new Set());
          }
          activeConnections.get(userId)!.add(ws);
          
          // Update user activity when they connect
          storage.updateUserActivity(userId).catch(console.warn);
          
          console.log(`User ${userId} connected via WebSocket`);
        }
        
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
      
      // Remove from active connections
      if (userId) {
        const userConnections = activeConnections.get(userId);
        if (userConnections) {
          userConnections.delete(ws);
          if (userConnections.size === 0) {
            activeConnections.delete(userId);
          }
        }
      }
    });
  });

  // Enhanced isUserOnline check that considers WebSocket connections
  const originalIsUserOnline = storage.isUserOnline.bind(storage);
  storage.isUserOnline = async (userId: number): Promise<boolean> => {
    // First check if user has active WebSocket connections
    const hasActiveConnections = activeConnections.has(userId) && activeConnections.get(userId)!.size > 0;
    
    if (hasActiveConnections) {
      // Update their activity since they have an active connection
      await storage.updateUserActivity(userId);
      return true;
    }
    
    // Fall back to time-based check
    return originalIsUserOnline(userId);
  };

  return httpServer;
}
