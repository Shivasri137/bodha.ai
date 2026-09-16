"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type Goal = "Homework" | "Olympiad" | "School Practice" | "Just Explore";
type Mode = "home" | "practice" | "worksheet";
type PracticeType = "challenge" | "olympiad" | "homework";

type Question = {
  number: number;
  question: string;
  topic: string;
  difficulty?: string;
  correctAnswer?: string;
  visual?: string[];
};

type Profile = {
  name: string;
  classLevel: string;
  goal: Goal;
};

type Fact = {
  title: string;
  fact: string;
  whyItMatters?: string;
  category?: string;
  emoji?: string;
};

type Progress = {
  xp: number;
  solved: number;
  correct: number;
  mistakes: number;
  streak: number;
  lastActive: string;
  facts: number;
  missions: number;
  topics: Record<string, { solved: number; correct: number }>;
};

const PROFILE_KEY = "bodhaProfile";
const PROGRESS_KEY = "bodhaProgress";
const Q_HISTORY = "bodha_question_history_v3";
const F_HISTORY = "bodha_fact_history_v3";

const EMPTY: Progress = {
  xp: 0,
  solved: 0,
  correct: 0,
  mistakes: 0,
  streak: 0,
  lastActive: "",
  facts: 0,
  missions: 0,
  topics: {},
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[₹$,.?!:;'"`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const day = () => {
  const d = new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(d);
};

const prevDay = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(d);
};

function touch(p: Progress): Progress {
  const now = day();

  if (p.lastActive === now) return p;

  return {
    ...p,
    lastActive: now,
    streak: p.lastActive === prevDay() ? p.streak + 1 : 1,
  };
}

function readArray(key: string): string[] {
  try {
    const x = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(x) ? x : [];
  } catch {
    return [];
  }
}

function writeHistory(key: string, values: string[]) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify([...new Set(values)].slice(-100))
    );
  } catch {}
}

/* -------------------------------------------------------------------------- */
/* ICON SYSTEM — no emoji, no external icon package                            */
/* -------------------------------------------------------------------------- */

function Icon({
  name,
  size = 20,
  stroke = 1.8,
}: {
  name: string;
  size?: number;
  stroke?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "logo":
      return (
        <svg {...common} viewBox="0 0 48 48">
          <path
            d="M10 13.5C13.8 10.1 17.7 9 24 11.2v23c-6.3-2.2-10.2-1.1-14 2.3V13.5Z"
            fill="currentColor"
            opacity=".95"
            stroke="none"
          />
          <path
            d="M38 13.5C34.2 10.1 30.3 9 24 11.2v23c6.3-2.2 10.2-1.1 14 2.3V13.5Z"
            fill="currentColor"
            opacity=".7"
            stroke="none"
          />
          <path
            d="M24 11.2v23"
            stroke="white"
            strokeWidth="1.7"
            opacity=".7"
          />
          <path
            d="M24 8c1.7-2.3 4.4-3.5 7.3-3.1-1.1 2.6-3.4 4.3-6.2 4.5"
            stroke="currentColor"
            strokeWidth="1.6"
            fill="none"
          />
        </svg>
      );

    case "home":
      return (
        <svg {...common}>
          <path d="m3 10 9-7 9 7" />
          <path d="M5 9v11h14V9" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );

    case "spark":
      return (
        <svg {...common}>
          <path d="M12 2.8 13.7 9l6 1.7-6 1.7-1.7 6-1.7-6-6-1.7L10.3 9 12 2.8Z" />
        </svg>
      );

    case "book":
      return (
        <svg {...common}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M8 7h8M8 10h6" />
        </svg>
      );

    case "trophy":
      return (
        <svg {...common}>
          <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
          <path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4" />
          <path d="M12 13v4M8 21h8M9 17h6" />
        </svg>
      );

    case "bulb":
      return (
        <svg {...common}>
          <path d="M9 18h6" />
          <path d="M10 21h4" />
          <path d="M8.5 14.5C7.6 13.4 7 12 7 10.5a5 5 0 1 1 10 0c0 1.5-.6 2.9-1.5 4-.6.7-1 1.4-1.1 2.5h-4.8c-.1-1.1-.5-1.8-1.1-2.5Z" />
        </svg>
      );

    case "puzzle":
      return (
        <svg {...common}>
          <path d="M9 4h3a2 2 0 1 1 4 0h3v5a2 2 0 1 0 0 4v5h-5a2 2 0 1 1-4 0H5v-4a2 2 0 1 0 0-4V6h4a2 2 0 1 1 0-2Z" />
        </svg>
      );

    case "target":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" />
        </svg>
      );

    case "chart":
      return (
        <svg {...common}>
          <path d="M4 19V5M4 19h17" />
          <path d="m7 15 4-4 3 2 5-6" />
        </svg>
      );

    case "leaf":
      return (
        <svg {...common}>
          <path d="M20 4C10 4 5 8.2 5 14.5A5.5 5.5 0 0 0 10.5 20C16.8 20 20 13.7 20 4Z" />
          <path d="M4 21c3.5-5.5 7-8.5 12-11" />
        </svg>
      );

    case "camera":
      return (
        <svg {...common}>
          <path d="M4 7h3l1.5-2h7L17 7h3v12H4V7Z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
      );

    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );

    case "arrowLeft":
      return (
        <svg {...common}>
          <path d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );

    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 21c.8-4 3.1-6 7-6s6.2 2 7 6" />
        </svg>
      );

    case "chevron":
      return (
        <svg {...common}>
          <path d="m9 5 7 7-7 7" />
        </svg>
      );

    case "close":
      return (
        <svg {...common}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      );

    case "refresh":
      return (
        <svg {...common}>
          <path d="M20 11a8 8 0 0 0-14.8-4L3 9" />
          <path d="M3 4v5h5" />
          <path d="M4 13a8 8 0 0 0 14.8 4L21 15" />
          <path d="M21 20v-5h-5" />
        </svg>
      );

    case "menu":
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

/* -------------------------------------------------------------------------- */
/* LOGO                                                                         */
/* -------------------------------------------------------------------------- */

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`logo ${compact ? "logo-compact" : ""}`}>
      <div className="logo-mark">
        <Icon name="logo" size={compact ? 34 : 38} stroke={1.5} />
      </div>

      <div className="logo-copy">
        <div>
          BODHA<span>.ai</span>
        </div>
        {!compact && <small>Learn · Think · Discover</small>}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FEATURE CARD                                                                 */
/* -------------------------------------------------------------------------- */

function FeatureCard({
  icon,
  eyebrow,
  title,
  text,
  onClick,
  tone,
}: {
  icon: string;
  eyebrow: string;
  title: string;
  text: string;
  onClick: () => void;
  tone: string;
}) {
  return (
    <button className={`feature-card ${tone}`} onClick={onClick}>
      <div className="feature-top">
        <div className="feature-icon">
          <Icon name={icon} size={21} />
        </div>

        <Icon name="arrow" size={17} />
      </div>

      <small>{eyebrow}</small>
      <h3>{title}</h3>
      <p>{text}</p>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* APP                                                                          */
/* -------------------------------------------------------------------------- */

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [goal, setGoal] = useState<Goal>("School Practice");

  const [mode, setMode] = useState<Mode>("home");
  const [type, setType] = useState<PracticeType>("challenge");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [mentor, setMentor] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [fact, setFact] = useState<Fact | null>(null);
  const [factBusy, setFactBusy] = useState(false);

  const [progress, setProgress] = useState<Progress>(EMPTY);

  const [image, setImage] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [mission, setMission] = useState(false);

  const [attempt, setAttempt] = useState(1);
  const [answerCorrect, setAnswerCorrect] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    try {
      const p = localStorage.getItem(PROFILE_KEY);
      const s = localStorage.getItem(PROGRESS_KEY);

      if (p) {
        const x = JSON.parse(p);
        setProfile(x);
        setName(x.name || "");
        setClassLevel(x.classLevel || "");
        setGoal(x.goal || "School Practice");
      }

      if (s) {
        setProgress({
          ...EMPTY,
          ...JSON.parse(s),
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (profile) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    }

    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }, [profile, progress]);

  const current = questions[index];

  const accuracy = progress.solved
    ? Math.round((progress.correct / progress.solved) * 100)
    : 0;

  const level = Math.floor(progress.xp / 100) + 1;
  const levelPct = progress.xp % 100;

  const strongestTopic = useMemo(() => {
    const entries = Object.entries(progress.topics);

    if (!entries.length) return null;

    return entries.sort(
      (a, b) =>
        b[1].correct / Math.max(b[1].solved, 1) -
        a[1].correct / Math.max(a[1].solved, 1)
    )[0][0];
  }, [progress.topics]);

  const start = () => {
    if (!name.trim() || !classLevel) return;

    setProfile({
      name: name.trim(),
      classLevel,
      goal,
    });

    setProgress((p) => touch(p));
  };

  /* ------------------------------------------------------------------------ */
  /* QUESTION GENERATION                                                       */
  /* ------------------------------------------------------------------------ */

  const generate = async (kind: PracticeType) => {
    if (!profile) return;

    setType(kind);
    setMode("practice");
    setQuestions([]);
    setIndex(0);
    setAnswer("");
    setMentor("");
    setError("");
    setAttempt(1);
    setAnswerCorrect(false);
    setBusy(true);

    try {
      const history = readArray(Q_HISTORY);

      const r = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: kind,
          classLevel: profile.classLevel,
          goal: profile.goal,
          count: kind === "challenge" ? 1 : 5,
          exclude: history.slice(-60),
        }),
      });

      const text = await r.text();

      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `BODHA received an unexpected response (${r.status}).`
        );
      }

      if (!r.ok) {
        throw new Error(
          data.error || "BODHA couldn't create questions right now."
        );
      }

      const qs: Question[] = Array.isArray(data.questions)
        ? data.questions.filter((q: Question) => q?.question)
        : [];

      const fresh = qs.filter((q) => !history.includes(norm(q.question)));

      if (!fresh.length) {
        throw new Error(
          "BODHA couldn't find a fresh question. Please try again."
        );
      }

      setQuestions(fresh);

      writeHistory(Q_HISTORY, [
        ...history,
        ...fresh.map((q) => norm(q.question)),
      ]);

      setProgress((p) => touch(p));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "BODHA couldn't create a challenge."
      );
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* FACT                                                                       */
  /* ------------------------------------------------------------------------ */

  const learnFact = async () => {
    setFactBusy(true);
    setError("");

    try {
      const history = readArray(F_HISTORY);

      const r = await fetch("/api/fact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classLevel: profile?.classLevel || "3",
          exclude: history.slice(-60),
        }),
      });

      const text = await r.text();

      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Unexpected fact response (${r.status}).`);
      }

      if (!r.ok) {
        throw new Error(data.error || "BODHA couldn't find a fact.");
      }

      const f: Fact = data.fact;

      if (!f?.fact) {
        throw new Error("BODHA couldn't format the fact correctly.");
      }

      setFact(f);

      writeHistory(F_HISTORY, [
        ...history,
        norm(`${f.title} ${f.fact}`),
      ]);

      setProgress((p) => ({
        ...touch(p),
        facts: p.facts + 1,
        xp: p.xp + 5,
      }));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Let's discover a fact again."
      );
    } finally {
      setFactBusy(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* MENTOR                                                                     */
  /* ------------------------------------------------------------------------ */

  const ask = async () => {
    if (!current || !answer.trim() || busy || answerCorrect) return;

    setBusy(true);
    setMentor("");
    setError("");

    try {
      const r = await fetch("/api/mentor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profile?.name || "",
          question: current.question,
          childAnswer: answer,
          correctAnswer: current.correctAnswer || "",
          classLevel: profile?.classLevel || "",
          goal: profile?.goal || "",
          topic: current.topic || "",
          attempt,
        }),
      });

      const text = await r.text();

      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Unexpected mentor response (${r.status}).`
        );
      }

      if (!r.ok) {
        throw new Error(
          data.error || "BODHA couldn't respond right now."
        );
      }

      setMentor(data.response || "Let's think about it together.");

      if (data.isCorrect === true) {
        setAnswerCorrect(true);

        setProgress((p) => {
          const old = p.topics[current.topic] || {
            solved: 0,
            correct: 0,
          };

          return {
            ...touch(p),
            solved: p.solved + 1,
            correct: p.correct + 1,
            xp: p.xp + (attempt === 1 ? 10 : 7),
            topics: {
              ...p.topics,
              [current.topic]: {
                solved: old.solved + 1,
                correct: old.correct + 1,
              },
            },
          };
        });
      } else {
        setAttempt((n) => Math.min(n + 1, 3));
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "BODHA couldn't respond right now."
      );
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    if (!answerCorrect) return;

    if (index < questions.length - 1) {
      setIndex((i) => i + 1);
      setAnswer("");
      setMentor("");
      setError("");
      setAttempt(1);
      setAnswerCorrect(false);
    } else {
      setMode("home");
      setQuestions([]);
      setIndex(0);
      setAnswer("");
      setMentor("");
      setError("");
      setAttempt(1);
      setAnswerCorrect(false);
    }
  };

  const home = () => {
    setMode("home");
    setQuestions([]);
    setIndex(0);
    setAnswer("");
    setMentor("");
    setError("");
    setAttempt(1);
    setAnswerCorrect(false);
  };

  /* ------------------------------------------------------------------------ */
  /* WORKSHEET                                                                  */
  /* ------------------------------------------------------------------------ */

  const compress = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = () =>
        reject(new Error("Could not read the image."));

      reader.onload = () => {
        const img = new Image();

        img.onerror = () =>
          reject(new Error("Could not open the image."));

        img.onload = () => {
          const scale = Math.min(
            1,
            1600 / Math.max(img.width, img.height)
          );

          const c = document.createElement("canvas");

          c.width = Math.round(img.width * scale);
          c.height = Math.round(img.height * scale);

          const ctx = c.getContext("2d");

          if (!ctx) {
            return reject(
              new Error("Could not prepare the image.")
            );
          }

          ctx.drawImage(
            img,
            0,
            0,
            c.width,
            c.height
          );

          resolve(c.toDataURL("image/jpeg", 0.78));
        };

        img.src = String(reader.result);
      };

      reader.readAsDataURL(file);
    });

  const worksheet = async (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    e.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose a worksheet image.");
      return;
    }

    setMode("worksheet");
    setError("");
    setMentor("");
    setAnalyzing(true);

    try {
      const dataUrl = await compress(file);

      setImage(dataUrl);

      const r = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: dataUrl,
        }),
      });

      const text = await r.text();

      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Unexpected worksheet response (${r.status}).`
        );
      }

      if (!r.ok) {
        throw new Error(
          data.error || "BODHA couldn't read this worksheet."
        );
      }

      if (
        !Array.isArray(data.questions) ||
        !data.questions.length
      ) {
        throw new Error("No clear questions found.");
      }

      setQuestions(data.questions);
      setIndex(0);
      setAnswer("");
      setAttempt(1);
      setAnswerCorrect(false);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "BODHA couldn't read this worksheet."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* ONBOARDING                                                                 */
  /* ------------------------------------------------------------------------ */

  if (!profile) {
    return (
      <main className="onboard-page">
        <style>{CSS}</style>

        <div className="onboard-shell">
          <div className="onboard-brand">
            <Logo />
          </div>

          <div className="onboard-card">
            <div className="onboard-intro">
              <div className="intro-icon">
                <Icon name="spark" size={23} />
              </div>

              <div className="eyebrow">
                WELCOME TO BODHA
              </div>

              <h1>
                Learning should feel
                <br />
                <span>like discovering.</span>
              </h1>

              <p>
                Tell BODHA a little about you.
                We&apos;ll make your learning journey personal.
              </p>
            </div>

            <div className="form-section">
              <label>
                Your name

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should BODHA call you?"
                  maxLength={30}
                />
              </label>

              <div className="field">
                <div className="field-label">
                  Which class are you in?
                </div>

                <div className="classes">
                  {Array.from(
                    { length: 10 },
                    (_, i) => String(i + 1)
                  ).map((x) => (
                    <button
                      key={x}
                      className={
                        classLevel === x
                          ? "class-button selected"
                          : "class-button"
                      }
                      onClick={() => setClassLevel(x)}
                    >
                      {x}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <div className="field-label">
                  What are you here for?
                </div>

                <div className="goals">
                  {[
                    {
                      g: "Homework",
                      icon: "book",
                      text: "Understand my homework",
                    },
                    {
                      g: "Olympiad",
                      icon: "trophy",
                      text: "Train my thinking",
                    },
                    {
                      g: "School Practice",
                      icon: "puzzle",
                      text: "Practise what I learn",
                    },
                    {
                      g: "Just Explore",
                      icon: "spark",
                      text: "Discover something new",
                    },
                  ].map((item) => (
                    <button
                      key={item.g}
                      className={
                        goal === item.g
                          ? "goal-button selected"
                          : "goal-button"
                      }
                      onClick={() =>
                        setGoal(item.g as Goal)
                      }
                    >
                      <span className="goal-icon">
                        <Icon name={item.icon} size={19} />
                      </span>

                      <span>
                        <strong>{item.g}</strong>
                        <small>{item.text}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="primary-button start-button"
                disabled={!name.trim() || !classLevel}
                onClick={start}
              >
                Begin my journey
                <Icon name="arrow" size={18} />
              </button>
            </div>
          </div>

          <p className="onboard-footer">
            A quiet little space for curious minds.
          </p>
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* PRACTICE                                                                   */
  /* ------------------------------------------------------------------------ */

  if (mode === "practice" && current) {
    return (
      <main className="practice-page">
        <style>{CSS}</style>

        <header className="practice-header">
          <button className="back-button" onClick={home}>
            <Icon name="arrowLeft" size={17} />
            Home
          </button>

          <Logo compact />

          <div className="practice-stats">
            <span>
              <Icon name="leaf" size={15} />
              {progress.streak}
            </span>

            <span>
              {progress.xp} XP
            </span>
          </div>
        </header>

        <div className="practice-container">
          <div className="question-progress">
            <div>
              <span>
                {type === "challenge"
                  ? "Tiny Challenge"
                  : type === "olympiad"
                  ? "Olympiad Training"
                  : "Homework Practice"}
              </span>

              <b>
                {index + 1} / {questions.length}
              </b>
            </div>

            <div className="progress-line">
              <i
                style={{
                  width: `${
                    ((index + 1) / questions.length) * 100
                  }%`,
                }}
              />
            </div>
          </div>

          <section className="question-card">
            <div className="question-meta">
              <div className="question-type-icon">
                <Icon
                  name={
                    type === "olympiad"
                      ? "trophy"
                      : type === "homework"
                      ? "book"
                      : "puzzle"
                  }
                  size={21}
                />
              </div>

              <div>
                <small>
                  {current.topic || "Thinking skills"}
                </small>

                <b>
                  {current.difficulty || "Explore"}
                </b>
              </div>

              <span className="question-number">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>

            <div className="question-content">
              <div className="attempt-label">
                <span>
                  {answerCorrect
                    ? "Nicely thought through"
                    : `Attempt ${attempt} of 3`}
                </span>

                {answerCorrect && (
                  <span className="correct-label">
                    <Icon name="check" size={14} />
                    Correct
                  </span>
                )}
              </div>

              <h1>{current.question}</h1>

              {current.visual?.length ? (
                <div className="visual-box">
                  {current.visual.map((x, i) => (
                    <div key={i}>{x}</div>
                  ))}
                </div>
              ) : null}

              <label className="answer-label">
                <span>
                  Your thinking
                </span>

                <textarea
                  value={answer}
                  onChange={(e) =>
                    setAnswer(e.target.value)
                  }
                  placeholder="Write what you think..."
                  rows={4}
                  disabled={answerCorrect}
                />
              </label>

              <button
                className="primary-button answer-button"
                disabled={
                  !answer.trim() ||
                  busy ||
                  answerCorrect
                }
                onClick={ask}
              >
                {busy ? (
                  <>
                    <span className="loader" />
                    BODHA is thinking
                  </>
                ) : answerCorrect ? (
                  <>
                    <Icon name="check" size={18} />
                    You got it
                  </>
                ) : (
                  <>
                    Check my thinking
                    <Icon name="arrow" size={18} />
                  </>
                )}
              </button>

              {mentor && (
                <div
                  className={
                    answerCorrect
                      ? "mentor-box mentor-correct"
                      : "mentor-box"
                  }
                >
                  <div className="mentor-mark">
                    <Icon name="logo" size={23} />
                  </div>

                  <div>
                    <div className="mentor-name">
                      BODHA
                    </div>

                    <p>{mentor}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="error-box">
                  {error}
                </div>
              )}

              {answerCorrect && (
                <button
                  className="next-button"
                  onClick={next}
                >
                  {index < questions.length - 1
                    ? "Next question"
                    : "Finish for now"}

                  <Icon name="arrow" size={17} />
                </button>
              )}
            </div>
          </section>
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* DASHBOARD                                                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="dashboard-page">
      <style>{CSS}</style>

      <div className="dashboard-layout">
        <aside className="sidebar">
          <Logo />

          <nav>
            <button className="nav-item active">
              <Icon name="home" size={18} />
              Home
            </button>

            <button
              className="nav-item"
              onClick={() => generate("challenge")}
            >
              <Icon name="puzzle" size={18} />
              Challenge
            </button>

            <button
              className="nav-item"
              onClick={() => generate("homework")}
            >
              <Icon name="book" size={18} />
              Homework
            </button>

            <button
              className="nav-item"
              onClick={() => generate("olympiad")}
            >
              <Icon name="trophy" size={18} />
              Olympiad
            </button>

            <button
              className="nav-item"
              onClick={learnFact}
            >
              <Icon name="bulb" size={18} />
              Learn a Fact
            </button>

            <button
              className="nav-item"
              onClick={() => setMode("worksheet")}
            >
              <Icon name="camera" size={18} />
              Worksheet
            </button>
          </nav>

          <div className="sidebar-bottom">
            <div className="sidebar-quote">
              <Icon name="leaf" size={17} />
              <p>
                Small steps every day create
                <strong> big thinkers.</strong>
              </p>
            </div>

            <div className="sidebar-brand-line">
              BODHA.ai
            </div>
          </div>
        </aside>

        <div className="dashboard-main">
          <header className="dashboard-header">
            <div className="mobile-logo">
              <Logo compact />
            </div>

            <div className="header-right">
              <div className="streak">
                <Icon name="leaf" size={16} />
                <span>{progress.streak}</span>
                <small>day streak</small>
              </div>

              <div className="xp">
                {progress.xp} XP
              </div>

              <button
                className="profile-button"
                onClick={() =>
                  setMenu((v) => !v)
                }
              >
                <span>
                  {profile.name[0].toUpperCase()}
                </span>

                <div>
                  <strong>{profile.name}</strong>
                  <small>
                    Class {profile.classLevel}
                  </small>
                </div>

                <Icon name="chevron" size={15} />
              </button>
            </div>

            {menu && (
              <div className="profile-menu">
                <strong>{profile.name}</strong>

                <span>
                  Class {profile.classLevel}
                </span>

                <span>{profile.goal}</span>

                <button
                  onClick={() => {
                    localStorage.removeItem(
                      PROFILE_KEY
                    );

                    setProfile(null);
                    setProgress(EMPTY);
                  }}
                >
                  Change profile
                </button>
              </div>
            )}
          </header>

          <section className="welcome-row">
            <div>
              <span className="greeting">
                GOOD TO SEE YOU
              </span>

              <h1>
                Hello, {profile.name}.
              </h1>

              <p>
                What would you like to discover today?
              </p>
            </div>

            <div className="today-badge">
              <div className="today-icon">
                <Icon name="spark" size={18} />
              </div>

              <div>
                <strong>Today&apos;s focus</strong>
                <span>
                  Learn something new
                </span>
              </div>
            </div>
          </section>

          {/* HERO */}

          <section className="challenge-hero">
            <div className="challenge-copy">
              <span className="section-label">
                TODAY&apos;S CHALLENGE
              </span>

              <h2>
                A little puzzle
                <br />
                for a curious mind.
              </h2>

              <p>
                One fresh question designed to make
                you think, not just remember.
              </p>

              <div className="hero-details">
                <span>
                  <Icon name="target" size={15} />
                  1 question
                </span>

                <span>
                  <Icon name="clock" size={15} />
                  About 2 min
                </span>

                <span>
                  <Icon name="spark" size={15} />
                  Made for you
                </span>
              </div>

              <button
                className="primary-button"
                onClick={() =>
                  generate("challenge")
                }
              >
                Start challenge
                <Icon name="arrow" size={17} />
              </button>
            </div>

            <div className="hero-illustration">
              <div className="illustration-circle">
                <div className="book-stack">
                  <div className="book book-one">
                    Curiosity
                  </div>

                  <div className="book book-two">
                    Thinking
                  </div>

                  <div className="book book-three">
                    Discovery
                  </div>

                  <div className="plant">
                    <span className="stem" />
                    <span className="leaf leaf-one" />
                    <span className="leaf leaf-two" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* EXPLORE */}

          <div className="section-heading">
            <div>
              <span className="section-label">
                EXPLORE
              </span>

              <h2>
                Choose what feels interesting.
              </h2>
            </div>

            <span className="section-note">
              Learn at your own pace.
            </span>
          </div>

          <section className="feature-grid">
            <FeatureCard
              icon="book"
              eyebrow="PRACTICE"
              title="Homework"
              text="Understand the idea behind your schoolwork."
              onClick={() =>
                generate("homework")
              }
              tone="blue"
            />

            <FeatureCard
              icon="trophy"
              eyebrow="TRAIN"
              title="Olympiad"
              text="Stretch your reasoning with fresh problems."
              onClick={() =>
                generate("olympiad")
              }
              tone="cream"
            />

            <FeatureCard
              icon="spark"
              eyebrow="EXPLORE"
              title="Tiny Challenge"
              text="A small question to wake up your thinking."
              onClick={() =>
                generate("challenge")
              }
              tone="green"
            />

            <FeatureCard
              icon="bulb"
              eyebrow="DISCOVER"
              title="Learn a Fact"
              text="Find one fascinating thing about our world."
              onClick={learnFact}
              tone="rose"
            />
          </section>

          {/* FACT */}

          {fact && (
            <section className="fact-card">
              <div className="fact-mark">
                <Icon name="bulb" size={24} />
              </div>

              <div className="fact-content">
                <span className="section-label">
                  DID YOU KNOW?
                </span>

                <h2>{fact.title}</h2>

                <p>{fact.fact}</p>

                {fact.whyItMatters && (
                  <div className="fact-why">
                    {fact.whyItMatters}
                  </div>
                )}

                <button
                  className="text-button"
                  disabled={factBusy}
                  onClick={learnFact}
                >
                  <Icon
                    name="refresh"
                    size={15}
                  />

                  {factBusy
                    ? "Finding another"
                    : "Discover another"}
                </button>
              </div>
            </section>
          )}

          {error && (
            <div className="error-box dashboard-error">
              {error}
            </div>
          )}

          {/* PROGRESS */}

          <div className="section-heading progress-heading">
            <div>
              <span className="section-label">
                YOUR JOURNEY
              </span>

              <h2>
                Keep growing, one question at a time.
              </h2>
            </div>
          </div>

          <section className="progress-grid">
            <div className="progress-card main-progress">
              <div className="progress-card-top">
                <div>
                  <span className="section-label">
                    CURRENT LEVEL
                  </span>

                  <h3>
                    Level {level}
                  </h3>
                </div>

                <div className="level-number">
                  {level}
                </div>
              </div>

              <div className="level-bar">
                <i
                  style={{
                    width: `${levelPct}%`,
                  }}
                />
              </div>

              <div className="level-caption">
                {levelPct} / 100 XP to your next level
              </div>

              <div className="mini-stats">
                <div>
                  <strong>
                    {progress.solved}
                  </strong>

                  <span>Questions solved</span>
                </div>

                <div>
                  <strong>
                    {accuracy}%
                  </strong>

                  <span>Accuracy</span>
                </div>

                <div>
                  <strong>
                    {progress.facts}
                  </strong>

                  <span>Facts discovered</span>
                </div>
              </div>
            </div>

            <div className="progress-card garden-card">
              <div className="garden-art">
                <div className="garden-ground" />
                <div className="garden-stem" />
                <div className="garden-leaf garden-leaf-one" />
                <div className="garden-leaf garden-leaf-two" />
              </div>

              <span className="section-label">
                LEARNING GARDEN
              </span>

              <h3>
                Your curiosity is growing.
              </h3>

              <p>
                Every correct answer helps your
                little garden grow.
              </p>

              <div className="garden-count">
                {progress.correct}{" "}
                <span>correct answers</span>
              </div>
            </div>
          </section>

          {/* MISSION */}

          <section className="mission-card">
            <div className="mission-icon">
              <Icon name="target" size={22} />
            </div>

            <div className="mission-copy">
              <span className="section-label">
                TODAY&apos;S MISSION
              </span>

              <h3>
                Three small steps.
                <br />
                One stronger mind.
              </h3>

              <p>
                Try a challenge, discover a fact,
                and keep your learning streak alive.
              </p>
            </div>

            <div className="mission-actions">
              <div className="mission-steps">
                <span
                  className={mission ? "done" : ""}
                >
                  <Icon name="check" size={13} />
                  Think
                </span>

                <span
                  className={mission ? "done" : ""}
                >
                  <Icon name="check" size={13} />
                  Discover
                </span>
              </div>

              <button
                onClick={() => {
                  if (!mission) {
                    setMission(true);

                    setProgress((p) => ({
                      ...touch(p),
                      missions: p.missions + 1,
                      xp: p.xp + 30,
                    }));
                  }
                }}
                className="mission-button"
              >
                {mission
                  ? "Mission complete"
                  : "Complete mission"}
              </button>
            </div>
          </section>

          {/* WORKSHEET */}

          <section className="worksheet-card">
            <div className="worksheet-icon">
              <Icon name="camera" size={23} />
            </div>

            <div>
              <span className="section-label">
                STUCK ON HOMEWORK?
              </span>

              <h2>
                Let BODHA read it with you.
              </h2>

              <p>
                Upload a clear photo and BODHA will
                guide you through the questions.
              </p>
            </div>

            <button
              className="secondary-button"
              onClick={() =>
                setMode("worksheet")
              }
            >
              Upload worksheet
              <Icon name="arrow" size={16} />
            </button>
          </section>

          {/* WORKSHEET PANEL */}

          {mode === "worksheet" && (
            <section className="worksheet-panel">
              <button
                className="close-button"
                onClick={home}
              >
                <Icon name="close" size={17} />
              </button>

              <span className="section-label">
                WORKSHEET MENTOR
              </span>

              <h2>
                Let&apos;s understand it together.
              </h2>

              <p>
                Choose one clear page. BODHA will read
                the questions and guide you through them.
              </p>

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={worksheet}
              />

              <button
                className="upload-area"
                disabled={analyzing}
                onClick={() =>
                  inputRef.current?.click()
                }
              >
                <div className="upload-icon">
                  <Icon name="camera" size={22} />
                </div>

                <strong>
                  {analyzing
                    ? "BODHA is reading your worksheet"
                    : "Choose a worksheet photo"}
                </strong>

                <small>
                  {analyzing
                    ? "Looking carefully at each question."
                    : "A clear, well-lit photo works best."}
                </small>
              </button>

              {image && (
                <img
                  className="worksheet-preview"
                  src={image}
                  alt="Worksheet preview"
                />
              )}

              {error && (
                <div className="error-box">
                  {error}
                </div>
              )}
            </section>
          )}

          <footer className="dashboard-footer">
            <Logo compact />

            <span>
              Learn · Think · Discover
            </span>

            <small>
              Made for curious minds.
            </small>
          </footer>
        </div>
      </div>
    </main>
  );
}

/* ========================================================================== */
/* CSS                                                                        */
/* ========================================================================== */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');

:root{
  --bg:#f8f9f6;
  --surface:#ffffff;
  --ink:#17221d;
  --muted:#748078;
  --line:#e6ebe6;

  --green:#477d67;
  --green-dark:#315d4c;
  --green-soft:#edf5f0;

  --blue-soft:#eef5f8;
  --cream:#f8f4e9;
  --rose:#f8efef;

  --shadow:0 16px 50px rgba(31,52,42,.07);
}

*{
  box-sizing:border-box;
}

html{
  scroll-behavior:smooth;
}

body{
  margin:0;
  background:var(--bg);
  color:var(--ink);
  font-family:"DM Sans",sans-serif;
}

button,
input,
textarea{
  font:inherit;
}

button{
  cursor:pointer;
}

button:disabled{
  cursor:not-allowed;
  opacity:.55;
}

button:focus-visible,
input:focus-visible,
textarea:focus-visible{
  outline:3px solid rgba(71,125,103,.16);
  outline-offset:2px;
}

/* -------------------------------------------------------------------------- */
/* LOGO                                                                        */
/* -------------------------------------------------------------------------- */

.logo{
  display:flex;
  align-items:center;
  gap:10px;
}

.logo-mark{
  width:43px;
  height:43px;
  border-radius:13px;
  background:var(--green-soft);
  color:var(--green);
  display:grid;
  place-items:center;
  flex:none;
}

.logo-copy>div{
  font-family:"Manrope",sans-serif;
  font-size:22px;
  line-height:1;
  font-weight:800;
  letter-spacing:-.8px;
}

.logo-copy span{
  color:var(--green);
}

.logo-copy small{
  display:block;
  color:#8b968f;
  font-size:9px;
  margin-top:4px;
  letter-spacing:.2px;
}

.logo-compact .logo-mark{
  width:37px;
  height:37px;
  border-radius:11px;
}

.logo-compact .logo-copy>div{
  font-size:19px;
}

/* -------------------------------------------------------------------------- */
/* BUTTONS                                                                     */
/* -------------------------------------------------------------------------- */

.primary-button,
.secondary-button{
  border:0;
  border-radius:11px;
  min-height:43px;
  padding:0 17px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:9px;
  font-weight:700;
  font-size:13px;
  transition:
    transform .18s ease,
    box-shadow .18s ease,
    background .18s ease;
}

.primary-button{
  background:var(--green-dark);
  color:#fff;
  box-shadow:0 8px 22px rgba(49,93,76,.16);
}

.primary-button:hover{
  transform:translateY(-1px);
  box-shadow:0 11px 26px rgba(49,93,76,.2);
}

.secondary-button{
  background:#fff;
  color:var(--green-dark);
  border:1px solid var(--line);
}

.secondary-button:hover{
  background:#f9fbf9;
}

.text-button{
  border:0;
  background:transparent;
  padding:0;
  color:var(--green-dark);
  display:inline-flex;
  align-items:center;
  gap:7px;
  font-size:12px;
  font-weight:700;
}

/* -------------------------------------------------------------------------- */
/* ONBOARDING                                                                  */
/* -------------------------------------------------------------------------- */

.onboard-page{
  min-height:100vh;
  background:
    radial-gradient(circle at 15% 15%,rgba(112,160,137,.09),transparent 25%),
    radial-gradient(circle at 90% 80%,rgba(211,188,126,.08),transparent 28%),
    var(--bg);
  display:flex;
  align-items:center;
  justify-content:center;
  padding:30px 18px;
}

.onboard-shell{
  width:min(550px,100%);
}

.onboard-brand{
  margin-bottom:24px;
}

.onboard-card{
  background:#fff;
  border:1px solid var(--line);
  border-radius:25px;
  padding:34px;
  box-shadow:var(--shadow);
}

.onboard-intro{
  text-align:center;
  margin-bottom:28px;
}

.intro-icon{
  width:47px;
  height:47px;
  margin:0 auto 17px;
  border-radius:14px;
  background:var(--green-soft);
  color:var(--green);
  display:grid;
  place-items:center;
}

.eyebrow,
.section-label{
  font-size:9px;
  font-weight:800;
  letter-spacing:1.35px;
  color:#87918a;
}

.onboard-intro h1{
  font-family:"Manrope",sans-serif;
  font-size:31px;
  line-height:1.13;
  letter-spacing:-1.1px;
  margin:9px 0 10px;
}

.onboard-intro h1 span{
  color:var(--green);
}

.onboard-intro p{
  color:var(--muted);
  font-size:12px;
  line-height:1.6;
  max-width:390px;
  margin:auto;
}

.form-section label,
.field{
  display:block;
}

.form-section label{
  font-size:11px;
  font-weight:700;
  color:#47544c;
}

.form-section input{
  width:100%;
  height:47px;
  margin-top:7px;
  padding:0 13px;
  border:1px solid var(--line);
  border-radius:11px;
  background:#fbfcfb;
  color:var(--ink);
  outline:none;
}

.form-section input:focus{
  border-color:#a7c5b6;
  background:#fff;
}

.field{
  margin-top:20px;
}

.field-label{
  font-size:11px;
  font-weight:700;
  color:#47544c;
}

.classes{
  display:grid;
  grid-template-columns:repeat(10,1fr);
  gap:5px;
  margin-top:8px;
}

.class-button{
  border:1px solid var(--line);
  background:#fbfcfb;
  color:#657168;
  height:38px;
  border-radius:9px;
  font-size:11px;
  font-weight:700;
}

.class-button:hover{
  border-color:#b9cbbf;
}

.class-button.selected{
  color:#fff;
  background:var(--green-dark);
  border-color:var(--green-dark);
}

.goals{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:7px;
  margin-top:8px;
}

.goal-button{
  display:flex;
  align-items:center;
  gap:10px;
  text-align:left;
  border:1px solid var(--line);
  background:#fbfcfb;
  border-radius:12px;
  padding:10px;
  color:#536057;
}

.goal-button.selected{
  background:var(--green-soft);
  border-color:#bfd5c8;
  color:var(--green-dark);
}

.goal-icon{
  width:36px;
  height:36px;
  border-radius:10px;
  background:#fff;
  display:grid;
  place-items:center;
  flex:none;
  color:var(--green);
}

.goal-button strong,
.goal-button small{
  display:block;
}

.goal-button strong{
  font-size:11px;
}

.goal-button small{
  margin-top:2px;
  color:#87918a;
  font-size:9px;
  line-height:1.35;
}

.start-button{
  width:100%;
  margin-top:23px;
  min-height:48px;
}

.onboard-footer{
  text-align:center;
  color:#99a29c;
  font-size:10px;
  margin:18px 0 0;
}

/* -------------------------------------------------------------------------- */
/* DASHBOARD                                                                   */
/* -------------------------------------------------------------------------- */

.dashboard-page{
  min-height:100vh;
  background:var(--bg);
}

.dashboard-layout{
  display:flex;
  min-height:100vh;
}

.sidebar{
  position:fixed;
  inset:0 auto 0 0;
  width:235px;
  background:#fff;
  border-right:1px solid var(--line);
  padding:30px 19px 24px;
  display:flex;
  flex-direction:column;
  z-index:20;
}

.sidebar nav{
  margin-top:44px;
  display:flex;
  flex-direction:column;
  gap:3px;
}

.nav-item{
  width:100%;
  height:43px;
  padding:0 13px;
  border:0;
  background:transparent;
  color:#7d8981;
  border-radius:10px;
  display:flex;
  align-items:center;
  gap:12px;
  text-align:left;
  font-size:12px;
  font-weight:600;
  transition:.18s ease;
}

.nav-item:hover{
  background:#f6f8f6;
  color:var(--ink);
}

.nav-item.active{
  background:var(--green-soft);
  color:var(--green-dark);
  font-weight:700;
}

.sidebar-bottom{
  margin-top:auto;
}

.sidebar-quote{
  border-top:1px solid var(--line);
  padding-top:19px;
  color:#94a097;
}

.sidebar-quote svg{
  color:var(--green);
}

.sidebar-quote p{
  font-size:10px;
  line-height:1.55;
  margin:9px 0 0;
}

.sidebar-quote strong{
  color:#53675b;
}

.sidebar-brand-line{
  color:#b1b9b4;
  font-size:9px;
  margin-top:26px;
}

.dashboard-main{
  margin-left:235px;
  width:calc(100% - 235px);
  max-width:1280px;
  padding:0 48px 35px;
}

.dashboard-header{
  height:78px;
  display:flex;
  align-items:center;
  justify-content:flex-end;
  border-bottom:1px solid var(--line);
  position:relative;
}

.mobile-logo{
  display:none;
}

.header-right{
  display:flex;
  align-items:center;
  gap:12px;
}

.streak,
.xp{
  height:36px;
  padding:0 11px;
  border:1px solid var(--line);
  background:#fff;
  border-radius:9px;
  display:flex;
  align-items:center;
  gap:6px;
  font-size:11px;
  font-weight:700;
}

.streak svg{
  color:var(--green);
}

.streak small{
  color:#89948d;
  font-weight:500;
}

.xp{
  color:#66736b;
}

.profile-button{
  border:0;
  background:transparent;
  display:flex;
  align-items:center;
  gap:9px;
  padding:3px;
  color:var(--ink);
}

.profile-button>span{
  width:34px;
  height:34px;
  border-radius:50%;
  background:var(--green-soft);
  color:var(--green-dark);
  display:grid;
  place-items:center;
  font-size:12px;
  font-weight:800;
}

.profile-button div{
  text-align:left;
}

.profile-button strong,
.profile-button small{
  display:block;
}

.profile-button strong{
  font-size:11px;
}

.profile-button small{
  color:#8c968f;
  font-size:8px;
  margin-top:2px;
}

.profile-button>svg{
  color:#8b968f;
}

.profile-menu{
  position:absolute;
  top:66px;
  right:0;
  width:220px;
  background:#fff;
  border:1px solid var(--line);
  border-radius:13px;
  box-shadow:var(--shadow);
  padding:14px;
  z-index:50;
}

.profile-menu strong,
.profile-menu span{
  display:block;
}

.profile-menu strong{
  font-size:12px;
}

.profile-menu span{
  color:#8a958e;
  font-size:9px;
  margin-top:3px;
}

.profile-menu button{
  width:100%;
  border:1px solid var(--line);
  background:#f8faf8;
  color:#53645a;
  border-radius:8px;
  margin-top:12px;
  padding:8px;
  font-size:10px;
  font-weight:700;
}

.welcome-row{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  padding:35px 0 24px;
}

.greeting{
  font-size:9px;
  letter-spacing:1.4px;
  color:#8c978f;
  font-weight:800;
}

.welcome-row h1{
  font-family:"Manrope",sans-serif;
  font-size:32px;
  letter-spacing:-1.3px;
  margin:6px 0 3px;
}

.welcome-row p{
  margin:0;
  color:#7d8981;
  font-size:12px;
}

.today-badge{
  display:flex;
  align-items:center;
  gap:10px;
  padding:9px 13px;
  background:#fff;
  border:1px solid var(--line);
  border-radius:12px;
}

.today-icon{
  width:32px;
  height:32px;
  border-radius:9px;
  background:var(--green-soft);
  color:var(--green);
  display:grid;
  place-items:center;
}

.today-badge strong,
.today-badge span{
  display:block;
}

.today-badge strong{
  font-size:10px;
}

.today-badge span{
  font-size:9px;
  color:#8b958f;
  margin-top:2px;
}

/* HERO */

.challenge-hero{
  min-height:300px;
  background:#edf5f0;
  border:1px solid #dceae1;
  border-radius:22px;
  display:grid;
  grid-template-columns:1.25fr .75fr;
  overflow:hidden;
}

.challenge-copy{
  padding:34px 36px;
  align-self:center;
}

.challenge-copy h2{
  font-family:"Manrope",sans-serif;
  font-size:30px;
  line-height:1.12;
  letter-spacing:-1.2px;
  margin:9px 0 11px;
}

.challenge-copy p{
  color:#65736a;
  font-size:12px;
  line-height:1.55;
  max-width:410px;
  margin:0;
}

.hero-details{
  display:flex;
  flex-wrap:wrap;
  gap:14px;
  margin:18px 0 20px;
}

.hero-details span{
  display:flex;
  align-items:center;
  gap:5px;
  color:#607068;
  font-size:9px;
  font-weight:600;
}

.hero-details svg{
  color:var(--green);
}

.hero-illustration{
  min-height:300px;
  display:grid;
  place-items:center;
  position:relative;
}

.illustration-circle{
  width:230px;
  height:230px;
  border-radius:50%;
  background:rgba(255,255,255,.52);
  display:grid;
  place-items:center;
}

.book-stack{
  position:relative;
  width:175px;
  height:155px;
}

.book{
  position:absolute;
  left:16px;
  width:150px;
  height:37px;
  border-radius:8px 12px 12px 8px;
  display:flex;
  align-items:center;
  padding-left:15px;
  font-size:10px;
  font-weight:700;
  color:#405149;
  box-shadow:0 6px 12px rgba(40,67,53,.07);
}

.book-one{
  bottom:9px;
  background:#d8e7df;
  transform:rotate(-1deg);
}

.book-two{
  bottom:43px;
  background:#e8dfc9;
  transform:rotate(2deg);
}

.book-three{
  bottom:77px;
  background:#d9e5e9;
  transform:rotate(-1deg);
}

.plant{
  position:absolute;
  left:81px;
  bottom:100px;
  width:35px;
  height:70px;
}

.stem{
  position:absolute;
  width:3px;
  height:54px;
  left:17px;
  bottom:0;
  border-radius:10px;
  background:#58846d;
}

.leaf{
  position:absolute;
  width:24px;
  height:14px;
  background:#709d83;
  border-radius:100% 0 100% 0;
}

.leaf-one{
  top:10px;
  left:1px;
  transform:rotate(-28deg);
}

.leaf-two{
  top:1px;
  right:-2px;
  transform:rotate(38deg) scaleX(-1);
}

/* SECTION */

.section-heading{
  margin:34px 0 14px;
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
}

.section-heading h2{
  font-family:"Manrope",sans-serif;
  font-size:20px;
  letter-spacing:-.6px;
  margin:4px 0 0;
}

.section-note{
  color:#929c96;
  font-size:10px;
}

/* FEATURE CARDS */

.feature-grid{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:10px;
}

.feature-card{
  position:relative;
  min-height:172px;
  border:1px solid var(--line);
  border-radius:17px;
  padding:17px;
  text-align:left;
  background:#fff;
  color:var(--ink);
  transition:.2s ease;
}

.feature-card:hover{
  transform:translateY(-3px);
  box-shadow:var(--shadow);
}

.feature-top{
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin-bottom:21px;
}

.feature-top>svg{
  color:#a4aea8;
}

.feature-icon{
  width:42px;
  height:42px;
  border-radius:11px;
  display:grid;
  place-items:center;
}

.feature-card small{
  color:#87928b;
  font-size:8px;
  font-weight:800;
  letter-spacing:1px;
}

.feature-card h3{
  font-family:"Manrope",sans-serif;
  font-size:17px;
  margin:5px 0 5px;
  letter-spacing:-.4px;
}

.feature-card p{
  color:#7e8982;
  font-size:10px;
  line-height:1.45;
  margin:0;
  max-width:180px;
}

.feature-card.blue{
  background:#f4f8fa;
  border-color:#e1ebef;
}

.feature-card.blue .feature-icon{
  background:#e5f0f4;
  color:#507787;
}

.feature-card.cream{
  background:#faf7ef;
  border-color:#eee8d8;
}

.feature-card.cream .feature-icon{
  background:#f1ead4;
  color:#9a7b35;
}

.feature-card.green{
  background:#f1f7f3;
  border-color:#deebe2;
}

.feature-card.green .feature-icon{
  background:#e2f0e7;
  color:#4d7f67;
}

.feature-card.rose{
  background:#faf3f3;
  border-color:#eee1e1;
}

.feature-card.rose .feature-icon{
  background:#f2e4e4;
  color:#986b6b;
}

/* FACT */

.fact-card{
  margin-top:11px;
  background:#fff;
  border:1px solid var(--line);
  border-radius:18px;
  padding:22px;
  display:flex;
  gap:15px;
  align-items:flex-start;
}

.fact-mark{
  width:48px;
  height:48px;
  border-radius:13px;
  background:#f8f3df;
  color:#9a7d3c;
  display:grid;
  place-items:center;
  flex:none;
}

.fact-content h2{
  font-family:"Manrope",sans-serif;
  font-size:20px;
  letter-spacing:-.5px;
  margin:5px 0 5px;
}

.fact-content>p{
  color:#59665e;
  font-size:13px;
  line-height:1.55;
  margin:0 0 9px;
  max-width:800px;
}

.fact-why{
  color:#8a948d;
  font-size:10px;
  line-height:1.5;
  margin-bottom:11px;
}

/* PROGRESS */

.progress-heading{
  margin-top:35px;
}

.progress-grid{
  display:grid;
  grid-template-columns:1.25fr .75fr;
  gap:11px;
}

.progress-card{
  background:#fff;
  border:1px solid var(--line);
  border-radius:18px;
  padding:21px;
}

.progress-card-top{
  display:flex;
  align-items:center;
  justify-content:space-between;
}

.progress-card h3{
  font-family:"Manrope",sans-serif;
  font-size:19px;
  margin:5px 0 0;
}

.level-number{
  width:46px;
  height:46px;
  border-radius:50%;
  background:var(--green-soft);
  color:var(--green-dark);
  display:grid;
  place-items:center;
  font-size:14px;
  font-weight:800;
}

.level-bar,
.progress-line{
  height:7px;
  background:#edf0ed;
  border-radius:100px;
  overflow:hidden;
}

.level-bar{
  margin-top:21px;
}

.level-bar i,
.progress-line i{
  display:block;
  height:100%;
  border-radius:inherit;
  background:var(--green);
}

.level-caption{
  color:#8a948e;
  font-size:9px;
  margin-top:7px;
}

.mini-stats{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:7px;
  margin-top:20px;
}

.mini-stats>div{
  padding:10px;
  background:#f8faf8;
  border-radius:10px;
}

.mini-stats strong,
.mini-stats span{
  display:block;
}

.mini-stats strong{
  font-family:"Manrope",sans-serif;
  font-size:18px;
}

.mini-stats span{
  color:#89938d;
  font-size:8px;
  margin-top:3px;
}

/* GARDEN */

.garden-card{
  background:#f4f7ee;
  border-color:#e5eadc;
}

.garden-art{
  height:92px;
  position:relative;
  display:flex;
  justify-content:center;
  align-items:flex-end;
}

.garden-ground{
  width:86px;
  height:22px;
  border-radius:50%;
  background:#d9cfb0;
  position:absolute;
  bottom:8px;
}

.garden-stem{
  width:4px;
  height:60px;
  background:#60846b;
  border-radius:8px;
  position:absolute;
  bottom:20px;
}

.garden-leaf{
  position:absolute;
  width:31px;
  height:19px;
  background:#82a88c;
  border-radius:100% 0 100% 0;
}

.garden-leaf-one{
  transform:rotate(-30deg);
  left:calc(50% - 34px);
  bottom:59px;
}

.garden-leaf-two{
  transform:rotate(38deg) scaleX(-1);
  left:calc(50% + 3px);
  bottom:47px;
}

.garden-card h3{
  font-size:17px;
}

.garden-card p{
  color:#7e8981;
  font-size:10px;
  line-height:1.45;
  margin:6px 0 13px;
  max-width:250px;
}

.garden-count{
  font-size:11px;
  font-weight:800;
  color:var(--green-dark);
}

.garden-count span{
  color:#8a958e;
  font-weight:500;
}

/* MISSION */

.mission-card{
  margin-top:11px;
  border-radius:18px;
  background:#20342b;
  color:#fff;
  padding:21px 23px;
  display:grid;
  grid-template-columns:auto 1fr auto;
  align-items:center;
  gap:15px;
}

.mission-icon{
  width:47px;
  height:47px;
  border-radius:12px;
  background:rgba(255,255,255,.08);
  color:#c9dfd2;
  display:grid;
  place-items:center;
}

.mission-copy .section-label{
  color:#9eb1a7;
}

.mission-copy h3{
  font-family:"Manrope",sans-serif;
  font-size:18px;
  line-height:1.18;
  margin:5px 0;
  letter-spacing:-.4px;
}

.mission-copy p{
  color:#aab9b1;
  font-size:9px;
  line-height:1.5;
  margin:0;
  max-width:410px;
}

.mission-actions{
  display:flex;
  flex-direction:column;
  align-items:flex-end;
  gap:9px;
}

.mission-steps{
  display:flex;
  gap:8px;
}

.mission-steps span{
  color:#a9b9b0;
  display:flex;
  align-items:center;
  gap:4px;
  font-size:9px;
}

.mission-steps span.done{
  color:#d6e9df;
}

.mission-button{
  border:0;
  background:#fff;
  color:#20342b;
  border-radius:9px;
  padding:9px 13px;
  font-size:10px;
  font-weight:800;
}

/* WORKSHEET */

.worksheet-card{
  margin-top:11px;
  padding:20px 21px;
  border:1px solid #dce9ef;
  background:#f3f8fa;
  border-radius:18px;
  display:flex;
  align-items:center;
  gap:14px;
}

.worksheet-icon{
  width:48px;
  height:48px;
  background:#e4f0f4;
  color:#557b88;
  border-radius:12px;
  display:grid;
  place-items:center;
  flex:none;
}

.worksheet-card>div:nth-child(2){
  flex:1;
}

.worksheet-card h2{
  font-family:"Manrope",sans-serif;
  font-size:17px;
  margin:4px 0;
}

.worksheet-card p{
  color:#788780;
  font-size:10px;
  margin:0;
  line-height:1.45;
}

/* WORKSHEET PANEL */

.worksheet-panel{
  position:relative;
  margin-top:11px;
  background:#fff;
  border:1px solid var(--line);
  border-radius:18px;
  padding:22px;
}

.close-button{
  position:absolute;
  right:14px;
  top:14px;
  width:31px;
  height:31px;
  border:1px solid var(--line);
  background:#f8faf8;
  color:#718078;
  border-radius:8px;
  display:grid;
  place-items:center;
}

.worksheet-panel h2{
  font-family:"Manrope",sans-serif;
  font-size:21px;
  margin:5px 0;
}

.worksheet-panel>p{
  color:#7e8982;
  font-size:10px;
  line-height:1.5;
}

.upload-area{
  width:100%;
  margin-top:16px;
  padding:28px 15px;
  border:1px dashed #b8cbbf;
  background:#f8fbf9;
  border-radius:13px;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:6px;
  color:#53645a;
}

.upload-icon{
  width:44px;
  height:44px;
  border-radius:12px;
  background:#eaf3ed;
  color:var(--green);
  display:grid;
  place-items:center;
  margin-bottom:4px;
}

.upload-area strong{
  font-size:12px;
}

.upload-area small{
  color:#8d9891;
  font-size:9px;
}

.worksheet-preview{
  display:block;
  max-width:100%;
  max-height:380px;
  margin:16px auto 0;
  border-radius:12px;
  border:1px solid var(--line);
}

/* ERROR */

.error-box{
  margin-top:11px;
  padding:10px 12px;
  border-radius:10px;
  background:#fff4f3;
  border:1px solid #f0d9d6;
  color:#a75d56;
  font-size:10px;
  font-weight:600;
}

.dashboard-error{
  margin-top:12px;
}

/* FOOTER */

.dashboard-footer{
  border-top:1px solid var(--line);
  margin-top:35px;
  padding-top:22px;
  display:flex;
  align-items:center;
  gap:15px;
  color:#9ba39e;
}

.dashboard-footer .logo{
  transform:scale(.82);
  transform-origin:left center;
}

.dashboard-footer>span{
  font-size:9px;
}

.dashboard-footer>small{
  margin-left:auto;
  font-size:9px;
}

/* -------------------------------------------------------------------------- */
/* PRACTICE PAGE                                                               */
/* -------------------------------------------------------------------------- */

.practice-page{
  min-height:100vh;
  background:
    radial-gradient(circle at 80% 10%,rgba(108,155,133,.07),transparent 25%),
    var(--bg);
}

.practice-header{
  height:75px;
  padding:0 30px;
  border-bottom:1px solid var(--line);
  background:rgba(255,255,255,.72);
  backdrop-filter:blur(12px);
  display:grid;
  grid-template-columns:1fr auto 1fr;
  align-items:center;
}

.back-button{
  justify-self:start;
  border:0;
  background:transparent;
  color:#728078;
  display:flex;
  align-items:center;
  gap:6px;
  font-size:11px;
  font-weight:600;
}

.practice-stats{
  justify-self:end;
  display:flex;
  align-items:center;
  gap:8px;
}

.practice-stats span{
  height:34px;
  padding:0 11px;
  background:#fff;
  border:1px solid var(--line);
  border-radius:9px;
  display:flex;
  align-items:center;
  gap:5px;
  color:#68756d;
  font-size:10px;
  font-weight:700;
}

.practice-stats span:first-child svg{
  color:var(--green);
}

.practice-container{
  width:min(760px,calc(100% - 30px));
  margin:0 auto;
  padding:35px 0 60px;
}

.question-progress{
  margin-bottom:12px;
}

.question-progress>div:first-child{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:7px;
}

.question-progress span{
  color:#818c85;
  font-size:9px;
  font-weight:700;
  letter-spacing:.4px;
}

.question-progress b{
  color:#59665e;
  font-size:10px;
}

.progress-line{
  height:5px;
}

.question-card{
  background:#fff;
  border:1px solid var(--line);
  border-radius:20px;
  overflow:hidden;
  box-shadow:var(--shadow);
}

.question-meta{
  padding:15px 18px;
  border-bottom:1px solid var(--line);
  background:#fafcfb;
  display:flex;
  align-items:center;
  gap:10px;
}

.question-type-icon{
  width:42px;
  height:42px;
  border-radius:11px;
  background:var(--green-soft);
  color:var(--green);
  display:grid;
  place-items:center;
}

.question-meta div:nth-child(2){
  display:flex;
  flex-direction:column;
  gap:2px;
}

.question-meta small{
  color:#8a958e;
  font-size:9px;
}

.question-meta b{
  color:#56635b;
  font-size:10px;
}

.question-number{
  margin-left:auto;
  color:#a2aba5;
  font-size:10px;
  font-weight:700;
}

.question-content{
  padding:29px;
}

.attempt-label{
  display:flex;
  align-items:center;
  justify-content:space-between;
  color:#8a948e;
  font-size:9px;
  font-weight:700;
  margin-bottom:8px;
}

.correct-label{
  color:var(--green);
  display:flex;
  align-items:center;
  gap:4px;
}

.question-content h1{
  font-family:"Manrope",sans-serif;
  font-size:29px;
  line-height:1.2;
  letter-spacing:-1px;
  margin:0;
}

.visual-box{
  margin-top:18px;
  padding:13px;
  background:#faf7ed;
  border:1px solid #eee6d0;
  border-radius:12px;
  text-align:center;
  color:#655c48;
  font-size:12px;
  line-height:1.7;
}

.answer-label{
  display:block;
  margin-top:22px;
}

.answer-label>span{
  display:block;
  color:#657169;
  font-size:10px;
  font-weight:700;
  margin-bottom:6px;
}

.answer-label textarea{
  width:100%;
  min-height:120px;
  resize:vertical;
  border:1px solid var(--line);
  border-radius:12px;
  background:#fbfcfb;
  padding:13px;
  color:var(--ink);
  outline:none;
  font-size:12px;
  line-height:1.55;
}

.answer-label textarea:focus{
  background:#fff;
  border-color:#a8c4b5;
}

.answer-button{
  width:100%;
  margin-top:10px;
  min-height:47px;
}

.loader{
  width:13px;
  height:13px;
  border:2px solid rgba(255,255,255,.35);
  border-top-color:#fff;
  border-radius:50%;
  animation:spin .7s linear infinite;
}

.mentor-box{
  margin-top:12px;
  display:flex;
  gap:10px;
  padding:13px;
  background:#f2f8f4;
  border:1px solid #dcebe2;
  border-radius:12px;
}

.mentor-correct{
  background:#edf7f0;
}

.mentor-mark{
  width:37px;
  height:37px;
  border-radius:10px;
  background:#dfeee5;
  color:var(--green-dark);
  display:grid;
  place-items:center;
  flex:none;
}

.mentor-name{
  color:var(--green-dark);
  font-size:9px;
  letter-spacing:.7px;
  font-weight:800;
}

.mentor-box p{
  margin:3px 0 0;
  color:#536159;
  font-size:11px;
  line-height:1.55;
}

.next-button{
  width:100%;
  margin-top:10px;
  min-height:45px;
  border:1px solid #d9e6de;
  border-radius:11px;
  background:#f4f8f5;
  color:var(--green-dark);
  display:flex;
  align-items:center;
  justify-content:center;
  gap:7px;
  font-size:12px;
  font-weight:700;
}

/* -------------------------------------------------------------------------- */
/* RESPONSIVE                                                                  */
/* -------------------------------------------------------------------------- */

@media(max-width:1100px){

  .sidebar{
    width:205px;
  }

  .dashboard-main{
    margin-left:205px;
    width:calc(100% - 205px);
    padding:0 30px 30px;
  }

  .feature-grid{
    grid-template-columns:repeat(2,1fr);
  }

  .challenge-hero{
    grid-template-columns:1.4fr .6fr;
  }
}

@media(max-width:850px){

  .sidebar{
    display:none;
  }

  .dashboard-main{
    margin-left:0;
    width:100%;
    padding:0 20px 25px;
  }

  .mobile-logo{
    display:block;
  }

  .dashboard-header{
    justify-content:space-between;
  }

  .welcome-row{
    padding-top:27px;
  }

  .progress-grid{
    grid-template-columns:1fr;
  }

  .mission-card{
    grid-template-columns:auto 1fr;
  }

  .mission-actions{
    grid-column:2;
    align-items:flex-start;
  }

  .mission-button{
    width:100%;
  }
}

@media(max-width:650px){

  .dashboard-main{
    padding:0 13px 20px;
  }

  .dashboard-header{
    height:67px;
  }

  .header-right{
    gap:5px;
  }

  .streak small{
    display:none;
  }

  .xp{
    display:none;
  }

  .profile-button div,
  .profile-button>svg{
    display:none;
  }

  .welcome-row{
    padding:25px 2px 20px;
    align-items:flex-start;
    flex-direction:column;
    gap:15px;
  }

  .welcome-row h1{
    font-size:27px;
  }

  .today-badge{
    align-self:stretch;
  }

  .challenge-hero{
    grid-template-columns:1fr;
    min-height:auto;
  }

  .challenge-copy{
    padding:25px 22px 20px;
  }

  .challenge-copy h2{
    font-size:25px;
  }

  .hero-illustration{
    min-height:175px;
  }

  .illustration-circle{
    width:145px;
    height:145px;
  }

  .book-stack{
    transform:scale(.72);
  }

  .feature-grid{
    grid-template-columns:1fr 1fr;
    gap:7px;
  }

  .feature-card{
    min-height:166px;
    padding:13px;
  }

  .feature-card h3{
    font-size:15px;
  }

  .feature-card p{
    font-size:9px;
  }

  .section-heading{
    margin-top:28px;
  }

  .section-note{
    display:none;
  }

  .fact-card{
    padding:17px;
  }

  .fact-content h2{
    font-size:17px;
  }

  .fact-content>p{
    font-size:11px;
  }

  .mini-stats{
    grid-template-columns:1fr;
  }

  .mission-card{
    grid-template-columns:auto 1fr;
    padding:17px;
  }

  .mission-copy h3{
    font-size:16px;
  }

  .mission-actions{
    grid-column:1 / -1;
  }

  .worksheet-card{
    align-items:flex-start;
    flex-wrap:wrap;
  }

  .worksheet-card>div:nth-child(2){
    width:calc(100% - 65px);
  }

  .worksheet-card .secondary-button{
    width:100%;
  }

  .dashboard-footer{
    flex-wrap:wrap;
  }

  .dashboard-footer>small{
    margin-left:0;
    width:100%;
  }

  .practice-header{
    padding:0 15px;
    grid-template-columns:1fr auto 1fr;
  }

  .practice-header .logo-copy{
    display:none;
  }

  .practice-container{
    width:calc(100% - 20px);
    padding-top:24px;
  }

  .question-content{
    padding:21px;
  }

  .question-content h1{
    font-size:23px;
  }

  .question-meta{
    padding:12px;
  }

  .practice-stats span{
    padding:0 8px;
  }

  .onboard-card{
    padding:24px 18px;
    border-radius:20px;
  }

  .onboard-intro h1{
    font-size:27px;
  }

  .classes{
    grid-template-columns:repeat(5,1fr);
  }

  .goals{
    grid-template-columns:1fr;
  }
}

@media(max-width:390px){

  .feature-card{
    min-height:155px;
  }

  .feature-card p{
    display:none;
  }

  .challenge-copy h2{
    font-size:23px;
  }
}

@keyframes spin{
  to{
    transform:rotate(360deg);
  }
}
`;