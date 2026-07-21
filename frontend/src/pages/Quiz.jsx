import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Trophy, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

const DAILY_LIMIT = 5;

function DailyProgressBar({ used, limit }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-ink-500">
        <span>Today's progress</span>
        <span className="font-medium text-ink-900">{used}/{limit} questions</span>
      </div>
      <div className="h-2 bg-ink-900/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full rounded-full ${used >= limit ? "bg-amber-500" : "bg-forest-600"}`}
        />
      </div>
    </div>
  );
}

export default function Quiz() {
  const { user } = useAuth();
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [dailyProgress, setDailyProgress] = useState({ used: 0, limit: DAILY_LIMIT, remaining: DAILY_LIMIT, completed: false });
  const [limitReached, setLimitReached] = useState(false);

  // Load daily status on mount (only for logged in users)
  useEffect(() => {
    if (!user) return;
    api.get("/quiz/status")
      .then((res) => {
        setDailyProgress(res.data);
        if (res.data.completed) setLimitReached(true);
      })
      .catch(() => {});
  }, [user]);

  function loadNext() {
    setSelected(null);
    setResult(null);
    api.get("/quiz/random").then((res) => setQuestion(res.data));
  }

  useEffect(loadNext, []);

  async function submit() {
    if (!selected || !user) return;
    try {
      const res = await api.post(`/quiz/${question.id}/submit`, { selected_answer: selected });
      setResult(res.data);
      if (res.data.daily_progress) {
        setDailyProgress(res.data.daily_progress);
        if (res.data.daily_progress.completed) setLimitReached(false); // show after next click
      }
      setScore((s) => ({ correct: s.correct + (res.data.is_correct ? 1 : 0), total: s.total + 1 }));
    } catch (err) {
      if (err?.response?.status === 429) {
        setLimitReached(true);
        setDailyProgress({ used: DAILY_LIMIT, limit: DAILY_LIMIT, remaining: 0, completed: true });
      }
    }
  }

  function handleNext() {
    if (dailyProgress.completed) {
      setLimitReached(true);
    } else {
      loadNext();
    }
  }

  const letters = ["A", "B", "C", "D"];

  return (
    <div className="p-4 sm:p-6 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={20} className="text-violet-600" />
          <h1 className="font-display text-2xl text-ink-900">Plant Quiz</h1>
        </div>
        {score.total > 0 && (
          <span className="text-sm text-ink-500">
            Session: <span className="font-medium text-ink-900">{score.correct}/{score.total}</span>
          </span>
        )}
      </div>

      {/* Daily progress bar — logged in users only */}
      {user && (
        <DailyProgressBar used={dailyProgress.used} limit={dailyProgress.limit} />
      )}

      {!user && (
        <p className="text-sm text-amber-600 bg-amber-100 rounded-lg px-4 py-3">
          <Link to="/login" className="underline font-medium">Log in</Link> to track your daily progress and earn badges.
        </p>
      )}

      {/* Daily limit reached screen */}
      <AnimatePresence>
        {limitReached && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-ink-900/5 shadow-sm p-8 text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
              <Trophy size={28} className="text-amber-600" />
            </div>
            <div>
              <p className="font-display text-xl text-ink-900">Great job today!</p>
              <p className="text-sm text-ink-500 mt-1">
                You've completed all {dailyProgress.limit} questions for today.
              </p>
            </div>
            <div className="bg-sage-50 rounded-xl px-4 py-3 flex items-center gap-3">
              <Clock size={16} className="text-forest-600 shrink-0" />
              <p className="text-sm text-ink-700">
                Come back tomorrow for a new set of questions and keep your streak going!
              </p>
            </div>
            <div className="pt-2 space-y-2">
              <p className="text-sm font-medium text-ink-900">
                Today's score: <span className="text-forest-700">{score.correct}/{score.total}</span>
              </p>
              <Link
                to="/profile"
                className="inline-block text-sm text-forest-600 underline"
              >
                View your quiz history →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question card */}
      {!limitReached && question && (
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-ink-900/5 shadow-sm p-6"
        >
          {/* Question number badge */}
          {user && (
            <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 font-medium mb-4">
              Question {dailyProgress.used + (result ? 0 : 0) + 1 > dailyProgress.limit
                ? dailyProgress.limit
                : dailyProgress.used + (result ? 0 : 1)} of {dailyProgress.limit}
            </span>
          )}

          <p className="text-base text-ink-900 font-medium mb-5">{question.question}</p>
          <div className="space-y-2.5">
            {question.options.map((opt, i) => {
              let cls = "border-ink-900/10 hover:border-forest-500/50";
              if (result) {
                if (opt === result.correct_answer) cls = "border-forest-500 bg-sage-100";
                else if (opt === selected && !result.is_correct) cls = "border-red-400 bg-red-50";
                else cls = "border-ink-900/10 opacity-50";
              } else if (selected === opt) {
                cls = "border-forest-500 bg-sage-100";
              }

              return (
                <button
                  key={opt}
                  onClick={() => !result && setSelected(opt)}
                  className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border transition-colors ${cls}`}
                >
                  <span
                    className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium shrink-0 ${
                      selected === opt ? "border-forest-600 text-forest-700" : "border-ink-300 text-ink-500"
                    }`}
                  >
                    {letters[i]}
                  </span>
                  <span className="text-sm text-ink-900">{opt}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-2">
                <p className={`text-sm font-medium ${result.is_correct ? "text-forest-700" : "text-red-600"}`}>
                  {result.is_correct ? "✓ Correct!" : `✗ The answer was: ${result.correct_answer}`}
                </p>
                {result.newly_unlocked_badges?.length > 0 && (
                  <p className="text-sm text-amber-600">
                    🎉 Badge unlocked: {result.newly_unlocked_badges.join(", ")}
                  </p>
                )}
                {result.daily_progress?.remaining > 0 && (
                  <p className="text-xs text-ink-400">
                    {result.daily_progress.remaining} question{result.daily_progress.remaining !== 1 ? "s" : ""} remaining today
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-5">
            {!result ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={submit}
                disabled={!selected || (!user)}
                className="w-full py-2.5 rounded-lg bg-forest-700 hover:bg-forest-600 disabled:opacity-40 text-white text-sm font-medium transition-colors"
              >
                {!user ? "Log in to submit" : "Submit Answer"}
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleNext}
                className="w-full py-2.5 rounded-lg bg-forest-700 hover:bg-forest-600 text-white text-sm font-medium transition-colors"
              >
                {dailyProgress.completed ? "See Today's Summary" : "Next Question →"}
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
