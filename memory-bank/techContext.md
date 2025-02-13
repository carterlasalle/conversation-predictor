# Technical Context

## Technology Stack

### Core Technologies
- Python 3.11+
- OpenRouter API for LLM access
- AsyncIO for concurrent operations
- UV for dependency management
- React/Next.js for frontend
- TailwindCSS for styling

### Key Dependencies
- Backend:
  - `openrouter`: LLM API integration
  - `asyncio`: Asynchronous I/O
  - `aiohttp`: Async HTTP client
  - `numpy`: Numerical computations
  - `networkx`: Graph operations
  - `pydantic`: Data validation
  - `pytest`: Testing framework
  - `loguru`: Logging
  - `fastapi`: API server

- Frontend:
  - `react`: UI framework
  - `next`: React framework
  - `tailwindcss`: Styling
  - `d3`: Visualization
  - `framer-motion`: Animations
  - `@headlessui`: UI components

## System Architecture

### Components

1. **Backend Components**

   a. **Tree Generator**
      - Async conversation tree generation
      - Probability-weighted response generation
      - Context management for conversation history

   b. **Monte Carlo Simulator**
      - Parallel path simulation
      - Probability-weighted sampling
      - Tree pruning optimization

   c. **Evaluator**
      - Conversation scoring system
      - Goal achievement metrics
      - Path optimization

   d. **API Manager**
      - Credential rotation
      - Rate limiting
      - Request batching
      - Error handling

2. **Frontend Components**

   a. **Chat Interface**
      - Message history display
      - Input field with send button
      - Video call toggle
      - Connection status indicator
      - Version display

   b. **Goal Setting**
      - Goal input field
      - Goal display
      - Goal editing

   c. **Analysis Display**
      - Conversation state visualization
      - Monte Carlo evaluation visualization
      - Analysis results with scores
      - Alternative responses

   d. **Visualization Components**
      - Dot matrix for conversation states
      - Color-coded Monte Carlo evaluation
      - Score indicators (0.61, 0.60, 0.59)
      - Tree-based path visualization

### Data Structures

```python
class ConversationNode:
    message: str
    probability: float
    score: Optional[float]
    children: List[ConversationNode]
    metadata: Dict[str, Any]

class ConversationPath:
    nodes: List[ConversationNode]
    total_probability: float
    final_score: float

class SimulationConfig:
    max_depth: int
    branching_factor: int
    prune_threshold: float
    batch_size: int
```

## UI Components

### Chat Interface
- Header with user info and connection status
- Message bubbles with user/assistant distinction
- Input field with microphone and send button
- Video call toggle button
- Version indicator (v0.1)

### Analysis Panel
1. **Conversation Goal**
   - Input field for goal setting
   - Goal display and editing

2. **Analysis Results**
   - Score display (0.0-1.0 scale)
   - Alternative responses with scores
   - Response confidence indicators

3. **Visualizations**
   - State exploration matrix (blue dots)
   - Monte Carlo evaluation matrix (yellow/red/green dots)
   - Path probability indicators

### Visual Design
- Clean, modern interface
- White background
- Blue accent colors
- Professional typography
- Responsive layout
- Clear visual hierarchy

## Development Setup

### Environment Setup
```bash
# Backend
python -m venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt

# Frontend
yarn install
```

### API Configuration
```python
OPENROUTER_API_CONFIG = {
    "base_url": "https://openrouter.ai/api/v1",
    "models": {
        "user_proxy": "anthropic/claude-3-opus-20240229",
        "opponent_proxy": "anthropic/claude-3-opus-20240229",
        "evaluator": "anthropic/claude-3-sonnet-20240229"
    }
}
```

## Performance Considerations

### Backend Optimization
1. Parallel API calls
2. Early pruning of low-probability paths
3. Caching of common subtrees
4. Batched API requests
5. Memory-efficient tree representation

### Frontend Optimization
1. Efficient state management
2. Virtualized lists for long conversations
3. Debounced input handling
4. Optimized visualizations
5. Progressive loading

### Scaling Considerations
1. API cost management
2. Rate limit handling
3. Memory usage optimization
4. Response time optimization
5. WebSocket connection management

## Testing Strategy

### Backend Tests
- Node generation
- Tree operations
- Probability calculations
- Path evaluation

### Frontend Tests
- Component rendering
- User interactions
- State management
- Visualization accuracy

### Integration Tests
- API integration
- Full conversation simulation
- Performance benchmarks
- WebSocket communication

### Load Tests
- Concurrent request handling
- Memory usage monitoring
- API quota management
- WebSocket connection limits 