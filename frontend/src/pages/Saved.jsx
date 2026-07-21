import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Leaf, X } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import PlantImage from "../components/PlantImage";

export default function Saved() {
  const { user } = useAuth();
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    if (user) api.get("/saved-plants").then((res) => setSaved(res.data));
  }, [user]);

  async function remove(plantId) {
    await api.delete(`/saved-plants/${plantId}`);
    setSaved((s) => s.filter((item) => item.plant.id !== plantId));
  }

  if (!user) {
    return <div className="p-6 text-sm text-ink-500">Log in to view your saved plants.</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl space-y-6">
      <h1 className="font-display text-2xl text-ink-900">Saved Plants</h1>

      {saved.length === 0 ? (
        <p className="text-sm text-ink-500">
          You haven't saved any plants yet. Browse plants and tap the bookmark icon to save them here.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {saved.map(({ plant }) => (
            <div key={plant.id} className="relative group bg-white rounded-2xl border border-ink-900/5 shadow-sm overflow-hidden">
              <button
                onClick={() => remove(plant.id)}
                className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <X size={13} />
              </button>
              <Link to={`/plants/${plant.slug}`}>
                <div className="aspect-square">
                  <PlantImage slug={plant.slug} alt={plant.common_name} className="w-full h-full" />
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm text-ink-900 truncate">{plant.common_name}</p>
                  <p className="text-xs text-ink-500 italic truncate">{plant.botanical_name}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}