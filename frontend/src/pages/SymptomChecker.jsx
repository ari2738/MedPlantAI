import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Stethoscope, Search, ArrowRight, Leaf } from "lucide-react";
import api from "../lib/api";
import PlantImage from "../components/PlantImage";

const COMMON_SYMPTOMS = [
  "fever", "headache", "cough", "cold", "sore throat", "stomach pain",
  "diabetes", "inflammation", "skin irritation", "joint pain",
  "indigestion", "hair loss", "wound healing", "liver", "anxiety",
];

export default function SymptomChecker() {
  const [symptom, setSymptom] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  async function check(s) {
    const q = s || symptom;
    if (!q.trim()) return;
    setSymptom(q);
    setLoading(true);
    setResults(null);
    try {
      const res = await api.get("/plants/remedies/search", { params: { q } });
      setResults(res.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Stethoscope size={20} className="text-violet-600" />
        <h1 className="font-display text-2xl text-ink-900">Symptom Checker</h1>
      </div>
      <p className="text-sm text-ink-500 -mt-4">
        Enter a symptom and discover traditional medicinal plants that may help.
      </p>

      {/* Search */}
      <form
        onSubmit={(e) => { e.preventDefault(); check(); }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
            placeholder="e.g. fever, headache, diabetes..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-ink-900/10 bg-white text-sm outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={!symptom.trim() || loading}
          className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
        >
          {loading ? "Checking..." : "Check"}
        </motion.button>
      </form>

      {/* Suggestions */}
      {!results && !loading && (
        <div>
          <p className="text-xs text-ink-400 mb-2">Common symptoms</p>
          <div className="flex flex-wrap gap-2">
            {COMMON_SYMPTOMS.map((s) => (
              <button
                key={s}
                onClick={() => check(s)}
                className="text-xs px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100 hover:bg-violet-100 transition-colors capitalize"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-ink-900/5 animate-pulse" />
          ))}
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {results !== null && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {results.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <p className="text-ink-500 text-sm">No remedies found for <span className="font-medium">"{symptom}"</span>.</p>
                <p className="text-xs text-ink-400">Try a different term like "fever", "cough", or "skin".</p>
                <button
                  onClick={() => { setResults(null); setSymptom(""); }}
                  className="mt-3 text-xs text-violet-600 underline"
                >
                  Clear and try again
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-ink-500">
                    Found <span className="font-semibold text-ink-900">{results.length}</span> plant{results.length !== 1 ? "s" : ""} for <span className="font-semibold text-ink-900">"{symptom}"</span>
                  </p>
                  <button onClick={() => { setResults(null); setSymptom(""); }} className="text-xs text-ink-400 hover:text-ink-600">
                    Clear
                  </button>
                </div>

                {results.map((plant) => (
                  <motion.div
                    key={plant.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-ink-900/5 shadow-sm overflow-hidden"
                  >
                    {/* Plant header */}
                    <Link
                      to={`/plants/${plant.slug}`}
                      className="flex items-center gap-4 p-4 hover:bg-sage-50 transition-colors"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                        <PlantImage slug={plant.slug} alt={plant.common_name} className="w-full h-full" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Leaf size={13} className="text-forest-600 shrink-0" />
                          <p className="font-semibold text-sm text-ink-900">{plant.common_name}</p>
                        </div>
                        <p className="text-xs text-ink-500 italic">{plant.botanical_name}</p>
                        {plant.region && (
                          <p className="text-xs text-ink-400 mt-0.5">📍 {plant.region}</p>
                        )}
                      </div>
                      <ArrowRight size={15} className="text-ink-300 shrink-0" />
                    </Link>

                    {/* Matched remedies */}
                    <div className="border-t border-ink-900/5 divide-y divide-ink-900/5">
                      {plant.matched_remedies.map((r, i) => (
                        <div key={i} className="px-4 py-3 flex gap-3">
                          <div className="w-1 rounded-full bg-violet-400 shrink-0 mt-1" />
                          <div>
                            <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide mb-0.5">
                              {r.ailment}
                            </p>
                            <p className="text-sm text-ink-600 leading-relaxed">{r.preparation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}

                <p className="text-[11px] text-ink-300 text-center pt-2">
                  Traditional-use reference only. Not medical advice. Consult a doctor for diagnosis.
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
