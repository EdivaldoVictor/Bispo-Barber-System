# Python Backend Integration Guide

This guide explains how to integrate the Python/LangChain backend with the React frontend.

## Overview

The Python backend runs on port 8000 and provides AI-powered chat processing using OpenAI GPT-4 and LangChain. The React frontend communicates with this backend via HTTP requests.

## Architecture

```
React Frontend (Port 3000)
        ↓
    tRPC API (Port 3000)
        ↓
    Node.js Backend (Port 3000)
        ↓
    Python Backend (Port 8000) ← LangChain + GPT-4
```

## Setup Instructions

### 1. Configure OpenAI API Key

The Python backend requires an OpenAI API key. Add it to your environment:

```bash
cd python-backend
export OPENAI_API_KEY="sk-your-api-key-here"
```

Or create a `.env` file:

```bash
OPENAI_API_KEY=sk-your-api-key-here
SERVER_PORT=8000
SERVER_HOST=0.0.0.0
FRONTEND_URL=http://localhost:3000
```

### 2. Install Python Dependencies

```bash
cd python-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Start the Python Backend

```bash
python main.py
```

The server will start at `http://localhost:8000`

### 4. Test the Backend

Visit `http://localhost:8000/docs` to access the interactive API documentation.

## Integration Points

### Frontend to Python Backend Communication

The React frontend communicates with the Python backend through the Node.js tRPC API. Here's how to add tRPC procedures that call the Python backend:

#### 1. Create a tRPC Router for AI Chat

Add this to `server/routers.ts`:

```typescript
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";

export const aiRouter = router({
  chat: protectedProcedure
    .input(z.object({
      conversationId: z.number(),
      message: z.string(),
    }))
    .mutation(async ({ input }) => {
      const response = await fetch(`${PYTHON_BACKEND_URL}/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: input.conversationId,
          message: input.message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process message");
      }

      return response.json();
    }),

  extractAppointment: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ input }) => {
      const response = await fetch(`${PYTHON_BACKEND_URL}/chat/extract-appointment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: input.conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to extract appointment");
      }

      return response.json();
    }),

  validateAppointment: protectedProcedure
    .input(z.object({
      appointmentData: z.object({
        service: z.string().optional(),
        date: z.string().optional(),
        time: z.string().optional(),
        barberName: z.string().optional(),
        notes: z.string().optional(),
      }),
    }))
    .query(async ({ input }) => {
      const response = await fetch(`${PYTHON_BACKEND_URL}/chat/validate-appointment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_data: {
            service: input.appointmentData.service,
            date: input.appointmentData.date,
            time: input.appointmentData.time,
            barber_name: input.appointmentData.barberName,
            notes: input.appointmentData.notes,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to validate appointment");
      }

      return response.json();
    }),

  getServices: publicProcedure.query(async () => {
    const response = await fetch(`${PYTHON_BACKEND_URL}/services`);

    if (!response.ok) {
      throw new Error("Failed to fetch services");
    }

    return response.json();
  }),
});
```

#### 2. Add AI Router to App Router

In `server/routers.ts`, add to the main router:

```typescript
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  chat: chatRouter,
  appointments: appointmentsRouter,
  stripe: stripeRouter,
  ai: aiRouter,  // Add this
  training: trainingRouter,
});
```

#### 3. Use in React Components

In your React components, use the new tRPC procedures:

```typescript
import { trpc } from "@/lib/trpc";

export function ChatInterface() {
  const [message, setMessage] = useState("");
  const chatMutation = trpc.ai.chat.useMutation();
  const extractMutation = trpc.ai.extractAppointment.useQuery({
    conversationId: 1,
  });

  const handleSendMessage = async () => {
    const result = await chatMutation.mutateAsync({
      conversationId: 1,
      message,
    });

    console.log("AI Response:", result.response);
    console.log("Appointment Data:", result.appointment_data);
    console.log("Confidence:", result.confidence);

    setMessage("");
  };

  return (
    <div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
      />
      <button onClick={handleSendMessage}>Send</button>
    </div>
  );
}
```

## Environment Variables

Add these to your `.env` file in the root directory:

```bash
# Python Backend URL
PYTHON_BACKEND_URL=http://localhost:8000

# OpenAI API Key (for Python backend)
OPENAI_API_KEY=sk-your-api-key-here
```

## API Endpoints

The Python backend provides these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/services` | GET | Get available services |
| `/chat/message` | POST | Process chat message |
| `/chat/extract-appointment` | POST | Extract appointment from conversation |
| `/chat/validate-appointment` | POST | Validate appointment data |
| `/chat/history/{id}` | GET | Get conversation history |
| `/chat/history/{id}` | DELETE | Clear conversation history |
| `/chat/reset` | POST | Reset all conversations |

## Running Both Servers

### Terminal 1: Start Node.js Backend + React Frontend

```bash
cd /home/ubuntu/barber_ai_scheduler
pnpm dev
```

### Terminal 2: Start Python Backend

```bash
cd /home/ubuntu/barber_ai_scheduler/python-backend
python main.py
```

Or using Docker:

```bash
cd python-backend
docker-compose up
```

## Testing the Integration

### 1. Test Python Backend Directly

```bash
curl -X POST http://localhost:8000/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": 1,
    "message": "I want to book a haircut tomorrow at 10 AM"
  }'
```

### 2. Test via Frontend

1. Open `http://localhost:3000` in your browser
2. Navigate to the chat interface
3. Send a message
4. Observe the AI response and extracted appointment data

## Troubleshooting

### Python Backend Not Responding

```
Error: Failed to fetch from http://localhost:8000
```

**Solution**: 
1. Ensure Python backend is running: `python main.py`
2. Check port 8000 is not in use: `lsof -i :8000`
3. Verify OPENAI_API_KEY is set

### OpenAI API Key Error

```
ValueError: OPENAI_API_KEY environment variable is not set
```

**Solution**: Set the environment variable before starting the server:
```bash
export OPENAI_API_KEY="sk-your-key-here"
python main.py
```

### CORS Errors

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution**: Ensure `FRONTEND_URL` environment variable is set correctly in the Python backend.

### Slow Responses

The first request may take 5-10 seconds as the LLM initializes. Subsequent requests should be faster.

## Performance Tips

1. **Cache Services**: Cache the services list in the frontend
2. **Debounce Messages**: Debounce chat input to avoid too many requests
3. **Connection Pooling**: Use connection pooling for database (when added)
4. **Async Processing**: Use async/await for better performance

## Security Considerations

1. **API Key**: Never expose OpenAI API key in frontend code
2. **CORS**: Restrict CORS origins in production
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **Input Validation**: All inputs are validated on both frontend and backend

## Next Steps

1. Implement Google Calendar integration via MCP
2. Add database persistence for conversations
3. Implement training data management
4. Add analytics and metrics
5. Deploy to production

## Support

For issues with the Python backend:
1. Check the Python backend README: `python-backend/README.md`
2. Review OpenAI documentation: https://platform.openai.com/docs
3. Check LangChain documentation: https://python.langchain.com
