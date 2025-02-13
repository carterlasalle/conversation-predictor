"""
Core data structures for the Social Stockfish system.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class ConversationNode(BaseModel):
    """
    Represents a single node in the conversation tree.
    Each node contains a message, its probability, and links to child nodes.
    """
    message: str = Field(..., description="The text content of this conversation turn")
    probability: float = Field(..., ge=0.0, le=1.0, description="Probability of this response")
    score: Optional[float] = Field(None, description="Evaluation score for this path")
    children: List["ConversationNode"] = Field(default_factory=list, description="Child nodes")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    parent: Optional["ConversationNode"] = Field(None, description="Parent node reference")
    depth: int = Field(0, description="Depth in the conversation tree")
    turn_type: str = Field(..., description="Type of turn: 'user' or 'opponent'")

    def add_child(self, child: "ConversationNode") -> None:
        """Add a child node to this node."""
        child.parent = self
        child.depth = self.depth + 1
        self.children.append(child)

    def get_path_to_root(self) -> List["ConversationNode"]:
        """Get the path from this node to the root."""
        path = [self]
        current = self
        while current.parent is not None:
            current = current.parent
            path.append(current)
        return list(reversed(path))

    def get_conversation_history(self) -> List[str]:
        """Get the conversation history from root to this node."""
        return [node.message for node in self.get_path_to_root()]

    class Config:
        arbitrary_types_allowed = True


class ConversationPath(BaseModel):
    """
    Represents a complete conversation path from root to leaf.
    """
    nodes: List[ConversationNode] = Field(..., description="Nodes in this path")
    total_probability: float = Field(..., ge=0.0, le=1.0, description="Combined probability")
    final_score: float = Field(..., description="Final evaluation score")

    @property
    def messages(self) -> List[str]:
        """Get all messages in this path."""
        return [node.message for node in self.nodes]

    @property
    def length(self) -> int:
        """Get the length of this path."""
        return len(self.nodes)


class SimulationConfig(BaseModel):
    """
    Configuration for the Monte Carlo simulation.
    """
    max_depth: int = Field(5, ge=1, description="Maximum conversation depth")
    branching_factor: int = Field(3, ge=1, description="Number of responses to generate per turn")
    prune_threshold: float = Field(0.1, ge=0.0, le=1.0, description="Probability threshold for pruning")
    batch_size: int = Field(10, ge=1, description="Batch size for API calls")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="Temperature for response generation")
    top_p: float = Field(0.9, ge=0.0, le=1.0, description="Top-p sampling parameter")
    cache_size: int = Field(1000, ge=0, description="Size of response cache")


class ConversationResponse(BaseModel):
    """
    Response from the conversation engine.
    """
    message: str = Field(..., description="Best next response")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    alternatives: List[Dict[str, float]] = Field(
        ...,
        description="Alternative responses with their scores"
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata about the response"
    )


class UserContext(BaseModel):
    """
    Context information about the user.
    """
    style: str = Field(..., description="Conversation style (e.g., 'professional', 'casual')")
    personality: str = Field(..., description="User's personality traits")
    goals: List[str] = Field(..., description="User's conversation goals")
    constraints: Dict[str, Any] = Field(
        default_factory=dict,
        description="Any constraints on the conversation"
    )


class ConversationState(BaseModel):
    """
    Current state of the conversation.
    """
    history: List[str] = Field(..., description="Conversation history")
    current_goal: str = Field(..., description="Current conversation goal")
    user_context: UserContext = Field(..., description="User context information")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional state information"
    ) 