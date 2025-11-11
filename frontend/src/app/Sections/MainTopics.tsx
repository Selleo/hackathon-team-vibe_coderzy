"use client";

import { useState, useEffect } from "react";
import { TrashIcon } from "./Components/Icons";
import { TopicBlueprint } from "../lib/types";

interface MainTopicsProps {
  onComplete: (topics: TopicBlueprint[]) => void;
  initialTopics: TopicBlueprint[];
}

const MainTopics: React.FC<MainTopicsProps> = ({ onComplete, initialTopics }) => {
  const [topics, setTopics] = useState(initialTopics);
  const [deletedTopics, setDeletedTopics] = useState<TopicBlueprint[]>([]);

  useEffect(() => {
    setTopics(initialTopics);
  }, [initialTopics]);

  const handleTopicChange = (index: number, value: string) => {
    const newTopics = [...topics];
    newTopics[index] = { ...newTopics[index], title: value };
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

  const restoreTopic = (topic: TopicBlueprint) => {
    setTopics([...topics, topic]);
    setDeletedTopics(deletedTopics.filter(t => t.id !== topic.id));
  };

  const handleSubmit = () => {
    const validTopics = topics.filter(t => t.title.trim() !== "");
    if (validTopics.length === 0) {
      alert("Please add at least 1 topic");
      return;
    }
    onComplete(validTopics);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-slate-800">
      <div className="w-full max-w-3xl bg-gray-800 rounded-xl shadow-2xl p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center text-cyan-300">What do you want to learn?</h1>
        <p className="text-center text-gray-400">Edit the topics below to customize your learning path. At least 1 topic is required.</p>
        
        <div className="space-y-4">
          {topics.map((topic, index) => (
            <div key={topic.id} className="flex items-start space-x-4 bg-gray-700/50 p-4 rounded-lg">
              <div className="flex-grow">
                <input
                  type="text"
                  value={topic.title}
                  onChange={(e) => handleTopicChange(index, e.target.value)}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-semibold"
                  placeholder="Enter a topic"
                />
                <p className="text-sm text-gray-400 mt-2 px-1">{topic.tagline}</p>
                <p className="text-sm text-gray-300 mt-2 px-1 bg-cyan-900/20 py-2 rounded border border-cyan-800/30">{topic.whyItMatters}</p>
              </div>
              <button 
                onClick={() => removeTopic(index)} 
                disabled={topics.length <= 1}
                className={`p-2 text-white rounded-lg transition-colors mt-1 ${
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

        {deletedTopics.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Deleted Topics (click to restore)</h3>
            <div className="flex flex-wrap gap-2">
              {deletedTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => restoreTopic(topic)}
                  className="px-3 py-1.5 bg-gray-700/50 text-gray-300 rounded-lg border border-gray-600/50 hover:bg-gray-600/50 hover:border-cyan-500/50 transition-all duration-200 text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {topic.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={handleSubmit} 
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