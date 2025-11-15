import { describe, it, expect } from 'vitest';
import { generateRoadmapPlan } from './roadmapBuilder';
import { UserProfile, TopicBlueprint } from './types';

describe('generateRoadmapPlan', () => {
  const userProfile: UserProfile = {
    reason: 'career change',
    jobStatus: 'student',
    codingExperience: 'beginner',
    captivates: 'building things',
    learningGoal: 'become a full-stack developer',
    hobbies: ['reading', 'gaming'],
  };

  const topicBlueprints: TopicBlueprint[] = [
    {
      id: 'test-topic',
      title: 'Test Topic',
      tagline: 'A test topic',
      whyItMatters: 'Because testing is important',
      skillsToUnlock: ['testing', 'more testing'],
      hobbyHook: 'Test your hobby projects',
      targetExperience: 'beginner',
      recommendedArtifacts: ['quiz', 'code challenge'],
    },
  ];

  it('should generate an array of RoadmapTopic objects', () => {
    const roadmap = generateRoadmapPlan(userProfile, topicBlueprints);
    expect(Array.isArray(roadmap)).toBe(true);
    expect(roadmap.length).toBeGreaterThan(0);
  });

  it('should generate roadmap with the correct structure', () => {
    const roadmap = generateRoadmapPlan(userProfile, topicBlueprints);
    const topic = roadmap[0];
    expect(topic).toHaveProperty('topicBlueprint');
    expect(topic).toHaveProperty('topicSummary');
    expect(topic).toHaveProperty('lessons');
    expect(Array.isArray(topic.lessons)).toBe(true);
  });

  it('should generate personalized content', () => {
    const roadmap = generateRoadmapPlan(userProfile, topicBlueprints);
    const topic = roadmap[0];
    expect(topic.topicSummary).toContain(userProfile.learningGoal);
    expect(topic.topicSummary).toContain(topicBlueprints[0].whyItMatters);
    const lesson = topic.lessons[0];
    expect(lesson.lesson.plan.description).toContain(userProfile.reason);
    expect(lesson.lesson.plan.description).toContain(userProfile.hobbies[0]);
  });
});
