# Documentation

This document describes the data flow for the personalized learning pipeline in ViaMent.

## 1. Survey

The user provides their profile data through a survey. The `UserProfile` interface is defined in `src/app/lib/types.ts` and includes the following fields:

- `reason`: The user's reason for learning.
- `jobStatus`: The user's job status.
- `codingExperience`: The user's coding experience level.
- `captivates`: What captivates the user.
- `learningGoal`: The user's learning goal.
- `hobbies`: A list of the user's hobbies.

## 2. Topic Blueprints

After the survey is completed, the frontend calls the `/api/topics` endpoint with the `UserProfile`. This endpoint returns an array of `TopicBlueprint` objects.

The `TopicBlueprint` interface is defined in `src/app/lib/types.ts` and contains the following fields:

- `id`: A unique identifier for the topic.
- `title`: The title of the topic.
- `tagline`: A short tagline for the topic.
- `whyItMatters`: An explanation of why the topic is important for the user, personalized with their profile data.
- `skillsToUnlock`: A list of skills the user will learn.
- `hobbyHook`: A sentence that connects the topic to one of the user's hobbies.
- `targetExperience`: The user's coding experience level.
- `recommendedArtifacts`: A list of recommended learning artifacts.

## 3. Roadmap Generation

The user selects their preferred topics from the list of `TopicBlueprint`s. The frontend then calls the `/api/roadmap` endpoint with the selected `TopicBlueprint[]` and the `UserProfile`.

This endpoint returns an array of `RoadmapTopic` objects. The `RoadmapTopic` interface is defined in `src/app/lib/types.ts` and contains:

- `topicBlueprint`: The original `TopicBlueprint`.
- `topicSummary`: A personalized summary of the topic.
- `lessons`: An array of `LessonSummary` objects.

Each `LessonSummary` contains a `LessonPlan` with personalized fields:

- `lessonGoal`: The goal of the lesson.
- `reasonHook`: A hook related to the user's reason for learning.
- `hobbyInfusion`: A hobby to infuse into the lesson.
- `assessmentFocus`: The focus of the lesson's assessment.
- `topicBlueprintId`: The ID of the parent `TopicBlueprint`.

## 4. Lesson Hydration

When the user starts a lesson, the frontend calls the `/api/lesson` endpoint with the `LessonPlan`, `UserProfile`, and `TopicBlueprint`.

This endpoint generates the lesson content, including `microSteps` for text blocks and `reflectionPrompt` for quiz and code blocks. The content is highly personalized using the provided context.
