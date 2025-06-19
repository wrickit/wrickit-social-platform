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
  type User,
  type InsertUser,
  type Relationship,
  type Post,
  type Message,
  type FriendGroup,
  type Notification,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql, inArray, count } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUserByAdmissionNumber(admissionNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  authenticateUser(admissionNumber: string, password: string): Promise<User | null>;
  getUser(id: number): Promise<User | undefined>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  searchUsers(query: string): Promise<User[]>;
  
  // Relationship operations
  createRelationship(fromUserId: number, toUserId: number, type: string): Promise<Relationship>;
  getRelationshipsByUserId(userId: number): Promise<(Relationship & { toUser: User; fromUser: User })[]>;
  checkMutualCrush(userId1: number, userId2: number): Promise<boolean>;
  
  // Post operations
  createPost(authorId: number, content: string, audience: string): Promise<Post>;
  getPosts(limit?: number): Promise<(Post & { author: User })[]>;
  likePost(postId: number): Promise<void>;
  
  // Message operations
  createMessage(fromUserId: number, toUserId: number, content: string): Promise<Message>;
  getMessagesBetweenUsers(userId1: number, userId2: number): Promise<(Message & { fromUser: User; toUser: User })[]>;
  getRecentMessagesByUserId(userId: number): Promise<(Message & { fromUser: User; toUser: User })[]>;
  
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
}

export class DatabaseStorage implements IStorage {
  async getUserByAdmissionNumber(admissionNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.admissionNumber, admissionNumber));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
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

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
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
    
    // Check for friend groups if type is best_friend
    if (type === 'best_friend') {
      await this.detectFriendGroups(fromUserId);
    }
    
    return relationship;
  }

  async getRelationshipsByUserId(userId: number): Promise<(Relationship & { toUser: User; fromUser: User })[]> {
    const result = await db
      .select({
        relationship: relationships,
        toUser: users,
      })
      .from(relationships)
      .leftJoin(users, eq(relationships.toUserId, users.id))
      .where(eq(relationships.fromUserId, userId));
    
    return result.map(row => ({
      ...row.relationship,
      toUser: row.toUser!,
      fromUser: row.toUser!, // Will be populated with proper user data in a real implementation
    })) as any;
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

  async getPosts(limit = 20): Promise<(Post & { author: User })[]> {
    const result = await db
      .select({
        post: posts,
        author: users,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(posts.createdAt))
      .limit(limit);
    
    return result.map(row => ({
      ...row.post,
      author: row.author!,
    })) as any;
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
    return await db
      .select()
      .from(messages)
      .leftJoin(users, eq(messages.fromUserId, users.id))
      .leftJoin(users, eq(messages.toUserId, users.id))
      .where(
        or(
          and(eq(messages.fromUserId, userId1), eq(messages.toUserId, userId2)),
          and(eq(messages.fromUserId, userId2), eq(messages.toUserId, userId1))
        )
      )
      .orderBy(messages.createdAt);
  }

  async getRecentMessagesByUserId(userId: number): Promise<(Message & { fromUser: User; toUser: User })[]> {
    return await db
      .select()
      .from(messages)
      .leftJoin(users, eq(messages.fromUserId, users.id))
      .leftJoin(users, eq(messages.toUserId, users.id))
      .where(or(eq(messages.fromUserId, userId), eq(messages.toUserId, userId)))
      .orderBy(desc(messages.createdAt))
      .limit(10);
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
    return await db
      .select()
      .from(friendGroups)
      .leftJoin(friendGroupMembers, eq(friendGroups.id, friendGroupMembers.groupId))
      .leftJoin(users, eq(friendGroupMembers.userId, users.id))
      .where(eq(friendGroupMembers.userId, userId));
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
    return searchResults.map(({ password, ...user }) => user);
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
}

export const storage = new DatabaseStorage();
