"""
Main conversation engine for Social Stockfish.
"""

from typing import List, Dict, Any, Optional
from loguru import logger

from social_stockfish.models import (
    ConversationNode,
    ConversationResponse,
    SimulationConfig,
    UserContext,
    ConversationState
)
from social_stockfish.api import OpenRouterClient
from social_stockfish.mcts import MCTS


class ConversationEngine:
    """
    Main engine for conversation optimization.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        config: Optional[SimulationConfig] = None,
        exploration_constant: float = 1.41
    ):
        """Initialize the conversation engine."""
        self.api_client = OpenRouterClient(api_key=api_key)
        self.config = config or SimulationConfig()
        self.mcts = MCTS(
            api_client=self.api_client,
            config=self.config,
            exploration_constant=exploration_constant
        )

    async def __aenter__(self):
        """Async context manager entry."""
        await self.api_client.init_session()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.api_client.close()

    async def get_next_response(
        self,
        conversation_history: List[str],
        goal: str,
        user_context: Dict[str, Any],
        opponent_context: Optional[Dict[str, Any]] = None,
        num_simulations: int = 100
    ) -> ConversationResponse:
        """
        Get the best next response for the current conversation state.
        """
        try:
            # Create root node from current state
            root = ConversationNode(
                message=conversation_history[-1] if conversation_history else "",
                probability=1.0,
                turn_type="opponent" if conversation_history else "user",
                metadata={"visits": 1}
            )

            # Create user context
            user_ctx = UserContext(
                style=user_context.get("style", "professional"),
                personality=user_context.get("personality", "friendly"),
                goals=[goal],
                constraints=user_context.get("constraints", {})
            )

            # Use default opponent context if none provided
            opp_context = opponent_context or {
                "style": "professional",
                "personality": "neutral",
                "goals": ["engage in meaningful conversation"]
            }

            # Perform MCTS search
            best_node = await self.mcts.search(
                root=root,
                user_context=user_ctx,
                opponent_context=opp_context,
                num_simulations=num_simulations
            )

            # Get best path and alternatives
            best_path = self.mcts.get_best_path(best_node)
            alternatives = self._get_alternative_responses(best_node)

            return ConversationResponse(
                message=best_node.message,
                confidence=best_node.score or 0.0,
                alternatives=alternatives,
                metadata={
                    "path_probability": best_path.total_probability,
                    "path_length": best_path.length,
                    "simulations": num_simulations
                }
            )

        except Exception as e:
            logger.error(f"Error getting next response: {e}")
            raise

    def _get_alternative_responses(
        self,
        node: ConversationNode,
        max_alternatives: int = 3
    ) -> List[Dict[str, float]]:
        """
        Get alternative responses with their scores.
        """
        if not node.parent or not node.parent.children:
            return []

        siblings = [
            n for n in node.parent.children
            if n != node and n.score is not None
        ]

        # Sort by score and probability
        siblings.sort(
            key=lambda n: (n.score or 0) * n.probability,
            reverse=True
        )

        return [
            {"message": n.message, "score": n.score or 0}
            for n in siblings[:max_alternatives]
        ]

    async def evaluate_conversation(
        self,
        conversation: List[str],
        goal: str
    ) -> float:
        """
        Evaluate an entire conversation against a goal.
        """
        return await self.api_client.evaluate_conversation(conversation, goal)

    async def analyze_conversation(
        self,
        conversation_history: List[str],
        goal: str,
        user_context: Dict[str, Any],
        depth: int = 3
    ) -> Dict[str, Any]:
        """
        Analyze possible future paths for the conversation.
        """
        # Create temporary config with smaller depth
        temp_config = SimulationConfig(
            max_depth=depth,
            branching_factor=self.config.branching_factor,
            prune_threshold=self.config.prune_threshold,
            batch_size=self.config.batch_size
        )

        # Create temporary MCTS instance
        temp_mcts = MCTS(
            api_client=self.api_client,
            config=temp_config,
            exploration_constant=self.mcts.exploration_constant
        )

        # Create root node
        root = ConversationNode(
            message=conversation_history[-1] if conversation_history else "",
            probability=1.0,
            turn_type="opponent" if conversation_history else "user",
            metadata={"visits": 1}
        )

        # Create user context
        user_ctx = UserContext(
            style=user_context.get("style", "professional"),
            personality=user_context.get("personality", "friendly"),
            goals=[goal],
            constraints=user_context.get("constraints", {})
        )

        # Perform limited search
        best_node = await temp_mcts.search(
            root=root,
            user_context=user_ctx,
            opponent_context={
                "style": "professional",
                "personality": "neutral",
                "goals": ["engage in meaningful conversation"]
            },
            num_simulations=50
        )

        # Get best path and top alternatives
        best_path = temp_mcts.get_best_path(best_node)
        
        return {
            "best_path": {
                "messages": best_path.messages,
                "probability": best_path.total_probability,
                "score": best_path.final_score
            },
            "alternative_paths": [
                {
                    "messages": temp_mcts.get_best_path(child).messages,
                    "probability": child.probability,
                    "score": child.score or 0.0
                }
                for child in root.children[:3]
                if child != best_node
            ],
            "analysis": {
                "total_nodes_explored": sum(
                    node.metadata.get("visits", 0)
                    for node in self._get_all_nodes(root)
                ),
                "max_depth_reached": max(
                    node.depth
                    for node in self._get_all_nodes(root)
                ),
                "branching_factor": len(root.children)
            }
        }

    def _get_all_nodes(self, root: ConversationNode) -> List[ConversationNode]:
        """Get all nodes in the tree."""
        nodes = [root]
        for child in root.children:
            nodes.extend(self._get_all_nodes(child))
        return nodes 