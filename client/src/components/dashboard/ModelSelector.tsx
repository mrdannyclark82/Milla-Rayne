import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Cpu, Check, Zap, Brain, Star } from 'lucide-react';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  speed: 'fast' | 'medium' | 'slow';
  icon: React.ReactNode;
}

const defaultModels: AIModel[] = [
  {
    id: 'venice-uncensored',
    name: 'Venice Uncensored',
    provider: 'Venice',
    description: 'Unfiltered general conversation',
    speed: 'fast',
    icon: <Star className="w-4 h-4" />,
  },
  {
    id: 'deepseek-coder',
    name: 'DeepSeek Coder',
    provider: 'DeepSeek',
    description: 'Specialized for coding tasks',
    speed: 'medium',
    icon: <Brain className="w-4 h-4" />,
  },
  {
    id: 'grok-2',
    name: 'Grok 2',
    provider: 'xAI',
    description: 'Creative & Visual capabilities',
    speed: 'fast',
    icon: <Zap className="w-4 h-4" />,
  },
  {
    id: 'gemini-2-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    description: 'Fastest response time',
    speed: 'fast',
    icon: <Cpu className="w-4 h-4" />,
  },
];

interface ModelSelectorProps {
  value?: AIModel;
  models?: AIModel[];
  onChange?: (model: AIModel) => void;
}

export function ModelSelector({ value, models = defaultModels, onChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalModel, setInternalModel] = useState<AIModel>(value ?? models[0]);
  const hasAnnouncedInitial = useRef(false);

  const selectedModel = useMemo(() => value ?? internalModel, [value, internalModel]);

  useEffect(() => {
    if (value) {
      setInternalModel(value);
    }
  }, [value]);

  useEffect(() => {
    if (!value && onChange && !hasAnnouncedInitial.current) {
      onChange(internalModel);
      hasAnnouncedInitial.current = true;
    }
  }, [value, onChange, internalModel]);

  const handleSelect = async (model: AIModel) => {
    setInternalModel(model);
    onChange?.(model);
    setIsOpen(false);

    try {
      // Send the selected model ID directly to the backend
      await fetch('/api/ai-model/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model.id }),
      });
    } catch (e) {
      console.error('Failed to persist model selection:', e);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
          isOpen
            ? 'bg-white/10 border border-[#00f2ff]/50 shadow-[0_0_15px_rgba(0,242,255,0.2)]'
            : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
        }`}
      >
        <span className="text-[#00f2ff]">{selectedModel.icon}</span>
        <span className="text-white/80">{selectedModel.name}</span>
        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-72 z-50 rounded-xl overflow-hidden backdrop-blur-xl bg-[#0c021a]/95 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium text-white/40 uppercase tracking-wider">
                Select AI Model
              </div>
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleSelect(model)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    selectedModel.id === model.id
                      ? 'bg-gradient-to-r from-[#00f2ff]/20 to-[#ff00aa]/10 border border-[#00f2ff]/30'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selectedModel.id === model.id
                      ? 'bg-gradient-to-r from-[#00f2ff]/30 to-[#ff00aa]/30 text-[#00f2ff]'
                      : 'bg-white/5 text-white/40'
                  }`}>
                    {model.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white">{model.name}</span>
                      <span className="text-[10px] text-white/40">{model.provider}</span>
                    </div>
                    <span className="text-xs text-white/40">{model.description}</span>
                  </div>
                  {selectedModel.id === model.id && (
                    <Check className="w-4 h-4 text-[#00f2ff]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ModelSelector;
