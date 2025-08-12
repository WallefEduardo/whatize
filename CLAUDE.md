# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend Development
- `npm run dev` - Start backend in development mode with hot reload
- `npm run build` - Compile TypeScript to JavaScript in dist/
- `npm run start` - Run production build from dist/server.js
- `npm run test` - Run test suite with Jest
- `npm run lint` - Run ESLint on TypeScript files
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Run database seeders

### Frontend Development
- `npm run start` - Start React development server
- `npm run build` - Build production React app
- `npm run test` - Run React test suite

### Testing Individual Files
Use Jest with specific file paths:
```bash
NODE_ENV=test jest __tests__/services/verifyContact.spec.ts --no-coverage
NODE_ENV=test npx jest __tests__/unit/simple-lid-test.spec.ts --no-coverage --testTimeout=10000
NODE_ENV=test npx jest __tests__/integration/contactDeletion.spec.ts --no-coverage --verbose --testTimeout=30000
```

## Architecture Overview

This is a multi-tenant WhatsApp business platform with the following key components:

### Core Architecture
- **Backend**: Node.js/Express + TypeScript + Sequelize ORM
- **Frontend**: React 16.x with Material-UI components
- **Database**: PostgreSQL with multi-company isolation
- **Real-time**: Socket.IO for live updates
- **Queue System**: Bull/Redis for background jobs
- **WhatsApp Integration**: Baileys library for WhatsApp Web API

### Service Layer Pattern
The backend follows a strict service-oriented architecture:
- **Controllers** (`src/controllers/`) - Handle HTTP requests/responses
- **Services** (`src/services/`) - Business logic organized by domain
- **Models** (`src/models/`) - Sequelize ORM models with relationships
- **Routes** (`src/routes/`) - Express route definitions

### Key Domain Services
- **ContactServices** - Contact management and LID/JID mapping
- **TicketServices** - Support ticket lifecycle management  
- **WbotServices** - WhatsApp bot message processing
- **CompanyService** - Multi-tenant company management
- **FlowBuilderService** - Chatbot flow automation

### Database Models
Primary entities with complex relationships:
- **Company** - Tenant isolation root
- **Contact** - Customer contacts with WhatsApp mapping via WhatsappLidMap
- **Ticket** - Support conversations with status tracking
- **Message** - Individual messages with media support
- **User** - System users with role-based permissions
- **Whatsapp** - WhatsApp connection instances per company

### WhatsApp Integration Patterns
- **Message Listening** (`wbotMessageListener.ts`) - Processes incoming WhatsApp messages
- **Contact Resolution** - LID/JID mapping for contact identification
- **Media Handling** - File upload/download with proper sanitization
- **Session Management** - Multiple WhatsApp sessions per company

### Multi-Tenant Architecture
- All database models include `companyId` for tenant isolation
- Services enforce company-scoped data access
- File storage organized by company (`/public/company{id}/`)
- WhatsApp sessions isolated per company

### Queue System
Background processing for:
- Message delivery (`messageQueue`)
- Scheduled messages (`sendScheduledMessages`)
- File processing and media handling
- Contact import operations

### Frontend Architecture
- React with Material-UI components
- Socket.IO for real-time updates
- Axios for API communication
- React Router for navigation
- Context API for state management

## Important Implementation Notes

### LID/JID Handling
The system handles WhatsApp contact identification through LID (Local ID) and JID (Jabber ID) mapping. Recent fixes address race conditions in contact creation and duplicate handling.

### File Upload Security
All file uploads go through sanitization (`sanitizeFileName.ts`) and are organized by company ID in the public directory structure.

### Race Condition Monitoring
The system includes extensive logging for race conditions, particularly around contact and ticket creation. Monitor logs in `logs/race_conditions.log`.

### Database Connection
Uses connection pooling with retry logic for database resilience. Configuration supports both PostgreSQL and MySQL dialects.

### Real-time Features
Socket.IO handles live updates for:
- New messages and tickets
- User status changes  
- Queue assignments
- Company-wide notifications

## Development Workflow

1. **Database Setup**: Run migrations and seeders for initial data
2. **Environment**: Configure `.env` files for both backend and frontend
3. **Services**: Follow the service pattern when adding new business logic
4. **Testing**: Write tests for service layer before controllers
5. **Multi-tenancy**: Always include company isolation in new features

## File Structure
- `/backend/src/` - TypeScript backend source
- `/frontend/src/` - React frontend source  
- `/backend/public/` - Static file serving (organized by company)
- `/backend/logs/` - Application and monitoring logs