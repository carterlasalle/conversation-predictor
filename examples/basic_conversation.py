"""
Basic example of using the Social Stockfish conversation engine.
"""

import asyncio
import json
from typing import List, Dict
import argparse
from loguru import logger

from social_stockfish import ConversationEngine, SimulationConfig


async def run_conversation(
    goal: str,
    initial_message: str,
    user_context: Dict,
    max_turns: int = 5,
    debug: bool = False
):
    """Run a sample conversation."""
    if debug:
        logger.add("conversation.log", level="DEBUG")
    else:
        logger.add("conversation.log", level="INFO")

    config = SimulationConfig(
        max_depth=5,
        branching_factor=3,
        prune_threshold=0.1,
        batch_size=10,
        temperature=0.7,
        top_p=0.9,
        cache_size=1000
    )

    async with ConversationEngine(config=config) as engine:
        conversation: List[str] = [initial_message]
        logger.info(f"Initial message: {initial_message}")
        logger.info(f"Conversation goal: {goal}")

        for turn in range(max_turns):
            logger.info(f"\nTurn {turn + 1}:")

            # Get next response
            response = await engine.get_next_response(
                conversation_history=conversation,
                goal=goal,
                user_context=user_context
            )

            # Add response to conversation
            conversation.append(response.message)
            logger.info(f"Response: {response.message}")
            logger.info(f"Confidence: {response.confidence:.2f}")

            if debug:
                logger.debug("Alternative responses:")
                for alt in response.alternatives:
                    logger.debug(f"- {alt['message']} (score: {alt['score']:.2f})")
                logger.debug(f"Metadata: {json.dumps(response.metadata, indent=2)}")

            # Analyze conversation state
            if debug:
                analysis = await engine.analyze_conversation(
                    conversation_history=conversation,
                    goal=goal,
                    user_context=user_context,
                    depth=3
                )
                logger.debug(f"Analysis: {json.dumps(analysis, indent=2)}")

        # Final evaluation
        final_score = await engine.evaluate_conversation(conversation, goal)
        logger.info(f"\nFinal conversation score: {final_score:.2f}")
        logger.info("\nFinal conversation:")
        for i, message in enumerate(conversation):
            logger.info(f"[{'User' if i % 2 == 0 else 'Assistant'}]: {message}")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Run a sample conversation")
    parser.add_argument("--goal", type=str, default="Schedule a meeting for next week")
    parser.add_argument("--message", type=str, default="Hi, I'd like to schedule a meeting.")
    parser.add_argument("--turns", type=int, default=5)
    parser.add_argument("--debug", action="store_true")
    args = parser.parse_args()

    user_context = {
        "style": "professional",
        "personality": "friendly but direct",
        "goals": [args.goal],
        "constraints": {
            "time": "business hours",
            "duration": "1 hour"
        }
    }

    asyncio.run(run_conversation(
        goal=args.goal,
        initial_message=args.message,
        user_context=user_context,
        max_turns=args.turns,
        debug=args.debug
    ))


if __name__ == "__main__":
    main() 