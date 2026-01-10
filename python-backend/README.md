# Barbershop AI Assistant - Python Backend

FastAPI server for processing natural language conversations and extracting appointment information using LangChain and OpenAI GPT-4.

## Features

- **Natural Language Processing**: Uses OpenAI GPT-4 to understand customer requests
- **Appointment Extraction**: Automatically extracts appointment details from conversations
- **Service Information**: Provides pricing and availability information
- **Conversation Management**: Maintains conversation history for context
- **Validation**: Validates appointment data before confirmation
- **CORS Support**: Configured for frontend integration

## Architecture

```
FastAPI Server (Port 8000)
    ├── Chat Processing (LangChain + GPT-4)
    ├── Appointment Extraction
    ├── Conversation Management
    └── Service Information
```

## Installation

### Prerequisites

- Python 3.8+
- pip or poetry
- OpenAI API key

### Setup

1. **Create a virtual environment** (recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies**:

```bash
pip install -r requirements.txt
```

3. **Configure environment variables**:

Create a `.env` file in the `python-backend` directory:

```bash
OPENAI_API_KEY=sk-your-api-key-here
SERVER_PORT=8000
SERVER_HOST=0.0.0.0
FRONTEND_URL=http://localhost:3000
```

## Running the Server

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The server will start at `http://localhost:8000`

## API Documentation

Once the server is running, access the interactive API documentation at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## API Endpoints

### Health Check

```
GET /health
```

Returns server status and version.

### Get Services

```
GET /services
```

Returns available services with pricing:
- Haircut (Corte de Cabelo): $25.00
- Hair & Eyebrow (Cabelo e Sobrancelha): $30.00
- Full Service (Serviço Completo): $40.00

### Process Chat Message

```
POST /chat/message
Content-Type: application/json

{
  "conversation_id": 1,
  "message": "I want to book a haircut tomorrow at 10 AM"
}
```

Response:
```json
{
  "response": "Great! I can help you book a haircut tomorrow at 10 AM...",
  "appointment_data": {
    "service": "haircut",
    "date": "2025-12-17",
    "time": "10:00",
    "barber_name": null,
    "notes": null
  },
  "confidence": 1.0
}
```

### Extract Appointment from Conversation

```
POST /chat/extract-appointment
Content-Type: application/json

{
  "conversation_id": 1
}
```

Analyzes the entire conversation history to extract appointment details.

### Validate Appointment

```
POST /chat/validate-appointment
Content-Type: application/json

{
  "appointment_data": {
    "service": "haircut",
    "date": "2025-12-17",
    "time": "10:00",
    "barber_name": null,
    "notes": null
  }
}
```

### Get Conversation History

```
GET /chat/history/{conversation_id}
```

Returns all messages in a conversation.

### Clear Conversation History

```
DELETE /chat/history/{conversation_id}
```

Clears the conversation history for a specific conversation.

### Reset All Conversations

```
POST /chat/reset
```

Clears all conversation data and resets the assistant.

## How It Works

### Conversation Flow

1. **User sends message** → `/chat/message`
2. **LangChain processes** the message with GPT-4
3. **AI responds** naturally in Portuguese
4. **Appointment data extracted** if available
5. **Response returned** to frontend with extracted data

### Appointment Extraction

The AI assistant looks for key information:
- **Service**: haircut, hair_eyebrow, or full_service
- **Date**: in YYYY-MM-DD format
- **Time**: in HH:MM format (24-hour)
- **Barber preference**: optional
- **Special notes**: optional

### System Prompt

The assistant is configured with a system prompt that:
- Greets customers warmly
- Explains available services and pricing
- Suggests available time slots
- Confirms appointment details
- Responds in Portuguese (Brazilian Portuguese)

## Configuration

### Services

Services are defined in `config.py`:

```python
SERVICES = {
    "haircut": {
        "name": "Corte de Cabelo",
        "price": 25.00,
        "duration": 30,
        "description": "Professional haircut"
    },
    # ... more services
}
```

### Business Hours

```python
BUSINESS_HOURS = {
    "monday": {"start": "09:00", "end": "18:00"},
    # ... more days
    "sunday": None,  # Closed
}
```

## Integration with Frontend

The frontend (React) communicates with this backend via:

1. **Chat messages**: Send user input, receive AI responses
2. **Appointment extraction**: Get structured appointment data
3. **Service information**: Display pricing and availability
4. **Validation**: Validate appointment before payment

### Example Frontend Integration

```javascript
// Send message to AI
const response = await fetch('http://localhost:8000/chat/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversation_id: 1,
    message: 'I want to book a haircut'
  })
});

const data = await response.json();
console.log(data.response);  // AI response
console.log(data.appointment_data);  // Extracted appointment
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key (required) | - |
| `SERVER_PORT` | Server port | 8000 |
| `SERVER_HOST` | Server host | 0.0.0.0 |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |
| `DATABASE_URL` | Database URL (future use) | - |

## Troubleshooting

### OpenAI API Key Error

```
ValueError: OPENAI_API_KEY environment variable is not set
```

**Solution**: Make sure your `.env` file contains a valid OpenAI API key.

### Connection Refused

```
ConnectionRefusedError: [Errno 111] Connection refused
```

**Solution**: Ensure the server is running and accessible at the configured host and port.

### CORS Errors

If the frontend can't reach the backend, check:
1. Server is running on the correct port
2. `FRONTEND_URL` environment variable is set correctly
3. CORS middleware is properly configured

### Slow Responses

The first request may take longer as the LLM initializes. Subsequent requests should be faster.

## Development

### Adding New Services

1. Add service to `config.py`:

```python
SERVICES = {
    "new_service": {
        "name": "Service Name",
        "price": 50.00,
        "duration": 60,
        "description": "Description"
    }
}
```

2. Update system prompt in `config.py` to mention the new service

### Customizing the AI Behavior

Edit `BARBERSHOP_SYSTEM_PROMPT` in `config.py` to change how the assistant responds.

### Adding Persistence

Currently, conversations are stored in memory. For production:

1. Replace the `conversations` dict with a database
2. Store conversation history in the database
3. Load history when needed

## Performance Optimization

- **Caching**: Cache service information and system prompts
- **Async**: All endpoints are async for better concurrency
- **Connection pooling**: Use connection pooling for database (when added)
- **Rate limiting**: Consider adding rate limiting for production

## Security Considerations

- **API Key**: Keep OpenAI API key secure (use environment variables)
- **CORS**: Restrict CORS origins in production
- **Input validation**: All inputs are validated with Pydantic
- **Error handling**: Sensitive errors are not exposed to clients

## Future Enhancements

- [ ] Database persistence for conversations
- [ ] Google Calendar integration via MCP
- [ ] Payment processing integration
- [ ] Training data management
- [ ] Analytics and metrics
- [ ] Multi-language support
- [ ] Custom model fine-tuning

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review OpenAI documentation: https://platform.openai.com/docs
3. Check LangChain documentation: https://python.langchain.com

## License

MIT
