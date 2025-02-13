# Conversation Predictor Frontend

A Next.js application for predicting conversation flow using WebSocket communication and real-time analysis.

## Features

- Real-time chat interface
- Conversation analysis and prediction
- WebSocket communication
- Monte Carlo simulation visualization
- Responsive design with Tailwind CSS
- Accessible components with Radix UI
- Comprehensive test coverage

## Getting Started

### Prerequisites

- Node.js 18.x or later
- Yarn package manager

### Installation

```bash
# Install dependencies
yarn install

# Copy environment file
cp .env.example .env.local

# Start development server
yarn dev
```

## Testing

The project uses Jest and React Testing Library for testing. The testing setup includes:

### Test Structure

- `__tests__/` - Test files
  - `components/` - Component tests
  - `lib/` - Utility function tests
  - `test-utils.tsx` - Custom test utilities

### Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage
```

### Test Utilities

The project includes several test utilities to make testing easier:

- Custom render method with providers
- WebSocket mocks
- Common test helpers
- Type-safe test utilities

Example usage:

```typescript
import { render, screen } from '@/test-utils'
import { ChatInterface } from '@/components/ChatInterface'

describe('ChatInterface', () => {
  it('renders correctly', () => {
    render(<ChatInterface />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})
```

### Coverage Requirements

The project maintains high test coverage requirements:

- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

## Development

### Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build production bundle
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `yarn format` - Format code with Prettier
- `yarn type-check` - Run TypeScript type checking

### Code Style

The project uses:

- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety

### Best Practices

1. Write tests for all new components and utilities
2. Maintain type safety with TypeScript
3. Follow accessibility guidelines
4. Keep components small and focused
5. Use custom hooks for complex logic
6. Document complex functionality

## Project Structure

```
frontend/
├── __tests__/           # Test files
├── public/             # Static files
├── src/
│   ├── components/    # React components
│   ├── contexts/      # React contexts
│   ├── hooks/         # Custom hooks
│   ├── lib/          # Utility functions
│   ├── pages/        # Next.js pages
│   ├── styles/       # Global styles
│   └── types/        # TypeScript types
├── .env.example       # Environment variables example
├── .eslintrc.js      # ESLint configuration
├── jest.config.js     # Jest configuration
├── jest.setup.js      # Jest setup file
├── next.config.js     # Next.js configuration
├── package.json       # Dependencies and scripts
├── postcss.config.js  # PostCSS configuration
├── tailwind.config.js # Tailwind configuration
└── tsconfig.json     # TypeScript configuration
```

## Contributing

1. Create a feature branch
2. Write tests for new functionality
3. Ensure all tests pass
4. Update documentation
5. Submit a pull request

## License

MIT 