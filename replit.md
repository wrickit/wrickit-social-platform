# Wrickit - Social Platform for Classmates

## Overview

Wrickit is a social networking platform designed for students to connect with classmates. The application facilitates relationship building, content sharing, messaging, and peer-to-peer disciplinary reporting. Built with a modern React frontend and Express backend, it provides real-time features through WebSocket connections and focuses on creating meaningful connections within academic environments.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme variables for Discord purple and YouTube red color schemes
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js 20
- **Session Management**: Express sessions with PostgreSQL storage
- **Authentication**: Custom session-based authentication with bcrypt password hashing
- **Real-time Communication**: WebSocket server for live messaging
- **API Design**: RESTful APIs with JSON responses

### Database Architecture
- **Database**: PostgreSQL 16
- **ORM**: Drizzle ORM for type-safe database operations
- **Migration Strategy**: Drizzle Kit for schema migrations
- **Connection**: Neon Database serverless connection with connection pooling

## Key Components

### User Management
- User registration and authentication with admission numbers
- Profile management with bio, profile images, and personal information
- User search functionality for finding classmates

### Relationship System
- Four-tier relationship classification: best friend, friend, acquaintance, crush
- Mutual crush detection with automated notifications
- Relationship management and visualization

### Content Sharing
- Post creation with audience targeting (class or grade level)
- Like system for post engagement
- Real-time post feed updates

### Messaging System
- Direct messaging between users
- Real-time message delivery via WebSockets
- Message read status tracking
- Conversation history management

### Social Features
- Friend group detection and management
- Notification system for social interactions
- Activity feeds and social discovery

### Disciplinary System
- Peer reporting mechanism for disciplinary issues
- Anonymous reporting options
- Community voting on disciplinary actions
- Democratic resolution process

## Data Flow

1. **Authentication Flow**: Users authenticate with admission number and password, creating server-side sessions
2. **Real-time Updates**: WebSocket connections enable instant message delivery and notification updates
3. **Social Interactions**: Relationship creation triggers mutual crush detection and notification generation
4. **Content Distribution**: Posts are filtered by audience settings and delivered to appropriate user feeds
5. **Disciplinary Process**: Reports are submitted, voted on by peers, and resolved through community consensus

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **express-session**: Session management
- **bcrypt**: Password hashing
- **ws**: WebSocket implementation

### UI Dependencies
- **@radix-ui/***: Primitive UI components for accessibility
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **date-fns**: Date formatting utilities

### Development Dependencies
- **typescript**: Type safety and development experience
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for server development

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

### Build Process
- Frontend: Vite builds React app to `dist/public`
- Backend: ESBuild bundles server code to `dist/index.js`
- Static assets served from the build output directory

### Environment Configuration
- Development: Hot reload with Vite middleware integration
- Production: Compiled static assets served by Express
- Database: Environment variable-based PostgreSQL connection

### Scaling Considerations
- Session storage in PostgreSQL for horizontal scaling
- WebSocket connections managed per server instance
- Static asset serving optimized for CDN deployment

## Recent Changes

### June 19, 2025
- ✓ Implemented Facebook-style notification system with real-time updates
- ✓ Added class and division selection in signup for post filtering 
- ✓ Created username-based social relationship connections
- ✓ Enhanced post filtering to show posts by class when posted to class-specific feeds
- ✓ Built comprehensive user search functionality with relationship management
- ✓ Added profile settings page with account management features
- ✓ Integrated WebSocket messaging system for real-time communication
- ✓ Fixed database schema to support new user fields (username, firstName, lastName, class, division)
- ✓ Updated API routes for complete user management including password changes and account deletion
- ✓ Implemented disciplinary reporting system with community voting
- ✓ Added email verification system with SendGrid integration for secure signup process
- ✓ Fixed duplicate likes issue with individual user tracking system
- ✓ Implemented complete comment system with real-time updates
- ✓ Created separate posts page accessible from dashboard with dedicated navigation
- ✓ Limited dashboard to show maximum 10 recent posts with "View All Posts" button
- ✓ Removed irritating toast notifications while preserving important social notifications
- ✓ Added comprehensive post sorting system (recent, oldest, most liked, friends, crushes)
- ✓ Implemented visual relationship indicators on posts (friend/best friend/crush/acquaintance badges)
- ✓ Enhanced hamburger menu with comprehensive sidebar content for mobile users
- ✓ Added all relationship types to dashboard sidebar (friends, acquaintances, crushes)
- ✓ Fixed hamburger menu scrolling and added complete sidebar functionality for responsive design
- ✓ Prevented duplicate relationships by updating existing ones instead of creating duplicates

### June 22, 2025
- ✓ Fixed database connection issues by creating PostgreSQL database and pushing schema
- ✓ Added comprehensive deployment configuration files for multiple platforms (Heroku, Railway, Vercel, Docker)
- ✓ Removed redundant "selected" message from social relationship addition interface
- ✓ Improved profile picture dialog with better URL validation and preview functionality
- ✓ Enhanced image preview with error handling for invalid URLs

## Changelog

- June 19, 2025. Initial setup and comprehensive feature implementation

## User Preferences

Preferred communication style: Simple, everyday language.