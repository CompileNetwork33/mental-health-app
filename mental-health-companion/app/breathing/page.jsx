'use client';

import { useState, useEffect, useRef } from 'react';
import { Wind, Play, Pause, RotateCcw } from 'lucide-react';

const breathingTechniques = {
  box: {
    name: 'Box Breathing',
    pattern: [4, 4, 4, 4],
    phases: ['Inhale', 'Hold', 'Exhale', 'Hold'],
    instructions: 'Breathe in for 4 seconds, hold for 4, breathe out for 4, hold for 4. Repeat.',
    benefits: 'Reduces stress and improves focus'
  },
  '4-7-8': {
    name: '4-7-8 Breathing',
    pattern: [4, 7, 8],
    phases: ['Inhale', 'Hold', 'Exhale'],
    instructions: 'Breathe in for 4 seconds, hold for 7, breathe out for 8. Repeat.',
    benefits: 'Promotes relaxation and sleep'
  },
  deep: {
    name: 'Deep Breathing',
    pattern: [5, 5],
    phases: ['Inhale', 'Exhale'],
    instructions: 'Breathe in deeply for 5 seconds, breathe out slowly for 5. Repeat.',
    benefits: 'Calms the nervous system'
  }
};

export default function BreathingPage() {
  const [selectedTechnique, setSelectedTechnique] = useState('box');
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [isInhaling, setIsInhaling] = useState(false);
  const intervalRef = useRef(null);

  const technique = breathingTechniques[selectedTechnique];

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setCurrentPhase((prevPhase) => {
              const nextPhase = (prevPhase + 1) % technique.phases.length;
              if (nextPhase === 0) {
                setRounds((r) => r + 1);
              }
              return nextPhase;
            });
            return technique.pattern[currentPhase];
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining, currentPhase, technique.pattern]);

  useEffect(() => {
    setIsInhaling(technique.phases[currentPhase] === 'Inhale');
  }, [currentPhase, technique.phases]);

  const startBreathing = () => {
    setIsRunning(true);
    setCurrentPhase(0);
    setTimeRemaining(technique.pattern[0]);
    setRounds(0);
  };

  const stopBreathing = () => {
    setIsRunning(false);
    setCurrentPhase(0);
    setTimeRemaining(0);
    setRounds(0);
  };

  const resetBreathing = () => {
    stopBreathing();
  };

  const getCircleSize = () => {
    if (!isRunning) return 120;
    
    const phase = technique.phases[currentPhase];
    const progress = (technique.pattern[currentPhase] - timeRemaining) / technique.pattern[currentPhase];
    
    if (phase === 'Inhale') {
      return 120 + (80 * progress);
    } else if (phase === 'Exhale') {
      return 200 - (80 * progress);
    } else {
      return 200;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F5F7FA] via-[#E8F4F8] to-[#F0F9FF]">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#1A73E8] mb-2">Breathing Exercises</h1>
          <p className="text-gray-600">Find your calm through mindful breathing</p>
        </div>

        {/* Technique Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {Object.entries(breathingTechniques).map(([key, tech]) => (
            <button
              key={key}
              onClick={() => {
                setSelectedTechnique(key);
                resetBreathing();
              }}
              className={`p-6 rounded-2xl border-2 transition-all ${
                selectedTechnique === key
                  ? 'border-[#1A73E8] bg-white shadow-lg'
                  : 'border-gray-200 bg-white hover:border-[#00BFA5]'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <Wind className="w-6 h-6 text-[#00BFA5]" />
                <h3 className="font-semibold text-[#1A73E8]">{tech.name}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">{tech.instructions}</p>
              <p className="text-xs text-[#00BFA5] font-medium">{tech.benefits}</p>
            </button>
          ))}
        </div>

        {/* Breathing Circle */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            {/* Outer glow */}
            <div 
              className="absolute inset-0 rounded-full bg-gradient-to-r from-[#1A73E8] to-[#00BFA5] opacity-20 blur-xl"
              style={{
                width: `${getCircleSize() + 40}px`,
                height: `${getCircleSize() + 40}px`,
                transform: 'translate(-50%, -50%)',
                left: '50%',
                top: '50%',
                transition: 'all 0.3s ease-in-out'
              }}
            />
            
            {/* Main circle */}
            <div
              className="relative rounded-full bg-gradient-to-br from-[#1A73E8] to-[#00BFA5] shadow-2xl flex items-center justify-center transition-all duration-1000 ease-in-out"
              style={{
                width: `${getCircleSize()}px`,
                height: `${getCircleSize()}px`
              }}
            >
              <div className="text-white text-center">
                <div className="text-2xl font-bold mb-1">
                  {technique.phases[currentPhase]}
                </div>
                <div className="text-4xl font-light">
                  {timeRemaining}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-8">
          {!isRunning ? (
            <button
              onClick={startBreathing}
              className="flex items-center gap-2 px-8 py-3 bg-[#1A73E8] text-white rounded-full hover:bg-[#1557AD] transition-colors shadow-lg"
            >
              <Play className="w-5 h-5" />
              Start Breathing
            </button>
          ) : (
            <button
              onClick={stopBreathing}
              className="flex items-center gap-2 px-8 py-3 bg-[#FFB347] text-white rounded-full hover:bg-[#FFA500] transition-colors shadow-lg"
            >
              <Pause className="w-5 h-5" />
              Stop
            </button>
          )}
          
          <button
            onClick={resetBreathing}
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-[#1A73E8] mb-4">Current Technique</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pattern:</span>
                <span className="font-medium text-[#00BFA5]">
                  {technique.pattern.join('-')} seconds
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Phase:</span>
                <span className="font-medium text-[#1A73E8]">
                  {technique.phases[currentPhase]}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-[#1A73E8] mb-4">Session Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Rounds Completed:</span>
                <span className="font-medium text-[#00BFA5]">{rounds}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${isRunning ? 'text-[#FFB347]' : 'text-gray-500'}`}>
                  {isRunning ? 'Active' : 'Paused'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-[#1A73E8] mb-3">How to Use</h3>
          <ol className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-[#00BFA5] font-medium">1.</span>
              <span>Select a breathing technique from the cards above</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#00BFA5] font-medium">2.</span>
              <span>Click "Start Breathing" to begin the exercise</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#00BFA5] font-medium">3.</span>
              <span>Follow the visual cues and timing on the breathing circle</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#00BFA5] font-medium">4.</span>
              <span>Focus on your breath and let go of distracting thoughts</span>
            </li>
          </ol>
        </div>
      </div>
    </main>
  );
}
