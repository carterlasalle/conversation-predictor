# Conversation Predictor

A real-time conversation prediction system using Monte Carlo Tree Search (MCTS) and large language models to predict and analyze conversation flows.

## Features

- Real-time conversation prediction using MCTS
- WebSocket-based communication between frontend and backend
- Integration with OpenRouter API for LLM access
- Interactive visualization of conversation trees
- Configurable conversation parameters and model settings

## Prerequisites

- Docker and Docker Compose
- Node.js 20.x LTS (for local development)
- Python 3.11 (for local development)
- OpenRouter API key

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/carterlasalle/conversation-predictor.git
   cd conversation-predictor
   ```

2. Set up environment variables:
   ```bash
   # Copy example environment files
   cp server/.env.example server/.env
   
   # Edit server/.env and add your OpenRouter API key
   ```

3. Build and start the containers:
   ```bash
   docker-compose up --build
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8001

## Development Setup

### Frontend (Next.js + TypeScript)

```bash
cd frontend
yarn install
yarn dev
```

### Backend (FastAPI + Python)

```bash
cd server
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
uv pip install -r requirements.txt
uvicorn main:app --reload
```

## Project Structure

```
.
├── frontend/                # Next.js frontend application
│   ├── src/                # Source code
│   ├── public/             # Static files
│   └── package.json        # Dependencies and scripts
├── server/                 # FastAPI backend application
│   ├── main.py            # Application entry point
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
└── docker-compose.yml      # Docker services configuration
```

## Configuration

### Frontend Environment Variables

- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_WS_URL`: WebSocket server URL

### Backend Environment Variables

See `server/.env.example` for all available configuration options.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenRouter for providing LLM API access
- FastAPI for the backend framework
- Next.js for the frontend framework 