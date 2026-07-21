import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ScanLine, Search, BookOpen, MapPin, ArrowRight, Leaf, Globe2, FlaskConical, BrainCircuit, Stethoscope } from "lucide-react";
import api from "../lib/api";
import PlantImage from "../components/PlantImage";

const featureCards = [
  {
    to: "/identify",
    icon: ScanLine,
    accent: "text-forest-600 bg-sage-100",
    title: "Identify Plant",
    desc: "Upload a leaf image and identify the plant instantly with AI",
  },
  {
    to: "/symptoms",
    icon: Stethoscope,
    accent: "text-violet-600 bg-violet-100",
    title: "Symptom Checker",
    desc: "Enter a symptom and find medicinal plants that may help",
  },
  {
    to: "/search",
    icon: Search,
    accent: "text-forest-600 bg-sage-100",
    title: "Search Plants",
    desc: "Search by name, disease, or plant properties",
  },
  {
    to: "/regions",
    icon: MapPin,
    accent: "text-amber-600 bg-amber-100",
    title: "Explore Regions",
    desc: "Discover plants by region and climate",
  },
];

const stats = [
  { icon: Leaf, value: "45", label: "Medicinal Plants" },
  { icon: Globe2, value: "15+", label: "Indian Regions" },
  { icon: FlaskConical, value: "80+", label: "Traditional Remedies" },
  { icon: BrainCircuit, value: "AI", label: "Powered Identification" },
];

export default function Home() {
  const [plants, setPlants] = useState([]);

  useEffect(() => {
    api.get("/plants").then((res) => setPlants(res.data.slice(0, 5))).catch(() => {});
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-3xl overflow-hidden bg-forest-950 text-cream-50 min-h-[300px] sm:min-h-[340px] flex"
      >
        <div className="absolute inset-0 botanical-texture" />
        <div className="relative z-10 p-6 sm:p-10 flex flex-col justify-center max-w-md">
          <h1 className="font-display text-3xl sm:text-4xl leading-tight">
            MedPlant <span className="text-forest-500">AI</span>
          </h1>
          <p className="font-display text-lg sm:text-xl text-sage-200 mt-1">Identify. Learn. Heal.</p>
          <p className="text-sm text-ink-300 mt-4 leading-relaxed">
            Your smart companion for discovering medicinal plants, their uses, and traditional
            remedies from across India.
          </p>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-6 flex bg-white rounded-xl overflow-hidden"
          >
            <input
              type="text"
              placeholder="Search plant name, disease, or region..."
              className="flex-1 min-w-0 px-4 py-3 text-sm text-ink-900 outline-none"
            />
            <motion.button
              whileTap={{ scale: 0.96 }}
              className="px-4 sm:px-5 bg-forest-700 hover:bg-forest-600 text-white text-sm font-medium transition-colors shrink-0"
            >
              Search
            </motion.button>
          </form>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/2 leaf-mask hidden md:block">
          <img
            src="https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?q=80&w=1200&auto=format&fit=crop"
            alt="Tulsi plant with purple flowers, representative of Indian medicinal herbs"
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-forest-950/60" />
        </div>
      </motion.div>

      {/* Feature cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {featureCards.map(({ to, icon: Icon, accent, title, desc }, i) => (
          <motion.div
            key={to}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <Link
              to={to}
              className="group block h-full bg-white rounded-2xl border border-ink-900/5 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${accent}`}>
                <Icon size={17} />
              </div>
              <h3 className="font-semibold text-sm text-ink-900 mb-1">{title}</h3>
              <p className="text-xs text-ink-500 leading-relaxed">{desc}</p>
              <ArrowRight
                size={14}
                className="mt-3 text-ink-300 group-hover:text-forest-600 group-hover:translate-x-0.5 transition-all"
              />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Popular plants */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl text-ink-900">Popular Medicinal Plants</h2>
          <Link to="/search" className="text-sm text-forest-600 font-medium hover:underline">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                {p.uses?.[0] && (
                  <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-sage-100 text-forest-700 font-medium">
                    {p.uses[0]}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white rounded-2xl border border-ink-900/5 shadow-sm p-6">
        {stats.map(({ icon: Icon, value, label }) => (
          <div key={label} className="flex items-center gap-3">
            <Icon size={20} className="text-forest-600" />
            <div>
              <p className="font-display text-lg text-ink-900 leading-none">{value}</p>
              <p className="text-xs text-ink-500 mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}