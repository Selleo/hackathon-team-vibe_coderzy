"use client";

import { useState, useEffect } from "react";
import { TrashIcon } from "./Components/Icons";

interface MainTopicsProps {
  onComplete: (topics: string[]) => void;
  initialTopics: string[];
}

const MainTopics: React.FC<MainTopicsProps> = ({ onComplete, initialTopics }) => {
  const [topics, setTopics] = useState(initialTopics);
  const [deletedTopics, setDeletedTopics] = useState<string[]>([]);

  useEffect(() => {
    setTopics(initialTopics);
  }, [initialTopics]);

  const handleTopicChange = (index: number, value: string) => {
    const newTopics = [...topics];
    newTopics[index] = value;
    setTopics(newTopics);
  };

  const removeTopic = (index: number) => {
    if (topics.length <= 1) {
      alert("You must have at least 1 topic to generate a roadmap");
      return;
    }
    
    const newTopics = [...topics];
    const removed = newTopics.splice(index, 1);
    setTopics(newTopics);
    setDeletedTopics([...deletedTopics, ...removed]);
  };

  const restoreTopic = (topic: string) => {
    setTopics([...topics, topic]);
    setDeletedTopics(deletedTopics.filter(t => t !== topic));
  };

  const handleSubmit = () => {
    const validTopics = topics.filter(t => t.trim() !== "");
    if (validTopics.length === 0) {
      alert("Please add at least 1 topic");
      return;
    }
    onComplete(validTopics);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-slate-800">
      <div className="w-full max-w-2xl bg-gray-800 rounded-xl shadow-2xl p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center text-cyan-300">What do you want to learn?</h1>
        <p className="text-center text-gray-400">Edit the topics below to customize your learning path. At least 1 topic is required.</p>
        
        <div className="space-y-4">
          {topics.map((topic, index) => (
            <div key={index} className="flex items-center space-x-4">
              <input
                type="text"
                value={topic}
                onChange={(e) => handleTopicChange(index, e.target.value)}
                className="w-full p-4 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Enter a topic"
              />
              <button 
                onClick={() => removeTopic(index)} 
                disabled={topics.length <= 1}
                className={`p-2 text-white rounded-lg transition-colors ${
                  topics.length <= 1 
                    ? "bg-gray-600 cursor-not-allowed opacity-50" 
                    : "bg-red-600 hover:bg-red-500"
                }`}
                title={topics.length <= 1 ? "At least 1 topic is required" : "Remove topic"}
              >
                <TrashIcon className="w-6 h-6" />
              </button>
            </div>
          ))}
        </div>

        {/* Deleted Topics - Restore Section */}
        {deletedTopics.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Deleted Topics (click to restore)</h3>
            <div className="flex flex-wrap gap-2">
              {deletedTopics.map((topic, index) => (
                <button
                  key={index}
                  onClick={() => restoreTopic(topic)}
                  className="px-3 py-1.5 bg-gray-700/50 text-gray-300 rounded-lg border border-gray-600/50 hover:bg-gray-600/50 hover:border-cyan-500/50 transition-all duration-200 text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button 
            onClick={handleSubmit} 
            className="px-6 py-3 text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg transition-all duration-200 shadow-lg font-semibold"
          >
            Generate Roadmap
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainTopics;
