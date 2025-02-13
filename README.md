# Conversation Predictor

A real-time conversation analysis and prediction system that uses advanced language models to analyze conversations and predict potential outcomes.

## Features

- Real-time conversation analysis using WebSocket communication
- Interactive visualization of conversation states using D3.js
- Monte Carlo tree search for conversation path prediction
- Modern, responsive UI built with Next.js and TailwindCSS
- Scalable backend architecture using FastAPI and WebSocket

## Prerequisites

- Docker and Docker Compose
- Node.js 20.x (for local development)
- Python 3.11 (for local development)
- Yarn package manager

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/carterlasalle/conversation-predictor.git
   cd conversation-predictor
   ```

2. Create environment files:
   ```bash
   # Backend
   cp server/.env.example server/.env
   # Frontend
   cp frontend/.env.example frontend/.env
   ```

3. Start the development environment:
   ```bash
   docker-compose up
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:8001
- API Documentation: http://localhost:8001/docs

## Development

### Frontend Development

The frontend is built with Next.js and uses:
- TailwindCSS for styling
- D3.js for visualizations
- Socket.io for real-time communication
- Framer Motion for animations

To run the frontend locally:
```bash
cd frontend
yarn install
yarn dev
```

### Backend Development

The backend is built with FastAPI and uses:
- WebSocket for real-time communication
- OpenRouter API for language model integration
- Monte Carlo Tree Search for path prediction

To run the backend locally:
```bash
cd server
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python start.py
```

## Project Structure

```
.
├── frontend/                # Next.js frontend application
│   ├── components/         # React components
│   ├── lib/               # Utility functions and hooks
│   ├── pages/             # Next.js pages
│   └── styles/            # CSS and TailwindCSS styles
├── server/                 # FastAPI backend application
│   ├── api/               # API endpoints
│   ├── core/              # Core functionality
│   ├── models/            # Data models
│   └── services/          # Business logic
└── docker-compose.yml     # Docker composition file
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenRouter API for providing access to various language models
- The FastAPI team for the excellent web framework
- The Next.js team for the React framework
- The D3.js team for the visualization library 