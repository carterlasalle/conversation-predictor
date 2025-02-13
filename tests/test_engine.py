"""
Tests for the Social Stockfish conversation engine.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import json

from social_stockfish import (
    ConversationEngine,
    ConversationNode,
    SimulationConfig,
    UserContext,
    ConversationResponse
)
from social_stockfish.api import OpenRouterClient
from social_stockfish.mcts import MCTS


@pytest.fixture
def mock_api_response():
    """Mock API response fixture."""
    return {
        "choices": [
            {
                "message": {
                    "content": "Test response",
                    "probability": 0.8
                }
            }
        ]
    }


@pytest.fixture
def mock_api_client(mock_api_response):
    """Mock API client fixture."""
    client = AsyncMock(spec=OpenRouterClient)
    client.generate_responses.return_value = mock_api_response
    client.generate_user_response.return_value = mock_api_response
    client.generate_opponent_response.return_value = mock_api_response
    client.evaluate_conversation.return_value = 0.75
    return client


@pytest.fixture
def config():
    """Test configuration fixture."""
    return SimulationConfig(
        max_depth=3,
        branching_factor=2,
        prune_threshold=0.1,
        batch_size=5,
        temperature=0.7,
        top_p=0.9,
        cache_size=100
    )


@pytest.fixture
def user_context():
    """Test user context fixture."""
    return {
        "style": "professional",
        "personality": "friendly",
        "goals": ["test goal"],
        "constraints": {}
    }


@pytest.mark.asyncio
async def test_conversation_engine_initialization():
    """Test conversation engine initialization."""
    engine = ConversationEngine()
    assert isinstance(engine.config, SimulationConfig)
    assert isinstance(engine.api_client, OpenRouterClient)
    assert isinstance(engine.mcts, MCTS)


@pytest.mark.asyncio
async def test_get_next_response(mock_api_client, config, user_context):
    """Test getting next response."""
    engine = ConversationEngine(config=config)
    engine.api_client = mock_api_client
    
    conversation = ["Hello", "Hi there"]
    goal = "test goal"
    
    response = await engine.get_next_response(
        conversation_history=conversation,
        goal=goal,
        user_context=user_context
    )
    
    assert isinstance(response, ConversationResponse)
    assert isinstance(response.message, str)
    assert isinstance(response.confidence, float)
    assert isinstance(response.alternatives, list)
    assert isinstance(response.metadata, dict)


@pytest.mark.asyncio
async def test_evaluate_conversation(mock_api_client, config):
    """Test conversation evaluation."""
    engine = ConversationEngine(config=config)
    engine.api_client = mock_api_client
    
    conversation = ["Hello", "Hi there", "How are you?"]
    goal = "test goal"
    
    score = await engine.evaluate_conversation(conversation, goal)
    assert isinstance(score, float)
    assert 0 <= score <= 1


@pytest.mark.asyncio
async def test_analyze_conversation(mock_api_client, config, user_context):
    """Test conversation analysis."""
    engine = ConversationEngine(config=config)
    engine.api_client = mock_api_client
    
    conversation = ["Hello", "Hi there"]
    goal = "test goal"
    
    analysis = await engine.analyze_conversation(
        conversation_history=conversation,
        goal=goal,
        user_context=user_context
    )
    
    assert isinstance(analysis, dict)
    assert "best_path" in analysis
    assert "alternative_paths" in analysis
    assert "analysis" in analysis


@pytest.mark.asyncio
async def test_error_handling(mock_api_client, config, user_context):
    """Test error handling."""
    engine = ConversationEngine(config=config)
    engine.api_client = mock_api_client
    
    # Simulate API error
    mock_api_client.generate_responses.side_effect = Exception("API Error")
    
    with pytest.raises(Exception):
        await engine.get_next_response(
            conversation_history=["Hello"],
            goal="test goal",
            user_context=user_context
        )


@pytest.mark.asyncio
async def test_conversation_node_operations():
    """Test conversation node operations."""
    root = ConversationNode(
        message="Hello",
        probability=1.0,
        turn_type="user",
        metadata={"visits": 1}
    )
    
    child = ConversationNode(
        message="Hi there",
        probability=0.8,
        turn_type="opponent",
        metadata={"visits": 1}
    )
    
    root.add_child(child)
    
    assert len(root.children) == 1
    assert child.parent == root
    assert child.depth == 1
    
    path = child.get_path_to_root()
    assert len(path) == 2
    assert path[0] == root
    assert path[1] == child
    
    history = child.get_conversation_history()
    assert len(history) == 2
    assert history[0] == "Hello"
    assert history[1] == "Hi there"


@pytest.mark.asyncio
async def test_mcts_search(mock_api_client, config, user_context):
    """Test MCTS search."""
    mcts = MCTS(api_client=mock_api_client, config=config)
    
    root = ConversationNode(
        message="Hello",
        probability=1.0,
        turn_type="user",
        metadata={"visits": 1}
    )
    
    user_ctx = UserContext(**user_context)
    opponent_context = {
        "style": "professional",
        "personality": "neutral",
        "goals": ["engage in conversation"]
    }
    
    best_node = await mcts.search(
        root=root,
        user_context=user_ctx,
        opponent_context=opponent_context,
        num_simulations=10
    )
    
    assert isinstance(best_node, ConversationNode)
    assert best_node.score is not None
    assert best_node.probability > 0


@pytest.mark.asyncio
async def test_api_client_operations(mock_api_response):
    """Test API client operations."""
    client = OpenRouterClient()
    
    with patch("aiohttp.ClientSession.request") as mock_request:
        mock_request.return_value.__aenter__.return_value.json = AsyncMock(
            return_value=mock_api_response
        )
        mock_request.return_value.__aenter__.return_value.raise_for_status = MagicMock()
        
        response = await client.generate_responses(
            messages=[{"role": "user", "content": "Hello"}],
            model="test-model"
        )
        
        assert response == mock_api_response 