import { useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Leaf } from "lucide-react";
import Sidebar from "./Sidebar";
import RightRail from "./RightRail";

// Pages where the right rail (identify widget / quiz) doesn't make sense
const HIDE_RAIL_ON = ["/login", "/register"];

export default function Layout() {
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const showRail = !HIDE_RAIL_ON.includes(location.pathname);

  return (
    <div className="flex min-h-screen bg-cream-50">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 bg-forest-950 text-cream-50 px-4 py-3">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10"
          >
            <Menu size={19} />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-forest-600 flex items-center justify-center">
              <Leaf size={13} />
            </div>
            <span className="font-display text-sm">
              MedPlant <span className="text-forest-500 font-semibold">AI</span>
            </span>
          </Link>
        </header>

        <div className="flex flex-1 min-w-0">
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
          {showRail && <RightRail />}
        </div>
      </div>
    </div>
  );
}
