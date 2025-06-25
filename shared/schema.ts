import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  name: text("name").notNull(), // Full name for backward compatibility
  class: varchar("class", { length: 10 }).notNull(), // e.g., "9A", "9B"
  division: varchar("division", { length: 5 }).notNull(), // e.g., "A", "B"
  profileImageUrl: text("profile_image_url"),
  bio: text("bio"),
  securityQuestion: text("security_question"),
  securityAnswer: text("security_answer"),
  hasCompletedTutorial: boolean("has_completed_tutorial").default(false),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const relationships = pgTable("relationships", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  toUserId: integer("to_user_id").notNull().references(() => users.id),
  type: varchar("type", { length: 20 }).notNull(), // 'best_friend', 'friend', 'acquaintance', 'crush'
  createdAt: timestamp("created_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  audience: varchar("audience", { length: 10 }).notNull(), // 'class' or 'grade'
  likes: integer("likes").default(0),
  mediaUrls: text("media_urls").array(), // Array of image/video URLs
  mediaTypes: text("media_types").array(), // Array of media types (image/video/audio)
  voiceMessageUrl: text("voice_message_url"), // Voice message audio URL
  voiceMessageDuration: integer("voice_message_duration"), // Duration in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  toUserId: integer("to_user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"), // When the message was read
  voiceMessageUrl: text("voice_message_url"), // Voice message audio URL
  voiceMessageDuration: integer("voice_message_duration"), // Duration in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupMessages = pgTable("group_messages", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  groupId: integer("group_id").notNull().references(() => friendGroups.id),
  content: text("content").notNull(),
  voiceMessageUrl: text("voice_message_url"), // Voice message audio URL
  voiceMessageDuration: integer("voice_message_duration"), // Duration in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const friendGroups = pgTable("friend_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const friendGroupMembers = pgTable("friend_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => friendGroups.id),
  userId: integer("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const groupMessageReads = pgTable("group_message_reads", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => groupMessages.id),
  userId: integer("user_id").notNull().references(() => users.id),
  readAt: timestamp("read_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(), // 'mutual_crush', 'friend_group_created'
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  relatedUserId: integer("related_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const disciplinaryActions = pgTable("disciplinary_actions", {
  id: serial("id").primaryKey(),
  reportedUserId: integer("reported_user_id").notNull().references(() => users.id),
  reporterUserId: integer("reporter_user_id").notNull().references(() => users.id),
  reason: varchar("reason", { length: 100 }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  votes: integer("votes").default(0),
  isAnonymous: boolean("is_anonymous").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const disciplinaryVotes = pgTable("disciplinary_votes", {
  id: serial("id").primaryKey(),
  actionId: integer("action_id").notNull().references(() => disciplinaryActions.id),
  voterId: integer("voter_id").notNull().references(() => users.id),
  vote: varchar("vote", { length: 10 }).notNull(), // 'support', 'oppose'
  createdAt: timestamp("created_at").defaultNow(),
});



export const loops = pgTable("loops", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull().references(() => users.id),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  description: text("description"),
  songTitle: text("song_title"),
  songArtist: text("song_artist"),
  songUrl: text("song_url"),
  songStartTime: integer("song_start_time").default(0),
  songDuration: integer("song_duration").default(30),
  likes: integer("likes").default(0),
  views: integer("views").default(0),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const loopLikes = pgTable("loop_likes", {
  id: serial("id").primaryKey(),
  loopId: integer("loop_id").notNull().references(() => loops.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const loopViews = pgTable("loop_views", {
  id: serial("id").primaryKey(),
  loopId: integer("loop_id").notNull().references(() => loops.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userInterests = pgTable("user_interests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  category: text("category").notNull(),
  score: integer("score").default(1), // Using integer for simplicity (multiply by 100 for decimals)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const loopInteractions = pgTable("loop_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  loopId: integer("loop_id").notNull().references(() => loops.id),
  interactionType: text("interaction_type").notNull(), // 'view', 'like', 'share', 'skip', 'watch_complete'
  durationWatched: integer("duration_watched").default(0), // in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const hashtags = pgTable("hashtags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // hashtag without the #
  usageCount: integer("usage_count").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const postHashtags = pgTable("post_hashtags", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  hashtagId: integer("hashtag_id").notNull().references(() => hashtags.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messageHashtags = pgTable("message_hashtags", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  hashtagId: integer("hashtag_id").notNull().references(() => hashtags.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const postMentions = pgTable("post_mentions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  mentionedUserId: integer("mentioned_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messageMentions = pgTable("message_mentions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  mentionedUserId: integer("mentioned_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Sessions and Activity Tracking
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  sessionStart: timestamp("session_start").defaultNow(),
  sessionEnd: timestamp("session_end"),
  durationMinutes: integer("duration_minutes").default(0),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userActivityLogs = pgTable("user_activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  sessionId: integer("session_id").references(() => userSessions.id),
  activityType: varchar("activity_type", { length: 50 }).notNull(), // 'messages', 'posts', 'loops', 'relationships', 'profile', 'dashboard'
  actionType: varchar("action_type", { length: 50 }).notNull(), // 'view', 'create', 'edit', 'delete', 'like', 'comment'
  targetId: integer("target_id"), // ID of the target resource (post, message, etc.)
  durationSeconds: integer("duration_seconds").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyUserStats = pgTable("daily_user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  totalTimeMinutes: integer("total_time_minutes").default(0),
  sessionsCount: integer("sessions_count").default(0),
  messagesCount: integer("messages_count").default(0),
  postsCount: integer("posts_count").default(0),
  loopsCount: integer("loops_count").default(0),
  relationshipsCount: integer("relationships_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sentRelationships: many(relationships, { relationName: "fromUser" }),
  receivedRelationships: many(relationships, { relationName: "toUser" }),
  posts: many(posts),
  sentMessages: many(messages, { relationName: "fromUser" }),
  receivedMessages: many(messages, { relationName: "toUser" }),
  friendGroupMemberships: many(friendGroupMembers),
  notifications: many(notifications),
}));

export const relationshipsRelations = relations(relationships, ({ one }) => ({
  fromUser: one(users, {
    fields: [relationships.fromUserId],
    references: [users.id],
    relationName: "fromUser",
  }),
  toUser: one(users, {
    fields: [relationships.toUserId],
    references: [users.id],
    relationName: "toUser",
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  fromUser: one(users, {
    fields: [messages.fromUserId],
    references: [users.id],
    relationName: "fromUser",
  }),
  toUser: one(users, {
    fields: [messages.toUserId],
    references: [users.id],
    relationName: "toUser",
  }),
}));

export const friendGroupsRelations = relations(friendGroups, ({ many }) => ({
  members: many(friendGroupMembers),
  messages: many(groupMessages),
}));

export const friendGroupMembersRelations = relations(friendGroupMembers, ({ one }) => ({
  group: one(friendGroups, {
    fields: [friendGroupMembers.groupId],
    references: [friendGroups.id],
  }),
  user: one(users, {
    fields: [friendGroupMembers.userId],
    references: [users.id],
  }),
}));

export const groupMessagesRelations = relations(groupMessages, ({ one, many }) => ({
  fromUser: one(users, {
    fields: [groupMessages.fromUserId],
    references: [users.id],
  }),
  group: one(friendGroups, {
    fields: [groupMessages.groupId],
    references: [friendGroups.id],
  }),
  reads: many(groupMessageReads),
}));

export const groupMessageReadsRelations = relations(groupMessageReads, ({ one }) => ({
  message: one(groupMessages, {
    fields: [groupMessageReads.messageId],
    references: [groupMessages.id],
  }),
  user: one(users, {
    fields: [groupMessageReads.userId],
    references: [users.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, {
    fields: [postLikes.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postLikes.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  relatedUser: one(users, {
    fields: [notifications.relatedUserId],
    references: [users.id],
  }),
}));

export const loopsRelations = relations(loops, ({ one, many }) => ({
  author: one(users, {
    fields: [loops.authorId],
    references: [users.id],
  }),
  likes: many(loopLikes),
  views: many(loopViews),
}));

export const loopLikesRelations = relations(loopLikes, ({ one }) => ({
  loop: one(loops, {
    fields: [loopLikes.loopId],
    references: [loops.id],
  }),
  user: one(users, {
    fields: [loopLikes.userId],
    references: [users.id],
  }),
}));

export const loopViewsRelations = relations(loopViews, ({ one }) => ({
  loop: one(loops, {
    fields: [loopViews.loopId],
    references: [loops.id],
  }),
  user: one(users, {
    fields: [loopViews.userId],
    references: [users.id],
  }),
}));

export const userInterestsRelations = relations(userInterests, ({ one }) => ({
  user: one(users, {
    fields: [userInterests.userId],
    references: [users.id],
  }),
}));

export const loopInteractionsRelations = relations(loopInteractions, ({ one }) => ({
  user: one(users, {
    fields: [loopInteractions.userId],
    references: [users.id],
  }),
  loop: one(loops, {
    fields: [loopInteractions.loopId],
    references: [loops.id],
  }),
}));

export const hashtagsRelations = relations(hashtags, ({ many }) => ({
  postHashtags: many(postHashtags),
  messageHashtags: many(messageHashtags),
}));

export const postHashtagsRelations = relations(postHashtags, ({ one }) => ({
  post: one(posts, {
    fields: [postHashtags.postId],
    references: [posts.id],
  }),
  hashtag: one(hashtags, {
    fields: [postHashtags.hashtagId],
    references: [hashtags.id],
  }),
}));

export const messageHashtagsRelations = relations(messageHashtags, ({ one }) => ({
  message: one(messages, {
    fields: [messageHashtags.messageId],
    references: [messages.id],
  }),
  hashtag: one(hashtags, {
    fields: [messageHashtags.hashtagId],
    references: [hashtags.id],
  }),
}));

export const postMentionsRelations = relations(postMentions, ({ one }) => ({
  post: one(posts, {
    fields: [postMentions.postId],
    references: [posts.id],
  }),
  mentionedUser: one(users, {
    fields: [postMentions.mentionedUserId],
    references: [users.id],
  }),
}));

export const messageMentionsRelations = relations(messageMentions, ({ one }) => ({
  message: one(messages, {
    fields: [messageMentions.messageId],
    references: [messages.id],
  }),
  mentionedUser: one(users, {
    fields: [messageMentions.mentionedUserId],
    references: [users.id],
  }),
}));

export const userSessionsRelations = relations(userSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
  activities: many(userActivityLogs),
}));

export const userActivityLogsRelations = relations(userActivityLogs, ({ one }) => ({
  user: one(users, {
    fields: [userActivityLogs.userId],
    references: [users.id],
  }),
  session: one(userSessions, {
    fields: [userActivityLogs.sessionId],
    references: [userSessions.id],
  }),
}));

export const dailyUserStatsRelations = relations(dailyUserStats, ({ one }) => ({
  user: one(users, {
    fields: [dailyUserStats.userId],
    references: [users.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  class: true,
  division: true,
}).extend({
  name: z.string().optional(), // Will be auto-generated from firstName + lastName
});

export const loginSchema = z.object({
  name: z.string().min(1),
  password: z.string().min(1),
});

export const devRegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  class: z.string().min(1, "Class is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  bio: z.string().optional(),
  profileImageUrl: z.string().optional(),
  securityQuestion: z.string().optional(),
  securityAnswer: z.string().optional(),
  hasCompletedTutorial: z.boolean().optional(),
});

export const securityQuestionSchema = z.object({
  securityQuestion: z.string().min(1, "Security question is required"),
  securityAnswer: z.string().min(1, "Security answer is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export const searchUserSchema = z.object({
  username: z.string().min(1),
});

export const insertRelationshipSchema = createInsertSchema(relationships).pick({
  toUserId: true,
  type: true,
});

export const insertPostSchema = createInsertSchema(posts).pick({
  content: true,
  audience: true,
  mediaUrls: true,
  mediaTypes: true,
  voiceMessageUrl: true,
  voiceMessageDuration: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  postId: true,
  content: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  toUserId: true,
  content: true,
  voiceMessageUrl: true,
  voiceMessageDuration: true,
});

export const insertGroupMessageSchema = createInsertSchema(groupMessages).pick({
  groupId: true,
  content: true,
  voiceMessageUrl: true,
  voiceMessageDuration: true,
});

export const insertLoopSchema = createInsertSchema(loops).pick({
  videoUrl: true,
  thumbnailUrl: true,
  description: true,
  songTitle: true,
  songArtist: true,
  songUrl: true,
  songStartTime: true,
  songDuration: true,
  isPublic: true,
});

export const searchSchema = z.object({
  query: z.string().min(1),
  type: z.enum(['all', 'hashtags', 'mentions', 'content']).optional().default('all'),
});



// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type SearchUser = z.infer<typeof searchUserSchema>;
export type User = typeof users.$inferSelect;
export type Relationship = typeof relationships.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type GroupMessage = typeof groupMessages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertGroupMessage = z.infer<typeof insertGroupMessageSchema>;
export type FriendGroup = typeof friendGroups.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type DevRegisterData = z.infer<typeof devRegisterSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertLoop = z.infer<typeof insertLoopSchema>;
export type Loop = typeof loops.$inferSelect;
export type Hashtag = typeof hashtags.$inferSelect;
export type PostHashtag = typeof postHashtags.$inferSelect;
export type MessageHashtag = typeof messageHashtags.$inferSelect;
export type PostMention = typeof postMentions.$inferSelect;
export type MessageMention = typeof messageMentions.$inferSelect;
export type SearchQuery = z.infer<typeof searchSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type UserActivityLog = typeof userActivityLogs.$inferSelect;
export type DailyUserStats = typeof dailyUserStats.$inferSelect;

// Partial user type for public display
export type PublicUser = {
  id: number;
  name: string;
  username: string;
  profileImageUrl: string | null;
};
