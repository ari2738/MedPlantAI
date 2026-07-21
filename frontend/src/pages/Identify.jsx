import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Camera, Sparkles, ThumbsUp, ThumbsDown, Share2, Check } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import ConfidenceRing from "../components/ConfidenceRing";

export default function Identify() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [shared, setShared] = useState(false);

  async function handleShare() {
    const name = result?.identification?.plant?.common_name
      || result?.external_info?.common_names?.[0]
      || result?.identification?.raw_label
      || "a plant";
    const botanical = result?.identification?.plant?.botanical_name || result?.identification?.raw_label || "";
    const text = `🌿 I just identified ${name} (${botanical}) using MedPlant AI!\n\nDiscover medicinal plants and their traditional remedies.`;
    if (navigator.share) {
      await navigator.share({ title: `MedPlant AI — ${name}`, text });
    } else {
      await navigator.clipboard.writeText(text);
    }
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }

  async function handleFile(file) {
    if (!file || !user) return;
    setStatus("loading");
    setResult(null);
    setFeedbackSent(false);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await api.post("/identify", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      setStatus("done");
    } catch (err) {
      const detail = err?.response?.data?.detail
        ? JSON.stringify(err.response.data.detail)
        : err?.response?.data?.error || err?.message || "Unknown error";
      setResult({ errorDetail: detail });
      setStatus("error");
    }
  }

  async function sendFeedback(isCorrect) {
    if (!result?.identification) return;
    await api.post("/feedback", {
      plant_id: result.identification.plant?.id,
      identification_id: result.identification.id,
      is_correct: isCorrect,
    });
    setFeedbackSent(true);
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles size={20} className="text-forest-600" />
        <h1 className="font-display text-2xl text-ink-900">Identify Plant</h1>
      </div>
      <p className="text-sm text-ink-500 -mt-4">
        Upload a clear photo of a leaf or plant to identify it using AI.
      </p>

      {!user && (
        <p className="text-sm text-amber-600 bg-amber-100 rounded-lg px-4 py-3">
          <Link to="/login" className="underline font-medium">Log in</Link> to identify plants and save your history.
        </p>
      )}

      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer py-16 transition-colors ${
          dragOver ? "border-forest-500 bg-sage-100" : "border-ink-300/60 bg-white"
        } ${!user ? "opacity-50 pointer-events-none" : ""}`}
      >
        {/* Gallery / file picker (hidden, triggered by label click) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <div className="w-14 h-14 rounded-full bg-forest-600 flex items-center justify-center">
          <Camera size={24} className="text-white" />
        </div>
        <p className="text-base font-medium text-ink-900">
          {status === "loading" ? "Identifying..." : "Click or drag image here"}
        </p>
        <p className="text-xs text-ink-500">JPG, PNG up to 10MB</p>
      </label>

      {/* Camera capture button — visible on mobile */}
      {user && status !== "loading" && (
        <div className="flex gap-3 sm:hidden">
          <label className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-forest-700 text-white text-sm font-medium cursor-pointer">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <Camera size={16} /> Take Photo
          </label>
          <label className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-ink-900/10 bg-white text-ink-700 text-sm font-medium cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            Choose File
          </label>
        </div>
      )}

      <AnimatePresence>
        {status === "done" && result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-ink-900/5 shadow-sm p-6"
          >
            {result.identification.plant ? (
              <>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-xl text-ink-900">{result.identification.plant.common_name}</p>
                    <p className="text-sm text-ink-500 italic">{result.identification.plant.botanical_name}</p>
                  </div>
                  <ConfidenceRing confidence={Math.round(result.identification.confidence)} />
                </div>

                {result.newly_unlocked_badges?.length > 0 && (
                  <p className="text-sm text-amber-600 mt-3">
                    🎉 New badge unlocked: {result.newly_unlocked_badges.join(", ")}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-5 pt-4 border-t border-ink-900/5">
                  <span className="text-xs text-ink-500">Was this correct?</span>
                  {feedbackSent ? (
                    <span className="text-xs text-forest-700">Thanks for the feedback!</span>
                  ) : (
                    <>
                      <button onClick={() => sendFeedback(true)} className="p-1.5 rounded-lg hover:bg-sage-100 text-forest-600">
                        <ThumbsUp size={15} />
                      </button>
                      <button onClick={() => sendFeedback(false)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                        <ThumbsDown size={15} />
                      </button>
                    </>
                  )}
                  <button onClick={handleShare} className="ml-auto flex items-center gap-1.5 text-xs text-ink-500 hover:text-forest-600 transition-colors">
                    {shared ? <Check size={13} className="text-forest-600" /> : <Share2 size={13} />}
                    {shared ? "Copied!" : "Share"}
                  </button>
                </div>
              </>
            ) : (
              /* Plant not in local DB — show external info from Plant.id */
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-xl text-ink-900">
                      {result.external_info?.common_names?.[0] || result.identification.raw_label}
                    </p>
                    <p className="text-sm text-ink-500 italic">{result.identification.raw_label}</p>
                  </div>
                  <ConfidenceRing confidence={Math.round(result.identification.confidence)} />
                </div>

                {result.external_info?.common_names?.length > 1 && (
                  <div>
                    <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">Also known as</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.external_info.common_names.slice(1, 5).map((n) => (
                        <span key={n} className="text-xs px-2 py-0.5 rounded-full bg-cream-100 text-ink-700">{n}</span>
                      ))}
                    </div>
                  </div>
                )}

                {result.external_info?.description && (
                  <div>
                    <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">About</p>
                    <p className="text-sm text-ink-700 leading-relaxed">
                      {result.external_info.description.length > 300
                        ? result.external_info.description.slice(0, 300) + "…"
                        : result.external_info.description}
                    </p>
                  </div>
                )}

                {result.external_info?.edible_parts?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">Edible parts</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.external_info.edible_parts.map((p) => (
                        <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 capitalize">{p}</span>
                      ))}
                    </div>
                  </div>
                )}

                {result.external_info?.taxonomy && Object.keys(result.external_info.taxonomy).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">Classification</p>
                    <div className="grid grid-cols-2 gap-1 text-xs text-ink-600">
                      {Object.entries(result.external_info.taxonomy).map(([k, v]) => v && (
                        <span key={k}><span className="text-ink-400 capitalize">{k}:</span> {v}</span>
                      ))}
                    </div>
                  </div>
                )}

                {result.external_info?.wiki_url && (
                  <a
                    href={result.external_info.wiki_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs text-forest-600 underline mt-1"
                  >
                    Read more on Wikipedia →
                  </a>
                )}

                <p className="text-[11px] text-ink-300 pt-2 border-t border-ink-900/5">
                  This plant isn't in our local database yet. Info sourced from Plant.id.
                </p>
                <button onClick={handleShare} className="flex items-center gap-1.5 text-xs text-ink-500 hover:text-forest-600 transition-colors">
                  {shared ? <Check size={13} className="text-forest-600" /> : <Share2 size={13} />}
                  {shared ? "Copied!" : "Share result"}
                </button>
              </div>
            )}
          </motion.div>
        )}
        {status === "error" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-600 bg-red-50 rounded-xl p-4 space-y-1">
            <p className="font-medium">Couldn't identify that image.</p>
            {result?.errorDetail && (
              <p className="text-xs font-mono break-all text-red-500">{result.errorDetail}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
