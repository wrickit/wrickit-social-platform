import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  admissionNumber: varchar("admission_number", { length: 20 }).notNull().unique(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  name: text("name").notNull(), // Full name for backward compatibility
  email: text("email").notNull(),
  class: varchar("class", { length: 10 }).notNull(), // e.g., "9A", "9B"
  division: varchar("division", { length: 5 }).notNull(), // e.g., "A", "B"
  profileImageUrl: text("profile_image_url"),
  bio: text("bio"),
  securityQuestion: text("security_question"),
  securityAnswer: text("security_answer"),
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

export const emailVerifications = pgTable("email_verifications", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  isUsed: boolean("is_used").default(false),
  expiresAt: timestamp("expires_at").notNull(),
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

// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  admissionNumber: true,
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
  class: true,
  division: true,
}).extend({
  name: z.string().optional(), // Will be auto-generated from firstName + lastName
  verificationCode: z.string().optional(), // For email verification during registration
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
  email: z.string().email().optional(),
  bio: z.string().optional(),
  profileImageUrl: z.string().optional(),
  securityQuestion: z.string().optional(),
  securityAnswer: z.string().optional(),
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

export const emailVerificationSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export const sendVerificationSchema = z.object({
  email: z.string().email(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type SearchUser = z.infer<typeof searchUserSchema>;
export type EmailVerification = z.infer<typeof emailVerificationSchema>;
export type SendVerification = z.infer<typeof sendVerificationSchema>;
export type User = typeof users.$inferSelect;
export type Relationship = typeof relationships.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type FriendGroup = typeof friendGroups.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type DevRegisterData = z.infer<typeof devRegisterSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
