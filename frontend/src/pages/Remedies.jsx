import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FlaskConical } from "lucide-react";
import api from "../lib/api";

export default function Remedies() {
  const [plants, setPlants] = useState([]);

  useEffect(() => {
    api.get("/plants").then((res) => setPlants(res.data));
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <FlaskConical size={20} className="text-violet-600" />
        <h1 className="font-display text-2xl text-ink-900">Traditional Remedies</h1>
      </div>
      <p className="text-sm text-ink-500 -mt-4">
        Browse by plant to see traditional remedies and preparation methods.
      </p>

      <div className="space-y-3">
        {plants.map((p) => (
          <Link
            key={p.id}
            to={`/plants/${p.slug}`}
            className="flex items-center justify-between bg-white rounded-xl border border-ink-900/5 shadow-sm px-5 py-4 hover:shadow-md transition-shadow"
          >
            <div>
              <p className="font-medium text-sm text-ink-900">{p.common_name}</p>
              <p className="text-xs text-ink-500 italic">{p.botanical_name}</p>
            </div>
            <span className="text-xs text-forest-600 font-medium">View remedies →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
