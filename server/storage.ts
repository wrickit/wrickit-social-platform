import {
  users,
  relationships,
  posts,
  comments,
  postLikes,
  messages,
  friendGroups,
  friendGroupMembers,
  notifications,
  disciplinaryActions,
  disciplinaryVotes,
  emailVerifications,
  loops,
  loopLikes,
  loopViews,
  userInterests,
  loopInteractions,
  type User,
  type InsertUser,
  type UpdateUser,
  type ChangePassword,
  type Relationship,
  type Post,
  type Comment,
  type Message,
  type FriendGroup,
  type Notification,
  type Loop,
  type InsertLoop
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql, inArray, count, gt, lt, asc } from "drizzle-orm";
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
  updateUserActivity(userId: number): Promise<void>;
  isUserOnline(userId: number): Promise<boolean>;
  
  // Relationship operations
  createRelationship(fromUserId: number, toUserId: number, type: string): Promise<Relationship>;
  getRelationshipsByUserId(userId: number): Promise<(Relationship & { toUser: User; fromUser: User })[]>;
  deleteRelationship(fromUserId: number, toUserId: number): Promise<void>;
  checkMutualCrush(userId1: number, userId2: number): Promise<boolean>;
  
  // Post operations
  createPost(authorId: number, content: string, audience: string, mediaUrls?: string[], mediaTypes?: string[], voiceMessageUrl?: string, voiceMessageDuration?: number): Promise<Post>;
  getPosts(limit?: number, userClass?: string): Promise<(Post & { author: User; comments: (Comment & { author: User })[]; likesCount: number; isLikedByUser?: boolean })[]>;
  likePost(postId: number, userId: number): Promise<{ success: boolean; isLiked: boolean }>;
  unlikePost(postId: number, userId: number): Promise<void>;
  
  // Comment operations
  createComment(postId: number, authorId: number, content: string): Promise<Comment>;
  getCommentsByPostId(postId: number): Promise<(Comment & { author: User })[]>;
  
  // Message operations
  createMessage(fromUserId: number, toUserId: number, content: string, voiceMessageUrl?: string, voiceMessageDuration?: number): Promise<Message>;
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
  
  // Loop operations
  createLoop(authorId: number, loopData: InsertLoop): Promise<Loop>;
  getLoops(limit?: number, currentUserId?: number): Promise<(Loop & { author: User; isLiked?: boolean })[]>;
  getPersonalizedLoops(userId: number, limit?: number): Promise<(Loop & { author: User; isLiked?: boolean })[]>;
  likeLoop(loopId: number, userId: number): Promise<{ success: boolean; isLiked: boolean }>;
  viewLoop(loopId: number, userId: number): Promise<void>;
  deleteLoop(loopId: number, userId: number): Promise<void>;
  recordLoopInteraction(userId: number, loopId: number, interactionType: string, durationWatched?: number): Promise<void>;
  updateUserInterests(userId: number): Promise<void>;
  getUserInterests(userId: number): Promise<{ category: string; score: number }[]>;
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

  async updateUserActivity(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.id, userId));
  }

  async isUserOnline(userId: number): Promise<boolean> {
    const user = await db
      .select({ lastActiveAt: users.lastActiveAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user.length || !user[0].lastActiveAt) return false;
    
    // Consider user online if they were active within the last 2 minutes (more strict)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    return user[0].lastActiveAt > twoMinutesAgo;
  }

  async createRelationship(fromUserId: number, toUserId: number, type: string): Promise<Relationship> {
    // Check if a relationship already exists between these users
    const existingRelationship = await db
      .select()
      .from(relationships)
      .where(and(
        eq(relationships.fromUserId, fromUserId),
        eq(relationships.toUserId, toUserId)
      ))
      .limit(1);

    let relationship: Relationship;

    if (existingRelationship.length > 0) {
      // Update existing relationship
      const [updatedRelationship] = await db
        .update(relationships)
        .set({ type })
        .where(and(
          eq(relationships.fromUserId, fromUserId),
          eq(relationships.toUserId, toUserId)
        ))
        .returning();
      relationship = updatedRelationship;
    } else {
      // Create new relationship
      const [newRelationship] = await db
        .insert(relationships)
        .values({ fromUserId, toUserId, type })
        .returning();
      relationship = newRelationship;
    }
    
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

  async deleteRelationship(fromUserId: number, toUserId: number): Promise<void> {
    await db
      .delete(relationships)
      .where(and(
        eq(relationships.fromUserId, fromUserId),
        eq(relationships.toUserId, toUserId)
      ));
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

  async createPost(authorId: number, content: string, audience: string, mediaUrls?: string[], mediaTypes?: string[], voiceMessageUrl?: string, voiceMessageDuration?: number): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values({ 
        authorId, 
        content, 
        audience,
        mediaUrls: mediaUrls || null,
        mediaTypes: mediaTypes || null,
        voiceMessageUrl: voiceMessageUrl || null,
        voiceMessageDuration: voiceMessageDuration || null
      })
      .returning();
    return post;
  }

  async getPosts(limit = 20, userClass?: string, currentUserId?: number): Promise<(Post & { author: User; comments: (Comment & { author: User })[]; likesCount: number; isLikedByUser?: boolean })[]> {
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
    
    // Get posts with authors
    const postsWithAuthors = result.map(row => ({
      ...row.posts,
      author: row.users!,
    }));

    // Get comments and likes for each post
    const postsWithCommentsAndLikes = await Promise.all(
      postsWithAuthors.map(async (post) => {
        const comments = await this.getCommentsByPostId(post.id);
        
        // Get likes count
        const likesCountResult = await db
          .select({ count: count() })
          .from(postLikes)
          .where(eq(postLikes.postId, post.id));
        const likesCount = likesCountResult[0]?.count || 0;
        
        // Check if current user liked this post
        let isLikedByUser = false;
        if (currentUserId) {
          const userLike = await db
            .select()
            .from(postLikes)
            .where(and(eq(postLikes.postId, post.id), eq(postLikes.userId, currentUserId)))
            .limit(1);
          isLikedByUser = userLike.length > 0;
        }
        
        return {
          ...post,
          comments,
          likesCount,
          isLikedByUser,
        };
      })
    );

    return postsWithCommentsAndLikes;
  }

  async likePost(postId: number, userId: number): Promise<{ success: boolean; isLiked: boolean }> {
    // Check if user already liked this post
    const existingLike = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
      .limit(1);
    
    if (existingLike.length > 0) {
      // Unlike the post
      await db
        .delete(postLikes)
        .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
      return { success: true, isLiked: false };
    } else {
      // Like the post
      await db
        .insert(postLikes)
        .values({ postId, userId });
      return { success: true, isLiked: true };
    }
  }

  async unlikePost(postId: number, userId: number): Promise<void> {
    await db
      .delete(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
  }

  async createMessage(fromUserId: number, toUserId: number, content: string, voiceMessageUrl?: string, voiceMessageDuration?: number): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({ 
        fromUserId, 
        toUserId, 
        content,
        voiceMessageUrl: voiceMessageUrl || null,
        voiceMessageDuration: voiceMessageDuration || null
      })
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
      .set({ 
        isRead: true,
        readAt: new Date()
      })
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
          sql`${users.username} ILIKE ${`%${query}%`}`,
          sql`${users.firstName} ILIKE ${`%${query}%`}`,
          sql`${users.lastName} ILIKE ${`%${query}%`}`,
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

  async createComment(postId: number, authorId: number, content: string): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values({ postId, authorId, content })
      .returning();
    return comment;
  }

  async getCommentsByPostId(postId: number): Promise<(Comment & { author: User })[]> {
    const result = await db
      .select()
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(asc(comments.createdAt));
    
    return result.map(row => ({
      ...row.comments,
      author: row.users!,
    }));
  }

  async createLoop(authorId: number, loopData: InsertLoop): Promise<Loop> {
    const [loop] = await db
      .insert(loops)
      .values({
        ...loopData,
        authorId,
      })
      .returning();
    return loop;
  }

  async getLoops(limit = 20, currentUserId?: number): Promise<(Loop & { author: User; isLiked?: boolean })[]> {
    const result = await db
      .select({
        id: loops.id,
        authorId: loops.authorId,
        videoUrl: loops.videoUrl,
        thumbnailUrl: loops.thumbnailUrl,
        description: loops.description,
        songTitle: loops.songTitle,
        songArtist: loops.songArtist,
        songUrl: loops.songUrl,
        songStartTime: loops.songStartTime,
        songDuration: loops.songDuration,
        likes: loops.likes,
        views: loops.views,
        isPublic: loops.isPublic,
        createdAt: loops.createdAt,
        author: {
          id: users.id,
          name: users.name,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
        }
      })
      .from(loops)
      .innerJoin(users, eq(loops.authorId, users.id))
      .where(eq(loops.isPublic, true))
      .orderBy(desc(loops.createdAt))
      .limit(limit);

    // Check if current user liked each loop
    let userLikes: number[] = [];
    if (currentUserId) {
      const likes = await db
        .select({ loopId: loopLikes.loopId })
        .from(loopLikes)
        .where(eq(loopLikes.userId, currentUserId));
      userLikes = likes.map(like => like.loopId);
    }

    return result.map(row => ({
      ...row,
      author: row.author,
      isLiked: currentUserId ? userLikes.includes(row.id) : false,
    }));
  }

  async likeLoop(loopId: number, userId: number): Promise<{ success: boolean; isLiked: boolean }> {
    // Check if already liked
    const existingLike = await db
      .select()
      .from(loopLikes)
      .where(and(eq(loopLikes.loopId, loopId), eq(loopLikes.userId, userId)))
      .limit(1);

    if (existingLike.length > 0) {
      // Unlike
      await db
        .delete(loopLikes)
        .where(and(eq(loopLikes.loopId, loopId), eq(loopLikes.userId, userId)));
      
      // Decrement likes count
      await db
        .update(loops)
        .set({ likes: sql`${loops.likes} - 1` })
        .where(eq(loops.id, loopId));

      return { success: true, isLiked: false };
    } else {
      // Like
      await db
        .insert(loopLikes)
        .values({ loopId, userId });
      
      // Increment likes count
      await db
        .update(loops)
        .set({ likes: sql`${loops.likes} + 1` })
        .where(eq(loops.id, loopId));

      return { success: true, isLiked: true };
    }
  }

  async viewLoop(loopId: number, userId: number): Promise<void> {
    // Check if already viewed
    const existingView = await db
      .select()
      .from(loopViews)
      .where(and(eq(loopViews.loopId, loopId), eq(loopViews.userId, userId)))
      .limit(1);

    if (existingView.length === 0) {
      // Add view
      await db
        .insert(loopViews)
        .values({ loopId, userId });
      
      // Increment views count
      await db
        .update(loops)
        .set({ views: sql`${loops.views} + 1` })
        .where(eq(loops.id, loopId));
    }
  }

  async deleteLoop(loopId: number, userId: number): Promise<void> {
    // First check if the user is the author of the loop
    const loop = await db
      .select()
      .from(loops)
      .where(and(eq(loops.id, loopId), eq(loops.authorId, userId)))
      .limit(1);

    if (loop.length === 0) {
      throw new Error("Loop not found or you don't have permission to delete it");
    }

    // Delete associated likes, views, and interactions first (due to foreign key constraints)
    await db.delete(loopLikes).where(eq(loopLikes.loopId, loopId));
    await db.delete(loopViews).where(eq(loopViews.loopId, loopId));
    await db.delete(loopInteractions).where(eq(loopInteractions.loopId, loopId));
    
    // Delete the loop
    await db.delete(loops).where(eq(loops.id, loopId));
  }

  async getPersonalizedLoops(userId: number, limit = 20): Promise<(Loop & { author: User; isLiked?: boolean })[]> {
    // Get user interests
    const interests = await this.getUserInterests(userId);
    const interestCategories = interests.map(i => i.category);

    // Get loops from followed users/friends
    const friendRelationships = await db
      .select({ toUserId: relationships.toUserId })
      .from(relationships)
      .where(and(eq(relationships.fromUserId, userId), eq(relationships.type, 'friend')));
    
    const friendIds = friendRelationships.map(r => r.toUserId);

    // Get recently viewed loops to avoid showing them again immediately
    const recentlyViewed = await db
      .select({ loopId: loopInteractions.loopId })
      .from(loopInteractions)
      .where(and(
        eq(loopInteractions.userId, userId),
        eq(loopInteractions.interactionType, 'view'),
        gt(loopInteractions.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
      ));
    
    const recentLoopIds = recentlyViewed.map(r => r.loopId);

    let whereConditions = [eq(loops.isPublic, true)];
    
    // Exclude recently viewed loops
    if (recentLoopIds.length > 0) {
      whereConditions.push(sql`${loops.id} NOT IN (${recentLoopIds.join(',')})`);
    }

    // Build the base query
    let query = db
      .select({
        id: loops.id,
        authorId: loops.authorId,
        videoUrl: loops.videoUrl,
        thumbnailUrl: loops.thumbnailUrl,
        description: loops.description,
        songTitle: loops.songTitle,
        songArtist: loops.songArtist,
        songUrl: loops.songUrl,
        songStartTime: loops.songStartTime,
        songDuration: loops.songDuration,
        likes: loops.likes,
        views: loops.views,
        isPublic: loops.isPublic,
        createdAt: loops.createdAt,
        author: {
          id: users.id,
          name: users.name,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
        },
        // Add scoring for personalization
        friendScore: sql<number>`CASE WHEN ${loops.authorId} IN (${friendIds.length > 0 ? friendIds.join(',') : 'NULL'}) THEN 100 ELSE 0 END`,
        interestScore: sql<number>`CASE 
          WHEN ${loops.songTitle} IS NOT NULL OR ${loops.songArtist} IS NOT NULL THEN 
            CASE WHEN 'music' IN (${interestCategories.length > 0 ? interestCategories.map(c => `'${c}'`).join(',') : "''"}) THEN 50 ELSE 0 END
          ELSE 0 
        END`,
        recencyScore: sql<number>`EXTRACT(EPOCH FROM (NOW() - ${loops.createdAt})) / 86400 * -1`, // Negative days for recent content
      })
      .from(loops)
      .innerJoin(users, eq(loops.authorId, users.id))
      .where(and(...whereConditions));

    // Execute query and sort by personalized score
    const result = await query
      .orderBy(sql`(friend_score + interest_score + recency_score + ${loops.likes} + ${loops.views}) DESC`)
      .limit(limit);

    // Check if current user liked each loop
    let userLikes: number[] = [];
    const likes = await db
      .select({ loopId: loopLikes.loopId })
      .from(loopLikes)
      .where(eq(loopLikes.userId, userId));
    userLikes = likes.map(like => like.loopId);

    return result.map(row => ({
      id: row.id,
      authorId: row.authorId,
      videoUrl: row.videoUrl,
      thumbnailUrl: row.thumbnailUrl,
      description: row.description,
      songTitle: row.songTitle,
      songArtist: row.songArtist,
      songUrl: row.songUrl,
      songStartTime: row.songStartTime,
      songDuration: row.songDuration,
      likes: row.likes,
      views: row.views,
      isPublic: row.isPublic,
      createdAt: row.createdAt,
      author: row.author,
      isLiked: userLikes.includes(row.id),
    }));
  }

  async recordLoopInteraction(userId: number, loopId: number, interactionType: string, durationWatched = 0): Promise<void> {
    await db
      .insert(loopInteractions)
      .values({
        userId,
        loopId,
        interactionType,
        durationWatched,
      });

    // Update user interests based on interaction
    if (interactionType === 'like' || interactionType === 'watch_complete') {
      await this.updateUserInterests(userId);
    }
  }

  async updateUserInterests(userId: number): Promise<void> {
    // Analyze user's recent interactions to update interests
    const recentInteractions = await db
      .select({
        loopId: loopInteractions.loopId,
        interactionType: loopInteractions.interactionType,
        durationWatched: loopInteractions.durationWatched,
        songTitle: loops.songTitle,
        songArtist: loops.songArtist,
        description: loops.description,
      })
      .from(loopInteractions)
      .innerJoin(loops, eq(loopInteractions.loopId, loops.id))
      .where(and(
        eq(loopInteractions.userId, userId),
        gt(loopInteractions.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
      ));

    // Calculate interest scores
    const interestScores: { [category: string]: number } = {};

    for (const interaction of recentInteractions) {
      let score = 0;
      
      // Base scoring by interaction type
      switch (interaction.interactionType) {
        case 'like': score = 10; break;
        case 'watch_complete': score = 8; break;
        case 'view': score = 3; break;
        case 'share': score = 15; break;
        case 'skip': score = -2; break;
      }

      // If it's a music-related loop
      if (interaction.songTitle || interaction.songArtist) {
        interestScores['music'] = (interestScores['music'] || 0) + score;
      }

      // Analyze description for content categories
      if (interaction.description) {
        const desc = interaction.description.toLowerCase();
        
        // Simple keyword-based categorization
        if (desc.includes('dance') || desc.includes('dancing')) {
          interestScores['dance'] = (interestScores['dance'] || 0) + score;
        }
        if (desc.includes('comedy') || desc.includes('funny') || desc.includes('humor')) {
          interestScores['comedy'] = (interestScores['comedy'] || 0) + score;
        }
        if (desc.includes('art') || desc.includes('creative') || desc.includes('design')) {
          interestScores['art'] = (interestScores['art'] || 0) + score;
        }
        if (desc.includes('food') || desc.includes('cooking') || desc.includes('recipe')) {
          interestScores['food'] = (interestScores['food'] || 0) + score;
        }
        if (desc.includes('travel') || desc.includes('adventure') || desc.includes('explore')) {
          interestScores['travel'] = (interestScores['travel'] || 0) + score;
        }
      }
    }

    // Update or insert user interests
    for (const [category, score] of Object.entries(interestScores)) {
      if (score > 0) {
        await db
          .insert(userInterests)
          .values({
            userId,
            category,
            score: Math.round(score * 100), // Store as integer (score * 100)
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [userInterests.userId, userInterests.category],
            set: {
              score: sql`${userInterests.score} + ${Math.round(score * 100)}`,
              updatedAt: new Date(),
            },
          });
      }
    }
  }

  async getUserInterests(userId: number): Promise<{ category: string; score: number }[]> {
    const interests = await db
      .select({
        category: userInterests.category,
        score: userInterests.score,
      })
      .from(userInterests)
      .where(eq(userInterests.userId, userId))
      .orderBy(desc(userInterests.score));

    return interests.map(interest => ({
      category: interest.category,
      score: (interest.score || 0) / 100, // Convert back to decimal
    }));
  }
}

export const storage = new DatabaseStorage();
