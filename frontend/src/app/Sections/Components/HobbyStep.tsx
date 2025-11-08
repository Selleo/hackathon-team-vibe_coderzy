"use client";

import { useState } from "react";
import {
  DeviceGamepadIcon,
  BoltIcon,
  MusicalNoteIcon,
  FilmIcon,
  GlobeAltIcon,
  CakeIcon,
  PaintBrushIcon,
  PencilIcon,
  CodeBracketIcon,
  CameraIcon,
  HeartIcon,
  SunIcon,
  BookIcon,
} from "./Icons";

interface HobbyStepProps {
  onComplete: (hobbies: string[]) => void;
  prev: () => void;
}

const hobbies = [
  { name: "Gaming", icon: <DeviceGamepadIcon className="w-8 h-8" /> },
  { name: "Reading", icon: <BookIcon className="w-8 h-8" /> },
  { name: "Sports", icon: <BoltIcon className="w-8 h-8" /> },
  { name: "Music", icon: <MusicalNoteIcon className="w-8 h-8" /> },
  { name: "Movies", icon: <FilmIcon className="w-8 h-8" /> },
  { name: "Traveling", icon: <GlobeAltIcon className="w-8 h-8" /> },
  { name: "Cooking", icon: <CakeIcon className="w-8 h-8" /> },
  { name: "Art", icon: <PaintBrushIcon className="w-8 h-8" /> },
  { name: "Writing", icon: <PencilIcon className="w-8 h-8" /> },
  { name: "Coding", icon: <CodeBracketIcon className="w-8 h-8" /> },
  { name: "Photography", icon: <CameraIcon className="w-8 h-8" /> },
  { name: "Fitness", icon: <HeartIcon className="w-8 h-8" /> },
  { name: "Dancing", icon: <MusicalNoteIcon className="w-8 h-8" /> },
  { name: "Gardening", icon: <SunIcon className="w-8 h-8" /> },
];

const HobbyStep: React.FC<HobbyStepProps> = ({ onComplete, prev }) => {
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);

  const toggleHobby = (hobby: string) => {
    setSelectedHobbies((prev) =>
      prev.includes(hobby) ? prev.filter((h) => h !== hobby) : [...prev, hobby]
    );
  };

  const handleSubmit = () => {
    onComplete(selectedHobbies);
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-300 text-center">
        What are your hobbies?
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 justify-center">
        {hobbies.map((hobby) => (
          <button
            key={hobby.name}
            onClick={() => toggleHobby(hobby.name)}
            className={`flex flex-col items-center justify-center p-8 rounded-lg text-lg font-semibold transition-all duration-200 w-full ${
              selectedHobbies.includes(hobby.name)
                ? "bg-cyan-500 text-white shadow-lg scale-105"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {hobby.icon}
            <span className="mt-2">{hobby.name}</span>
          </button>
        ))}
      </div>
      <div className="mt-8 flex justify-between">
        <button onClick={prev} className="px-6 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition">
          Back
        </button>
        <button onClick={handleSubmit} className="px-6 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-500 transition">
          Next
        </button>
      </div>
    </div>
  );
};

export default HobbyStep;