"""
FastAPI server for Barbershop AI Assistant using LangChain and OpenAI GPT-4
"""
import os
from typing import Dict, List
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import SERVER_HOST, SERVER_PORT, FRONTEND_URL, SERVICES
from models import (
    ChatRequest,
    ChatResponse,
    ConversationHistory,
    ExtractAppointmentRequest,
    ExtractAppointmentResponse,
    ValidateAppointmentRequest,
    ValidateAppointmentResponse,
    ServiceInfo,
    HealthResponse,
    AppointmentData,
)
from ai_assistant import get_assistant, reset_assistant

# Create FastAPI app
app = FastAPI(
    title="Barbershop AI Assistant API",
    description="AI-powered API for barbershop appointment scheduling using LangChain and OpenAI GPT-4",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for conversations (in production, use a database)
conversations: Dict[int, List[Dict[str, str]]] = {}


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "Barbershop AI Assistant is running",
        "version": "1.0.0",
    }


@app.get("/services", response_model=List[ServiceInfo])
async def get_services():
    """Get available services and pricing"""
    services = []
    for service_id, service_info in SERVICES.items():
        services.append(
            ServiceInfo(
                id=service_id,
                name=service_info["name"],
                price=service_info["price"],
                duration=service_info["duration"],
                description=service_info["description"],
            )
        )
    return services


@app.post("/chat/message", response_model=ChatResponse)
async def process_chat_message(request: ChatRequest):
    """
    Process a chat message and get AI response
    
    This endpoint:
    1. Takes a user message
    2. Processes it with LangChain + GPT-4
    3. Extracts appointment information if available
    4. Returns the AI response and any extracted data
    """
    try:
        # Get or create conversation
        if request.conversation_id not in conversations:
            conversations[request.conversation_id] = []

        # Get assistant
        assistant = get_assistant()

        # Process the message
        result = assistant.process_message(request.message)

        # Store conversation history
        conversations[request.conversation_id] = assistant.get_conversation_history()

        return ChatResponse(
            response=result["response"],
            appointment_data=result["appointment_data"],
            confidence=result["confidence"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")


@app.post("/chat/extract-appointment", response_model=ExtractAppointmentResponse)
async def extract_appointment(request: ExtractAppointmentRequest):
    """
    Extract appointment information from conversation history
    
    This endpoint analyzes the entire conversation to extract
    appointment details (date, time, service, etc.)
    """
    try:
        # Get assistant
        assistant = get_assistant()

        # Extract appointment data
        appointment_data = assistant.extract_appointment_from_conversation()

        # Validate if we have data
        if appointment_data:
            is_valid, errors = assistant.validate_appointment_data(appointment_data)
            return ExtractAppointmentResponse(
                appointment_data=AppointmentData(**appointment_data),
                is_complete=is_valid,
                validation_errors=errors,
            )
        else:
            return ExtractAppointmentResponse(
                appointment_data=None,
                is_complete=False,
                validation_errors=["Insufficient information to create appointment"],
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting appointment: {str(e)}")


@app.post("/chat/validate-appointment", response_model=ValidateAppointmentResponse)
async def validate_appointment(request: ValidateAppointmentRequest):
    """
    Validate appointment data
    
    Checks if the appointment data is complete and valid
    """
    try:
        assistant = get_assistant()

        # Convert Pydantic model to dict
        appointment_dict = request.appointment_data.dict()

        # Validate
        is_valid, errors = assistant.validate_appointment_data(appointment_dict)

        return ValidateAppointmentResponse(
            is_valid=is_valid,
            errors=errors,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error validating appointment: {str(e)}")


@app.get("/chat/history/{conversation_id}", response_model=ConversationHistory)
async def get_conversation_history(conversation_id: int):
    """
    Get conversation history for a specific conversation
    
    Returns all messages in the conversation
    """
    try:
        if conversation_id not in conversations:
            return ConversationHistory(conversation_id=conversation_id, messages=[])

        # Get assistant and set its history
        assistant = get_assistant()
        assistant.conversation_history = conversations[conversation_id]

        messages = assistant.get_conversation_history()

        return ConversationHistory(
            conversation_id=conversation_id,
            messages=[{"role": msg["role"], "content": msg["content"]} for msg in messages],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving history: {str(e)}")


@app.delete("/chat/history/{conversation_id}")
async def clear_conversation_history(conversation_id: int):
    """
    Clear conversation history for a specific conversation
    
    Resets the conversation to start fresh
    """
    try:
        if conversation_id in conversations:
            del conversations[conversation_id]

        # Reset assistant
        reset_assistant()

        return {"message": "Conversation history cleared", "conversation_id": conversation_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing history: {str(e)}")


@app.post("/chat/reset")
async def reset_conversation():
    """
    Reset the current conversation
    
    Clears all conversation history and resets the assistant
    """
    try:
        reset_assistant()
        conversations.clear()

        return {"message": "All conversations reset"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resetting conversations: {str(e)}")


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "Barbershop AI Assistant API",
        "version": "1.0.0",
        "description": "AI-powered API for barbershop appointment scheduling",
        "endpoints": {
            "health": "/health",
            "services": "/services",
            "chat": "/chat/message",
            "extract": "/chat/extract-appointment",
            "validate": "/chat/validate-appointment",
            "history": "/chat/history/{conversation_id}",
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=SERVER_HOST,
        port=SERVER_PORT,
        log_level="info",
    )
