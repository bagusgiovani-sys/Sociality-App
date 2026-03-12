"use client";

import { useAddComment } from "@/hooks/useComments";
import { useAppSelector } from "@/store";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile } from "lucide-react";

const EMOJIS = [
  "😀", "😂", "🤩", "😊", "🙂", "😜", "🤔", "🥲", "😌", "😔",
  "🥹", "😭", "😤", "😡", "😱", "🤯", "😎", "🥳", "😍", "❤️",
  "🔥", "✨", "💯", "👍", "🙌", "💀", "😅", "🫶", "💕", "🎉",
];

interface Props {
  postId: number;
}

export default function CommentComposer({ postId }: Props) {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const { mutate: addComment, isPending } = useAddComment(postId);
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!isAuthenticated) return router.push("/login");
    const trimmed = text.trim();
    if (!trimmed || isPending) return;
    addComment(trimmed, { onSuccess: () => setText("") });
    setShowEmoji(false);
  };

  const insertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      {/* Emoji picker */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 p-3 rounded-2xl grid grid-cols-6 gap-2 shadow-xl z-10 bg-[#1a1a1a] border border-white/8"
          >
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => insertEmoji(e)}
                className="text-xl hover:scale-110 transition-transform"
              >
                {e}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-t border-white/8 bg-[#111111]"
      >
        <button
          onClick={() => setShowEmoji((v) => !v)}
          className="text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
        >
          <Smile size={22} />
        </button>

        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder={isAuthenticated ? "Add Comment" : "Login to comment"}
          disabled={!isAuthenticated || isPending}
          maxLength={500}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none"
        />

        {text.trim() && (
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="text-sm font-bold shrink-0 transition-opacity disabled:opacity-50 text-[#7C3AED]"
          >
            Post
          </button>
        )}
      </div>
    </div>
  );
}