import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  admissionNumber: varchar("admission_number", { length: 20 }).notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  profileImageUrl: text("profile_image_url"),
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
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  toUserId: integer("to_user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const friendGroups = pgTable("friend_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
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

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
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
  password: true,
  name: true,
  email: true,
});

export const loginSchema = z.object({
  admissionNumber: z.string().min(1),
  password: z.string().min(1),
});

export const insertRelationshipSchema = createInsertSchema(relationships).pick({
  toUserId: true,
  type: true,
});

export const insertPostSchema = createInsertSchema(posts).pick({
  content: true,
  audience: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  toUserId: true,
  content: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Relationship = typeof relationships.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type FriendGroup = typeof friendGroups.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
