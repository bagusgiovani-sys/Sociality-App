"use client";

import { useUserFollowers, useUserFollowing } from "@/hooks/useFollow";
import { useMyFollowers, useMyFollowing } from "@/hooks/useMe";
import { useToggleFollow } from "@/hooks/useFollow";
import { useAppSelector } from "@/store";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  type: "followers" | "following";
  username?: string; // if undefined = my own list
  onClose: () => void;
}

export default function FollowListModal({ open, type, username, onClose }: Props) {
  const { user: me } = useAppSelector((s) => s.auth);
  const router = useRouter();

  const myFollowers = useMyFollowers({ enabled: open && !username && type === "followers" });
  const myFollowing = useMyFollowing({ enabled: open && !username && type === "following" });
  const userFollowers = useUserFollowers(username ?? "", { enabled: open && !!username && type === "followers" });
  const userFollowing = useUserFollowing(username ?? "", { enabled: open && !!username && type === "following" });

  const query = username
    ? type === "followers" ? userFollowers : userFollowing
    : type === "followers" ? myFollowers : myFollowing;

  const users = Array.isArray((query as any)?.data) ? (query as any).data : [];
  const isLoading = (query as any)?.isLoading;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70"
          />

          {/* Sheet */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md max-h-[80vh] rounded-2xl overflow-hidden bg-[#111111]"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b border-white/8"
            >
              <h3 className="text-white font-bold text-lg capitalize">{type}</h3>
              <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-[60vh]">
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-10">No {type} yet.</p>
              ) : (
                users.map((u: any) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    isMe={me?.username === u.username}
                    onNavigate={() => { onClose(); router.push(`/profile/${u.username}`); }}
                  />
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function UserRow({ user, isMe, onNavigate }: { user: any; isMe: boolean; onNavigate: () => void }) {
  const { mutate: toggleFollow, isPending } = useToggleFollow(user.username);

  return (
    <div
      className="flex items-center gap-3 mx-4 my-2 px-4 py-3 rounded-2xl bg-[#1a1a1a]"
    >
      <div
        onClick={onNavigate}
        className="cursor-pointer w-11 h-11 rounded-full overflow-hidden bg-zinc-800 shrink-0"
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400 text-lg">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={onNavigate}>
        <p className="text-white text-sm font-semibold truncate">{user.name}</p>
        <p className="text-zinc-500 text-xs truncate">@{user.username}</p>
      </div>

      {!isMe && (
        user.isFollowedByMe ? (
          <button
            onClick={() => toggleFollow(true)}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium text-white border border-zinc-600 transition-opacity disabled:opacity-50"
          >
            <CheckCircle size={14} className="text-zinc-400" />
            Following
          </button>
        ) : (
          <button
            onClick={() => toggleFollow(false)}
            disabled={isPending}
            className="px-5 py-1.5 rounded-full text-sm font-bold text-white bg-[#7C3AED] transition-opacity disabled:opacity-50"
          >
            Follow
          </button>
        )
      )}
    </div>
  );
}