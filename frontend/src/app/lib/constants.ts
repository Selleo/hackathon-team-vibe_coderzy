
import {
    CodeBlock,
    Lesson,
    LessonSummary,
    MentorBlock,
    QuizBlock,
    QuizOption,
    StageStatus,
    TextBlock,
} from './types';

type RawQuizBlock = Omit<QuizBlock, 'options'> & {
    options: string[];
    correct: number[];
    explanations: string[];
};

type RawLessonBlock = RawQuizBlock | TextBlock | CodeBlock | MentorBlock;

type RawLesson = Omit<Lesson, 'blocks'> & {
    blocks: RawLessonBlock[];
};

const rawLessons: RawLesson[] = [
  {
    "id": "react-fundamentals-l1",
    "track": "React",
    "chapter": "React Fundamentals",
    "title": "React & JSX Mental Model",
    "estimated_minutes": 10,
    "xp_reward": 20,
    "prerequisites": [],
    "blocks": [
      { "type": "text", "title": "Why React?", "markdown": "React builds UIs from small functions called *components*. JSX lets you write HTML-like syntax inside JavaScript." },
      {
        "type": "quiz",
        "question": "Which statement about JSX is true?",
        "kind": "single",
        "options": [
          "JSX is a template language unrelated to JavaScript.",
          "JSX compiles to React.createElement calls.",
          "JSX can only appear in .jsx files.",
          "JSX runs directly in the browser without compilation."
        ],
        "correct": [1],
        "explanations": [
          "Incorrect. JSX is syntactic sugar over JavaScript.",
          "Correct! Babel/TSX compiles JSX to plain JavaScript function calls.",
          "Incorrect. It can be used in .js, .ts, and .tsx files too.",
          "Incorrect. JSX must be compiled before the browser can understand it."
        ],
        "penalty_hearts": 1
      },
      {
        "type": "code",
        "title": "Hello, Component",
        "instructions": "Create a function component `Hello` that returns `<h1>Hello React</h1>` and export it as default.",
        "language": "javascript",
        "starter": "export default function Hello(){\n  // Your code here\n}",
        "solution": "export default function Hello(){\n  return <h1>Hello React</h1>;\n}",
        "tests": [
          { "name": "is function component", "hidden": false, "run": "check if default export is a function" },
          { "name": "renders correct JSX", "hidden": false, "run": "check if rendered output contains 'Hello React'" }
        ],
        "penalty_hearts": 1
      },
      { "type": "mentor", "mode": "guide", "trigger": "manual", "prompt_vars": { "proficiency": "beginner", "lesson_context": "Intro to JSX and function components." } },
      { "type": "mentor", "mode": "examiner", "trigger": "after_test_fail", "prompt_vars": { "proficiency": "beginner", "lesson_context": "Check that Hello returns an <h1> with 'Hello React'." } }
    ]
  },
  {
    "id": "react-fundamentals-l2",
    "track": "React",
    "chapter": "React Fundamentals",
    "title": "Props Basics",
    "estimated_minutes": 12,
    "xp_reward": 22,
    "prerequisites": ["react-fundamentals-l1"],
    "blocks": [
        { "type": "text", "title": "Props = Inputs", "markdown": "Props (short for properties) are read-only inputs to a component. They allow you to pass data from a parent component to a child. A common pattern is to use object destructuring for props in the function signature." },
        {
            "type": "quiz",
            "question": "How do you idiomatically read a prop named `label` in a function component?",
            "kind": "single",
            "options": [
              "function Button(props) { const { label } = props }",
              "function Button() { const { label } = this.props }",
              "function Button([label]) {}",
              "function Button({ label }) {}"
            ],
            "correct": [3],
            "explanations": ["This works, but destructuring in the signature is more common.", "This is syntax for class components, not function components.", "This is array destructuring, not object destructuring.", "Correct! This is the most common and concise way to access props."],
            "penalty_hearts": 1
        },
        {
            "type": "code",
            "title": "Greeting with Props",
            "instructions": "Build a component `Greeting({ name })` that returns `<p>Hello, {name}!</p>`. Export it as the default.",
            "language": "javascript",
            "starter": "export default function Greeting({ name }){\n  // Your code here\n}",
            "solution": "export default function Greeting({ name }){\n  return <p>Hello, {name}!</p>;\n}",
            "tests": [
              { "name": "uses name prop", "hidden": false, "run": "check if 'Ada' is present when name='Ada'" }
            ],
            "penalty_hearts": 1
        },
        { "type": "mentor", "mode": "guide", "trigger": "manual", "prompt_vars": { "proficiency": "beginner", "lesson_context": "Using and destructuring props in React." } }
    ]
  },
  {
    "id": "react-fundamentals-l3",
    "track": "React",
    "chapter": "React Fundamentals",
    "title": "State with useState",
    "estimated_minutes": 12,
    "xp_reward": 22,
    "prerequisites": ["react-fundamentals-l2"],
    "blocks": [
        { "type": "text", "title": "What is State?", "markdown": "State allows a component to remember information and re-render when that information changes. The `useState` Hook is the primary way to add state to function components. It returns an array with two elements: the current state value, and a function to update it: `const [value, setValue] = useState(initialValue);`." },
        {
            "type": "quiz",
            "question": "What happens if you mutate state directly (e.g., `count++`) instead of using the setter function (`setCount`)?",
            "kind": "single",
            "options": ["React re-renders immediately.", "Nothing is guaranteed to happen; you must use the setter.", "It throws an error.", "It updates on the next browser tick automatically."],
            "correct": [1],
            "explanations": ["Incorrect. React won't know that the state has changed.", "Correct! React relies on the setter function being called to trigger a re-render.", "Incorrect, JavaScript allows the mutation but React won't react to it.", "Incorrect. State updates must be explicitly triggered."],
            "penalty_hearts": 1
        },
        {
            "type": "code",
            "title": "Simple Counter",
            "instructions": "Create a `Counter` component that shows a number (starting at 0) and a `+1` button. Clicking the button should increment the number.",
            "language": "javascript",
            "starter": "import { useState } from 'react';\n\nexport default function Counter(){\n  // Your code here\n}",
            "solution": "import { useState } from 'react';\n\nexport default function Counter(){\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;\n}",
            "tests": [
              { "name": "renders initial count", "hidden": false, "run": "check if initial render shows 0" },
              { "name": "increments on click", "hidden": false, "run": "check if count becomes 1 after a click" }
            ],
            "penalty_hearts": 1
        },
        { "type": "mentor", "mode": "examiner", "trigger": "after_test_fail", "prompt_vars": { "proficiency": "beginner", "lesson_context": "Ensure useState is used correctly and the setter function updates the state." } }
    ]
  },
  {
    "id": "react-fundamentals-l4",
    "track": "React",
    "chapter": "React Fundamentals",
    "title": "Lists & Keys",
    "estimated_minutes": 8,
    "xp_reward": 18,
    "prerequisites": ["react-fundamentals-l3"],
    "blocks": [
        { "type": "text", "title": "Why Keys?", "markdown": "When you render a list of items, you must provide a unique `key` prop for each item. Keys help React identify which items have changed, are added, or are removed, which is crucial for performance and preventing bugs with stateful list items." },
        {
            "type": "quiz",
            "question": "For a list of todo items fetched from a database, what is the best value to use as a key?",
            "kind": "single",
            "options": ["The array index of the item", "Math.random()", "The unique `todo.id` from the database", "The `todo.text` content"],
            "correct": [2],
            "explanations": ["Incorrect. The index is not stable if the list is reordered.", "Incorrect. This generates a new key on every render, which is inefficient.", "Correct! A stable, unique ID is the perfect key.", "Incorrect. The text may not be unique or could change."],
            "penalty_hearts": 1
        }
    ]
  },
  {
    "id": "react-fundamentals-l5",
    "track": "React",
    "chapter": "React Fundamentals",
    "title": "Controlled Inputs & useEffect",
    "estimated_minutes": 15,
    "xp_reward": 25,
    "prerequisites": ["react-fundamentals-l4"],
    "blocks": [
      { "type": "text", "title": "Controlled Inputs", "markdown": "In HTML, form elements like `<input>` typically maintain their own state. In React, we can create 'controlled components' by tying the input's `value` to a state variable and providing an `onChange` handler to update that state. This makes the React state the single source of truth." },
      {
        "type": "quiz",
        "question": "When does a `useEffect` hook with an empty dependency array (`[]`) run?",
        "kind": "single",
        "options": ["Only on the very first render.", "After every render.", "Before the component renders.", "Only when a specific state variable changes."],
        "correct": [0],
        "explanations": ["Correct! An empty dependency array means the effect runs once when the component mounts and not again.", "Incorrect. This happens when you omit the dependency array entirely.", "Incorrect. `useEffect` runs after rendering.", "Incorrect. For this, you would put that variable inside the dependency array."],
        "penalty_hearts": 1
      },
      { "type": "mentor", "mode": "guide", "trigger": "manual", "prompt_vars": { "proficiency": "beginner", "lesson_context": "Controlled components and the useEffect hook dependencies." } }
    ]
  }
];

function processRawLessons(raws: RawLesson[]): LessonSummary[] {
    return raws.map((lesson, index) => {
        const processedBlocks = lesson.blocks.map((block): Lesson['blocks'][number] => {
            if (block.type === 'quiz') {
                const quizBlock = block as RawQuizBlock;
                const options: QuizOption[] = quizBlock.options.map((optText, idx) => ({
                    text: optText,
                    isCorrect: quizBlock.correct.includes(idx),
                    explanation: quizBlock.explanations[idx]
                }));
                return { ...quizBlock, options };
            }
            return block;
        });

        return {
            id: lesson.id,
            title: lesson.title,
            status: index === 0 ? StageStatus.Unlocked : StageStatus.Locked,
            lesson: { ...lesson, blocks: processedBlocks }
        };
    });
}


export const INITIAL_ROADMAP_LESSONS: LessonSummary[] = processRawLessons(rawLessons);
