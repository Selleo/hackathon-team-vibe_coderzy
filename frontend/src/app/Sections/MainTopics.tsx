"use client";

import { useState, useEffect } from "react";
import { TrashIcon } from "./Components/Icons";

interface MainTopicsProps {
  onComplete: (topics: string[]) => void;
  initialTopics: string[];
}

const MainTopics: React.FC<MainTopicsProps> = ({ onComplete, initialTopics }) => {
  const [topics, setTopics] = useState(initialTopics);

  useEffect(() => {
    setTopics(initialTopics);
  }, [initialTopics]);

  const handleTopicChange = (index: number, value: string) => {
    const newTopics = [...topics];
    newTopics[index] = value;
    setTopics(newTopics);
  };

  const removeTopic = (index: number) => {
    const newTopics = [...topics];
    newTopics.splice(index, 1);
    setTopics(newTopics);
  };

  const handleSubmit = () => {
    onComplete(topics);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-slate-800">
      <div className="w-full max-w-2xl bg-gray-800 rounded-xl shadow-2xl p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center text-cyan-300">What do you want to learn?</h1>
        <p className="text-center text-gray-400">Edit the topics below to customize your learning path.</p>
        <div className="space-y-4">
          {topics.map((topic, index) => (
            <div key={index} className="flex items-center space-x-4">
              <input
                type="text"
                value={topic}
                onChange={(e) => handleTopicChange(index, e.target.value)}
                className="w-full p-4 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button onClick={() => removeTopic(index)} className="p-2 text-white bg-red-600 rounded-lg hover:bg-red-500">
                <TrashIcon className="w-6 h-6" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <button onClick={handleSubmit} className="px-6 py-2 text-white bg-cyan-600 rounded-lg hover:bg-cyan-500">
            Generate Roadmap
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainTopics;
