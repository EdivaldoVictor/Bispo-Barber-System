"""
Pydantic models for request/response validation
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """Single chat message"""
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    """Request to process a chat message"""
    conversation_id: int = Field(..., description="Conversation ID")
    message: str = Field(..., description="User message")


class AppointmentData(BaseModel):
    """Extracted appointment data"""
    service: Optional[str] = Field(None, description="Service type: haircut, hair_eyebrow, or full_service")
    date: Optional[str] = Field(None, description="Appointment date in YYYY-MM-DD format")
    time: Optional[str] = Field(None, description="Appointment time in HH:MM format")
    barber_name: Optional[str] = Field(None, description="Preferred barber name")
    notes: Optional[str] = Field(None, description="Special notes or requests")


class ChatResponse(BaseModel):
    """Response from chat processing"""
    response: str = Field(..., description="AI assistant response")
    appointment_data: Optional[AppointmentData] = Field(None, description="Extracted appointment data if available")
    confidence: float = Field(..., description="Confidence level of extraction (0-1)")


class ConversationHistory(BaseModel):
    """Conversation history"""
    conversation_id: int = Field(..., description="Conversation ID")
    messages: List[ChatMessage] = Field(..., description="List of messages")


class ExtractAppointmentRequest(BaseModel):
    """Request to extract appointment from conversation"""
    conversation_id: int = Field(..., description="Conversation ID")


class ExtractAppointmentResponse(BaseModel):
    """Response with extracted appointment"""
    appointment_data: Optional[AppointmentData] = Field(None, description="Extracted appointment data")
    is_complete: bool = Field(..., description="Whether all required fields are present")
    validation_errors: List[str] = Field(default_factory=list, description="Validation errors if any")


class ValidateAppointmentRequest(BaseModel):
    """Request to validate appointment data"""
    appointment_data: AppointmentData = Field(..., description="Appointment data to validate")


class ValidateAppointmentResponse(BaseModel):
    """Response from appointment validation"""
    is_valid: bool = Field(..., description="Whether appointment data is valid")
    errors: List[str] = Field(default_factory=list, description="Validation errors if any")


class ServiceInfo(BaseModel):
    """Information about a service"""
    id: str = Field(..., description="Service ID")
    name: str = Field(..., description="Service name")
    price: float = Field(..., description="Service price in USD")
    duration: int = Field(..., description="Service duration in minutes")
    description: str = Field(..., description="Service description")


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Health status")
    message: str = Field(..., description="Status message")
    version: str = Field(..., description="API version")
