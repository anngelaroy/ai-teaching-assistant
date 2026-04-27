"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────

type Student = {
  name: string;
  uploads: number;
  lastActive: number;
};

type Analytics = {
  students: Student[];
};

type Insights = {
  summary: string;
  risks: string[];
  recommendations: string[];
};

type GradeResult = {
  score: number;
  feedback: string;
  reasoning?: string;
  confidence?: "HIGH" | "MEDIUM" | "LOW";
  aiDetection?: {
    aiProbability: number;
    level: "LOW" | "MEDIUM" | "HIGH";
    reason: string;
  };
};

type DetectionSection = {
  text: string;
  aiLikelihood: "LOW" | "MEDIUM" | "HIGH";
  reason: string;
};

type DetectionResult = {
  aiProbability: number;
  level: "LOW" | "MEDIUM" | "HIGH";
  reason: string;
  flagged: string[];
  recommendation: string;
  sections: DetectionSection[];
};

type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
};

type Quiz = {
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  questions: QuizQuestion[];
};

type Segment = {
  title: string;
  type:
    | "RECAP"
    | "MINI_LECTURE"
    | "DEMO"
    | "DISCUSSION"
    | "ACTIVITY"
    | "CHECK_FOR_UNDERSTANDING"
    | "WRAP_UP";
  durationMinutes: number;
  objective: string;
  description: string;
};

type WeeklyOutline = {
  weekNumber: number;
  theme: string;
  keyOutcomes: string;
  suggestedAssessment: string;
};

type LessonPlan = {
  courseTitle: string;
  weekTopic: string;
  nextClass: {
    objectiveSummary: string;
    totalMinutes: number;
    segments: Segment[];
  };
  weeklyOutline: WeeklyOutline[];
};

type Activity = {
  title: string;
  type:
    | "THINK_PAIR_SHARE"
    | "SMALL_GROUP"
    | "WHOLE_CLASS_DISCUSSION"
    | "CASE_ACTIVITY"
    | "QUIZ_CHECK"
    | "REFLECTION";
  durationMinutes: number;
  goal: string;
  instructions: string;
  inClassPrompt: string;
  expectedStudentBehaviors: string;
};

type ActivitiesResult = {
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  activities: Activity[];
};

type Difficulty = "EASY" | "MEDIUM" | "HARD";
type GeneratingFrom = "topic" | "file" | null;
type Tab = "overview" | "grading" | "detection" | "quiz" | "lesson-plan" | "activities";

// ── Helpers ─────────────────────────────────────────────────────────────

const SEGMENT_COLORS: Record<Segment["type"], string> = {
  RECAP: "bg-slate-700 text-slate-200",
  MINI_LECTURE: "bg-blue-900/60 text-blue-200",
  DEMO: "bg-purple-900/60 text-purple-200",
  DISCUSSION: "bg-teal-900/60 text-teal-200",
  ACTIVITY: "bg-emerald-900/60 text-emerald-200",
  CHECK_FOR_UNDERSTANDING: "bg-amber-900/60 text-amber-200",
  WRAP_UP: "bg-slate-700 text-slate-200",
};

const ACTIVITY_TYPE_COLORS: Record<Activity["type"], string> = {
  THINK_PAIR_SHARE: "bg-blue-900/60 text-blue-200",
  SMALL_GROUP: "bg-teal-900/60 text-teal-200",
  WHOLE_CLASS_DISCUSSION: "bg-purple-900/60 text-purple-200",
  CASE_ACTIVITY: "bg-amber-900/60 text-amber-200",
  QUIZ_CHECK: "bg-emerald-900/60 text-emerald-200",
  REFLECTION: "bg-slate-700 text-slate-200",
};

const TAB_LABELS: Record<Tab, string> = {
  overview: "Overview",
  grading: "Grading",
  detection: "AI Detection",
  quiz: "Quizzes",
  "lesson-plan": "Lesson Plan",
  activities: "Activities",
};

const asPercent = (p: number | undefined | null) =>
  p == null ? null : Math.round(p * 100);

// ── Component ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Overview
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  // Grading
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [rubric, setRubric] = useState("");
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [gradingError, setGradingError] = useState<string | null>(null);

  // AI Detection
  const [aiText, setAiText] = useState("");
  const [aiDetection, setAiDetection] = useState<DetectionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);

  // Quiz
  const [quizTopic, setQuizTopic] = useState("");
  const [quizDifficulty, setQuizDifficulty] = useState<Difficulty>("MEDIUM");
  const [quizCount, setQuizCount] = useState(5);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [generatingFrom, setGeneratingFrom] = useState<GeneratingFrom>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);

  // Lesson Plan
  const [courseTitle, setCourseTitle] = useState("");
  const [weekTopic, setWeekTopic] = useState("");
  const [weeksRemaining, setWeeksRemaining] = useState(6);
  const [meetingMinutes, setMeetingMinutes] = useState(75);
  const [lessonNotes, setLessonNotes] = useState("");
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [lessonPlanError, setLessonPlanError] = useState<string | null>(null);

  // Activities
  const [activityTopic, setActivityTopic] = useState("");
  const [activityDifficulty, setActivityDifficulty] = useState<Difficulty>("MEDIUM");
  const [numActivities, setNumActivities] = useState(3);
  const [materialSummary, setMaterialSummary] = useState("");
  const [activitiesResult, setActivitiesResult] = useState<ActivitiesResult | null>(null);
  const [isGeneratingActivities, setIsGeneratingActivities] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  // ── Data loading ──────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      setOverviewLoading(true);
      setOverviewError(null);
      setInsightsLoading(true);
      setInsightsError(null);

      try {
        const res = await fetch("/api/analytics");
        if (!res.ok) throw new Error("Failed to load analytics");
        const data: Analytics = await res.json();
        setAnalytics(data);
        setOverviewLoading(false);

        try {
          const insightRes = await fetch("/api/insights", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ students: data.students }),
          });
          if (!insightRes.ok) throw new Error("Failed to load insights");
          const insightData: Insights = await insightRes.json();
          setInsights(insightData);
        } catch (e) {
          console.error(e);
          setInsightsError("Could not load AI insights. Please refresh.");
        } finally {
          setInsightsLoading(false);
        }
      } catch (e) {
        console.error(e);
        setOverviewError("Could not load student data. Please refresh.");
        setOverviewLoading(false);
        setInsightsLoading(false);
      }
    };

    load();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleGrade = async () => {
    if (!question.trim()) { setGradingError("Please enter a question."); return; }
    if (!answer.trim()) { setGradingError("Please enter a student answer."); return; }
    setIsGrading(true);
    setGrade(null);
    setGradingError(null);
    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer, rubric }),
      });
      if (!res.ok) throw new Error("Grading request failed");
      setGrade(await res.json());
    } catch (e) {
      console.error(e);
      setGradingError("Grading failed. Please try again.");
    } finally {
      setIsGrading(false);
    }
  };

  const handleCheckAI = async () => {
    if (!aiText.trim()) return;
    setIsAnalyzing(true);
    setAiDetection(null);
    setDetectionError(null);
    try {
      const res = await fetch("/api/analyze-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText }),
      });
      if (!res.ok) throw new Error("Detection request failed");
      setAiDetection(await res.json());
    } catch (e) {
      console.error(e);
      setDetectionError("AI detection failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateQuizFromTopic = async () => {
    if (!quizTopic.trim()) return;
    setGeneratingFrom("topic");
    setQuiz(null);
    setQuizError(null);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: quizTopic, difficulty: quizDifficulty, numQuestions: quizCount }),
      });
      if (!res.ok) throw new Error("Quiz generation failed");
      setQuiz(await res.json());
    } catch (e) {
      console.error(e);
      setQuizError("Quiz generation failed. Please try again.");
    } finally {
      setGeneratingFrom(null);
    }
  };

  const handleGenerateQuizFromFile = async () => {
    if (!sourceFile) return;
    setGeneratingFrom("file");
    setQuiz(null);
    setQuizError(null);
    try {
      const formData = new FormData();
      formData.append("file", sourceFile);
      formData.append("topic", quizTopic);
      formData.append("difficulty", quizDifficulty);
      formData.append("numQuestions", String(quizCount));
      const res = await fetch("/api/quiz-from-ppt", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Quiz generation from file failed");
      setQuiz(await res.json());
    } catch (e) {
      console.error(e);
      setQuizError("Quiz generation from file failed. Please try again.");
    } finally {
      setGeneratingFrom(null);
    }
  };

  const handleGenerateLessonPlan = async () => {
    if (!courseTitle.trim()) { setLessonPlanError("Please enter a course title."); return; }
    if (!weekTopic.trim()) { setLessonPlanError("Please enter a week topic."); return; }
    setIsGeneratingPlan(true);
    setLessonPlan(null);
    setLessonPlanError(null);
    try {
      const res = await fetch("/api/lesson-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseTitle, weekTopic, weeksRemaining, meetingMinutes, notes: lessonNotes }),
      });
      if (!res.ok) throw new Error("Lesson plan generation failed");
      setLessonPlan(await res.json());
    } catch (e) {
      console.error(e);
      setLessonPlanError("Lesson plan generation failed. Please try again.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleGenerateActivities = async () => {
    if (!activityTopic.trim()) { setActivitiesError("Please enter a topic."); return; }
    setIsGeneratingActivities(true);
    setActivitiesResult(null);
    setActivitiesError(null);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: activityTopic,
          difficulty: activityDifficulty,
          numActivities,
          materialSummary,
        }),
      });
      if (!res.ok) throw new Error("Activity generation failed");
      setActivitiesResult(await res.json());
    } catch (e) {
      console.error(e);
      setActivitiesError("Activity generation failed. Please try again.");
    } finally {
      setIsGeneratingActivities(false);
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────

  const students = analytics?.students ?? [];
  const riskData = [
    { name: "At Risk", value: students.filter((s) => s.lastActive > 3).length },
    { name: "Active",  value: students.filter((s) => s.lastActive <= 3).length },
  ];

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 p-8">

      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">🎓 AI Classroom Assistant</h1>

        <div className="inline-flex flex-wrap rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
          {(Object.keys(TAB_LABELS) as Tab[]).map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium ${
                i > 0 ? "border-l border-slate-800" : ""
              } ${
                activeTab === tab
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800/60"
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Overview ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {overviewLoading ? (
            <div className="text-slate-400 p-4">Loading student data...</div>
          ) : overviewError ? (
            <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-xl">
              {overviewError}
            </div>
          ) : (
            <>
              <div className="bg-slate-900 p-4 rounded-xl">
                <h3 className="mb-3 text-lg font-semibold">👥 Students</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {students.map((s, i) => (
                    <div key={i} className="bg-slate-950 p-3 rounded border border-slate-800">
                      <p className="font-bold">{s.name}</p>
                      <p className="text-sm text-slate-200">Uploads: {s.uploads}</p>
                      <p className={`text-sm ${s.lastActive > 3 ? "text-red-400" : "text-slate-300"}`}>
                        Last Active: {s.lastActive} day{s.lastActive !== 1 ? "s" : ""} ago
                        {s.lastActive > 3 && " ⚠️"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 p-6 rounded-xl">
                <h2 className="text-xl font-semibold mb-3">🧠 AI Insights</h2>
                {insightsLoading ? (
                  <p className="text-slate-400">Loading insights...</p>
                ) : insightsError ? (
                  <p className="text-red-400">{insightsError}</p>
                ) : insights ? (
                  <>
                    <p className="mb-3 text-slate-100">{insights.summary}</p>
                    <div className="mb-3">
                      <b>Risks:</b>
                      <ul className="list-disc ml-6 text-slate-200">
                        {insights.risks.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                    <div>
                      <b>Recommendations:</b>
                      <ul className="list-disc ml-6 text-slate-200">
                        {insights.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  </>
                ) : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 p-4 rounded-xl">
                  <h3 className="mb-2 font-semibold">📊 Upload Distribution</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={students}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2933" />
                      <XAxis dataKey="name" stroke="#cbd5f5" />
                      <YAxis stroke="#cbd5f5" />
                      <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", color: "#e5e7eb" }} />
                      <Bar dataKey="uploads" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl">
                  <h3 className="mb-2 font-semibold">⚠️ Risk Breakdown</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={riskData} dataKey="value" label>
                        <Cell key="at-risk" fill="#f97373" />
                        <Cell key="active"  fill="#22c55e" />
                      </Pie>
                      <Legend formatter={(value) => <span style={{ color: "#cbd5e1" }}>{value}</span>} />
                      <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", color: "#e5e7eb" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Grading ── */}
      {activeTab === "grading" && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-xl">
            <h2 className="text-xl mb-4 font-semibold">📝 AI Grading</h2>

            <input
              placeholder="Question"
              className="w-full mb-2 p-2 rounded bg-slate-950 border border-slate-800"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <textarea
              placeholder="Student answer"
              rows={5}
              className="w-full mb-2 p-2 rounded bg-slate-950 border border-slate-800 resize-y"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <textarea
              placeholder="Rubric (optional — defaults to clarity, accuracy, and completeness out of 10)"
              rows={3}
              className="w-full mb-2 p-2 rounded bg-slate-950 border border-slate-800 resize-y"
              value={rubric}
              onChange={(e) => setRubric(e.target.value)}
            />

            {gradingError && <p className="text-red-400 text-sm mb-2">{gradingError}</p>}

            <button
              onClick={handleGrade}
              disabled={isGrading}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 px-4 py-2 rounded text-black font-semibold"
            >
              {isGrading ? "Grading..." : "Grade"}
            </button>

            {grade && (
              <div className="mt-4 space-y-1 text-slate-100">
                <p>Score: <span className="font-semibold text-emerald-300">{grade.score}</span></p>
                <p>Feedback: {grade.feedback}</p>
                {grade.reasoning && <p>Reasoning: {grade.reasoning}</p>}
                {grade.confidence && (
                  <p>Confidence:{" "}
                    <span className={grade.confidence === "HIGH" ? "text-emerald-300" : grade.confidence === "MEDIUM" ? "text-amber-300" : "text-red-300"}>
                      {grade.confidence}
                    </span>
                  </p>
                )}
                {grade.aiDetection && (
                  <p>AI Probability:{" "}
                    <span className={grade.aiDetection.level === "HIGH" ? "text-red-400" : grade.aiDetection.level === "MEDIUM" ? "text-amber-300" : "text-emerald-300"}>
                      {asPercent(grade.aiDetection.aiProbability) ?? 0}% ({grade.aiDetection.level})
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── AI Detection ── */}
      {activeTab === "detection" && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-xl">
            <h2 className="text-xl mb-4 font-semibold">🔍 AI Detection</h2>

            <textarea
              placeholder="Paste student text to analyze..."
              rows={8}
              className="w-full mb-3 p-2 rounded bg-slate-950 border border-slate-800 resize-y"
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
            />

            {detectionError && <p className="text-red-400 text-sm mb-2">{detectionError}</p>}

            <button
              onClick={handleCheckAI}
              disabled={isAnalyzing || !aiText.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 px-4 py-2 rounded text-black font-semibold"
            >
              {isAnalyzing ? "Analyzing..." : "Check AI Usage"}
            </button>

            {aiDetection && (
              <div className="mt-4 space-y-4">
                <div className="text-slate-100">
                  <p>AI Probability:{" "}
                    <span className={`font-semibold ${aiDetection.level === "HIGH" ? "text-red-400" : aiDetection.level === "MEDIUM" ? "text-amber-300" : "text-emerald-300"}`}>
                      {asPercent(aiDetection.aiProbability) ?? 0}%
                    </span>{" "}
                    ({aiDetection.level})
                  </p>
                  <p className="text-sm text-slate-300 mt-1">{aiDetection.reason}</p>
                </div>

                {aiDetection.sections.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide text-slate-300">
                      Suspicious Sections
                    </h3>
                    <ul className="space-y-2 text-sm">
                      {aiDetection.sections.map((sec, idx) => {
                        const badgeColor =
                          sec.aiLikelihood === "HIGH" ? "bg-red-500/20 text-red-300 border-red-400/40"
                          : sec.aiLikelihood === "MEDIUM" ? "bg-amber-500/20 text-amber-300 border-amber-400/40"
                          : "bg-slate-700/40 text-slate-200 border-slate-500/40";
                        return (
                          <li key={idx} className="bg-slate-950 border border-slate-800 rounded p-3">
                            <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${badgeColor}`}>
                              {sec.aiLikelihood} likelihood
                            </span>
                            <p className="mt-2 text-slate-100">&ldquo;{sec.text}&rdquo;</p>
                            <p className="mt-1 text-xs text-slate-400">{sec.reason}</p>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <div className="text-xs text-slate-400 border-t border-slate-800 pt-3">
                  Recommendation: {aiDetection.recommendation}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Quiz ── */}
      {activeTab === "quiz" && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-xl">
            <h2 className="text-xl mb-4 font-semibold">🧪 Quiz Generator</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <input
                placeholder="Topic (optional if using a file)"
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 md:col-span-2"
                value={quizTopic}
                onChange={(e) => setQuizTopic(e.target.value)}
              />
              <div className="flex gap-2">
                <select
                  className="flex-1 p-2 rounded bg-slate-950 border border-slate-800"
                  value={quizDifficulty}
                  onChange={(e) => setQuizDifficulty(e.target.value as Difficulty)}
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
                <input
                  type="number" min={1} max={20}
                  className="w-20 p-2 rounded bg-slate-950 border border-slate-800"
                  value={quizCount}
                  onChange={(e) => setQuizCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Class PPT or PDF (optional)
              </label>
              <input
                type="file"
                accept=".ppt,.pptx,.pdf,.txt"
                className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-slate-100 hover:file:bg-slate-700"
                onChange={(e) => setSourceFile(e.target.files?.[0] || null)}
              />
              {sourceFile && <p className="mt-1 text-xs text-slate-400">Selected: {sourceFile.name}</p>}
            </div>

            {quizError && <p className="text-red-400 text-sm mb-3">{quizError}</p>}

            <div className="flex flex-wrap gap-3 mb-2">
              <button
                onClick={handleGenerateQuizFromTopic}
                disabled={generatingFrom !== null || !quizTopic.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 px-4 py-2 rounded text-black font-semibold text-sm"
              >
                {generatingFrom === "topic" ? "Generating..." : "Generate from Topic"}
              </button>
              <button
                onClick={handleGenerateQuizFromFile}
                disabled={generatingFrom !== null || !sourceFile}
                className="bg-purple-500 hover:bg-purple-600 disabled:opacity-60 px-4 py-2 rounded text-black font-semibold text-sm"
              >
                {generatingFrom === "file" ? "Generating from File..." : "Generate from PPT/PDF"}
              </button>
            </div>

            {quiz && (
              <div className="mt-5">
                <h3 className="font-semibold mb-3 text-lg">
                  {quiz.topic}{" "}
                  <span className="text-sm font-normal text-slate-400">({quiz.difficulty})</span>
                </h3>
                <ol className="space-y-4 list-decimal ml-5">
                  {quiz.questions.map((q, idx) => (
                    <li key={idx} className="bg-slate-950 border border-slate-800 rounded p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-semibold text-slate-100">{q.question}</p>
                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${
                          q.difficulty === "HARD" ? "border-red-400/40 text-red-300"
                          : q.difficulty === "MEDIUM" ? "border-amber-400/40 text-amber-300"
                          : "border-emerald-400/40 text-emerald-300"
                        }`}>
                          {q.difficulty}
                        </span>
                      </div>
                      <ul className="mt-2 space-y-1 text-sm">
                        {q.options.map((opt, i) => (
                          <li key={i} className={i === q.correctIndex ? "text-emerald-300 font-medium" : "text-slate-300"}>
                            {String.fromCharCode(65 + i)}. {opt}{i === q.correctIndex && " ✓"}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-slate-400 border-t border-slate-800 pt-2">
                        {q.explanation}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Lesson Plan ── */}
      {activeTab === "lesson-plan" && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-xl">
            <h2 className="text-xl mb-4 font-semibold">📅 Lesson Plan Generator</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input
                placeholder="Course title (e.g. Introduction to Psychology)"
                className="w-full p-2 rounded bg-slate-950 border border-slate-800"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
              />
              <input
                placeholder="This week's topic (e.g. Classical Conditioning)"
                className="w-full p-2 rounded bg-slate-950 border border-slate-800"
                value={weekTopic}
                onChange={(e) => setWeekTopic(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Weeks remaining</label>
                <input
                  type="number" min={1} max={16}
                  className="w-full p-2 rounded bg-slate-950 border border-slate-800"
                  value={weeksRemaining}
                  onChange={(e) => setWeeksRemaining(Math.max(1, Math.min(16, Number(e.target.value) || 1)))}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Class length (min)</label>
                <input
                  type="number" min={30} max={180}
                  className="w-full p-2 rounded bg-slate-950 border border-slate-800"
                  value={meetingMinutes}
                  onChange={(e) => setMeetingMinutes(Math.max(30, Math.min(180, Number(e.target.value) || 75)))}
                />
              </div>
            </div>

            <textarea
              placeholder="Optional notes (e.g. students struggled with X last week, want more group work)"
              rows={3}
              className="w-full mb-3 p-2 rounded bg-slate-950 border border-slate-800 resize-y"
              value={lessonNotes}
              onChange={(e) => setLessonNotes(e.target.value)}
            />

            {lessonPlanError && <p className="text-red-400 text-sm mb-2">{lessonPlanError}</p>}

            <button
              onClick={handleGenerateLessonPlan}
              disabled={isGeneratingPlan}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 px-4 py-2 rounded text-black font-semibold"
            >
              {isGeneratingPlan ? "Generating..." : "Generate Lesson Plan"}
            </button>
          </div>

          {lessonPlan && (
            <>
              {/* Next class */}
              <div className="bg-slate-900 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-semibold">🗓 Next Class</h3>
                  <span className="text-xs text-slate-400">{lessonPlan.nextClass.totalMinutes} min total</span>
                </div>
                <p className="text-slate-300 text-sm mb-4">{lessonPlan.nextClass.objectiveSummary}</p>

                <div className="space-y-3">
                  {lessonPlan.nextClass.segments.map((seg, i) => (
                    <div key={i} className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEGMENT_COLORS[seg.type]}`}>
                            {seg.type.replace(/_/g, " ")}
                          </span>
                          <span className="font-semibold text-slate-100">{seg.title}</span>
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">{seg.durationMinutes} min</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-1">Objective: {seg.objective}</p>
                      <p className="text-sm text-slate-300">{seg.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly outline */}
              <div className="bg-slate-900 p-6 rounded-xl">
                <h3 className="text-lg font-semibold mb-4">📆 Weekly Outline</h3>
                <div className="space-y-3">
                  {lessonPlan.weeklyOutline.map((w, i) => (
                    <div key={i} className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-medium">
                          Week {w.weekNumber}
                        </span>
                        <span className="font-semibold text-slate-100">{w.theme}</span>
                      </div>
                      <p className="text-sm text-slate-300 mb-1">
                        <span className="text-slate-400">Outcomes: </span>{w.keyOutcomes}
                      </p>
                      <p className="text-sm text-slate-300">
                        <span className="text-slate-400">Assessment: </span>{w.suggestedAssessment}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Activities ── */}
      {activeTab === "activities" && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-xl">
            <h2 className="text-xl mb-4 font-semibold">🎯 Activity Generator</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <input
                placeholder="Topic (e.g. Supply and Demand)"
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 md:col-span-2"
                value={activityTopic}
                onChange={(e) => setActivityTopic(e.target.value)}
              />
              <div className="flex gap-2">
                <select
                  className="flex-1 p-2 rounded bg-slate-950 border border-slate-800"
                  value={activityDifficulty}
                  onChange={(e) => setActivityDifficulty(e.target.value as Difficulty)}
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
                <div>
                  <input
                    type="number" min={1} max={10}
                    className="w-20 p-2 rounded bg-slate-950 border border-slate-800"
                    value={numActivities}
                    onChange={(e) => setNumActivities(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                  />
                </div>
              </div>
            </div>

            <textarea
              placeholder="Optional material summary (paste key concepts, lecture notes, or context)"
              rows={4}
              className="w-full mb-3 p-2 rounded bg-slate-950 border border-slate-800 resize-y"
              value={materialSummary}
              onChange={(e) => setMaterialSummary(e.target.value)}
            />

            {activitiesError && <p className="text-red-400 text-sm mb-2">{activitiesError}</p>}

            <button
              onClick={handleGenerateActivities}
              disabled={isGeneratingActivities}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 px-4 py-2 rounded text-black font-semibold"
            >
              {isGeneratingActivities ? "Generating..." : "Generate Activities"}
            </button>
          </div>

          {activitiesResult && (
            <div className="bg-slate-900 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-semibold">{activitiesResult.topic}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  activitiesResult.difficulty === "HARD" ? "border-red-400/40 text-red-300"
                  : activitiesResult.difficulty === "MEDIUM" ? "border-amber-400/40 text-amber-300"
                  : "border-emerald-400/40 text-emerald-300"
                }`}>
                  {activitiesResult.difficulty}
                </span>
              </div>

              <div className="space-y-4">
                {activitiesResult.activities.map((act, i) => (
                  <div key={i} className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTIVITY_TYPE_COLORS[act.type]}`}>
                          {act.type.replace(/_/g, " ")}
                        </span>
                        <span className="font-semibold text-slate-100">{act.title}</span>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">{act.durationMinutes} min</span>
                    </div>

                    <p className="text-xs text-slate-400 mb-2">
                      <span className="text-slate-300 font-medium">Goal: </span>{act.goal}
                    </p>

                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Instructions</p>
                        <p className="text-slate-300">{act.instructions}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">In-class prompt</p>
                        <p className="text-slate-200 bg-slate-900 border border-slate-700 rounded p-2 italic">
                          &ldquo;{act.inClassPrompt}&rdquo;
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Expected student behaviors</p>
                        <p className="text-slate-300">{act.expectedStudentBehaviors}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}