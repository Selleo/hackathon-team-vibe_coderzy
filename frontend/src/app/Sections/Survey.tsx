"use client";

import { useState } from "react";
import { UserProfile } from "../lib/types";
import QuestionStep from "./Components/QuestionStep";

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

  const handleSubmit = () => {
    if (profile.experience && profile.intensity) {
      onComplete(profile as UserProfile);
    }
  };

  const progress = (step / 2) * 100;

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <QuestionStep
            title="What is your coding experience?"
            field="experience"
            options={["Complete Beginner", "Some tutorials", "Built a small project", "Professional Developer"]}
            onSelect={handleSelectChange}
            next={nextStep}
            selected={profile.experience}
          />
        );
      case 2:
        return (
          <QuestionStep
            title="How much time can you commit daily?"
            field="intensity"
            options={["5 minutes (Casual)", "10 minutes (Regular)", "20 minutes (Serious)"]}
            onSelect={handleSelectChange}
            next={handleSubmit}
            prev={prevStep}
            selected={profile.intensity}
          />
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
