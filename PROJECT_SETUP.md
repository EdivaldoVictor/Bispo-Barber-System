# Barber AI Scheduler - Complete Setup Guide

A full-stack AI-powered barbershop appointment scheduling system with React frontend, Node.js/Express backend, Python/LangChain AI engine, and Stripe payment integration.

## Project Structure

```
barber_ai_scheduler/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   ├── pages/                  # Page components
│   │   ├── lib/                    # Utilities and helpers
│   │   └── App.tsx                 # Main app component
│   └── public/                     # Static assets
├── server/                          # Node.js/Express backend
│   ├── _core/                      # Core framework files
│   ├── routers.ts                  # tRPC API routes
│   ├── db.ts                       # Database queries
│   ├── products.ts                 # Service pricing
│   ├── stripe-router.ts            # Stripe integration
│   └── stripe-webhook.ts           # Webhook handler
├── python-backend/                  # Python/LangChain AI engine
│   ├── main.py                     # FastAPI server
│   ├── ai_assistant.py             # LangChain + GPT-4
│   ├── config.py                   # Configuration
│   ├── models.py                   # Pydantic models
│   └── requirements.txt            # Python dependencies
├── drizzle/                         # Database schema
│   └── schema.ts                   # Table definitions
└── README files                     # Documentation
```

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Python 3.8+
- MySQL/TiDB database
- OpenAI API key (GPT-4)
- Stripe account (for payments)

### 1. Frontend + Node.js Backend Setup

```bash
# Install dependencies
pnpm install

# Configure environment variables
# Add your Stripe keys and other secrets in the Manus UI

# Start development server
pnpm dev
```

The frontend will be available at `http://localhost:3000`

### 2. Python Backend Setup

```bash
cd python-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your OpenAI API key
echo "OPENAI_API_KEY=sk-your-api-key-here" > .env

# Start the server
python main.py
```

The Python backend will be available at `http://localhost:8000`

## Key Features

### 1. Chat Interface
- Natural language conversation with AI assistant
- Real-time message updates
- Conversation history
- Responsive design

### 2. Appointment Scheduling
- AI extracts appointment details from conversation
- Date/time picker with availability
- Service selection with pricing
- Barber preference (optional)

### 3. Payment Processing
- Stripe integration for secure payments
- Three service tiers:
  - Haircut: $25.00
  - Hair & Eyebrow: $30.00
  - Full Service: $40.00
- Webhook handling for payment confirmation

### 4. AI Assistant
- OpenAI GPT-4 powered
- LangChain for conversation management
- Automatic appointment data extraction
- Portuguese language support

### 5. Admin Dashboard (Coming Soon)
- View all appointments
- Calendar view
- AI training interface
- Analytics

## API Documentation

### Frontend API (tRPC)

Access at `http://localhost:3000/api/trpc`

Available procedures:
- `chat.*` - Chat operations
- `appointments.*` - Appointment management
- `stripe.*` - Payment operations
- `training.*` - AI training (admin only)
- `auth.*` - Authentication

### Python Backend API

Access at `http://localhost:8000/docs` for interactive documentation

Key endpoints:
- `POST /chat/message` - Process chat message
- `POST /chat/extract-appointment` - Extract appointment details
- `GET /services` - Get available services
- `POST /chat/validate-appointment` - Validate appointment data

## Configuration

### Environment Variables

Create a `.env` file in `python-backend/`:

```bash
OPENAI_API_KEY=sk-your-api-key-here
SERVER_PORT=8000
SERVER_HOST=0.0.0.0
FRONTEND_URL=http://localhost:3000
```

### Database Schema

The system uses the following tables:

- **users**: User accounts with Stripe customer ID
- **conversations**: Chat conversations
- **messages**: Individual messages in conversations
- **appointments**: Scheduled appointments with payment status
- **trainingExamples**: AI training data
- **aiModels**: Trained model versions
- **barbershopConfig**: Business configuration

### Services Configuration

Services are defined in `python-backend/config.py`:

```python
SERVICES = {
    "haircut": {
        "name": "Corte de Cabelo",
        "price": 25.00,
        "duration": 30,
    },
    # ... more services
}
```

## Workflow

### Customer Journey

1. **Visit Website** → `http://localhost:3000`
2. **Login** → Manus OAuth authentication
3. **Start Chat** → Describe desired appointment
4. **AI Processes** → Extracts date, time, service
5. **Confirm Details** → Review appointment info
6. **Pay with Stripe** → Secure payment
7. **Appointment Confirmed** → Receive confirmation

### Data Flow

```
React Frontend
    ↓
tRPC API (Node.js)
    ↓
Database (MySQL)
    ↓
Python Backend (LangChain)
    ↓
OpenAI GPT-4
```

## Testing

### Test Stripe Payments

Use test card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC

### Test AI Chat

Visit `http://localhost:8000/docs` and try the `/chat/message` endpoint:

```json
{
  "conversation_id": 1,
  "message": "I want to book a haircut tomorrow at 10 AM"
}
```

## Deployment

### Frontend + Node.js Backend

The project is ready to deploy to Manus hosting:

1. Click the **Publish** button in the Manus UI
2. Configure custom domain (optional)
3. Your app will be live

### Python Backend

Deploy to your preferred Python hosting:

**Option 1: Docker**
```bash
cd python-backend
docker build -t barber-ai-backend .
docker run -p 8000:8000 -e OPENAI_API_KEY=sk-xxx barber-ai-backend
```

**Option 2: Railway, Render, or Heroku**
- Push code to GitHub
- Connect repository to hosting platform
- Set environment variables
- Deploy

**Option 3: Self-hosted**
- Use systemd or supervisor for process management
- Configure nginx as reverse proxy
- Use SSL/TLS for HTTPS

## Troubleshooting

### Frontend Issues

**Port 3000 already in use**
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>
```

**Database connection error**
- Check DATABASE_URL is correct
- Verify MySQL/TiDB is running
- Check credentials

### Python Backend Issues

**OpenAI API Key error**
```bash
export OPENAI_API_KEY="sk-your-key-here"
python main.py
```

**Port 8000 already in use**
```bash
lsof -i :8000
kill -9 <PID>
```

**Slow responses**
- First request initializes LLM (5-10 seconds)
- Subsequent requests are faster
- Consider using GPT-3.5 Turbo for faster responses

### Stripe Issues

**Webhook not receiving events**
1. Check webhook URL is publicly accessible
2. Verify signing secret is correct
3. Check Stripe Dashboard for event logs

## Development

### Adding New Features

1. **Database changes**: Edit `drizzle/schema.ts`, run `pnpm db:push`
2. **API endpoints**: Add to `server/routers.ts`
3. **Frontend pages**: Create in `client/src/pages/`
4. **AI behavior**: Edit `python-backend/config.py`

### Running Tests

```bash
# Frontend + Backend tests
pnpm test

# Python backend tests (coming soon)
cd python-backend
pytest
```

## Documentation

- **Frontend**: See `client/README.md`
- **Backend**: See `server/README.md`
- **Python Backend**: See `python-backend/README.md`
- **Stripe Setup**: See `STRIPE_SETUP.md`
- **Python Integration**: See `PYTHON_BACKEND_INTEGRATION.md`

## Support & Resources

- **OpenAI Documentation**: https://platform.openai.com/docs
- **LangChain Documentation**: https://python.langchain.com
- **Stripe Documentation**: https://stripe.com/docs
- **Manus Documentation**: https://help.manus.im

## License

MIT

## Next Steps

1. ✅ Frontend chat interface
2. ✅ Stripe payment integration
3. ✅ Python/LangChain backend
4. ⏳ Google Calendar integration via MCP
5. ⏳ Admin dashboard
6. ⏳ AI training interface
7. ⏳ Analytics and metrics

## Contact

For questions or support, please reach out to the development team.
