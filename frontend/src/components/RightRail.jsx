import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Camera, ArrowRight, Brain } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

function IdentifyUpload() {
  const { user } = useAuth();
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [result, setResult] = useState(null);

  async function handleFile(file) {
    if (!file || !user) return;
    setStatus("loading");
    setResult(null);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await api.post("/identify", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data.identification);
      setStatus("done");
    } catch (err) {
      setStatus("error");
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-ink-900/5 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={16} className="text-forest-600" />
        <h3 className="font-semibold text-sm text-ink-900">Identify Plant</h3>
      </div>
      <p className="text-xs text-ink-500 mb-4">Upload a clear image of the leaf or plant</p>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer py-8 transition-colors ${
          dragOver ? "border-forest-500 bg-sage-100" : "border-ink-300/60 bg-cream-50"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <div className="w-11 h-11 rounded-full bg-forest-600 flex items-center justify-center">
          <Camera size={20} className="text-white" />
        </div>
        <p className="text-sm font-medium text-ink-900">
          {status === "loading" ? "Identifying..." : "Click or drag image here"}
        </p>
        <p className="text-[11px] text-ink-500">JPG, PNG up to 10MB</p>
      </label>

      {!user && (
        <p className="text-xs text-amber-600 mt-3">Log in to identify and save results.</p>
      )}

      <AnimatePresence>
        {status === "done" && result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-3 rounded-xl bg-sage-100 text-sm"
          >
            {result.plant ? (
              <>
                <p className="font-medium text-ink-900">{result.plant.common_name}</p>
                <p className="text-xs text-ink-500 italic">{result.plant.botanical_name}</p>
                <p className="text-xs text-forest-700 mt-1">Confidence: {result.confidence}%</p>
              </>
            ) : (
              <p className="text-ink-700">
                Detected "{result.raw_label}" — not yet in our database of 45 plants.
              </p>
            )}
          </motion.div>
        )}
        {status === "error" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-xs text-red-600"
          >
            Couldn't identify that image. Try a clearer, closer photo.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function RecentIdentificationCard({ recent }) {
  if (!recent) return null;
  return (
    <div className="bg-white rounded-2xl border border-ink-900/5 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-ink-900">Recent Identification</h3>
        <button className="text-xs text-forest-600 font-medium hover:underline">View All</button>
      </div>
      <div className="flex gap-3 items-center">
        <div className="w-16 h-16 rounded-xl bg-sage-100 shrink-0" />
        <div className="min-w-0">
          <p className="font-medium text-sm text-ink-900 truncate">{recent.plant?.common_name}</p>
          <p className="text-xs text-ink-500 italic truncate">{recent.plant?.botanical_name}</p>
          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-sage-100 text-forest-700 font-medium">
            Confidence: {recent.confidence}%
          </span>
        </div>
        <ArrowRight size={16} className="text-ink-300 ml-auto shrink-0" />
      </div>
    </div>
  );
}

function DailyQuizCard() {
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get("/quiz/random").then((res) => setQuestion(res.data)).catch(() => {});
  }, []);

  async function submit() {
    if (!selected || !question) return;
    try {
      const res = await api.post(`/quiz/${question.id}/submit`, { selected_answer: selected });
      setResult(res.data);
    } catch {
      // likely not logged in
    }
  }

  if (!question) {
    return (
      <div className="bg-white rounded-2xl border border-ink-900/5 shadow-sm p-5 text-sm text-ink-500">
        Loading today's quiz...
      </div>
    );
  }

  const letters = ["A", "B", "C", "D"];

  return (
    <div className="bg-white rounded-2xl border border-ink-900/5 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-violet-600" />
          <h3 className="font-semibold text-sm text-ink-900">Daily Plant Quiz</h3>
        </div>
        <button className="text-xs text-forest-600 font-medium hover:underline">View All</button>
      </div>
      <p className="text-sm text-ink-700 mb-3">{question.question}</p>
      <div className="space-y-2 mb-3">
        {question.options.map((opt, i) => (
          <button
            key={opt}
            onClick={() => setSelected(opt)}
            className={`w-full flex items-center gap-3 text-left text-sm px-3 py-2.5 rounded-lg border transition-colors ${
              selected === opt
                ? "border-forest-500 bg-sage-100"
                : "border-ink-900/10 hover:border-forest-500/50"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-medium ${
                selected === opt ? "border-forest-600 text-forest-700" : "border-ink-300 text-ink-500"
              }`}
            >
              {letters[i]}
            </span>
            {opt}
          </button>
        ))}
      </div>

      {result && (
        <p className={`text-xs mb-2 ${result.is_correct ? "text-forest-700" : "text-red-600"}`}>
          {result.is_correct ? "Correct!" : `Not quite — the answer was ${result.correct_answer}.`}
        </p>
      )}

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={submit}
        disabled={!selected}
        className="w-full py-2.5 rounded-lg bg-forest-700 hover:bg-forest-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
      >
        Submit Answer
      </motion.button>
    </div>
  );
}

export default function RightRail({ recentIdentification }) {
  return (
    <aside className="w-[360px] shrink-0 space-y-5 p-5 hidden xl:block">
      <IdentifyUpload />
      <RecentIdentificationCard recent={recentIdentification} />
      <DailyQuizCard />
    </aside>
  );
}
