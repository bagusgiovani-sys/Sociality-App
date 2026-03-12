"use client";

import { useFeed } from "@/hooks/useFeed";
import { useExplorePosts } from "@/hooks/usePosts";
import PostCard from "@/components/post/PostCard";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Compass } from "lucide-react";

type Tab = "feed" | "explore";

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse bg-[#111111]">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-zinc-800 shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="w-28 h-3 rounded-full bg-zinc-800" />
          <div className="w-16 h-2.5 rounded-full bg-zinc-800" />
        </div>
      </div>
      <div className="w-full aspect-square bg-zinc-800" />
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="w-6 h-6 rounded-full bg-zinc-800" />
        <div className="w-6 h-6 rounded-full bg-zinc-800" />
        <div className="w-6 h-6 rounded-full bg-zinc-800" />
        <div className="ml-auto w-6 h-6 rounded-full bg-zinc-800" />
      </div>
      <div className="px-4 pb-4 flex flex-col gap-2">
        <div className="w-20 h-3 rounded-full bg-zinc-800" />
        <div className="w-full h-3 rounded-full bg-zinc-800" />
        <div className="w-2/3 h-3 rounded-full bg-zinc-800" />
      </div>
    </div>
  );
}

export default function FeedPage() {
  const [tab, setTab] = useState<Tab>("feed");
  const bottomRef = useRef<HTMLDivElement>(null);

  const feed = useFeed();
  const explore = useExplorePosts();

  const active = tab === "feed" ? feed : explore;
  const posts = active.data?.pages.flatMap((p: any) => Array.isArray(p.data) ? p.data : []) ?? [];

  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && active.hasNextPage && !active.isFetchingNextPage) {
          active.fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [active.hasNextPage, active.isFetchingNextPage, tab]);

  return (
    <div className="min-h-screen bg-[#000000]">

      {/* Floating Feed / Explore tabs */}
      <div className="sticky top-14 z-40 flex justify-center pt-3 pb-2 pointer-events-none">
        <div
          className="flex items-center gap-1 p-1 mr-0 md:mr-9 my-1 rounded-full pointer-events-auto bg-[#111111] border border-white/8"
        >
          {([
            { key: "feed", label: "Feed", icon: Home },
            { key: "explore", label: "Explore", icon: Compass },
          ] as { key: Tab; label: string; icon: any }[]).map(({ key: t, label, icon: Icon }) => (
            <motion.button
              key={t}
              onClick={() => setTab(t)}
              className={`relative flex items-center gap-1.5 px-5 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition-colors ${tab === t ? "text-white" : "text-zinc-100"}`}
              whileHover={{ color: "#ffffff" }}
            >
              {tab === t && (
                <motion.div
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-full bg-violet-800/60"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={14} className="relative z-10 shrink-0" />
              <span className="relative z-10">{label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-xl mx-auto pb-32 px-4">

        {/* Skeleton */}
        {active.isLoading && (
          <motion.div
            className="flex flex-col gap-6 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
          </motion.div>
        )}

        {/* Error */}
        {active.isError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-zinc-500 text-sm">
            Something went wrong.{" "}
            <button onClick={() => active.refetch()} className="text-violet-500 underline">Retry</button>
          </motion.div>
        )}

        {/* Empty */}
        {!active.isLoading && posts.length === 0 && !active.isError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-zinc-500 text-sm">
            {tab === "feed" ? "Follow someone to see their posts here." : "No posts yet."}
          </motion.div>
        )}

        {/* Posts with staggered entrance */}
        <AnimatePresence mode="wait">
          {!active.isLoading && posts.length > 0 && (
            <motion.div
              key={tab}
              className="flex flex-col gap-6 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              {posts.map((post: any, i: number) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: "easeOut", delay: i * 0.07 }}
                >
                  <PostCard post={post} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} className="h-4" />

        {active.isFetchingNextPage && (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}