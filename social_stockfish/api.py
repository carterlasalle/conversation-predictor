"""
OpenRouter API client for Social Stockfish.
"""

import os
import asyncio
from typing import List, Dict, Any, Optional
import aiohttp
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential
from dotenv import load_dotenv

load_dotenv()

class OpenRouterClient:
    """
    Async client for OpenRouter API interactions.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://openrouter.ai/api/v1",
        default_models: Optional[Dict[str, str]] = None
    ):
        """Initialize the OpenRouter client."""
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError("OpenRouter API key is required")

        self.base_url = base_url
        self.default_models = default_models or {
            "user_proxy": "anthropic/claude-3-opus-20240229",
            "opponent_proxy": "anthropic/claude-3-opus-20240229",
            "evaluator": "anthropic/claude-3-sonnet-20240229"
        }

        self._session: Optional[aiohttp.ClientSession] = None
        self._credential_semaphore = asyncio.Semaphore(50)  # Rate limit protection

    async def __aenter__(self):
        """Async context manager entry."""
        await self.init_session()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()

    async def init_session(self):
        """Initialize the aiohttp session."""
        if self._session is None:
            self._session = aiohttp.ClientSession(
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
            )

    async def close(self):
        """Close the aiohttp session."""
        if self._session:
            await self._session.close()
            self._session = None

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def _make_request(
        self,
        endpoint: str,
        method: str = "POST",
        **kwargs
    ) -> Dict[str, Any]:
        """Make an API request with retry logic."""
        if self._session is None:
            await self.init_session()

        async with self._credential_semaphore:
            async with self._session.request(
                method,
                f"{self.base_url}/{endpoint}",
                **kwargs
            ) as response:
                response.raise_for_status()
                return await response.json()

    async def generate_responses(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        top_p: float = 0.9,
        max_tokens: int = 150,
        stop: Optional[List[str]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate responses using the specified model.
        """
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "top_p": top_p,
            "max_tokens": max_tokens,
            "stop": stop,
            **kwargs
        }

        try:
            response = await self._make_request(
                "chat/completions",
                json=payload
            )
            return response
        except Exception as e:
            logger.error(f"Error generating responses: {e}")
            raise

    async def generate_user_response(
        self,
        conversation_history: List[str],
        user_context: Dict[str, Any],
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate a response as the user proxy.
        """
        messages = self._format_conversation(
            conversation_history,
            user_context,
            is_user=True
        )
        return await self.generate_responses(
            messages,
            model=self.default_models["user_proxy"],
            **kwargs
        )

    async def generate_opponent_response(
        self,
        conversation_history: List[str],
        opponent_context: Dict[str, Any],
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate a response as the opponent proxy.
        """
        messages = self._format_conversation(
            conversation_history,
            opponent_context,
            is_user=False
        )
        return await self.generate_responses(
            messages,
            model=self.default_models["opponent_proxy"],
            **kwargs
        )

    async def evaluate_conversation(
        self,
        conversation: List[str],
        goal: str,
        **kwargs
    ) -> float:
        """
        Evaluate a conversation path and return a score.
        """
        messages = [
            {
                "role": "system",
                "content": (
                    "You are an expert conversation evaluator. "
                    "Your task is to score how well the conversation achieves its goal. "
                    f"The goal is: {goal}\n\n"
                    "Provide a score from 0 to 1, where:\n"
                    "0 = Completely fails to achieve the goal\n"
                    "1 = Perfectly achieves the goal\n\n"
                    "Respond with ONLY the numeric score."
                )
            },
            {
                "role": "user",
                "content": "\n".join(conversation)
            }
        ]

        response = await self.generate_responses(
            messages,
            model=self.default_models["evaluator"],
            max_tokens=10,
            **kwargs
        )

        try:
            score = float(response["choices"][0]["message"]["content"].strip())
            return max(0.0, min(1.0, score))  # Clamp between 0 and 1
        except (ValueError, KeyError, IndexError) as e:
            logger.error(f"Error parsing evaluation score: {e}")
            return 0.0

    def _format_conversation(
        self,
        history: List[str],
        context: Dict[str, Any],
        is_user: bool
    ) -> List[Dict[str, str]]:
        """
        Format conversation history and context for the API.
        """
        role = "user" if is_user else "opponent"
        style = context.get("style", "professional")
        personality = context.get("personality", "neutral")
        goals = context.get("goals", [])

        system_message = (
            f"You are acting as the {role} in this conversation. "
            f"Your communication style is {style}. "
            f"Your personality is {personality}. "
            f"Your goals are: {', '.join(goals)}\n\n"
            "Generate a natural, contextually appropriate next response "
            "that aligns with your character and goals."
        )

        messages = [{"role": "system", "content": system_message}]

        # Add conversation history
        for i, message in enumerate(history):
            messages.append({
                "role": "user" if i % 2 == (0 if is_user else 1) else "assistant",
                "content": message
            })

        return messages 