# AI Sarthi Chat Interface Documentation

## Overview

The AI Sarthi Chat Interface is a ChatGPT-like conversational interface that allows students to interact with AI Sarthi in natural language. This implementation provides a modern, user-friendly chat experience integrated with the existing EduNiti platform.

## Features

### 🎯 Core Capabilities

- **Course Recommendations**: Get personalized stream suggestions based on interests and performance
- **Practice Questions**: Generate MCQs for classes 10, 11, and 12 across all subjects
- **College Information**: Find colleges and programs that match student goals
- **General Guidance**: Handle FAQs and provide education-related advice

### 💬 Chat Interface Features

- **Real-time Messaging**: Instant responses with typing indicators
- **Persistent History**: Conversation history stored in database
- **Session Management**: Context maintained across multiple questions
- **Responsive Design**: Works on desktop and mobile devices
- **Floating Widget**: Always-accessible chat button on all pages

## Architecture

### Frontend Components

#### 1. SarthiChat (`src/components/SarthiChat.tsx`)

Main chat interface component with:

- Message display with user/assistant bubbles
- Input field with send functionality
- Typing indicators and loading states
- Message timestamps and metadata display
- Reset conversation functionality

#### 2. SarthiChatWidget (`src/components/SarthiChatWidget.tsx`)

Floating chat widget with:

- Minimizable chat window
- Position customization (bottom-right, bottom-left, etc.)
- New message notifications
- Compact mode for embedding in pages

#### 3. Chat Page (`src/app/chat/page.tsx`)

Dedicated chat page with:

- Full-screen chat interface
- Sidebar with capability explanations
- Quick start examples
- Usage tips and guidelines

### Backend API

#### 1. Session Management (`src/app/api/chat/session/route.ts`)

- Create new chat sessions
- Retrieve user's active sessions
- Session metadata and context storage

#### 2. Message Handling (`src/app/api/chat/message/route.ts`)

- Process user messages
- Route to appropriate AI capabilities
- Store conversation history
- Log interactions for analytics

#### 3. Session Reset (`src/app/api/chat/session/reset/route.ts`)

- Archive current sessions
- Start fresh conversations
- Maintain user privacy

### Database Schema

#### Tables Created (`src/lib/conversation-schema.sql`)

1. **conversation_sessions**
   - Stores chat session metadata
   - User context and preferences
   - Session status and activity tracking

2. **conversation_messages**
   - Individual messages in conversations
   - Message types (user, assistant, system)
   - Metadata and threading support

3. **sarthi_interactions**
   - AI capability usage tracking
   - Performance metrics
   - User feedback collection

## Integration Points

### Existing AI Sarthi Features

#### 1. Recommendation Engine

- Integrates with `src/lib/sarthi-ai.ts`
- Uses existing `SarthiUserProfile` interface
- Leverages `getEnhancedRecommendations()` method

#### 2. Question Generation

- Connects to `src/lib/question-generator.ts`
- Supports classes 10, 11, and 12
- Generates MCQs for all subjects

#### 3. College Database

- Queries existing `colleges` table
- Location-based filtering
- Program and stream matching

### Authentication Integration

- Uses existing `useAuth` hook from `src/app/providers.tsx`
- Respects user roles and permissions
- Maintains session security

## Usage Examples

### Basic Chat Interactions

```typescript
// User asks for recommendations
"What stream should I choose after 10th?";

// User requests practice questions
"Generate 10 math questions for class 12";

// User asks about colleges
"Show me engineering colleges in Jammu";

// User seeks general guidance
"How to prepare for JEE?";
```

### Capability Detection

The system automatically detects user intent based on keywords:

- **Recommendation**: "recommend", "suggestion", "stream", "career"
- **Questions**: "question", "practice", "quiz", "MCQ", subject names
- **Colleges**: "college", "university", "admission", "cutoff"
- **General**: Default fallback for other queries

## Setup Instructions

### 1. Database Setup

Apply the conversation schema to your database:

```bash
node apply-conversation-schema.js
```

### 2. Environment Variables

Ensure these environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Component Integration

The chat widget is automatically included in the main layout. For custom integration:

```tsx
import { SarthiChatWidget, SarthiChat } from '@/components/SarthiChatWidget'

// Floating widget
<SarthiChatWidget position="bottom-right" />

// Embedded chat
<SarthiChat className="w-full h-96" />
```

## Security Features

### Row Level Security (RLS)

- Users can only access their own conversations
- Admin access for analytics and monitoring
- Secure session management

### Input Sanitization

- All user inputs are sanitized
- SQL injection prevention
- XSS protection

### Rate Limiting

- Built-in request throttling
- Session-based limits
- Performance monitoring

## Performance Optimizations

### Response Time

- Target: < 2 seconds for all responses
- Caching for frequently asked questions
- Optimized database queries

### Scalability

- Session-based conversation management
- Efficient message storage
- Background analytics processing

## Analytics and Monitoring

### Interaction Tracking

- Capability usage statistics
- Response confidence scores
- Processing time metrics
- User feedback collection

### Admin Dashboard

- Conversation volume metrics
- Popular questions and topics
- Performance analytics
- User engagement data

## Customization Options

### UI Customization

- Color themes (user: blue, Sarthi: green)
- Position settings for floating widget
- Message bubble styling
- Typing indicator animations

### Capability Extension

- Easy addition of new AI capabilities
- Custom response formatting
- Integration with external APIs
- Plugin architecture support

## Troubleshooting

### Common Issues

1. **Import Errors**
   - Ensure all UI components are properly exported
   - Check import paths in components

2. **Database Connection**
   - Verify Supabase credentials
   - Check RLS policies are applied

3. **AI Responses**
   - Confirm Gemini API key is valid
   - Check rate limits and quotas

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

## Future Enhancements

### Planned Features

- Voice input/output support
- File upload capabilities
- Multi-language support
- Advanced conversation analytics
- Integration with learning management systems

### API Extensions

- Webhook support for external integrations
- Real-time collaboration features
- Advanced personalization algorithms
- Machine learning model improvements

## Support and Maintenance

### Regular Maintenance

- Database cleanup of old conversations
- Performance monitoring and optimization
- Security updates and patches
- User feedback integration

### Monitoring

- Error tracking and alerting
- Performance metrics dashboard
- User satisfaction surveys
- System health checks

---

## Quick Start Guide

1. **Apply Database Schema**: Run `node apply-conversation-schema.js`
2. **Access Chat**: Navigate to `/chat` or use the floating widget
3. **Test Capabilities**: Try asking about recommendations, questions, or colleges
4. **Monitor Usage**: Check admin dashboard for analytics

The AI Sarthi Chat Interface is now ready to provide intelligent, conversational education guidance to students across the EduNiti platform!
