import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon, FlaskConical, Leaf } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../lib/api";
import PlantImage from "../components/PlantImage";

const AILMENT_SUGGESTIONS = [
  "fever", "headache", "diabetes", "cough", "skin", "digestion",
  "inflammation", "wound", "cold", "joint pain", "hair", "liver",
];

export default function Search() {
  const [mode, setMode] = useState("plants"); // "plants" | "ailment"
  const [query, setQuery] = useState("");
  const [plants, setPlants] = useState([]);
  const [ailmentResults, setAilmentResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Plant search
  useEffect(() => {
    if (mode !== "plants") return;
    const timeout = setTimeout(() => {
      setLoading(true);
      api
        .get("/plants", { params: query ? { q: query } : {} })
        .then((res) => setPlants(res.data))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, mode]);

  // Ailment search
  useEffect(() => {
    if (mode !== "ailment") return;
    if (!query.trim()) { setAilmentResults([]); setLoading(false); return; }
    const timeout = setTimeout(() => {
      setLoading(true);
      api
        .get("/plants/remedies/search", { params: { q: query } })
        .then((res) => setAilmentResults(res.data))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, mode]);

  function switchMode(m) {
    setMode(m);
    setQuery("");
    setPlants([]);
    setAilmentResults([]);
    setLoading(m === "plants");
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink-900 mb-1">Search</h1>
        <p className="text-sm text-ink-500">Find plants by name or search by ailment to discover remedies.</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => switchMode("plants")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            mode === "plants"
              ? "bg-forest-700 text-white"
              : "bg-white border border-ink-900/10 text-ink-600 hover:border-forest-500/50"
          }`}
        >
          <Leaf size={14} /> Plants
        </button>
        <button
          onClick={() => switchMode("ailment")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            mode === "ailment"
              ? "bg-violet-600 text-white"
              : "bg-white border border-ink-900/10 text-ink-600 hover:border-violet-500/50"
          }`}
        >
          <FlaskConical size={14} /> By Ailment
        </button>
      </div>

      {/* Search input */}
      <div className="relative max-w-md">
        <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={mode === "plants" ? "Search plant name..." : "e.g. fever, headache, diabetes..."}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-ink-900/10 bg-white text-sm outline-none focus:border-forest-500 transition-colors"
        />
      </div>

      {/* Ailment suggestions */}
      {mode === "ailment" && !query && (
        <div>
          <p className="text-xs text-ink-400 mb-2">Common ailments</p>
          <div className="flex flex-wrap gap-2">
            {AILMENT_SUGGESTIONS.map((a) => (
              <button
                key={a}
                onClick={() => setQuery(a)}
                className="text-xs px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100 hover:bg-violet-100 transition-colors capitalize"
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.p key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-ink-500">
            Loading...
          </motion.p>
        ) : mode === "plants" ? (
          plants.length === 0 ? (
            <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-ink-500">
              No plants found{query ? ` for "${query}"` : ""}.
            </motion.p>
          ) : (
            <motion.div
              key="plant-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {plants.map((p) => (
                <Link
                  key={p.id}
                  to={`/plants/${p.slug}`}
                  className="group bg-white rounded-2xl border border-ink-900/5 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square">
                    <PlantImage slug={p.slug} alt={p.common_name} className="w-full h-full" />
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm text-ink-900 truncate">{p.common_name}</p>
                    <p className="text-xs text-ink-500 italic truncate">{p.botanical_name}</p>
                    <p className="text-[11px] text-ink-300 truncate mt-1">{p.region}</p>
                  </div>
                </Link>
              ))}
            </motion.div>
          )
        ) : query && ailmentResults.length === 0 ? (
          <motion.p key="ailment-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-ink-500">
            No remedies found for "{query}". Try a different term.
          </motion.p>
        ) : ailmentResults.length > 0 ? (
          <motion.div key="ailment-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-sm text-ink-500">
              Found <span className="font-medium text-ink-900">{ailmentResults.length}</span> plant{ailmentResults.length !== 1 ? "s" : ""} with remedies for <span className="font-medium text-ink-900">"{query}"</span>
            </p>
            {ailmentResults.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-ink-900/5 shadow-sm overflow-hidden">
                <Link to={`/plants/${p.slug}`} className="flex items-center gap-4 p-4 hover:bg-sage-50 transition-colors">
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                    <PlantImage slug={p.slug} alt={p.common_name} className="w-full h-full" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-ink-900">{p.common_name}</p>
                    <p className="text-xs text-ink-500 italic">{p.botanical_name}</p>
                    {p.hindi_name && <p className="text-xs text-ink-400 mt-0.5">Hindi: {p.hindi_name}</p>}
                  </div>
                  <span className="ml-auto text-xs text-forest-600 font-medium shrink-0">View →</span>
                </Link>

                {/* Matched remedies */}
                <div className="border-t border-ink-900/5 divide-y divide-ink-900/5">
                  {p.matched_remedies.map((r, i) => (
                    <div key={i} className="px-4 py-3 flex gap-3">
                      <div className="w-1.5 rounded-full bg-violet-400 shrink-0 mt-1" />
                      <div>
                        <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">{r.ailment}</p>
                        <p className="text-sm text-ink-600 mt-0.5 leading-relaxed">{r.preparation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
