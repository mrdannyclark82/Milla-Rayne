/**
 * Gemini 3 Reasoning Component
 * Displays Gemini's reasoning process and thought chain
 * Shows intermediate steps and confidence scores
 */

import React, { useState, useEffect } from 'react';

interface ReasoningStep {
  step: number;
  thought: string;
  confidence: number;
  timestamp: number;
}

interface ReasonGemini3Props {
  prompt: string;
  onComplete?: (result: string) => void;
  showSteps?: boolean;
}

export const ReasonGemini3: React.FC<ReasonGemini3Props> = ({
  prompt,
  onComplete,
  showSteps = true,
}) => {
  const [reasoning, setReasoning] = useState<ReasoningStep[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string>('');

  useEffect(() => {
    if (prompt) {
      processReasoning(prompt);
    }
  }, [prompt]);

  const processReasoning = async (input: string) => {
    setIsProcessing(true);
    setReasoning([]);
    setResult('');

    try {
      // Simulate reasoning steps
      const steps: ReasoningStep[] = [
        {
          step: 1,
          thought: 'Analyzing the query and identifying key components...',
          confidence: 0.85,
          timestamp: Date.now(),
        },
        {
          step: 2,
          thought: 'Retrieving relevant context and knowledge...',
          confidence: 0.90,
          timestamp: Date.now() + 500,
        },
        {
          step: 3,
          thought: 'Formulating response based on reasoning chain...',
          confidence: 0.92,
          timestamp: Date.now() + 1000,
        },
      ];

      // Simulate step-by-step reasoning
      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 600));
        setReasoning(prev => [...prev, step]);
      }

      // Simulate final result
      await new Promise(resolve => setTimeout(resolve, 500));
      const finalResult = `Gemini reasoning result for: ${input.substring(0, 50)}...`;
      setResult(finalResult);
      
      if (onComplete) {
        onComplete(finalResult);
      }
    } catch (error) {
      console.error('Reasoning failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="reason-gemini3 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-lg">
      <div className="header mb-4">
        <h3 className="text-xl font-bold text-purple-700">Gemini 3 Reasoning</h3>
        <p className="text-sm text-gray-600">Chain-of-Thought Processing</p>
      </div>

      {isProcessing && (
        <div className="processing flex items-center gap-2 mb-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
          <span className="text-purple-600 text-sm">Processing reasoning chain...</span>
        </div>
      )}

      {showSteps && reasoning.length > 0 && (
        <div className="reasoning-steps space-y-3 mb-4">
          {reasoning.map((step) => (
            <div
              key={step.step}
              className="step bg-white p-3 rounded-md shadow-sm border-l-4 border-purple-400 animate-fadeIn"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-semibold text-purple-600">
                  Step {step.step}
                </span>
                <span className="text-xs text-gray-500">
                  {(step.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
              <p className="text-sm text-gray-700">{step.thought}</p>
              <div className="mt-2 bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${step.confidence * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {result && (
        <div className="result bg-purple-100 p-4 rounded-md border-2 border-purple-300">
          <h4 className="text-sm font-semibold text-purple-700 mb-2">Final Result:</h4>
          <p className="text-gray-800">{result}</p>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ReasonGemini3;
