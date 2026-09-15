"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Goal =
  | "Homework"
  | "Olympiad"
  | "School Practice"
  | "Just Explore";

type Mode =
  | "home"
  | "worksheet"
  | "olympiad"
  | "homework"
  | "challenge";

type Difficulty = "Easy" | "Medium" | "Hard";

type Question = {
  number: number;
  question: string;
  topic: string;
  difficulty: Difficulty | string;
  correctAnswer?: string;
  visual?: string[];
};

type Profile = {
  name: string;
  classLevel: string;
  goal: Goal;
};

type TopicProgress = {
  solved: number;
  correct: number;
};

type Progress = {
  solved: number;
  correct: number;
  mistakes: number;
  topics: Record<string, TopicProgress>;
};

const PROFILE_KEY = "bodhaProfile";
const PROGRESS_KEY = "bodhaProgress";

const olympiadQuestions: Question[] = [
  {
    number: 1,
    question:
      "Riya has 12 chocolates. She gives 5 chocolates to her friend. How many chocolates does she have left?",
    topic: "Logical Thinking",
    difficulty: "Easy",
    correctAnswer: "7",
    visual: [
      "🍫 🍫 🍫 🍫 🍫 🍫",
      "🍫 🍫 🍫 🍫 🍫 🍫",
      "➖ 5 chocolates",
      "How many are left? 🤔",
    ],
  },
  {
    number: 2,
    question: "What comes next? 2, 4, 6, 8, ___",
    topic: "Patterns",
    difficulty: "Easy",
    correctAnswer: "10",
    visual: [
      "2  →  4  →  6  →  8  →  ?",
      "💡 Look at how much the number changes each time.",
    ],
  },
  {
    number: 3,
    question:
      "There are 3 birds on a tree. 2 more birds come. Then 1 bird flies away. How many birds are there now?",
    topic: "Reasoning",
    difficulty: "Easy",
    correctAnswer: "4",
    visual: [
      "🐦 🐦 🐦",
      "➕ 🐦 🐦",
      "➖ 🐦",
      "How many birds now?",
    ],
  },
  {
    number: 4,
    question:
      "A clock shows 3 o'clock. What number does the minute hand point to?",
    topic: "Time",
    difficulty: "Medium",
    correctAnswer: "12",
    visual: [
      "        12",
      "   9    🕒    3",
      "        6",
      "Where is the minute hand at 3:00?",
    ],
  },
  {
    number: 5,
    question:
      "I am greater than 20 and smaller than 30. I have 5 in my ones place. What number am I?",
    topic: "Number Sense",
    difficulty: "Medium",
    correctAnswer: "25",
    visual: [
      "20  <  ?  <  30",
      "The ones digit is 5.",
      "🤔 What number fits both clues?",
    ],
  },
];

const homeworkQuestions: Question[] = [
  {
    number: 1,
    question: "36 + 24 = ?",
    topic: "Addition",
    difficulty: "Easy",
    correctAnswer: "60",
    visual: [
      "36  ➕  24",
      "Think about adding the tens and ones.",
    ],
  },
  {
    number: 2,
    question: "75 - 28 = ?",
    topic: "Subtraction",
    difficulty: "Easy",
    correctAnswer: "47",
    visual: [
      "75  ➖  28",
      "How many are left after taking away 28?",
    ],
  },
  {
    number: 3,
    question: "6 × 4 = ?",
    topic: "Multiplication",
    difficulty: "Easy",
    correctAnswer: "24",
    visual: [
      "🍪 🍪 🍪 🍪",
      "🍪 🍪 🍪 🍪",
      "🍪 🍪 🍪 🍪",
      "🍪 🍪 🍪 🍪",
      "🍪 🍪 🍪 🍪",
      "🍪 🍪 🍪 🍪",
    ],
  },
  {
    number: 4,
    question: "There are ___ days in one week.",
    topic: "Time",
    difficulty: "Easy",
    correctAnswer: "7",
    visual: [
      "Mon → Tue → Wed → Thu → Fri → Sat → Sun",
      "☀️ Count the days!",
    ],
  },
  {
    number: 5,
    question: "A pencil costs ₹5. How much do 3 pencils cost?",
    topic: "Money",
    difficulty: "Medium",
    correctAnswer: "15",
    visual: [
      "✏️ ₹5    ✏️ ₹5    ✏️ ₹5",
      "3 groups of ₹5 = ?",
    ],
  },
];

function tinyChallenge(classLevel: string): Question {
  const classNumber = Number(classLevel) || 1;

  if (classNumber <= 2) {
    return {
      number: 1,
      question:
        "You have 5 apples and get 3 more. How many apples do you have?",
      topic: "Addition",
      difficulty: "Easy",
      correctAnswer: "8",
      visual: [
        "🍎 🍎 🍎 🍎 🍎",
        "➕ 🍎 🍎 🍎",
        "How many altogether?",
      ],
    };
  }

  if (classNumber <= 4) {
    return {
      number: 1,
      question:
        "There are 4 groups of 3 stars. How many stars are there?",
      topic: "Multiplication",
      difficulty: "Easy",
      correctAnswer: "12",
      visual: [
        "⭐ ⭐ ⭐",
        "⭐ ⭐ ⭐",
        "⭐ ⭐ ⭐",
        "⭐ ⭐ ⭐",
        "Count all the stars!",
      ],
    };
  }

  return {
    number: 1,
    question:
      "A book has 48 pages. You read 17 pages. How many pages are left?",
    topic: "Subtraction",
    difficulty: "Medium",
    correctAnswer: "31",
    visual: [
      "📖 48 pages",
      "📚 Read 17 pages",
      "How many pages remain?",
    ],
  };
}

const emptyProgress: Progress = {
  solved: 0,
  correct: 0,
  mistakes: 0,
  topics: {},
};

function normalizeAnswer(value: string) {
  return value
    .toLowerCase()
    .replace(/[,₹$]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);

  const [name, setName] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [goal, setGoal] = useState<Goal>("School Practice");

  const [mode, setMode] = useState<Mode>("home");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [answer, setAnswer] = useState("");
  const [mentorResponse, setMentorResponse] = useState("");

  const [image, setImage] = useState<string | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [thinking, setThinking] = useState(false);

  const [error, setError] = useState("");

  const [progress, setProgress] =
    useState<Progress>(emptyProgress);

  useEffect(() => {
    try {
      const savedProfile =
        localStorage.getItem(PROFILE_KEY);

      const savedProgress =
        localStorage.getItem(PROGRESS_KEY);

      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);

        setProfile(parsed);
        setName(parsed.name || "");
        setClassLevel(parsed.classLevel || "");
        setGoal(parsed.goal || "School Practice");
      }

      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);

        setProgress({
          solved: parsed.solved || 0,
          correct: parsed.correct || 0,
          mistakes: parsed.mistakes || 0,
          topics: parsed.topics || {},
        });
      }
    } catch {
      // Start fresh if saved data is invalid.
    }
  }, []);

  useEffect(() => {
    if (profile) {
      localStorage.setItem(
        PROFILE_KEY,
        JSON.stringify(profile)
      );
    }

    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify(progress)
    );
  }, [profile, progress]);

  const current = questions[currentQuestion];

  const accuracy = progress.solved
    ? Math.round(
        (progress.correct / progress.solved) * 100
      )
    : 0;

  const garden = useMemo(() => {
    if (progress.correct >= 20) return "🌳";
    if (progress.correct >= 10) return "🌿";
    if (progress.correct >= 5) return "🌱";
    if (progress.correct >= 1) return "🌰";

    return "🌱";
  }, [progress.correct]);

  const strongestTopic = useMemo(() => {
    const entries = Object.entries(progress.topics);

    if (!entries.length) return null;

    return [...entries].sort((a, b) => {
      const aScore =
        a[1].solved > 0
          ? a[1].correct / a[1].solved
          : 0;

      const bScore =
        b[1].solved > 0
          ? b[1].correct / b[1].solved
          : 0;

      return bScore - aScore;
    })[0][0];
  }, [progress.topics]);

  const weakestTopic = useMemo(() => {
    const entries = Object.entries(progress.topics);

    if (!entries.length) return null;

    return [...entries].sort((a, b) => {
      const aScore =
        a[1].solved > 0
          ? a[1].correct / a[1].solved
          : 0;

      const bScore =
        b[1].solved > 0
          ? b[1].correct / b[1].solved
          : 0;

      return aScore - bScore;
    })[0][0];
  }, [progress.topics]);

  const startLearning = () => {
    if (!name.trim() || !classLevel) return;

    const newProfile: Profile = {
      name: name.trim(),
      classLevel,
      goal,
    };

    setProfile(newProfile);
    setMode("home");
  };

  const chooseWorksheet = () => {
    fileInputRef.current?.click();
  };

  const startPractice = (
    type: "olympiad" | "homework" | "challenge"
  ) => {
    let selected: Question[];

    if (type === "olympiad") {
      selected = olympiadQuestions;
    } else if (type === "homework") {
      selected = homeworkQuestions;
    } else {
      selected = [
        tinyChallenge(profile?.classLevel || "1"),
      ];
    }

    setMode(type);
    setQuestions(selected);
    setCurrentQuestion(0);
    setAnswer("");
    setMentorResponse("");
    setError("");
  };

  const updateProgress = (
    question: Question,
    correct: boolean
  ) => {
    setProgress((previous) => {
      const old =
        previous.topics[question.topic] || {
          solved: 0,
          correct: 0,
        };

      return {
        solved: previous.solved + 1,

        correct:
          previous.correct + (correct ? 1 : 0),

        mistakes:
          previous.mistakes + (correct ? 0 : 1),

        topics: {
          ...previous.topics,

          [question.topic]: {
            solved: old.solved + 1,

            correct:
              old.correct + (correct ? 1 : 0),
          },
        },
      };
    });
  };

  const handleWorksheet = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose a worksheet image.");
      return;
    }

    const reader = new FileReader();

    reader.onload = async () => {
      const imageData = reader.result as string;

      setImage(imageData);
      setAnalyzing(true);
      setQuestions([]);
      setMentorResponse("");
      setError("");
      setMode("worksheet");

      try {
        const response = await fetch(
          "/api/analyze",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              image: imageData,
            }),
          }
        );

        const text = await response.text();

        let data: any;

        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(
            `Unexpected server response (${response.status}).`
          );
        }

        if (!response.ok) {
          throw new Error(
            data.error ||
              "BODHA couldn't read the worksheet."
          );
        }

        if (
          !Array.isArray(data.questions) ||
          !data.questions.length
        ) {
          throw new Error(
            "No questions found on this worksheet."
          );
        }

        setQuestions(data.questions);
        setCurrentQuestion(0);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "BODHA couldn't read the worksheet."
        );

        setMode("home");
      } finally {
        setAnalyzing(false);
      }
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  };

  const askBodha = async () => {
    if (!answer.trim() || !current || thinking) {
      return;
    }

    setThinking(true);
    setMentorResponse("");
    setError("");

    /*
     * Preset questions have verified answers,
     * so these can safely update progress.
     *
     * Worksheet questions do not have verified answers,
     * so they are not counted as correct/incorrect.
     */
    if (current.correctAnswer) {
      const correct =
        normalizeAnswer(answer) ===
        normalizeAnswer(current.correctAnswer);

      updateProgress(current, correct);
    }

    try {
      const response = await fetch(
        "/api/mentor",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            question: current.question,

            childAnswer: answer,

            correctAnswer:
              current.correctAnswer || "",

            classLevel:
              profile?.classLevel || "",

            goal:
              profile?.goal || "",
          }),
        }
      );

      const text = await response.text();

      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Unexpected mentor response (${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "BODHA couldn't respond."
        );
      }

      setMentorResponse(
        data.response ||
          "🌱 Let's think about it together!"
      );
    } catch (err) {
      console.error(err);

      setMentorResponse(
        err instanceof Error
          ? err.message
          : "🌱 Let's try that again!"
      );
    } finally {
      setThinking(false);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(
        (previous) => previous + 1
      );

      setAnswer("");
      setMentorResponse("");
      setError("");

      return;
    }

    goHome();
  };

  const goHome = () => {
    setMode("home");
    setQuestions([]);
    setCurrentQuestion(0);
    setAnswer("");
    setMentorResponse("");
    setError("");
  };

  const resetProfile = () => {
    localStorage.removeItem(PROFILE_KEY);

    setProfile(null);
    setName("");
    setClassLevel("");
    setGoal("School Practice");

    goHome();
  };

  /*
   * ==========================
   * ONBOARDING
   * ==========================
   */

  if (!profile) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-6">
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center">
            <div className="text-6xl mb-3">
              🌱
            </div>

            <h1 className="text-4xl font-black text-emerald-700">
              BODHA
              <span className="text-slate-700">
                .ai
              </span>
            </h1>

            <p className="text-slate-600 mt-2">
              Your little learning buddy
            </p>
          </div>

          <div className="mt-8 space-y-6">

            {/* NAME */}

            <div>
              <label className="font-bold text-slate-800">
                What should BODHA call you?
              </label>

              <input
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Your name"
                className="mt-2 w-full rounded-2xl border-2 border-slate-300 bg-white p-4 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            {/* CLASS */}

            <div>
              <label className="font-bold text-slate-800">
                Which class are you in?
              </label>

              <div className="grid grid-cols-5 gap-2 mt-2">
                {Array.from(
                  { length: 10 },
                  (_, i) => String(i + 1)
                ).map((value) => (
                  <button
                    key={value}
                    onClick={() =>
                      setClassLevel(value)
                    }
                    className={`rounded-xl p-3 font-bold border-2 transition ${
                      classLevel === value
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            {/* GOAL */}

            <div>
              <label className="font-bold text-slate-800">
                What do you want to do?
              </label>

              <div className="grid sm:grid-cols-2 gap-3 mt-2">
                {(
                  [
                    "Homework",
                    "Olympiad",
                    "School Practice",
                    "Just Explore",
                  ] as Goal[]
                ).map((item) => (
                  <button
                    key={item}
                    onClick={() =>
                      setGoal(item)
                    }
                    className={`rounded-xl p-4 font-bold border-2 transition ${
                      goal === item
                        ? "bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-200 shadow-sm"
                        : "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    {goal === item && "✓ "}
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* START */}

            <button
              onClick={startLearning}
              disabled={
                !name.trim() || !classLevel
              }
              className="w-full rounded-2xl bg-emerald-600 text-white p-4 font-black text-lg shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:opacity-100"
            >
              Start learning 🚀
            </button>

          </div>
        </div>
      </main>
    );
  }

  /*
   * ==========================
   * QUESTION SCREEN
   * ==========================
   */

  if (questions.length > 0 && current) {
    const title =
      mode === "olympiad"
        ? "🏆 Olympiad"
        : mode === "homework"
        ? "📚 Homework"
        : mode === "challenge"
        ? "🌟 Today's Tiny Challenge"
        : "📖 My Worksheet";

    return (
      <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
        <div className="max-w-3xl mx-auto">

          <button
            onClick={goHome}
            className="text-slate-700 font-bold mb-5 hover:text-emerald-700"
          >
            ← Home
          </button>

          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">

            {/* HEADER */}

            <div className="p-6 bg-emerald-700 text-white flex justify-between gap-4">
              <div>
                <p className="text-emerald-100 text-sm">
                  {title}
                </p>

                <h1 className="text-2xl font-black">
                  Question{" "}
                  {currentQuestion + 1} of{" "}
                  {questions.length}
                </h1>
              </div>

              <div className="text-right">
                <span className="text-emerald-100 text-sm">
                  {current.topic}
                </span>

                <div className="font-bold">
                  {current.difficulty}
                </div>
              </div>
            </div>

            {/* QUESTION */}

            <div className="p-6 sm:p-8">

              <div className="text-xl sm:text-2xl font-bold text-slate-800 leading-relaxed">
                {current.question}
              </div>

              {/* VISUAL */}

              {current.visual && (
                <div className="mt-6 rounded-3xl bg-amber-50 border-2 border-amber-200 p-6 text-center">

                  <div className="text-xs uppercase tracking-widest font-black text-amber-700 mb-3">
                    👀 Show Me
                  </div>

                  {current.visual.map(
                    (line, index) => (
                      <div
                        key={index}
                        className="text-xl sm:text-2xl font-semibold text-slate-800 whitespace-pre-wrap leading-relaxed"
                      >
                        {line}
                      </div>
                    )
                  )}

                </div>
              )}

              {/* ANSWER */}

              <textarea
                value={answer}
                onChange={(e) =>
                  setAnswer(e.target.value)
                }
                placeholder="Type your answer here..."
                className="mt-6 w-full min-h-28 rounded-2xl border-2 border-slate-300 bg-white p-4 text-lg text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />

              {/* ASK BODHA */}

              <button
                onClick={askBodha}
                disabled={
                  !answer.trim() || thinking
                }
                className="mt-3 w-full rounded-2xl bg-emerald-600 text-white p-4 font-black text-lg shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:opacity-100"
              >
                {thinking
                  ? "BODHA is thinking… 🌱"
                  : "Ask BODHA 💡"}
              </button>

              {/* ERROR */}

              {error && (
                <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 font-medium">
                  {error}
                </div>
              )}

              {/* MENTOR RESPONSE */}

              {mentorResponse && (
                <div className="mt-5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 p-5 text-lg text-slate-800 leading-relaxed">
                  <b className="text-emerald-800">
                    🌱 BODHA:
                  </b>

                  <p className="mt-2">
                    {mentorResponse}
                  </p>
                </div>
              )}

              {/* NEXT */}

              {mentorResponse && (
                <button
                  onClick={nextQuestion}
                  className="mt-4 w-full rounded-2xl border-2 border-emerald-600 text-emerald-700 bg-white hover:bg-emerald-50 p-4 font-black"
                >
                  {currentQuestion <
                  questions.length - 1
                    ? "Next question →"
                    : "Finish 🌟"}
                </button>
              )}

            </div>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ==========================
   * HOME
   * ==========================
   */

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-amber-50 p-4 sm:p-8">

      <div className="max-w-5xl mx-auto">

        {/* HEADER */}

        <header className="flex items-center justify-between mb-8">

          <div>
            <h1 className="text-3xl font-black text-emerald-700">
              BODHA
              <span className="text-slate-700">
                .ai
              </span>{" "}
              🌱
            </h1>

            <p className="text-slate-600">
              Hi {profile.name}! Class{" "}
              {profile.classLevel} learner
            </p>
          </div>

          <button
            onClick={resetProfile}
            className="text-sm font-semibold text-slate-600 hover:text-emerald-700"
          >
            Change profile
          </button>

        </header>

        {/* CHALLENGE + ACCURACY */}

        <section className="grid md:grid-cols-3 gap-4 mb-6">

          <div className="md:col-span-2 rounded-3xl bg-white shadow-sm border-2 border-slate-100 p-6">

            <p className="text-emerald-700 font-bold">
              Today's Tiny Challenge 🌟
            </p>

            <h2 className="text-2xl font-black text-slate-900 mt-1">
              One small problem. One big win.
            </h2>

            <p className="text-slate-600 mt-2">
              A quick challenge chosen for Class{" "}
              {profile.classLevel}.
            </p>

            <button
              onClick={() =>
                startPractice("challenge")
              }
              className="mt-5 rounded-2xl bg-emerald-600 text-white px-6 py-3 font-black hover:bg-emerald-700"
            >
              Start challenge →
            </button>

          </div>

          <div className="rounded-3xl bg-slate-900 text-white p-6">

            <div className="text-sm text-slate-300">
              Accuracy
            </div>

            <div className="text-4xl font-black mt-1">
              {accuracy}%
            </div>

            <div className="text-sm text-slate-300 mt-2">
              {progress.solved} solved ·{" "}
              {progress.mistakes} learning moments
            </div>

          </div>

        </section>

        {/* MAIN CARDS */}

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* WORKSHEET */}

          <button
            onClick={() => {
              setImage(null);
              setError("");
              setMode("worksheet");
            }}
            className="rounded-3xl bg-white border-2 border-slate-100 p-6 text-left hover:shadow-md hover:border-emerald-200 transition"
          >
            <div className="text-4xl">
              📸
            </div>

            <h3 className="font-black text-xl text-slate-900 mt-3">
              My Worksheet
            </h3>

            <p className="text-slate-600 text-sm mt-1">
              Upload a worksheet and let BODHA
              read it.
            </p>
          </button>

          {/* OLYMPIAD */}

          <button
            onClick={() =>
              startPractice("olympiad")
            }
            className="rounded-3xl bg-white border-2 border-slate-100 p-6 text-left hover:shadow-md hover:border-emerald-200 transition"
          >
            <div className="text-4xl">
              🏆
            </div>

            <h3 className="font-black text-xl text-slate-900 mt-3">
              Olympiad
            </h3>

            <p className="text-slate-600 text-sm mt-1">
              Think harder and build reasoning
              skills.
            </p>
          </button>

          {/* HOMEWORK */}

          <button
            onClick={() =>
              startPractice("homework")
            }
            className="rounded-3xl bg-white border-2 border-slate-100 p-6 text-left hover:shadow-md hover:border-emerald-200 transition"
          >
            <div className="text-4xl">
              📚
            </div>

            <h3 className="font-black text-xl text-slate-900 mt-3">
              Homework
            </h3>

            <p className="text-slate-600 text-sm mt-1">
              Practice school questions with
              BODHA.
            </p>
          </button>

          {/* GARDEN */}

          <div className="rounded-3xl bg-amber-100 border-2 border-amber-200 p-6">

            <div className="text-4xl">
              {garden}
            </div>

            <h3 className="font-black text-xl text-slate-900 mt-3">
              Learning Garden
            </h3>

            <p className="text-slate-700 text-sm mt-1">
              {progress.correct} correct answers
              are helping your garden grow!
            </p>

          </div>

        </section>

        {/* LEARNING GARDEN */}

        <section className="mt-6 rounded-3xl bg-white border-2 border-slate-100 shadow-sm p-6">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-xl font-black text-slate-900">
                {garden} My Learning Garden
              </h2>

              <p className="text-slate-600 text-sm">
                BODHA remembers your practice on
                this device.
              </p>
            </div>

            <div className="text-4xl">
              {garden}
            </div>

          </div>

          {/* STATS */}

          <div className="grid sm:grid-cols-3 gap-3 mt-5">

            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
              <div className="text-2xl font-black text-slate-900">
                {progress.solved}
              </div>

              <div className="text-sm text-slate-600">
                Problems solved
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
              <div className="text-2xl font-black text-slate-900">
                {progress.correct}
              </div>

              <div className="text-sm text-slate-600">
                Correct answers
              </div>
            </div>

            <div className="rounded-2xl bg-red-50 border border-red-100 p-4">
              <div className="text-2xl font-black text-slate-900">
                {progress.mistakes}
              </div>

              <div className="text-sm text-slate-600">
                Learning moments
              </div>
            </div>

          </div>

          {/* STRONG / WEAK */}

          {strongestTopic && (
            <p className="mt-5 text-emerald-700 font-bold">
              💪 Strong area: {strongestTopic}
            </p>
          )}

          {weakestTopic &&
            weakestTopic !== strongestTopic && (
              <p className="mt-2 text-amber-700 font-bold">
                🌱 Keep practising: {weakestTopic}
              </p>
            )}

          {/* TOPICS */}

          {Object.keys(progress.topics).length >
            0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">

              {Object.entries(
                progress.topics
              ).map(([topic, data]) => {

                const percentage =
                  data.solved > 0
                    ? Math.round(
                        (data.correct /
                          data.solved) *
                          100
                      )
                    : 0;

                return (
                  <div
                    key={topic}
                    className="rounded-2xl bg-slate-50 border border-slate-200 p-4"
                  >

                    <div className="font-bold text-slate-900">
                      {topic}
                    </div>

                    <div className="text-sm text-slate-600">
                      {data.correct}/
                      {data.solved} correct
                    </div>

                    <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">

                      <div
                        className="h-full bg-emerald-500"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </section>

        {/* WORKSHEET UPLOAD */}

        {mode === "worksheet" && (
          <section className="mt-6 rounded-3xl bg-white border-2 border-slate-100 shadow-sm p-6">

            <div className="flex justify-between">

              <div>
                <h2 className="text-xl font-black text-slate-900">
                  📸 Read My Worksheet
                </h2>

                <p className="text-slate-600">
                  Upload a clear photo of one
                  worksheet page.
                </p>
              </div>

              <button
                onClick={goHome}
                className="text-slate-600 font-semibold hover:text-emerald-700"
              >
                Close
              </button>

            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="mt-5 block w-full text-slate-800"
              onChange={handleWorksheet}
            />

            {image && (
              <img
                src={image}
                alt="Worksheet preview"
                className="mt-5 max-h-72 rounded-2xl mx-auto object-contain"
              />
            )}

            <button
              onClick={chooseWorksheet}
              disabled={analyzing}
              className="mt-5 w-full rounded-2xl bg-emerald-600 text-white p-4 font-black shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:opacity-100"
            >
              {analyzing
                ? "BODHA is reading… 📖"
                : "Choose worksheet →"}
            </button>

            {error && (
              <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 font-medium">
                {error}
              </div>
            )}

          </section>
        )}

        <p className="text-center mt-8 text-slate-600">
          🌱 BODHA helps you think — you do the
          learning.
        </p>

      </div>
    </main>
  );
}