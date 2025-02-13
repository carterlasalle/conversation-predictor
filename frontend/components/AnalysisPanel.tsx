import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import ConversationStateMatrix from './visualizations/ConversationStateMatrix';
import MonteCarloMatrix from './visualizations/MonteCarloMatrix';
import { useWebSocketEvent } from '@/lib/websocket';
import { cn, formatScore, debounce } from '@/lib/utils';
import type { AnalysisResult, StateUpdate, MonteCarloUpdate } from '@/types';

export default function AnalysisPanel() {
  const [goal, setGoal] = useState('');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [stateData, setStateData] = useState<StateUpdate | null>(null);
  const [monteCarloData, setMonteCarloData] = useState<MonteCarloUpdate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle incoming analysis updates
  useWebSocketEvent<AnalysisResult>('analysis', (data) => {
    setAnalysisResults((prev) => {
      const newResults = [data, ...prev];
      return newResults.slice(0, 3); // Keep only the last 3 results
    });
    setIsLoading(false);
    setError(null);
  });

  // Handle state exploration updates
  useWebSocketEvent<StateUpdate>('state_update', (data) => {
    setStateData(data);
  });

  // Handle Monte Carlo updates
  useWebSocketEvent<MonteCarloUpdate>('monte_carlo_update', (data) => {
    setMonteCarloData(data);
  });

  // Handle errors
  useWebSocketEvent('error', (error) => {
    setError(error.message);
    setIsLoading(false);
  });

  // Debounce goal updates
  const debouncedGoalUpdate = debounce((value: string) => {
    setIsLoading(true);
    setError(null);
    // Emit goal update through WebSocket
    try {
      window.dispatchEvent(new CustomEvent('update-goal', { detail: value }));
    } catch (err) {
      setError('Failed to update goal. Please try again.');
      setIsLoading(false);
    }
  }, 500);

  // Handle goal input change
  const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGoal(value);
    if (value.trim()) {
      debouncedGoalUpdate(value);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  return (
    <div className="h-full flex flex-col">
      {/* Goal Input */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-sm font-medium text-gray-500 flex items-center space-x-2">
          <span>CONVERSATION GOAL</span>
          {isLoading && (
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          )}
        </h2>
        <div className="mt-2 relative">
          <input
            type="text"
            value={goal}
            onChange={handleGoalChange}
            placeholder="Enter your goal..."
            className={cn(
              'w-full px-3 py-2 border rounded-md',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'transition-all',
              error ? 'border-red-300' : 'border-gray-300'
            )}
          />
          {error && (
            <div className="absolute right-2 top-2 text-red-500">
              <ExclamationCircleIcon className="w-5 h-5" />
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>

      {/* Analysis Results */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-sm font-medium text-gray-500 mb-4">ANALYSIS RESULTS</h2>
        <AnimatePresence mode="popLayout">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {analysisResults.map((result, index) => (
              <motion.div
                key={`${result.message}-${index}`}
                variants={itemVariants}
                layout
                className="flex items-center space-x-3"
              >
                <div className="flex-shrink-0 w-12 h-8 bg-primary-100 rounded-md flex items-center justify-center">
                  <span className="text-primary-700 font-medium">
                    {formatScore(result.score)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 flex-1">{result.message}</p>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                variants={itemVariants}
                className="flex items-center space-x-3"
              >
                <div className="flex-shrink-0 w-12 h-8 bg-gray-100 rounded-md flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="flex-1 h-4 bg-gray-100 rounded animate-pulse" />
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Conversation State Exploration */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-sm font-medium text-gray-500 mb-4">CONVERSATIONAL STATE EXPLORATION</h2>
        <div className="relative">
          <ConversationStateMatrix data={stateData?.dots} />
          {!stateData && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Monte Carlo Evaluation */}
      <div className="p-6">
        <h2 className="text-sm font-medium text-gray-500 mb-4">MONTE CARLO EVALUATION</h2>
        <div className="relative">
          <MonteCarloMatrix data={monteCarloData?.dots} />
          {!monteCarloData && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 