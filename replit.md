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
- ✓ Fixed self-relationship bug - users can no longer friend themselves or appear in their own search results
- ✓ Added defriend functionality - users can remove relationships from their profile page
- ✓ Created dedicated relationships management page accessible from hamburger menu and sidebar
- ✓ Built comprehensive relationships interface with grouping by type and action buttons
- ✓ Fixed dynamic online status indicator in messages - green dot now shows only when users are actually active
- ✓ Fixed critical messaging bug where previous messages were deleted when sending new ones - now all messages persist properly

### June 22, 2025
- ✓ Fixed database connection issues by creating PostgreSQL database and pushing schema
- ✓ Added comprehensive deployment configuration files for multiple platforms (Heroku, Railway, Vercel, Docker)
- ✓ Removed redundant "selected" message from social relationship addition interface
- ✓ Improved profile picture dialog with better URL validation and preview functionality
- ✓ Enhanced image preview with error handling for invalid URLs
- ✓ Implemented complete voice messaging system for posts and direct messages
- ✓ Created VoiceRecorder component with microphone access and audio compression
- ✓ Built VoicePlayer component with playback controls and progress visualization
- ✓ Updated database schema to support voice message URLs and durations
- ✓ Integrated voice recording functionality into PostForm and ChatWidget components
- ✓ Enhanced message and post display to show voice messages with playback controls
- ✓ Removed "admission number" terminology from user search interface, replaced with "username"
- ✓ Completely redesigned UserSearchDialog to remove social relationship dropdown
- ✓ Implemented real-time user search functionality with username and name matching
- ✓ Made search results clickable to navigate to user profile pages
- ✓ Enhanced search backend to include firstName, lastName, and username fields
- ✓ Fixed search API to properly filter and return user data without passwords

### June 24, 2025
- ✓ Fixed messaging interface to show recipient's name when starting new conversations instead of "Select a conversation"
- ✓ Resolved microphone permission prompts appearing during regular text messaging
- ✓ Replaced tick mark system with intuitive green square read receipts
- ✓ Implemented three-state visual system: outline (sent), half-filled (delivered), full (seen)
- ✓ Updated favicon with official Wrickit logo (purple square with white interconnected lines)
- ✓ Implemented official Wrickit logo throughout UI in headers, banners, and navigation
- ✓ Added logo to landing page, login page, dev page, main header, and service banner
- ✓ Created complete PostgreSQL database with all 24 required tables
- ✓ Successfully pushed database schema and verified all tables are operational
- ✓ Updated all favicon files and logo references with new purple network design
- ✓ Incremented favicon cache version to ensure browser refresh of new logo

### June 25, 2025
- ✓ Integrated Ubuntu font family throughout the entire website as the default font
- ✓ Added Google Fonts links for Ubuntu with all weights (300, 400, 500, 700)
- ✓ Updated Tailwind configuration to use Ubuntu as the default sans-serif font
- ✓ Applied Ubuntu font to all text elements, maintaining existing design system
- ✓ Created custom font utilities for consistent Ubuntu usage across components
- ✓ Implemented comprehensive contextual tooltip system with mobile optimization
- ✓ Added tooltips to navigation elements, buttons, and interactive components
- ✓ Created mobile-friendly tooltips with touch detection and responsive positioning
- ✓ Enhanced user experience with helpful guidance text throughout the interface
- ✓ Applied comprehensive Ubuntu font enforcement with !important declarations
- ✓ Added universal CSS rules to override component libraries and ensure Ubuntu usage
- ✓ Configured font fallbacks for optimal cross-platform compatibility
- ✓ Enhanced SPA routing fallback to prevent 404 errors on page reloads
- ✓ Added explicit API route handling to distinguish between client routes and API endpoints
- ✓ Improved route handling for both development and production environments
- ✓ Fixed dashboard crashes by reducing API polling frequency and cleaning up memory leaks
- ✓ Implemented proper cleanup for audio contexts, timers, and intervals
- ✓ Optimized notification system to prevent resource exhaustion
- ✓ Fixed React ref forwarding errors in TooltipWrapper, VoiceRecorder, HamburgerMenu, and ProfilePictureDialog
- ✓ Added proper forwardRef implementation to prevent console warnings
- ✓ Disabled automatic polling to prevent memory exhaustion and crashes
- ✓ Fixed notification bell dropdown by restructuring PopoverTrigger hierarchy
- ✓ Implemented functional Recent Messages section showing 3 most recent conversations
- ✓ Added real conversation data with partner info, timestamps, and unread indicators
- ✓ Fixed missing database tables and group chat functionality
- ✓ Removed dashboard chat widgets in favor of dedicated messages page navigation
- ✓ Updated all "Slide into DMs" and "Open Chat" buttons to redirect to messages page
- ✓ Implemented automatic new conversation creation for first-time messaging
- ✓ Added URL parameter handling to auto-open specific chats when navigating from dashboard
- ✓ Created complete PostgreSQL database setup with all 26 required tables
- ✓ Successfully established database connection and verified table structure
- ✓ Removed Squad navigation link from header for cleaner interface
- ✓ Fixed message sending error 500 by separating regular and group message mutations
- ✓ Resolved message display issue where new messages didn't appear in group chats
- ✓ Updated message rendering to correctly show group messages vs direct messages
- ✓ Fixed status display to show online status for DMs and member count only for group chats
- ✓ Added new conversation users to sidebar so they appear immediately when starting new chats
- ✓ Fixed voice recorder button preventing form submission by adding explicit button types
- ✓ Enhanced microphone access error handling with user-friendly messages for HTTPS requirements
- ✓ Fixed voice message duration showing "infinity NaN" with comprehensive validation
- ✓ Improved voice message slider functionality with proper invalid value handling
- ✓ Fixed voice message duration to use actual recording time instead of unreliable audio metadata
- ✓ Fixed online status system to accurately detect user activity with proper WebSocket cleanup
- ✓ Implemented strict 30-second activity window and periodic connection cleanup
- ✓ Enhanced user activity tracking to only update for meaningful interactions, not background polling
- ✓ Implemented comprehensive notification system for all social events
- ✓ Added notifications for new messages, posts, mutual crushes, relationships, and group activities
- ✓ Enhanced notification icons and messaging for different event types
- ✓ Implemented database-backed tutorial tracking system to prevent tutorial replay across devices
- ✓ Added hasCompletedTutorial field to user schema for persistent tutorial state
- ✓ Updated onboarding hook to use server-side tutorial completion status
- ✓ Added API endpoint for marking tutorial as complete in database
- ✓ Replaced localStorage-based tutorial tracking with cross-device database storage
- ✓ Added confirmation dialog for skipping tutorial to prevent accidental dismissal
- ✓ Enhanced skip tutorial functionality with permanent warning message
- ✓ Ensured tutorial completion status persists across all devices and browsers

## Changelog

- June 19, 2025. Initial setup and comprehensive feature implementation

## User Preferences

Preferred communication style: Simple, everyday language.