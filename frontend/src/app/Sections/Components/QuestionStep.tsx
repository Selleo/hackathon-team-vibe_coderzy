"use client";

import { UserProfile } from "@/app/lib/types";
import React from "react";

interface QuestionStepProps {
  title: string;
  field: keyof UserProfile;
  options: string[];
  selected?: string;
  onSelect: (field: keyof UserProfile, value: string) => void;
  next: () => void;
  prev?: () => void;
}

const QuestionStep: React.FC<QuestionStepProps> = ({
  title,
  field,
  options,
  selected,
  onSelect,
  next,
  prev,
}) => {
  const handleSelection = (option: string) => {
    onSelect(field, option);
    setTimeout(next, 300);
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-300 text-center">{title}</h2>
      <div className="space-y-3">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => handleSelection(option)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 text-lg ${
              selected === option
                ? "bg-cyan-500 border-cyan-400 shadow-lg scale-105"
                : "bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      {prev && (
        <div className="mt-8">
          <button onClick={prev} className="px-6 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition">
            Back
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionStep;
