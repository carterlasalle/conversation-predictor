import ChatInterface from '@/components/ChatInterface';
import AnalysisPanel from '@/components/AnalysisPanel';

export default function Home() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Chat Interface - Left Side */}
      <div className="flex-1 flex flex-col">
        <ChatInterface />
      </div>

      {/* Analysis Panel - Right Side */}
      <div className="w-96 border-l border-gray-200 bg-white">
        <AnalysisPanel />
      </div>
    </div>
  );
} 