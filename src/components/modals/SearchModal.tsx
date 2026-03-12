"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, UserCheck, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { usersApi } from "@/lib/api/users";
import { useToggleFollow } from "@/hooks/useFollow";
import { useAppSelector } from "@/store";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchUser {
  id: number;
  username: string;
  name: string;
  avatarUrl: string | null;
  isFollowedByMe?: boolean;
  isMe?: boolean;
}

function UserRow({ user, onNavigate }: { user: SearchUser; onNavigate: () => void }) {
  const { mutate: toggleFollow, isPending } = useToggleFollow(user.username);
  const router = useRouter();

  const handleClick = () => {
    router.push(`/profile/${user.username}`);
    onNavigate();
  };

  return (
    <div className="flex items-center justify-between px-5 py-3 hover:bg-zinc-900 transition-colors">
      <button onClick={handleClick} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 shrink-0">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-sm font-semibold">
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold truncate">{user.name}</p>
          <p className="text-zinc-500 text-xs truncate">@{user.username}</p>
        </div>
      </button>

      {!user.isMe && (
        <motion.button
          whileTap={{ scale: 0.93 }}
          disabled={isPending}
          onClick={() => toggleFollow(user.isFollowedByMe ?? false)}
          className={`ml-3 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all disabled:opacity-50 ${user.isFollowedByMe
              ? "bg-transparent border border-white/15 text-white"
              : "bg-[#7C3AED] text-white"
            }`}
        >
          {user.isFollowedByMe ? (
            <><UserCheck size={12} /> Following</>
          ) : (
            <><UserPlus size={12} /> Follow</>
          )}
        </motion.button>
      )}
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export default function SearchModal({ open, onClose, initialQuery = "" }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 350);

  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); return; }
    setIsLoading(true);
    usersApi.searchUsers(debouncedQuery)
      .then((res) => {
        const inner = res.data?.data;
        setResults(Array.isArray(inner?.users) ? inner.users : []);
      })
      .catch(() => setResults([]))
      .finally(() => setIsLoading(false));
  }, [debouncedQuery]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md rounded-2xl overflow-hidden shadow-2xl bg-[#111111] border border-white/8"
          >
            {/* Search input */}
            <div
              className="flex items-center gap-3 px-5 py-4 border-b border-white/8"
            >
              <Search size={18} className="text-zinc-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search people..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-white text-sm placeholder:text-zinc-600 outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-zinc-500 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              )}
              <button
                onClick={onClose}
                className="ml-1 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : results.length > 0 ? (
                results.map((user) => (
                  <UserRow key={user.id} user={user} onNavigate={onClose} />
                ))
              ) : debouncedQuery.trim() ? (
                <p className="text-zinc-500 text-sm text-center py-8">No users found for "{debouncedQuery}"</p>
              ) : (
                <p className="text-zinc-600 text-sm text-center py-8">Type to search people</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}