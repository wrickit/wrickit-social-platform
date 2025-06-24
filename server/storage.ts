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
  hashtags,
  postHashtags,
  messageHashtags,
  postMentions,
  messageMentions,
  loops,
  loopLikes,
  loopViews,
  userInterests,
  loopInteractions,
  userSessions,
  userActivityLogs,
  dailyUserStats,
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
  type InsertLoop,
  type Hashtag,
  type UserSession,
  type UserActivityLog,
  type DailyUserStats,
  type PublicUser
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql, inArray, count, gt, lt, asc, ilike } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByName(name: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createDevUser(name: string, userClass: string, password: string): Promise<User>;
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
  getPosts(limit?: number, userClass?: string): Promise<(Post & { author: { id: number; name: string; username: string; profileImageUrl: string | null; }; comments: (Comment & { author: { id: number; name: string; username: string; profileImageUrl: string | null; } })[]; likesCount: number; isLikedByUser?: boolean })[]>;
  likePost(postId: number, userId: number): Promise<{ success: boolean; isLiked: boolean }>;
  unlikePost(postId: number, userId: number): Promise<void>;
  
  // Comment operations
  createComment(postId: number, authorId: number, content: string): Promise<Comment>;
  getCommentsByPostId(postId: number): Promise<(Comment & { author: { id: number; name: string; username: string; profileImageUrl: string | null; } })[]>;
  
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
  

  
  // Loop operations
  createLoop(authorId: number, loopData: InsertLoop): Promise<Loop>;
  getLoops(limit?: number, currentUserId?: number): Promise<(Loop & { author: { id: number; name: string; username: string; profileImageUrl: string | null; }; isLiked?: boolean })[]>;
  getPersonalizedLoops(userId: number, limit?: number): Promise<(Loop & { author: { id: number; name: string; username: string; profileImageUrl: string | null; }; isLiked?: boolean })[]>;
  likeLoop(loopId: number, userId: number): Promise<{ success: boolean; isLiked: boolean }>;
  viewLoop(loopId: number, userId: number): Promise<void>;
  deleteLoop(loopId: number, userId: number): Promise<void>;
  recordLoopInteraction(userId: number, loopId: number, interactionType: string, durationWatched?: number): Promise<void>;
  updateUserInterests(userId: number): Promise<void>;
  getUserInterests(userId: number): Promise<{ category: string; score: number }[]>;
  
  // Hashtag operations
  processHashtags(content: string, postId?: number, messageId?: number): Promise<void>;
  getHashtagsByName(names: string[]): Promise<Hashtag[]>;
  searchHashtags(query: string): Promise<Hashtag[]>;
  
  // Mention operations
  processMentions(content: string, postId?: number, messageId?: number): Promise<void>;
  getUsersByUsername(usernames: string[]): Promise<User[]>;
  
  // Search operations
  searchPosts(query: string, type?: string): Promise<(Post & { author: { id: number; name: string; username: string; profileImageUrl: string | null; }; comments: (Comment & { author: { id: number; name: string; username: string; profileImageUrl: string | null; } })[]; likesCount: number })[]>;
  
  // Analytics operations
  getUserAnalytics(userId: number): Promise<{
    avgDailyTimeMinutes: number;
    avgSessionTimeMinutes: number;
    activityBreakdown: { activityType: string; count: number; percentage: number }[];
  }>;
  getActiveUsersByHour(): Promise<{ hour: number; activeUsers: number }[]>;
  getTotalUsersCount(): Promise<number>;
  getActiveUsersToday(): Promise<number>;
  getNewUsersLast7Days(): Promise<{ date: string; count: number }[]>;
  getMostActiveUsers(limit?: number): Promise<(User & { totalTimeMinutes: number; sessionsCount: number })[]>;
  startUserSession(userId: number, ipAddress?: string, userAgent?: string): Promise<UserSession>;
  endUserSession(sessionId: number): Promise<void>;
  logUserActivity(userId: number, sessionId: number, activityType: string, actionType: string, targetId?: number, durationSeconds?: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
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

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByName(name: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.name, name));
    return user || undefined;
  }

  async createDevUser(name: string, userClass: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [user] = await db
      .insert(users)
      .values({ 
        username: name.toLowerCase().replace(/\s+/g, ''),
        password: hashedPassword,
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || '',
        name,
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
    
    // Process hashtags and mentions
    await this.processHashtags(content, post.id);
    await this.processMentions(content, post.id, undefined, authorId);
    
    return post;
  }

  async getPosts(limit = 20, userClass?: string, currentUserId?: number): Promise<(Post & { author: PublicUser; comments: (Comment & { author: PublicUser })[]; likesCount: number; isLikedByUser?: boolean })[]> {
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
      author: {
        id: row.users!.id,
        name: row.users!.name,
        username: row.users!.username,
        profileImageUrl: row.users!.profileImageUrl,
      },
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
    
    // Process hashtags and mentions in messages
    await this.processHashtags(content, undefined, message.id);
    await this.processMentions(content, undefined, message.id, fromUserId);
    
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
          ilike(users.name, `%${query}%`),
          ilike(users.username, `%${query}%`),
          ilike(users.firstName, `%${query}%`),
          ilike(users.lastName, `%${query}%`)
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



  async createComment(postId: number, authorId: number, content: string): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values({ postId, authorId, content })
      .returning();
    return comment;
  }

  async getCommentsByPostId(postId: number): Promise<(Comment & { author: PublicUser })[]> {
    const result = await db
      .select()
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(asc(comments.createdAt));
    
    return result.map(row => ({
      ...row.comments,
      author: {
        id: row.users!.id,
        name: row.users!.name,
        username: row.users!.username,
        profileImageUrl: row.users!.profileImageUrl,
      },
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

  async getLoops(limit = 20, currentUserId?: number): Promise<(Loop & { author: PublicUser; isLiked?: boolean })[]> {
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

  async getPersonalizedLoops(userId: number, limit = 20): Promise<(Loop & { author: PublicUser; isLiked?: boolean })[]> {
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

  // Hashtag operations
  async processHashtags(content: string, postId?: number, messageId?: number): Promise<void> {
    const hashtagMatches = content.match(/#(\w+)/g);
    if (!hashtagMatches) return;

    for (const match of hashtagMatches) {
      const hashtagName = match.slice(1).toLowerCase(); // Remove # and convert to lowercase
      
      // Find or create hashtag
      let hashtag = await db.select().from(hashtags).where(eq(hashtags.name, hashtagName)).limit(1);
      
      if (hashtag.length === 0) {
        // Create new hashtag
        const [newHashtag] = await db.insert(hashtags).values({
          name: hashtagName,
          usageCount: 1
        }).returning();
        hashtag = [newHashtag];
      } else {
        // Update usage count
        await db.update(hashtags)
          .set({ 
            usageCount: (hashtag[0].usageCount || 0) + 1,
            updatedAt: new Date()
          })
          .where(eq(hashtags.id, hashtag[0].id));
      }

      // Link hashtag to post or message
      if (postId) {
        try {
          await db.insert(postHashtags).values({
            postId,
            hashtagId: hashtag[0].id
          });
        } catch (error) {
          // Ignore duplicate key errors
        }
      } else if (messageId) {
        await db.insert(messageHashtags).values({
          messageId,
          hashtagId: hashtag[0].id
        }).onConflictDoNothing();
      }
    }
  }

  async getHashtagsByName(names: string[]): Promise<Hashtag[]> {
    if (names.length === 0) return [];
    const lowerNames = names.map(name => name.toLowerCase());
    return await db.select().from(hashtags).where(inArray(hashtags.name, lowerNames));
  }

  async searchHashtags(query: string): Promise<Hashtag[]> {
    return await db.select().from(hashtags)
      .where(ilike(hashtags.name, `%${query.toLowerCase()}%`))
      .orderBy(desc(hashtags.usageCount))
      .limit(20);
  }

  // Mention operations
  async processMentions(content: string, postId?: number, messageId?: number, authorId?: number): Promise<void> {
    const mentionMatches = content.match(/@(\w+)/g);
    if (!mentionMatches) return;

    // Get author information for better notification messages
    let author: User | undefined;
    if (authorId) {
      author = await this.getUser(authorId);
    }

    for (const match of mentionMatches) {
      const username = match.slice(1); // Remove @
      
      // Find user by username
      const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
      
      if (user && user.id !== authorId) { // Don't notify if user mentions themselves
        // Link mention to post or message
        if (postId) {
          await db.insert(postMentions).values({
            postId,
            mentionedUserId: user.id
          }).onConflictDoNothing();
          
          // Create notification for mentioned user with author context
          const authorName = author?.name || author?.firstName || 'Someone';
          await this.createNotification(
            user.id,
            'mention',
            `${authorName} mentioned you in a post`,
            postId
          );
        } else if (messageId) {
          await db.insert(messageMentions).values({
            messageId,
            mentionedUserId: user.id
          }).onConflictDoNothing();
          
          // Create notification for mentioned user with author context
          const authorName = author?.name || author?.firstName || 'Someone';
          await this.createNotification(
            user.id,
            'mention',
            `${authorName} mentioned you in a message`,
            messageId
          );
        }
      }
    }
  }

  async getUsersByUsername(usernames: string[]): Promise<User[]> {
    if (usernames.length === 0) return [];
    return await db.select().from(users).where(inArray(users.username, usernames));
  }

  // Search operations
  async searchPosts(query: string, type?: string): Promise<(Post & { author: PublicUser; comments: (Comment & { author: PublicUser })[]; likesCount: number })[]> {
    let searchCondition;

    if (type === 'hashtags') {
      // Search by hashtag
      const hashtagName = query.startsWith('#') ? query.slice(1) : query;
      const hashtagResults = await db
        .select({ postId: postHashtags.postId })
        .from(postHashtags)
        .innerJoin(hashtags, eq(postHashtags.hashtagId, hashtags.id))
        .where(ilike(hashtags.name, `%${hashtagName.toLowerCase()}%`));
      
      const postIds = hashtagResults.map(r => r.postId);
      if (postIds.length === 0) return [];
      
      searchCondition = inArray(posts.id, postIds);
    } else if (type === 'mentions') {
      // Search by mention
      const username = query.startsWith('@') ? query.slice(1) : query;
      const mentionResults = await db
        .select({ postId: postMentions.postId })
        .from(postMentions)
        .innerJoin(users, eq(postMentions.mentionedUserId, users.id))
        .where(ilike(users.username, `%${username}%`));
      
      const postIds = mentionResults.map(r => r.postId);
      if (postIds.length === 0) return [];
      
      searchCondition = inArray(posts.id, postIds);
    } else {
      // Search in content
      searchCondition = ilike(posts.content, `%${query}%`);
    }

    const postsData = await db
      .select({
        post: posts,
        author: {
          id: users.id,
          name: users.name,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(searchCondition)
      .orderBy(desc(posts.createdAt))
      .limit(50);

    const result = [];
    for (const item of postsData) {
      const postComments = await db
        .select({
          comment: comments,
          author: {
            id: users.id,
            name: users.name,
            username: users.username,
            profileImageUrl: users.profileImageUrl,
          },
        })
        .from(comments)
        .innerJoin(users, eq(comments.authorId, users.id))
        .where(eq(comments.postId, item.post.id))
        .orderBy(comments.createdAt);

      const likesCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(postLikes)
        .where(eq(postLikes.postId, item.post.id));

      result.push({
        ...item.post,
        author: item.author,
        comments: postComments.map((c: any) => ({ 
          ...c.comment, 
          author: {
            id: c.author.id,
            name: c.author.name,
            username: c.author.username,
            profileImageUrl: c.author.profileImageUrl,
          }
        })),
        likesCount: likesCount[0]?.count || 0,
      });
    }

    return result;
  }

  // Analytics methods
  async getUserAnalytics(userId: number): Promise<{
    avgDailyTimeMinutes: number;
    avgSessionTimeMinutes: number;
    activityBreakdown: { activityType: string; count: number; percentage: number }[];
  }> {
    // Get average daily time from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [avgDaily] = await db
      .select({ avgTime: sql<number>`AVG(total_time_minutes)` })
      .from(dailyUserStats)
      .where(and(
        eq(dailyUserStats.userId, userId),
        gt(dailyUserStats.date, thirtyDaysAgo)
      ));

    // Get average session time
    const [avgSession] = await db
      .select({ avgDuration: sql<number>`AVG(duration_minutes)` })
      .from(userSessions)
      .where(and(
        eq(userSessions.userId, userId),
        gt(userSessions.sessionStart, thirtyDaysAgo)
      ));

    // Get activity breakdown
    const activities = await db
      .select({
        activityType: userActivityLogs.activityType,
        count: count()
      })
      .from(userActivityLogs)
      .where(and(
        eq(userActivityLogs.userId, userId),
        gt(userActivityLogs.createdAt, thirtyDaysAgo)
      ))
      .groupBy(userActivityLogs.activityType)
      .orderBy(desc(count()));

    const totalActivities = activities.reduce((sum, activity) => sum + Number(activity.count), 0);
    const activityBreakdown = activities.map(activity => ({
      activityType: activity.activityType,
      count: Number(activity.count),
      percentage: totalActivities > 0 ? Math.round((Number(activity.count) / totalActivities) * 100) : 0
    }));

    return {
      avgDailyTimeMinutes: avgDaily?.avgTime || 0,
      avgSessionTimeMinutes: avgSession?.avgDuration || 0,
      activityBreakdown
    };
  }

  async getActiveUsersByHour(): Promise<{ hour: number; activeUsers: number }[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hourlyData = await db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM session_start)`,
        activeUsers: sql<number>`COUNT(DISTINCT user_id)`
      })
      .from(userSessions)
      .where(gt(userSessions.sessionStart, today))
      .groupBy(sql`EXTRACT(HOUR FROM session_start)`)
      .orderBy(sql`EXTRACT(HOUR FROM session_start)`);

    // Fill in missing hours with 0
    const result = [];
    for (let hour = 0; hour < 24; hour++) {
      const found = hourlyData.find(data => Number(data.hour) === hour);
      result.push({
        hour,
        activeUsers: found ? Number(found.activeUsers) : 0
      });
    }

    return result;
  }

  async getTotalUsersCount(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(users);
    return Number(result.count);
  }

  async getActiveUsersToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [result] = await db
      .select({ count: sql<number>`COUNT(DISTINCT user_id)` })
      .from(userSessions)
      .where(gt(userSessions.sessionStart, today));

    return Number(result.count);
  }

  async getNewUsersLast7Days(): Promise<{ date: string; count: number }[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newUsers = await db
      .select({
        date: sql<string>`DATE(created_at)`,
        count: count()
      })
      .from(users)
      .where(gt(users.createdAt, sevenDaysAgo))
      .groupBy(sql`DATE(created_at)`)
      .orderBy(sql`DATE(created_at)`);

    return newUsers.map(user => ({
      date: user.date,
      count: Number(user.count)
    }));
  }

  async getMostActiveUsers(limit = 10): Promise<(User & { totalTimeMinutes: number; sessionsCount: number })[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = await db
      .select({
        user: users,
        totalTimeMinutes: sql<number>`COALESCE(SUM(total_time_minutes), 0)`,
        sessionsCount: sql<number>`COALESCE(SUM(sessions_count), 0)`
      })
      .from(users)
      .leftJoin(dailyUserStats, eq(users.id, dailyUserStats.userId))
      .where(or(
        gt(dailyUserStats.date, thirtyDaysAgo),
        eq(dailyUserStats.date, sql`NULL`)
      ))
      .groupBy(users.id)
      .orderBy(desc(sql`COALESCE(SUM(total_time_minutes), 0)`))
      .limit(limit);

    return activeUsers.map(result => ({
      ...result.user,
      totalTimeMinutes: Number(result.totalTimeMinutes),
      sessionsCount: Number(result.sessionsCount)
    }));
  }

  async startUserSession(userId: number, ipAddress?: string, userAgent?: string): Promise<UserSession> {
    const [session] = await db
      .insert(userSessions)
      .values({
        userId,
        ipAddress,
        userAgent,
        sessionStart: new Date()
      })
      .returning();

    return session;
  }

  async endUserSession(sessionId: number): Promise<void> {
    const sessionEnd = new Date();
    
    // Get session start time
    const [session] = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.id, sessionId));

    if (session && session.sessionStart) {
      const durationMinutes = Math.round((sessionEnd.getTime() - session.sessionStart.getTime()) / (1000 * 60));
      
      await db
        .update(userSessions)
        .set({
          sessionEnd,
          durationMinutes
        })
        .where(eq(userSessions.id, sessionId));

      // Update daily stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [existingStats] = await db
        .select()
        .from(dailyUserStats)
        .where(and(
          eq(dailyUserStats.userId, session.userId),
          eq(dailyUserStats.date, today)
        ));

      if (existingStats) {
        await db
          .update(dailyUserStats)
          .set({
            totalTimeMinutes: (existingStats.totalTimeMinutes || 0) + durationMinutes,
            sessionsCount: (existingStats.sessionsCount || 0) + 1
          })
          .where(eq(dailyUserStats.id, existingStats.id));
      } else {
        await db
          .insert(dailyUserStats)
          .values({
            userId: session.userId,
            date: today,
            totalTimeMinutes: durationMinutes,
            sessionsCount: 1
          });
      }
    }
  }

  async logUserActivity(userId: number, sessionId: number, activityType: string, actionType: string, targetId?: number, durationSeconds = 0): Promise<void> {
    await db
      .insert(userActivityLogs)
      .values({
        userId,
        sessionId,
        activityType,
        actionType,
        targetId,
        durationSeconds
      });

    // Update daily stats for activity counts
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [existingStats] = await db
      .select()
      .from(dailyUserStats)
      .where(and(
        eq(dailyUserStats.userId, userId),
        eq(dailyUserStats.date, today)
      ));

    if (existingStats) {
      const updateData: any = {};
      
      switch (activityType) {
        case 'messages':
          if (actionType === 'create') updateData.messagesCount = (existingStats.messagesCount || 0) + 1;
          break;
        case 'posts':
          if (actionType === 'create') updateData.postsCount = (existingStats.postsCount || 0) + 1;
          break;
        case 'loops':
          if (actionType === 'create') updateData.loopsCount = (existingStats.loopsCount || 0) + 1;
          break;
        case 'relationships':
          if (actionType === 'create') updateData.relationshipsCount = (existingStats.relationshipsCount || 0) + 1;
          break;
      }

      if (Object.keys(updateData).length > 0) {
        await db
          .update(dailyUserStats)
          .set(updateData)
          .where(eq(dailyUserStats.id, existingStats.id));
      }
    }
  }
}

export const storage = new DatabaseStorage();
