"""
Monte Carlo Tree Search implementation for conversation path optimization.
"""

import asyncio
import math
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from loguru import logger

from social_stockfish.models import (
    ConversationNode,
    ConversationPath,
    SimulationConfig,
    UserContext
)
from social_stockfish.api import OpenRouterClient


class MCTS:
    """
    Monte Carlo Tree Search implementation for conversation optimization.
    """

    def __init__(
        self,
        api_client: OpenRouterClient,
        config: SimulationConfig,
        exploration_constant: float = 1.41  # UCB1 exploration parameter
    ):
        """Initialize the MCTS system."""
        self.api_client = api_client
        self.config = config
        self.exploration_constant = exploration_constant
        self._cache: Dict[str, Any] = {}

    def _get_cache_key(self, node: ConversationNode) -> str:
        """Generate a cache key for a conversation state."""
        return "|".join(node.get_conversation_history())

    async def search(
        self,
        root: ConversationNode,
        user_context: UserContext,
        opponent_context: Dict[str, Any],
        num_simulations: int = 100
    ) -> ConversationNode:
        """
        Perform Monte Carlo Tree Search to find the best next move.
        """
        for _ in range(num_simulations):
            # Selection
            node = self._select(root)

            # Expansion
            if not node.children and node.depth < self.config.max_depth:
                await self._expand(node, user_context, opponent_context)

            # Simulation
            if node.children:
                score = await self._simulate(
                    node,
                    user_context,
                    opponent_context
                )
            else:
                score = await self._evaluate_terminal(
                    node,
                    user_context.goals[0]  # Using first goal for now
                )

            # Backpropagation
            self._backpropagate(node, score)

        # Return best child of root
        return self._get_best_child(root, exploration=False)

    def _select(self, node: ConversationNode) -> ConversationNode:
        """
        Select a node for expansion using UCB1.
        """
        current = node
        while current.children:
            if not all(child.score is not None for child in current.children):
                # If any child is unvisited, select it
                unvisited = [c for c in current.children if c.score is None]
                return np.random.choice(unvisited)
            current = self._get_best_child(current, exploration=True)
        return current

    async def _expand(
        self,
        node: ConversationNode,
        user_context: UserContext,
        opponent_context: Dict[str, Any]
    ) -> None:
        """
        Expand a node by generating possible responses.
        """
        history = node.get_conversation_history()
        is_user_turn = node.depth % 2 == 0

        # Generate responses in parallel
        tasks = []
        for _ in range(self.config.branching_factor):
            if is_user_turn:
                task = self.api_client.generate_user_response(
                    history,
                    user_context.dict(),
                    temperature=self.config.temperature,
                    top_p=self.config.top_p
                )
            else:
                task = self.api_client.generate_opponent_response(
                    history,
                    opponent_context,
                    temperature=self.config.temperature,
                    top_p=self.config.top_p
                )
            tasks.append(task)

        responses = await asyncio.gather(*tasks, return_exceptions=True)

        valid_responses = []
        for response in responses:
            if isinstance(response, Exception):
                logger.error(f"Error generating response: {response}")
                continue
            try:
                message = response["choices"][0]["message"]["content"]
                probability = float(response["choices"][0]["message"].get("probability", 0.5))
                valid_responses.append((message, probability))
            except (KeyError, IndexError, ValueError) as e:
                logger.error(f"Error parsing response: {e}")
                continue

        # Create child nodes
        for message, probability in valid_responses:
            child = ConversationNode(
                message=message,
                probability=probability,
                turn_type="user" if is_user_turn else "opponent",
                metadata={"visits": 0}
            )
            node.add_child(child)

    async def _simulate(
        self,
        node: ConversationNode,
        user_context: UserContext,
        opponent_context: Dict[str, Any]
    ) -> float:
        """
        Simulate a random path from node to terminal state.
        """
        current = node
        path = []

        while current.depth < self.config.max_depth:
            if not current.children:
                await self._expand(current, user_context, opponent_context)
                if not current.children:
                    break
            current = np.random.choice(current.children)
            path.append(current)

        return await self._evaluate_terminal(
            current,
            user_context.goals[0]  # Using first goal for now
        )

    async def _evaluate_terminal(
        self,
        node: ConversationNode,
        goal: str
    ) -> float:
        """
        Evaluate a terminal state.
        """
        cache_key = self._get_cache_key(node)
        if cache_key in self._cache:
            return self._cache[cache_key]

        conversation = node.get_conversation_history()
        score = await self.api_client.evaluate_conversation(conversation, goal)

        # Cache the result
        self._cache[cache_key] = score
        if len(self._cache) > self.config.cache_size:
            # Remove a random key if cache is full
            del self._cache[np.random.choice(list(self._cache.keys()))]

        return score

    def _backpropagate(self, node: ConversationNode, score: float) -> None:
        """
        Backpropagate the evaluation score up the tree.
        """
        current = node
        while current is not None:
            current.metadata["visits"] = current.metadata.get("visits", 0) + 1
            if current.score is None:
                current.score = score
            else:
                current.score = (current.score * (current.metadata["visits"] - 1) + score) / current.metadata["visits"]
            current = current.parent

    def _get_best_child(
        self,
        node: ConversationNode,
        exploration: bool
    ) -> ConversationNode:
        """
        Select the best child node using UCB1 formula.
        """
        if exploration:
            # UCB1 formula
            log_parent_visits = math.log(node.metadata["visits"])
            ucb_scores = []
            for child in node.children:
                if child.score is None:
                    ucb_scores.append(float("inf"))
                else:
                    exploitation = child.score
                    exploration_term = self.exploration_constant * math.sqrt(
                        log_parent_visits / child.metadata["visits"]
                    )
                    ucb_scores.append(exploitation + exploration_term)
            return node.children[np.argmax(ucb_scores)]
        else:
            # For final selection, use score and visit count
            scores = [
                (child.score or 0) * child.probability * math.sqrt(child.metadata["visits"])
                for child in node.children
            ]
            return node.children[np.argmax(scores)]

    def get_best_path(self, node: ConversationNode) -> ConversationPath:
        """
        Get the best conversation path from a node.
        """
        path = [node]
        current = node
        total_prob = node.probability

        while current.children:
            current = self._get_best_child(current, exploration=False)
            path.append(current)
            total_prob *= current.probability

        return ConversationPath(
            nodes=path,
            total_probability=total_prob,
            final_score=path[-1].score or 0.0
        ) 