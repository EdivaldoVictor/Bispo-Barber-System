"""
Configuration for the Python LangChain backend server
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# OpenAI Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

# Server Configuration
SERVER_PORT = int(os.getenv("SERVER_PORT", "8000"))
SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0")

# Frontend Configuration (for CORS)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Database Configuration (for future use)
DATABASE_URL = os.getenv("DATABASE_URL", "")

# System Prompt for the Barbershop AI Assistant
BARBERSHOP_SYSTEM_PROMPT = """You are a professional and friendly barbershop appointment assistant. Your role is to help customers schedule haircut appointments.

You should:
1. Greet customers warmly and ask about their desired service
2. Extract appointment details from the conversation (date, time, service type, barber preference, notes)
3. Provide information about available services and their prices:
   - Haircut (Corte de Cabelo): R$25.00
   - Hair & Eyebrow (Cabelo e Sobrancelha): R$30.00
   - Full Service (Serviço Completo): R$40.00
   - Hair and beard (Cabelo e barba): R$35.00,
   - Beard Only (Somente barba): R$20.00
4. Suggest available time slots (business hours: 9 AM - 6 PM, Monday-Saturday)
5. Confirm all details before finalizing the appointment
6. Be helpful and answer questions about services, pricing, and availability
7. Always respond in Portuguese (Brazilian Portuguese)

When you have extracted enough information to create an appointment, respond with a JSON block at the end:
```json
{
  "appointment_ready": true,
  "service": "haircut|hair_eyebrow|full_service",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "barber_name": "name or null",
  "notes": "any special notes"
}
```

If you need more information, respond naturally without the JSON block."""

# Available Services
SERVICES = {
    "haircut": {
        "name": "Corte de Cabelo",
        "price": 25.00,
        "duration": 30,
        "description": "Professional haircut"
    },
    "hair_eyebrow": {
        "name": "Cabelo e Sobrancelha",
        "price": 30.00,
        "duration": 45,
        "description": "Haircut with eyebrow trim"
    },
    "full_service": {
        "name": "Serviço Completo",
        "price": 40.00,
        "duration": 60,
        "description": "Haircut, eyebrow trim, and beard trim"
    },
    "hair_beard": {
        "name": "Cabelo e Barba",
        "price": 35.00,
        "duration": 50,
        "description": "Haircut with beard trim"
    },
    "beard_only": {
        "name": "Somente Barba",
        "price": 20.00,
        "duration": 20,
        "description": "Beard trim only"
    }
}

# Business Hours
BUSINESS_HOURS = {
    "monday": {"start": "09:00", "end": "18:00"},
    "tuesday": {"start": "09:00", "end": "18:00"},
    "wednesday": {"start": "09:00", "end": "18:00"},
    "thursday": {"start": "09:00", "end": "18:00"},
    "friday": {"start": "09:00", "end": "18:00"},
    "saturday": {"start": "09:00", "end": "18:00"},
    "sunday": None,  # Closed on Sunday
}