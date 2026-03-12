"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, User, Plus } from "lucide-react";
import CreatePostModal from "@/components/post/CreatePostModal";

export default function BottomMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);
  const [plusHovered, setPlusHovered] = useState(false);
  const [hidden, setHidden] = useState(false);
  const scrollTimer = useRef<NodeJS.Timeout | null>(null);

  const isHome = pathname === "/feed";
  const isProfile = pathname === "/me";
  const activeKey = isHome ? "home" : isProfile ? "profile" : null;

  useEffect(() => {
    const handleScroll = () => {
      setHidden(true);
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => setHidden(false), 1500);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    };
  }, []);

  return (
    <>
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.92 }}
          animate={hidden
            ? { y: 100, opacity: 0, scale: 0.95 }
            : { y: 0, opacity: 1, scale: 1 }
          }
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3 p-1.5 px-2.5 mb-8 md:mb-0 rounded-full bg-[#111111] border border-white/8"
        >
          {/* Home */}
          {[{ key: "home", label: "Home", icon: Home, onClick: () => router.push("/feed") }].map(({ key, label, icon: Icon, onClick }) => {
            const active = activeKey === key;
            return (
              <motion.button
                key={key}
                whileTap={{ scale: 0.88 }}
                onClick={onClick}
                className={`relative flex flex-col items-center gap-0.5 cursor-pointer px-5 py-1.5 rounded-full text-sm font-semibold transition-colors ${active ? "text-white" : "text-zinc-400"}`}
              >
                {active && (
                  <motion.div
                    layoutId="bottom-pill"
                    className="absolute inset-0 rounded-full bg-violet-800/60"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon size={18} className="relative z-10 shrink-0" />
                <span className="text-[10px] font-medium relative z-10">{label}</span>
              </motion.button>
            );
          })}

          {/* Create post — center */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onHoverStart={() => setPlusHovered(true)}
            onHoverEnd={() => setPlusHovered(false)}
            onClick={() => setCreateOpen(true)}
            className="flex items-center justify-center rounded-full overflow-hidden cursor-pointer h-11 bg-violet-800/60 mx-1 hover:bg-pink-700"
            animate={{ width: plusHovered ? "120px" : "44px" }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="flex items-center gap-2 whitespace-nowrap px-3">
              <Plus size={20} className="text-white shrink-0" />
              <AnimatePresence>
                {plusHovered && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.18 }}
                    className="text-white text-sm font-semibold"
                  >
                    New Post
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.button>

          {/* Profile */}
          {[{ key: "profile", label: "Profile", icon: User, onClick: () => router.push("/me") }].map(({ key, label, icon: Icon, onClick }) => {
            const active = activeKey === key;
            return (
              <motion.button
                key={key}
                whileTap={{ scale: 0.88 }}
                onClick={onClick}
                className={`relative flex flex-col items-center gap-0.5 cursor-pointer px-5 py-1.5 rounded-full text-sm font-semibold transition-colors ${active ? "text-white" : "text-zinc-400"}`}
              >
                {active && (
                  <motion.div
                    layoutId="bottom-pill"
                    className="absolute inset-0 rounded-full bg-violet-800/60"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon size={18} className="relative z-10 shrink-0" />
                <span className="text-[10px] font-medium relative z-10">{label}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      <CreatePostModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}