"""
WebSocket server for Social Stockfish.
"""

import asyncio
import json
import logging
from typing import Dict, Set, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

class ConnectionManager:
    """Manage WebSocket connections."""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.user_data: Dict[WebSocket, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket):
        """Connect a client."""
        await websocket.accept()
        self.active_connections.add(websocket)
        self.user_data[websocket] = {
            "conversation_history": [],
            "goal": None,
            "analysis_results": []
        }
        logger.info(f"Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Disconnect a client."""
        self.active_connections.remove(websocket)
        self.user_data.pop(websocket, None)
        logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast a message to all connected clients."""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting message: {e}")
                await self.disconnect(connection)

    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket):
        """Send a message to a specific client."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            await self.disconnect(websocket)

manager = ConnectionManager()

class Message(BaseModel):
    """Message model."""
    text: str

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint."""
    await manager.connect(websocket)
    
    try:
        while True:
            try:
                # Receive message
                data = await websocket.receive_json()
                logger.info(f"Received message: {data}")

                # Update conversation history
                if "text" in data:
                    user_data = manager.user_data[websocket]
                    user_data["conversation_history"].append({
                        "text": data["text"],
                        "sender": "user",
                        "timestamp": "now"  # Replace with actual timestamp
                    })

                    # Generate response using Social Stockfish
                    response = await generate_response(user_data)
                    user_data["conversation_history"].append(response)

                    # Send response
                    await manager.send_personal_message(
                        {"type": "message", "data": response},
                        websocket
                    )

                    # Generate and send analysis
                    analysis = await generate_analysis(user_data)
                    await manager.send_personal_message(
                        {"type": "analysis", "data": analysis},
                        websocket
                    )

                    # Generate and send state updates
                    await send_state_updates(websocket)

                # Update goal
                elif "goal" in data:
                    manager.user_data[websocket]["goal"] = data["goal"]
                    logger.info(f"Updated goal: {data['goal']}")

            except json.JSONDecodeError:
                logger.error("Invalid JSON received")
                continue

    except WebSocketDisconnect:
        manager.disconnect(websocket)

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

async def send_state_updates(websocket: WebSocket):
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
    await manager.send_personal_message(
        {"type": "state_update", "data": state_data},
        websocket
    )

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
    await manager.send_personal_message(
        {"type": "monte_carlo_update", "data": monte_carlo_data},
        websocket
    )

async def background_updates():
    """Send periodic background updates to all clients."""
    while True:
        for websocket in manager.active_connections:
            try:
                await send_state_updates(websocket)
            except Exception as e:
                logger.error(f"Error sending background updates: {e}")
                manager.disconnect(websocket)
        await asyncio.sleep(3)  # Update every 3 seconds

@app.on_event("startup")
async def startup_event():
    """Start background tasks."""
    asyncio.create_task(background_updates()) 