"""
WebSocket server for Social Stockfish using socket.io.
"""

import asyncio
import json
import logging
from typing import Dict, Set, Any, Optional
from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
import socketio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI()

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=['http://localhost:3000']
)

# Wrap with ASGI app
socket_app = socketio.ASGIApp(sio, app)

# Store client data
client_data: Dict[str, Dict[str, Any]] = {}

@sio.event
async def connect(sid, environ):
    """Handle client connection."""
    logger.info(f"Client connected: {sid}")
    client_data[sid] = {
        "conversation_history": [],
        "goal": None,
        "analysis_results": []
    }

@sio.event
async def disconnect(sid):
    """Handle client disconnection."""
    logger.info(f"Client disconnected: {sid}")
    client_data.pop(sid, None)

@sio.on('message')
async def handle_message(sid, data):
    """Handle incoming messages."""
    try:
        logger.info(f"Received message from {sid}: {data}")
        
        # Update conversation history
        user_data = client_data[sid]
        user_data["conversation_history"].append({
            "text": data["text"],
            "sender": "user",
            "timestamp": "now"  # Replace with actual timestamp
        })

        # Generate response using Social Stockfish
        response = await generate_response(user_data)
        user_data["conversation_history"].append(response)

        # Send response
        await sio.emit('message', response, room=sid)

        # Generate and send analysis
        analysis = await generate_analysis(user_data)
        await sio.emit('analysis', analysis, room=sid)

        # Generate and send state updates
        await send_state_updates(sid)

    except Exception as e:
        logger.error(f"Error handling message: {e}")
        await sio.emit('error', {"message": str(e)}, room=sid)

@sio.on('update_goal')
async def handle_goal_update(sid, data):
    """Handle goal updates."""
    try:
        client_data[sid]["goal"] = data["goal"]
        logger.info(f"Updated goal for {sid}: {data['goal']}")
    except Exception as e:
        logger.error(f"Error updating goal: {e}")
        await sio.emit('error', {"message": str(e)}, room=sid)

async def generate_response(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a response using Social Stockfish."""
    # TODO: Implement actual response generation
    return {
        "text": "This is a mock response",
        "sender": "assistant",
        "timestamp": "now"  # Replace with actual timestamp
    }

async def generate_analysis(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate conversation analysis."""
    # TODO: Implement actual analysis
    return {
        "score": np.random.random(),
        "message": "Mock analysis message",
        "alternatives": []
    }

async def send_state_updates(sid: str):
    """Send state exploration and Monte Carlo updates."""
    # Generate state exploration data
    state_data = {
        "dots": [
            {
                "x": i % 40 * 8 + 8,
                "y": i // 40 * 8 + 8,
                "active": np.random.random() > 0.7
            }
            for i in range(600)
        ]
    }
    await sio.emit('state_update', state_data, room=sid)

    # Generate Monte Carlo data
    monte_carlo_data = {
        "dots": [
            {
                "x": i % 40 * 8 + 8,
                "y": i // 40 * 8 + 8,
                "state": np.random.choice(
                    ["success", "warning", "error", "neutral"],
                    p=[0.3, 0.3, 0.2, 0.2]
                )
            }
            for i in range(600)
        ]
    }
    await sio.emit('monte_carlo_update', monte_carlo_data, room=sid)

async def background_updates():
    """Send periodic background updates to all clients."""
    while True:
        for sid in client_data:
            try:
                await send_state_updates(sid)
            except Exception as e:
                logger.error(f"Error sending background updates: {e}")
                client_data.pop(sid, None)
        await asyncio.sleep(3)  # Update every 3 seconds

@app.on_event("startup")
async def startup_event():
    """Start background tasks."""
    asyncio.create_task(background_updates()) 