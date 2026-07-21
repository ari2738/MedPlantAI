import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, MapPin, Download, Share2, Check } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import PlantImage from "../components/PlantImage";

function downloadPlantCard(plant) {
  const lines = [
    `MEDPLANT AI — Offline Plant Card`,
    `================================`,
    ``,
    `Common Name  : ${plant.common_name}`,
    `Botanical    : ${plant.botanical_name}`,
    plant.hindi_name ? `Hindi Name   : ${plant.hindi_name}` : null,
    plant.tamil_name ? `Tamil Name   : ${plant.tamil_name}` : null,
    plant.family    ? `Family       : ${plant.family}` : null,
    plant.part_used ? `Part Used    : ${plant.part_used}` : null,
    plant.region    ? `Region       : ${plant.region}` : null,
    ``,
    `TRADITIONAL USES`,
    `----------------`,
    ...(plant.uses?.map((u) => `• ${u}`) || []),
    ``,
    `REMEDIES`,
    `--------`,
    ...(plant.remedies?.flatMap((r) => [`Ailment      : ${r.ailment}`, `Preparation  : ${r.preparation}`, ``]) || []),
    `================================`,
    `Source: MedPlant AI  |  For reference only. Not medical advice.`,
  ].filter((l) => l !== null);

  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${plant.slug}-medplant.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PlantDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [plant, setPlant] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    api.get(`/plants/${slug}`).then((res) => setPlant(res.data));
  }, [slug]);

  async function toggleSave() {
    if (!user || !plant) return;
    setSaving(true);
    try {
      if (saved) {
        await api.delete(`/saved-plants/${plant.id}`);
        setSaved(false);
      } else {
        await api.post("/saved-plants", { plant_id: plant.id });
        setSaved(true);
      }
    } catch {
      // e.g. already saved
    } finally {
      setSaving(false);
    }
  }

  function handleDownload() {
    downloadPlantCard(plant);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  }

  async function handleShare() {
    const text = `🌿 ${plant.common_name} (${plant.botanical_name})\n\nUses: ${plant.uses?.join(", ")}\n\nDiscover more medicinal plants on MedPlant AI`;
    if (navigator.share) {
      await navigator.share({ title: plant.common_name, text });
    } else {
      await navigator.clipboard.writeText(text);
    }
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }

  if (!plant) return <div className="p-6 text-sm text-ink-500">Loading...</div>;

  return (
    <div className="p-4 sm:p-6 max-w-3xl space-y-6">
      <div className="bg-white rounded-2xl border border-ink-900/5 shadow-sm overflow-hidden">
        <div className="h-56 sm:h-72">
          <PlantImage slug={plant.slug} alt={plant.common_name} className="w-full h-full" />
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl text-ink-900">{plant.common_name}</h1>
              <p className="text-sm text-ink-500 italic">{plant.botanical_name}</p>
            </div>
            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleShare}
                className="w-9 h-9 rounded-full border border-ink-900/10 flex items-center justify-center hover:bg-sage-100 transition-colors"
                title="Share plant"
              >
                {shared ? <Check size={15} className="text-forest-600" /> : <Share2 size={15} className="text-ink-500" />}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleDownload}
                className="w-9 h-9 rounded-full border border-ink-900/10 flex items-center justify-center hover:bg-sage-100 transition-colors"
                title="Download offline card"
              >
                {downloaded ? <Check size={15} className="text-forest-600" /> : <Download size={15} className="text-ink-500" />}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleSave}
                disabled={!user || saving}
                className="w-9 h-9 rounded-full border border-ink-900/10 flex items-center justify-center hover:bg-sage-100 disabled:opacity-40 transition-colors"
                title={user ? "Save this plant" : "Log in to save"}
              >
                {saved ? <BookmarkCheck size={18} className="text-forest-600" /> : <Bookmark size={18} />}
              </motion.button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {plant.hindi_name && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-cream-100 text-ink-700">
                Hindi: {plant.hindi_name}
              </span>
            )}
            {plant.tamil_name && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-cream-100 text-ink-700">
                Tamil: {plant.tamil_name}
              </span>
            )}
            {plant.part_used && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-cream-100 text-ink-700">
                Part used: {plant.part_used}
              </span>
            )}
          </div>

          {plant.region && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-ink-500">
              <MapPin size={13} /> {plant.region}
            </div>
          )}

          <div className="mt-5">
            <h3 className="text-sm font-semibold text-ink-900 mb-2">Traditional Uses</h3>
            <div className="flex flex-wrap gap-2">
              {plant.uses?.map((u) => (
                <span key={u} className="text-xs px-2.5 py-1 rounded-full bg-sage-100 text-forest-700 font-medium">
                  {u}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {plant.remedies?.length > 0 && (
        <div className="bg-white rounded-2xl border border-ink-900/5 shadow-sm p-6">
          <h3 className="font-display text-lg text-ink-900 mb-4">Traditional Remedies</h3>
          <div className="space-y-4">
            {plant.remedies.map((r, i) => (
              <div key={i} className="border-l-2 border-violet-600 pl-4">
                <p className="text-sm font-medium text-ink-900">{r.ailment}</p>
                <p className="text-sm text-ink-500 mt-0.5">{r.preparation}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-ink-300 mt-5">
            This is traditional-use reference information, not medical advice. Consult a doctor
            for diagnosis or treatment.
          </p>
        </div>
      )}

      {/* Offline card hint */}
      <div className="flex items-center gap-3 bg-sage-50 rounded-xl px-4 py-3 border border-sage-200">
        <Download size={15} className="text-forest-600 shrink-0" />
        <p className="text-xs text-ink-600">
          Download an offline card with all plant info for use without internet access.
        </p>
        <button
          onClick={handleDownload}
          className="ml-auto text-xs font-medium text-forest-700 hover:underline shrink-0"
        >
          {downloaded ? "Downloaded ✓" : "Download"}
        </button>
      </div>
    </div>
  );
}