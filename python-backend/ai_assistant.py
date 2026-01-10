"""
AI Assistant module using LangChain and OpenAI GPT-4
Handles natural language processing for barbershop appointment scheduling
"""
import json
import re
from typing import Optional, Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
    BARBERSHOP_SYSTEM_PROMPT,
    SERVICES
)


class BarbershopAIAssistant:
    """AI Assistant for barbershop appointment scheduling"""

    def __init__(self):
        """Initialize the AI assistant with GEMINI FLASH"""
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY environment variable is not set")

        self.llm = ChatGoogleGenerativeAI(
            google_api_key=GEMINI_API_KEY,
            model=GEMINI_MODEL,
            temperature=0.7,
            max_tokens=1000,
        )

        self.system_prompt = BARBERSHOP_SYSTEM_PROMPT
        self.conversation_history = []

    def add_message(self, role: str, content: str) -> None:
        """Add a message to the conversation history"""
        self.conversation_history.append({"role": role, "content": content})

    def get_conversation_history(self) -> list:
        """Get the full conversation history"""
        return self.conversation_history

    def clear_history(self) -> None:
        """Clear the conversation history"""
        self.conversation_history = []

    def process_message(self, user_message: str) -> Dict[str, Any]:
       
       # Add user message to history
        self.add_message("user", user_message)

        # Build messages for the LLM
        messages = [SystemMessage(content=self.system_prompt)]

        # Add conversation history
        for msg in self.conversation_history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            else:
                messages.append(AIMessage(content=msg["content"]))

        # Get response from LLM
        
        response = self.llm.invoke(messages)
        
        # ⚠️ SEMPRE usar response.content
        assistant_text = response.content


        # Add AI response to history
        self.add_message("assistant", assistant_text)

        # Extract appointment data if available
        appointment_data = self._extract_appointment_data(assistant_text)

        return {
            "response": assistant_text,
            "appointment_data": appointment_data,
            "confidence": self._calculate_confidence(appointment_data),
        }

    def _extract_appointment_data(self, response: str) -> Optional[Dict[str, Any]]:
        """
        Extract appointment data from the AI response
        
        Args:
            response: The AI's response text
            
        Returns:
            Dictionary with appointment data or None if not ready
        """
        # Look for JSON block in the response
        json_pattern = r"```json\n(.*?)\n```"
        matches = re.findall(json_pattern, response, re.DOTALL)

        if not matches:
            return None

        try:
            data = json.loads(matches[0])
            if data.get("appointment_ready"):
                return {
                    "service": data.get("service"),
                    "date": data.get("date"),
                    "time": data.get("time"),
                    "barber_name": data.get("barber_name"),
                    "notes": data.get("notes"),
                }
        except json.JSONDecodeError:
            pass

        return None

    def _calculate_confidence(self, appointment_data: Optional[Dict]) -> float:
        """
        Calculate confidence level of appointment extraction
        
        Args:
            appointment_data: The extracted appointment data
            
        Returns:
            Confidence score between 0 and 1
        """
        if not appointment_data:
            return 0.0

        required_fields = ["service", "date", "time"]
        present_fields = sum(1 for field in required_fields if appointment_data.get(field))

        return present_fields / len(required_fields)

    def extract_appointment_from_conversation(self) -> Optional[Dict[str, Any]]:
        """
        Extract appointment information from the entire conversation
        
        Returns:
            Dictionary with appointment data or None
        """
        if not self.conversation_history:
            return None

        # Create a summary request
        summary_prompt = f"""Based on this conversation history, extract the appointment details if they are complete:

Conversation:
{self._format_conversation_for_summary()}

Please respond with ONLY a JSON object (no markdown) with this structure:
{{
  "service": "haircut|hair_eyebrow|full_service or null",
  "date": "YYYY-MM-DD or null",
  "time": "HH:MM or null",
  "barber_name": "name or null",
  "notes": "special notes or null"
}}"""

        messages = [
            SystemMessage(content="You are a data extraction assistant. Extract appointment information from conversations."),
            HumanMessage(content=summary_prompt),
        ]

        response = self.llm.invoke(messages)
        
        try:
            # Try to parse JSON from response
            json_str = response.content.strip()
            # Remove markdown code blocks if present
            json_str = re.sub(r"```json\n?|\n?```", "", json_str)
            data = json.loads(json_str)
            
            # Validate that we have at least the required fields
            if data.get("service") and data.get("date") and data.get("time"):
                return data
        except (json.JSONDecodeError, AttributeError):
            pass

        return None

    def _format_conversation_for_summary(self) -> str:
        """Format conversation history for summary"""
        formatted = []
        for msg in self.conversation_history:
            role = "Customer" if msg["role"] == "user" else "Assistant"
            formatted.append(f"{role}: {msg['content']}")
        return "\n".join(formatted)

    def validate_appointment_data(self, data: Dict[str, Any]) -> tuple[bool, list[str]]:
        """
        Validate appointment data
        
        Args:
            data: The appointment data to validate
            
        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []

        # Check service
        if not data.get("service") or data["service"] not in SERVICES:
            errors.append(f"Invalid service. Must be one of: {', '.join(SERVICES.keys())}")

        # Check date format
        if not data.get("date"):
            errors.append("Date is required")
        elif not self._is_valid_date(data["date"]):
            errors.append("Invalid date format. Use YYYY-MM-DD")

        # Check time format
        if not data.get("time"):
            errors.append("Time is required")
        elif not self._is_valid_time(data["time"]):
            errors.append("Invalid time format. Use HH:MM")

        return len(errors) == 0, errors

    @staticmethod
    def _is_valid_date(date_str: str) -> bool:
        """Check if date string is valid YYYY-MM-DD format"""
        import re
        return bool(re.match(r"^\d{4}-\d{2}-\d{2}$", date_str))

    @staticmethod
    def _is_valid_time(time_str: str) -> bool:
        """Check if time string is valid HH:MM format"""
        import re
        return bool(re.match(r"^\d{2}:\d{2}$", time_str))


# Global assistant instance
_assistant_instance: Optional[BarbershopAIAssistant] = None


def get_assistant() -> BarbershopAIAssistant:
    """Get or create the global assistant instance"""
    global _assistant_instance
    if _assistant_instance is None:
        _assistant_instance = BarbershopAIAssistant()
    return _assistant_instance


def reset_assistant() -> None:
    """Reset the global assistant instance"""
    global _assistant_instance
    _assistant_instance = None
