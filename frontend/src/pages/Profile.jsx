import { useEffect, useState } from "react";
import { User, Leaf, Bookmark, Target, Trophy, Award, Clock } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/profile/dashboard").then((res) => setData(res.data));
  }, []);

  if (!user) {
    return <div className="p-6 text-sm text-ink-500">Log in to view your profile.</div>;
  }
  if (!data) {
    return <div className="p-6 text-sm text-ink-500">Loading profile...</div>;
  }

  const { profile, stats, badges, recent_activity, identification_history } = data;

  const statCards = [
    { icon: Leaf, label: "Plants Identified", value: stats.plants_identified },
    { icon: Bookmark, label: "Plants Saved", value: stats.plants_saved },
    { icon: Target, label: "Quiz Accuracy", value: `${stats.quiz_accuracy}%` },
    { icon: Trophy, label: "Total Points", value: stats.total_points },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-ink-900/5 shadow-sm p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-forest-700 flex items-center justify-center text-white shrink-0">
          <User size={26} />
        </div>
        <div>
          <h1 className="font-display text-xl text-ink-900">{profile.name}</h1>
          <p className="text-sm text-ink-500">{profile.email}</p>
          <p className="text-xs text-ink-300 mt-1">
            Member since {new Date(profile.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-ink-900/5 shadow-sm p-5">
            <Icon size={18} className="text-forest-600 mb-2" />
            <p className="font-display text-2xl text-ink-900">{value}</p>
            <p className="text-xs text-ink-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="bg-white rounded-2xl border border-ink-900/5 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award size={17} className="text-amber-600" />
          <h3 className="font-semibold text-sm text-ink-900">Badges</h3>
        </div>
        {badges.length === 0 ? (
          <p className="text-sm text-ink-500">
            No badges yet — identify a plant or save one to earn your first badge.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {badges.map((b) => (
              <div key={b.badge_type} className="flex items-center gap-3 p-3 rounded-xl bg-sage-100">
                <span className="text-2xl">{b.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{b.label}</p>
                  <p className="text-[11px] text-ink-500">
                    {new Date(b.earned_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent activity */}
        <div className="bg-white rounded-2xl border border-ink-900/5 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-ink-500" />
            <h3 className="font-semibold text-sm text-ink-900">Recent Activity</h3>
          </div>
          {recent_activity.length === 0 ? (
            <p className="text-sm text-ink-500">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {recent_activity.map((a) => (
                <li key={a.id} className="text-sm text-ink-700 flex justify-between">
                  <span>{a.action}</span>
                  <span className="text-ink-300 text-xs shrink-0 ml-3">
                    {new Date(a.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Identification history */}
        <div className="bg-white rounded-2xl border border-ink-900/5 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Leaf size={16} className="text-forest-600" />
            <h3 className="font-semibold text-sm text-ink-900">Identification History</h3>
          </div>
          {identification_history.length === 0 ? (
            <p className="text-sm text-ink-500">No identifications yet.</p>
          ) : (
            <ul className="space-y-3">
              {identification_history.map((idf) => (
                <li key={idf.id} className="text-sm flex justify-between items-center">
                  <div className="min-w-0">
                    <p className="text-ink-900 font-medium truncate">
                      {idf.plant?.common_name || idf.raw_label}
                    </p>
                    {idf.confidence != null && (
                      <p className="text-xs text-ink-500">Confidence: {idf.confidence}%</p>
                    )}
                  </div>
                  <span className="text-ink-300 text-xs shrink-0 ml-3">
                    {new Date(idf.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
