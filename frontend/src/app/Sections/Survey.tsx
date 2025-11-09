"use client";

import { useState } from "react";
import { UserProfile } from "../lib/types";
import QuestionStep from "./Components/QuestionStep";
import HobbyStep from "./Components/HobbyStep";

interface SurveyProps {
  onComplete: (profile: UserProfile) => void;
}

const Survey: React.FC<SurveyProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>({});

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleSelectChange = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleHobbiesComplete = (hobbies: string[]) => {
    setProfile((prev) => ({ ...prev, hobbies }));
    nextStep();
  };

  const handleTextChange = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (profile.reason && profile.jobStatus && profile.codingExperience && profile.captivates && profile.learningGoal && profile.hobbies) {
      onComplete(profile as UserProfile);
    } else {
      alert("Please fill in all fields before finishing.");
    }
  };

  const progress = (step / 6.5) * 100;

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <QuestionStep
            title="Why do you want to study?"
            field="reason"
            options={["Career Change", "Skill Enhancement", "Hobby", "Curiosity"]}
            onSelect={handleSelectChange}
            next={nextStep}
            selected={profile.reason}
          />
        );
      case 2:
        return (
          <QuestionStep
            title="What is your job status?"
            field="jobStatus"
            options={["Student", "High School Student", "Employee", "Other"]}
            onSelect={handleSelectChange}
            next={nextStep}
            prev={prevStep}
            selected={profile.jobStatus}
          />
        );
      case 3:
        return (
          <QuestionStep
            title="What is your coding experience?"
            field="codingExperience"
            options={["Complete Beginner", "Some tutorials", "Built a small project", "Professional Developer"]}
            onSelect={handleSelectChange}
            next={nextStep}
            prev={prevStep}
            selected={profile.codingExperience}
          />
        );
      case 4:
        return (
          <QuestionStep
            title="Which aspect of coding captivates you?"
            field="captivates"
            options={["Problem Solving", "Creativity", "Building things", "The challenge"]}
            onSelect={handleSelectChange}
            next={nextStep}
            prev={prevStep}
            selected={profile.captivates}
          />
        );
      case 5:
        return (
          <HobbyStep
            onComplete={handleHobbiesComplete}
            prev={prevStep}
          />
        );
      case 6:
        return (
          <div className="flex flex-col items-center space-y-4">
            <h2 className="text-2xl font-semibold">What do you want to learn?</h2>
            <textarea
              className="w-full p-4 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="e.g., Build a full-stack web application with React and Node.js"
              value={profile.learningGoal || ""}
              onChange={(e) => handleTextChange("learningGoal", e.target.value)}
            />
            <div className="flex justify-between w-full">
              <button onClick={prevStep} className="px-6 py-2 text-white bg-gray-600 rounded-lg hover:bg-gray-500">
                Back
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={!profile.learningGoal || profile.learningGoal.trim() === ""}
                className="px-6 py-2 text-white bg-cyan-600 rounded-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Finish
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-slate-800">
      <div className="w-full max-w-2xl bg-gray-800 rounded-xl shadow-2xl p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center text-cyan-300">Create Your Profile</h1>
        <p className="text-center text-gray-400">This helps us tailor your learning path.</p>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-cyan-500 h-2.5 rounded-full"
            style={{ width: `${progress}%`, transition: "width 0.3s ease-in-out" }}
          ></div>
        </div>
        <div>{renderStep()}</div>
      </div>
    </div>
  );
};

export default Survey;
