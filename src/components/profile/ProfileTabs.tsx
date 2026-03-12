"use client";

import { useState } from "react";
import { LayoutGrid, Bookmark, Heart } from "lucide-react";
import PostGrid from "@/components/post/PostGrid";
import { useMyLikes, useMySaved } from "@/hooks/useMe";
import { useUserLikes } from "@/hooks/useUsers";

interface Post {
  id: number;
  imageUrl: string;
  caption?: string | null;
}

interface Props {
  posts: Post[];
  isMyProfile?: boolean;
  username?: string; // required when isMyProfile is false
  onUploadClick?: () => void;
  activeTab?: "gallery" | "saved" | "liked";
  onTabChange?: (tab: "gallery" | "saved" | "liked") => void;
}

export default function ProfileTabs({
  posts,
  isMyProfile,
  username,
  onUploadClick,
  activeTab,
  onTabChange,
}: Props) {
  const [internalTab, setInternalTab] = useState<"gallery" | "saved" | "liked">("gallery");
  const tab = activeTab ?? internalTab;

  const setTab = (t: "gallery" | "saved" | "liked") => {
    setInternalTab(t);
    onTabChange?.(t);
  };

  const tabs = isMyProfile
    ? [
      { key: "gallery", label: "Gallery", icon: LayoutGrid },
      { key: "saved", label: "Saved", icon: Bookmark },
      { key: "liked", label: "Liked", icon: Heart },
    ]
    : [
      { key: "gallery", label: "Gallery", icon: LayoutGrid },
      { key: "liked", label: "Liked", icon: Heart },
    ];

  const activeIndex = tabs.findIndex((t) => t.key === tab);

  return (
    <div className="max-w-2xl md:mx-auto">
      {/* Tab bar */}
      <div className="relative flex border-b border-white/8">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`relative flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${tab === key ? "text-white" : "text-[#a3a3a3]"
              }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
        {/* Sliding underline — pure CSS, no layout recalc */}
        <span
          className={`absolute bottom-0 h-0.5 rounded-full bg-white transition-transform duration-200 ease-out ${tabs.length === 2 ? "w-1/2" : "w-1/3"}`}
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        />
      </div>

      <div className="mt-0.5">
        {tab === "gallery" && (
          posts.length === 0
            ? <EmptyState isMyProfile={!!isMyProfile} tab="gallery" onUploadClick={onUploadClick} />
            : <PostGrid posts={posts} />
        )}
        {tab === "saved" && isMyProfile && <SavedTab />}
        {tab === "liked" && (
          isMyProfile
            ? <MyLikedTab />
            : <UserLikedTab username={username ?? ""} />
        )}
      </div>
    </div>
  );
}

// ── Lazy sub-tabs — only mount & fetch when tab is active ──────────

function SavedTab() {
  const { data, isLoading } = useMySaved();
  const posts = Array.isArray(data) ? data : [];
  if (isLoading) return <TabSpinner />;
  if (posts.length === 0) return <EmptyState isMyProfile tab="saved" />;
  return <PostGrid posts={posts} />;
}

function MyLikedTab() {
  const { data, isLoading } = useMyLikes();
  const posts = Array.isArray(data) ? data : [];
  if (isLoading) return <TabSpinner />;
  if (posts.length === 0) return <EmptyState isMyProfile tab="liked" />;
  return <PostGrid posts={posts} />;
}

function UserLikedTab({ username }: { username: string }) {
  const { data, isLoading } = useUserLikes(username);
  const posts = Array.isArray(data) ? data : [];
  if (isLoading) return <TabSpinner />;
  if (posts.length === 0) return <EmptyState isMyProfile={false} tab="liked" />;
  return <PostGrid posts={posts} />;
}

function TabSpinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-6 h-6 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
    </div>
  );
}

function EmptyState({
  isMyProfile,
  tab,
  onUploadClick,
}: {
  isMyProfile: boolean;
  tab: string;
  onUploadClick?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      {isMyProfile && tab === "gallery" ? (
        <>
          <p className="text-white font-bold text-lg mb-2">Your story starts here</p>
          <p className="text-zinc-500 text-sm leading-relaxed mb-6">
            Share your first post and let the world see your moments, passions, and memories. Make this space truly yours.
          </p>
          <button
            onClick={onUploadClick}
            className="px-8 py-3 rounded-full text-white text-sm font-bold bg-[#7C3AED] active:scale-95 transition-transform"
          >
            Upload My First Post
          </button>
        </>
      ) : (
        <p className="text-zinc-500 text-sm">No posts yet.</p>
      )}
    </div>
  );
}