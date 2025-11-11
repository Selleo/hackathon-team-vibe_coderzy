import { describe, it, expect } from 'vitest';
import { generateTopicBlueprintsFallback } from './profileUtils';
import { UserProfile } from './types';

describe('generateTopicBlueprintsFallback', () => {
  const userProfile: UserProfile = {
    reason: 'career change',
    jobStatus: 'student',
    codingExperience: 'beginner',
    captivates: 'building things',
    learningGoal: 'become a full-stack developer',
    hobbies: ['reading', 'gaming'],
  };

  it('should generate an array of TopicBlueprint objects', () => {
    const blueprints = generateTopicBlueprintsFallback(userProfile);
    expect(Array.isArray(blueprints)).toBe(true);
    expect(blueprints.length).toBeGreaterThan(0);
  });

  it('should generate blueprints with the correct structure', () => {
    const blueprints = generateTopicBlueprintsFallback(userProfile);
    const blueprint = blueprints[0];
    expect(blueprint).toHaveProperty('id');
    expect(blueprint).toHaveProperty('title');
    expect(blueprint).toHaveProperty('tagline');
    expect(blueprint).toHaveProperty('whyItMatters');
    expect(blueprint).toHaveProperty('skillsToUnlock');
    expect(blueprint).toHaveProperty('hobbyHook');
    expect(blueprint).toHaveProperty('targetExperience');
    expect(blueprint).toHaveProperty('recommendedArtifacts');
  });

  it('should generate personalized content', () => {
    const blueprints = generateTopicBlueprintsFallback(userProfile);
    const blueprint = blueprints[0];
    expect(blueprint.whyItMatters).toContain(userProfile.reason);
    expect(blueprint.whyItMatters).toContain(userProfile.jobStatus);
    expect(blueprint.hobbyHook).toContain(userProfile.hobbies[0]);
    expect(blueprint.targetExperience).toBe(userProfile.codingExperience);
  });
});
