"""
Social Stockfish - Conversation Optimization System
"""

from social_stockfish.engine import ConversationEngine
from social_stockfish.models import (
    ConversationNode,
    ConversationPath,
    SimulationConfig,
    ConversationResponse
)

__version__ = "0.1.0"
__author__ = "Carter Lasalle"

__all__ = [
    "ConversationEngine",
    "ConversationNode",
    "ConversationPath",
    "SimulationConfig",
    "ConversationResponse"
] 