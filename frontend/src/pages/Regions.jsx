import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Leaf } from "lucide-react";
import api from "../lib/api";
import PlantImage from "../components/PlantImage";

export default function Regions() {
  const [regions, setRegions] = useState([]);
  const [active, setActive] = useState(null);
  const [plants, setPlants] = useState([]);

  useEffect(() => {
    api.get("/plants/regions").then((res) => setRegions(res.data));
  }, []);

  useEffect(() => {
    if (active) api.get("/plants", { params: { region: active } }).then((res) => setPlants(res.data));
  }, [active]);

  return (
    <div className="p-4 sm:p-6 max-w-5xl space-y-6">
      <h1 className="font-display text-2xl text-ink-900">Explore by Region</h1>

      <div className="flex flex-wrap gap-2">
        {regions.map((r) => (
          <button
            key={r}
            onClick={() => setActive(r)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              active === r
                ? "bg-forest-700 text-white border-forest-700"
                : "bg-white text-ink-700 border-ink-900/10 hover:border-forest-500"
            }`}
          >
            <MapPin size={11} /> {r}
          </button>
        ))}
      </div>

      {active && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {plants.map((p) => (
            <Link
              key={p.id}
              to={`/plants/${p.slug}`}
              className="bg-white rounded-2xl border border-ink-900/5 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-square">
                <PlantImage slug={p.slug} alt={p.common_name} className="w-full h-full" />
              </div>
              <div className="p-3">
                <p className="font-medium text-sm text-ink-900 truncate">{p.common_name}</p>
                <p className="text-xs text-ink-500 italic truncate">{p.botanical_name}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}