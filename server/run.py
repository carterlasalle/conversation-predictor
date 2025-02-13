"""
Server startup script for Social Stockfish.
"""

import os
import uvicorn
from dotenv import load_dotenv
from loguru import logger

# Load environment variables
load_dotenv()

# Configure logging
logger.add(
    "logs/server.log",
    rotation="500 MB",
    retention="10 days",
    level="INFO",
    backtrace=True,
    diagnose=True
)

def main():
    """Start the server."""
    try:
        # Get configuration from environment variables
        host = os.getenv("HOST", "0.0.0.0")
        port = int(os.getenv("PORT", "8001"))
        reload = os.getenv("RELOAD", "false").lower() == "true"
        workers = int(os.getenv("WORKERS", "1"))
        log_level = os.getenv("LOG_LEVEL", "info")

        # Log startup configuration
        logger.info(f"Starting server on {host}:{port}")
        logger.info(f"Workers: {workers}")
        logger.info(f"Auto-reload: {reload}")
        logger.info(f"Log level: {log_level}")

        # Create logs directory if it doesn't exist
        os.makedirs("logs", exist_ok=True)

        # Start server
        uvicorn.run(
            "websocket_server:app",
            host=host,
            port=port,
            reload=reload,
            workers=workers,
            log_level=log_level,
            ws_ping_interval=20,
            ws_ping_timeout=20,
            timeout_keep_alive=30,
            loop="auto"
        )

    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        raise

if __name__ == "__main__":
    main() 