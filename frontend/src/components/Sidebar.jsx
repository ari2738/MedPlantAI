import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, ScanLine, Search, BookOpen, MapPin, HelpCircle, Bookmark, User, Leaf, X, Stethoscope } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/identify", label: "Identify Plant", icon: ScanLine },
  { to: "/symptoms", label: "Symptom Checker", icon: Stethoscope },
  { to: "/search", label: "Search Plants", icon: Search },
  { to: "/remedies", label: "Remedies", icon: BookOpen },
  { to: "/regions", label: "Regions", icon: MapPin },
  { to: "/quiz", label: "Quiz", icon: HelpCircle },
  { to: "/saved", label: "Saved Plants", icon: Bookmark },
  { to: "/profile", label: "My Profile", icon: User },
];

function SidebarContent({ onNavigate }) {
  const { user } = useAuth();

  return (
    <>
      <div className="px-6 pt-7 pb-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-forest-600 flex items-center justify-center">
            <Leaf size={18} className="text-cream-50" />
          </div>
          <span className="font-display text-lg tracking-tight">
            MedPlant <span className="text-forest-500 font-semibold">AI</span>
          </span>
        </div>
        <p className="text-[11px] text-ink-300 mt-1 pl-10 tracking-wide">Discover. Learn. Heal.</p>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-forest-700 text-white font-medium"
                  : "text-cream-100/80 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="m-4 mb-6 rounded-xl bg-forest-900/70 border border-white/10 p-4">
        <div className="flex items-center gap-2 text-sm font-medium mb-2">
          <Leaf size={14} className="text-forest-500" />
          Our Mission
        </div>
        <p className="text-xs leading-relaxed text-ink-300">
          Preserving traditional knowledge of medicinal plants and promoting natural healing.
        </p>
      </div>

      {!user && (
        <div className="px-4 pb-5 -mt-2 space-y-2">
          <NavLink
            to="/login"
            onClick={onNavigate}
            className="block text-center text-sm py-2 rounded-lg bg-forest-600 hover:bg-forest-500 transition-colors font-medium"
          >
            Log in
          </NavLink>
        </div>
      )}
    </>
  );
}

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      {/* Desktop sidebar - always visible */}
      <aside className="botanical-texture hidden lg:flex w-64 shrink-0 bg-forest-950 text-cream-50 flex-col h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
              className="botanical-texture fixed top-0 left-0 bottom-0 w-72 bg-forest-950 text-cream-50 flex flex-col z-50 lg:hidden"
            >
              <button
                onClick={onClose}
                className="absolute top-5 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10"
              >
                <X size={18} />
              </button>
              <SidebarContent onNavigate={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
