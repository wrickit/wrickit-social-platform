import {
  users,
  relationships,
  posts,
  messages,
  friendGroups,
  friendGroupMembers,
  notifications,
  disciplinaryActions,
  disciplinaryVotes,
  emailVerifications,
  type User,
  type InsertUser,
  type UpdateUser,
  type ChangePassword,
  type Relationship,
  type Post,
  type Message,
  type FriendGroup,
  type Notification,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql, inArray, count, gt, lt } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUserByAdmissionNumber(admissionNumber: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByName(name: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createDevUser(name: string, userClass: string, password: string): Promise<User>;
  authenticateUser(admissionNumber: string, password: string): Promise<User | null>;
  authenticateUserByName(name: string, password: string): Promise<User | null>;
  getUser(id: number): Promise<User | undefined>;
  updateUser(id: number, userData: UpdateUser): Promise<User>;
  changePassword(id: number, currentPassword: string, newPassword: string): Promise<void>;
  deleteUser(id: number): Promise<void>;
  searchUsers(query: string): Promise<User[]>;
  searchUsersByUsername(username: string): Promise<User[]>;
  
  // Relationship operations
  createRelationship(fromUserId: number, toUserId: number, type: string): Promise<Relationship>;
  getRelationshipsByUserId(userId: number): Promise<(Relationship & { toUser: User; fromUser: User })[]>;
  checkMutualCrush(userId1: number, userId2: number): Promise<boolean>;
  
  // Post operations
  createPost(authorId: number, content: string, audience: string): Promise<Post>;
  getPosts(limit?: number, userClass?: string): Promise<(Post & { author: User })[]>;
  likePost(postId: number): Promise<void>;
  
  // Message operations
  createMessage(fromUserId: number, toUserId: number, content: string): Promise<Message>;
  getMessagesBetweenUsers(userId1: number, userId2: number): Promise<(Message & { fromUser: User; toUser: User })[]>;
  getRecentMessagesByUserId(userId: number): Promise<(Message & { fromUser: User; toUser: User })[]>;
  markMessagesAsRead(currentUserId: number, otherUserId: number): Promise<void>;
  
  // Friend group operations
  createFriendGroup(name: string, memberIds: number[]): Promise<FriendGroup>;
  getFriendGroupsByUserId(userId: number): Promise<(FriendGroup & { members: (typeof friendGroupMembers.$inferSelect & { user: User })[] })[]>;
  detectFriendGroups(userId: number): Promise<void>;
  
  // Notification operations
  createNotification(userId: number, type: string, message: string, relatedUserId?: number): Promise<Notification>;
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  markNotificationAsRead(notificationId: number): Promise<void>;
  
  // Disciplinary action operations
  createDisciplinaryAction(reportedUserId: number, reporterUserId: number, reason: string, description: string, isAnonymous: boolean): Promise<any>;
  getDisciplinaryActions(): Promise<any[]>;
  voteDisciplinaryAction(actionId: number, voterId: number, vote: string): Promise<void>;
  
  // Email verification operations
  createEmailVerification(email: string, code: string): Promise<void>;
  verifyEmailCode(email: string, code: string): Promise<boolean>;
  cleanupExpiredCodes(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUserByAdmissionNumber(admissionNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.admissionNumber, admissionNumber));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const fullName = insertUser.name || `${insertUser.firstName} ${insertUser.lastName}`;
    
    const [user] = await db
      .insert(users)
      .values({ 
        ...insertUser, 
        password: hashedPassword,
        name: fullName
      })
      .returning();
    return user;
  }

  async authenticateUser(admissionNumber: string, password: string): Promise<User | null> {
    const user = await this.getUserByAdmissionNumber(admissionNumber);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByName(name: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.name, name));
    return user || undefined;
  }

  async createDevUser(name: string, userClass: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate a unique admission number for dev-created users
    const timestamp = Date.now().toString().slice(-6);
    const admissionNumber = `DEV${timestamp}`;
    
    const [user] = await db
      .insert(users)
      .values({ 
        admissionNumber,
        username: name.toLowerCase().replace(/\s+/g, ''),
        password: hashedPassword,
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || '',
        name,
        email: `${name.toLowerCase().replace(/\s+/g, '')}@wrickit.dev`,
        class: userClass,
        division: userClass.slice(-1) || 'A'
      })
      .returning();
    return user;
  }

  async authenticateUserByName(name: string, password: string): Promise<User | null> {
    const user = await this.getUserByName(name);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async updateUser(id: number, userData: UpdateUser): Promise<User> {
    // If first name or last name is updated, update the full name too
    const updateData: any = { ...userData };
    if (userData.firstName || userData.lastName) {
      const currentUser = await this.getUser(id);
      if (currentUser) {
        updateData.name = `${userData.firstName || currentUser.firstName} ${userData.lastName || currentUser.lastName}`;
      }
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async changePassword(id: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    
    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) throw new Error("Current password is incorrect");
    
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({ password: hashedNewPassword })
      .where(eq(users.id, id));
  }

  async deleteUser(id: number): Promise<void> {
    // Delete related data first
    await db.delete(relationships).where(or(eq(relationships.fromUserId, id), eq(relationships.toUserId, id)));
    await db.delete(messages).where(or(eq(messages.fromUserId, id), eq(messages.toUserId, id)));
    await db.delete(posts).where(eq(posts.authorId, id));
    await db.delete(notifications).where(eq(notifications.userId, id));
    await db.delete(friendGroupMembers).where(eq(friendGroupMembers.userId, id));
    
    // Delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  async searchUsersByUsername(username: string): Promise<User[]> {
    const searchResults = await db
      .select()
      .from(users)
      .where(sql`${users.username} ILIKE ${`%${username}%`}`)
      .limit(10);
    
    // Don't return passwords in search results
    return searchResults.map(({ password, ...user }) => user) as User[];
  }

  async createRelationship(fromUserId: number, toUserId: number, type: string): Promise<Relationship> {
    const [relationship] = await db
      .insert(relationships)
      .values({ fromUserId, toUserId, type })
      .returning();
    
    // Check for mutual crush
    if (type === 'crush') {
      const isMutual = await this.checkMutualCrush(fromUserId, toUserId);
      if (isMutual) {
        await this.createNotification(
          fromUserId,
          'mutual_crush',
          `You and your classmate have a mutual crush!`,
          toUserId
        );
        await this.createNotification(
          toUserId,
          'mutual_crush',
          `You and your classmate have a mutual crush!`,
          fromUserId
        );
      }
    }
    
    // Removed automatic friend group detection
    
    return relationship;
  }

  async getRelationshipsByUserId(userId: number): Promise<(Relationship & { toUser: User; fromUser: User })[]> {
    const result = await db
      .select()
      .from(relationships)
      .leftJoin(users, eq(relationships.toUserId, users.id))
      .where(eq(relationships.fromUserId, userId));
    
    const currentUser = await this.getUser(userId);
    
    return result.map(row => ({
      ...row.relationships,
      toUser: row.users!,
      fromUser: currentUser!,
    }));
  }

  async checkMutualCrush(userId1: number, userId2: number): Promise<boolean> {
    const crushes = await db
      .select()
      .from(relationships)
      .where(
        and(
          or(
            and(eq(relationships.fromUserId, userId1), eq(relationships.toUserId, userId2)),
            and(eq(relationships.fromUserId, userId2), eq(relationships.toUserId, userId1))
          ),
          eq(relationships.type, 'crush')
        )
      );
    
    return crushes.length === 2;
  }

  async createPost(authorId: number, content: string, audience: string): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values({ authorId, content, audience })
      .returning();
    return post;
  }

  async getPosts(limit = 20, userClass?: string): Promise<(Post & { author: User })[]> {
    let query = db
      .select()
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(posts.createdAt))
      .limit(limit);

    // Filter posts based on user's class if provided
    if (userClass) {
      query = query.where(
        or(
          eq(posts.audience, 'grade'), // Show all grade-level posts
          and(
            eq(posts.audience, 'class'),
            eq(users.class, userClass) // Only show class posts from same class
          )
        )
      ) as any;
    }
    
    const result = await query;
    
    return result.map(row => ({
      ...row.posts,
      author: row.users!,
    }));
  }

  async likePost(postId: number): Promise<void> {
    await db
      .update(posts)
      .set({ likes: sql`${posts.likes} + 1` })
      .where(eq(posts.id, postId));
  }

  async createMessage(fromUserId: number, toUserId: number, content: string): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({ fromUserId, toUserId, content })
      .returning();
    return message;
  }

  async getMessagesBetweenUsers(userId1: number, userId2: number): Promise<(Message & { fromUser: User; toUser: User })[]> {
    const result = await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.fromUserId, userId1), eq(messages.toUserId, userId2)),
          and(eq(messages.fromUserId, userId2), eq(messages.toUserId, userId1))
        )
      )
      .orderBy(messages.createdAt);

    const user1 = await this.getUser(userId1);
    const user2 = await this.getUser(userId2);
    
    return result.map(row => ({
      ...row,
      fromUser: row.fromUserId === userId1 ? user1! : user2!,
      toUser: row.toUserId === userId1 ? user1! : user2!,
    }));
  }

  async getRecentMessagesByUserId(userId: number): Promise<(Message & { fromUser: User; toUser: User })[]> {
    // Get all messages for this user
    const allMessages = await db
      .select()
      .from(messages)
      .where(or(eq(messages.fromUserId, userId), eq(messages.toUserId, userId)))
      .orderBy(desc(messages.createdAt));

    // Group by conversation partner and keep only the most recent message
    const conversationMap = new Map<number, Message>();
    
    for (const message of allMessages) {
      const partnerId = message.fromUserId === userId ? message.toUserId : message.fromUserId;
      
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, message);
      }
    }

    const result: (Message & { fromUser: User; toUser: User })[] = [];
    
    for (const message of Array.from(conversationMap.values())) {
      const fromUser = await this.getUser(message.fromUserId);
      const toUser = await this.getUser(message.toUserId);
      
      if (fromUser && toUser) {
        result.push({
          ...message,
          fromUser,
          toUser,
        });
      }
    }
    
    // Sort by creation date, most recent first
    return result.sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt as string | number | Date).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt as string | number | Date).getTime() : 0;
      return bDate - aDate;
    });
  }

  async markMessagesAsRead(currentUserId: number, otherUserId: number): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.toUserId, currentUserId),
          eq(messages.fromUserId, otherUserId)
        )
      );
  }

  async createFriendGroup(name: string, memberIds: number[]): Promise<FriendGroup> {
    const [group] = await db
      .insert(friendGroups)
      .values({ name })
      .returning();
    
    const memberInserts = memberIds.map(userId => ({
      groupId: group.id,
      userId,
    }));
    
    await db.insert(friendGroupMembers).values(memberInserts);
    
    // Notify all members
    for (const memberId of memberIds) {
      await this.createNotification(
        memberId,
        'friend_group_created',
        `You've been added to the friend group "${name}"!`
      );
    }
    
    return group;
  }

  async getFriendGroupsByUserId(userId: number): Promise<(FriendGroup & { members: (typeof friendGroupMembers.$inferSelect & { user: User })[] })[]> {
    const userGroups = await db
      .select()
      .from(friendGroupMembers)
      .leftJoin(friendGroups, eq(friendGroupMembers.groupId, friendGroups.id))
      .where(eq(friendGroupMembers.userId, userId));

    const result: (FriendGroup & { members: (typeof friendGroupMembers.$inferSelect & { user: User })[] })[] = [];
    
    for (const userGroup of userGroups) {
      if (userGroup.friend_groups) {
        const members = await db
          .select()
          .from(friendGroupMembers)
          .leftJoin(users, eq(friendGroupMembers.userId, users.id))
          .where(eq(friendGroupMembers.groupId, userGroup.friend_groups.id));
        
        const membersWithUsers = members.map(member => ({
          ...member.friend_group_members!,
          user: member.users!,
        }));
        
        result.push({
          ...userGroup.friend_groups,
          members: membersWithUsers,
        });
      }
    }
    
    return result;
  }

  async detectFriendGroups(userId: number): Promise<void> {
    // Get all best friends of the user
    const bestFriends = await db
      .select()
      .from(relationships)
      .where(and(eq(relationships.fromUserId, userId), eq(relationships.type, 'best_friend')));
    
    if (bestFriends.length < 2) return;
    
    // Check if any of the best friends are also best friends with each other
    for (let i = 0; i < bestFriends.length; i++) {
      for (let j = i + 1; j < bestFriends.length; j++) {
        const friend1 = bestFriends[i].toUserId;
        const friend2 = bestFriends[j].toUserId;
        
        // Check if friend1 and friend2 are best friends
        const mutualFriendship = await db
          .select()
          .from(relationships)
          .where(
            and(
              eq(relationships.fromUserId, friend1),
              eq(relationships.toUserId, friend2),
              eq(relationships.type, 'best_friend')
            )
          );
        
        if (mutualFriendship.length > 0) {
          // Create friend group
          const memberIds = [userId, friend1, friend2];
          const users_data = await db
            .select()
            .from(users)
            .where(inArray(users.id, memberIds));
          
          const groupName = users_data.map(u => u.name.split(' ')[0]).join(', ') + ' Squad';
          await this.createFriendGroup(groupName, memberIds);
        }
      }
    }
  }

  async createNotification(userId: number, type: string, message: string, relatedUserId?: number): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values({ userId, type, message, relatedUserId })
      .returning();
    return notification;
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async searchUsers(query: string): Promise<User[]> {
    const searchResults = await db
      .select()
      .from(users)
      .where(
        or(
          sql`${users.name} ILIKE ${`%${query}%`}`,
          sql`${users.admissionNumber} ILIKE ${`%${query}%`}`
        )
      )
      .limit(10);
    
    // Don't return passwords in search results
    return searchResults.map(({ password, ...user }) => user) as User[];
  }

  async createDisciplinaryAction(reportedUserId: number, reporterUserId: number, reason: string, description: string, isAnonymous: boolean): Promise<any> {
    const [action] = await db
      .insert(disciplinaryActions)
      .values({
        reportedUserId,
        reporterUserId,
        reason,
        description,
        isAnonymous,
      })
      .returning();
    return action;
  }

  async getDisciplinaryActions(): Promise<any[]> {
    const actions = await db
      .select()
      .from(disciplinaryActions)
      .leftJoin(users, eq(disciplinaryActions.reportedUserId, users.id))
      .orderBy(desc(disciplinaryActions.createdAt));
    
    return actions.map(action => ({
      ...action.disciplinary_actions,
      reportedUser: action.users,
    }));
  }

  async voteDisciplinaryAction(actionId: number, voterId: number, vote: string): Promise<void> {
    // Check if user already voted
    const existingVote = await db
      .select()
      .from(disciplinaryVotes)
      .where(and(
        eq(disciplinaryVotes.actionId, actionId),
        eq(disciplinaryVotes.voterId, voterId)
      ));

    if (existingVote.length > 0) {
      // Update existing vote
      await db
        .update(disciplinaryVotes)
        .set({ vote })
        .where(and(
          eq(disciplinaryVotes.actionId, actionId),
          eq(disciplinaryVotes.voterId, voterId)
        ));
    } else {
      // Create new vote
      await db
        .insert(disciplinaryVotes)
        .values({
          actionId,
          voterId,
          vote,
        });
    }

    // Update vote count on the action
    const supportVotes = await db
      .select({ count: sql<number>`count(*)` })
      .from(disciplinaryVotes)
      .where(and(
        eq(disciplinaryVotes.actionId, actionId),
        eq(disciplinaryVotes.vote, 'support')
      ));

    const opposeVotes = await db
      .select({ count: sql<number>`count(*)` })
      .from(disciplinaryVotes)
      .where(and(
        eq(disciplinaryVotes.actionId, actionId),
        eq(disciplinaryVotes.vote, 'oppose')
      ));

    const netVotes = (supportVotes[0]?.count || 0) - (opposeVotes[0]?.count || 0);
    
    await db
      .update(disciplinaryActions)
      .set({ votes: netVotes })
      .where(eq(disciplinaryActions.id, actionId));
  }

  async createEmailVerification(email: string, code: string): Promise<void> {
    // Clean up any existing codes for this email
    await db
      .delete(emailVerifications)
      .where(eq(emailVerifications.email, email));

    // Create new verification code with 10 minute expiry
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await db
      .insert(emailVerifications)
      .values({
        email,
        code,
        expiresAt,
      });
  }

  async verifyEmailCode(email: string, code: string): Promise<boolean> {
    const [verification] = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.email, email),
          eq(emailVerifications.code, code),
          eq(emailVerifications.isUsed, false),
          gt(emailVerifications.expiresAt, new Date())
        )
      )
      .limit(1);

    if (verification) {
      // Mark as used
      await db
        .update(emailVerifications)
        .set({ isUsed: true })
        .where(eq(emailVerifications.id, verification.id));
      
      return true;
    }

    return false;
  }

  async cleanupExpiredCodes(): Promise<void> {
    await db
      .delete(emailVerifications)
      .where(lt(emailVerifications.expiresAt, new Date()));
  }
}

export const storage = new DatabaseStorage();
