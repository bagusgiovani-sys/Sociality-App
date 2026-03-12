"use client";

import { Post } from "@/types/post";
import { useToggleLike } from "@/hooks/useLike";
import { useToggleSave } from "@/hooks/useSave";
import { useDeletePost, usePost } from "@/hooks/usePosts";
import { useAppSelector } from "@/store";
import { useRouter } from "next/navigation";
import dayjs from "@/lib/dayjs";
import { Heart, MessageCircle, Send, Bookmark, X, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import CommentSection from "@/components/comments/CommentSection";
import LikedByModal from "@/components/modals/LikedByModal";
import { toast } from "sonner";

interface Props {
  post: Post;
  onClose?: () => void;
}

const ease = [0.22, 1, 0.36, 1] as const;

export default function PostDetail({ post, onClose }: Props) {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const savedPostIds = useAppSelector((s) => s.saves.savedPostIds);
  const likedPostIds = useAppSelector((s) => s.likes.likedPostIds);
  const { mutate: toggleLike, isPending: likePending } = useToggleLike(post.id);
  const { mutate: toggleSave, isPending: savePending } = useToggleSave(post.id);
  const { mutate: deletePost, isPending: deletePending } = useDeletePost();
  const { data: livePost } = usePost(post.id, post);
  const p = livePost ?? post;
  const [likesOpen, setLikesOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const isOwner = user?.id === p.author?.id;

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const isLiked = likedPostIds.includes(post.id) || (p.likedByMe ?? false);
  const isSaved = savedPostIds.includes(post.id) || (p.savedByMe ?? false);

  const handleLike = () => {
    if (!isAuthenticated) return router.push("/login");
    if (!likePending) toggleLike(isLiked);
  };

  const handleSave = () => {
    if (!isAuthenticated) return router.push("/login");
    if (!savePending) toggleSave(isSaved);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/posts/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: p.author?.name ?? "Sociality", text: p.caption ?? "Check out this post!", url });
      } catch { }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleDelete = () => {
    if (!confirm("Delete this post?")) return;
    deletePost(post.id, {
      onSuccess: () => { onClose ? onClose() : router.replace("/feed"); },
    });
  };

  const handleClose = () => onClose ? onClose() : router.back();

  const onLongPressStart = () => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setLikesOpen(true);
    }, 500);
  };

  const onLongPressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const onLikeTap = () => {
    if (!didLongPress.current) handleLike();
    didLongPress.current = false;
  };

  return (
    <>
      {/* ── PC: Side-by-side layout ── */}
      <motion.div
        className="hidden md:flex h-[90vh] max-h-[700px] w-full max-w-5xl mx-auto rounded-2xl overflow-hidden bg-[#0a0a0a]"
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
      >
        <motion.div
          className="flex-1 bg-black flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <img src={p.imageUrl} alt={p.caption ?? "Post"} className="w-full h-full object-cover" />
        </motion.div>

        <motion.div
          className="w-[380px] shrink-0 flex flex-col bg-[#111111]"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.12, duration: 0.4, ease }}
        >
          <div className="flex justify-end p-3">
            <button onClick={handleClose} className="text-zinc-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <motion.div
            className="px-5 pb-4 border-b border-white/8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35, ease }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push(`/profile/${p.author?.username}`)}>
                <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-800">
                  {p.author?.avatarUrl ? (
                    <img src={p.author.avatarUrl} alt={p.author.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-xs font-semibold">
                      {p.author?.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{p.author?.name}</p>
                  <p className="text-zinc-500 text-xs">{dayjs(p.createdAt).fromNow()}</p>
                </div>
              </div>
              {isOwner && (
                <div className="relative">
                  <button onClick={() => setShowMenu((v) => !v)} className="text-zinc-400 hover:text-white transition-colors">
                    <MoreHorizontal size={20} />
                  </button>
                  <AnimatePresence>
                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 mt-1 rounded-xl overflow-hidden shadow-xl z-10 bg-[#1a1a1a] border border-white/8"
                      >
                        <button onClick={handleDelete} disabled={deletePending} className="block w-full px-5 py-2.5 text-sm text-left text-[#D9206E] hover:bg-zinc-800 transition-colors">
                          Delete Post
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
            {p.caption && <p className="text-white text-sm leading-relaxed">{p.caption}</p>}
          </motion.div>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <CommentSection postId={post.id} />
          </div>

          <motion.div
            className="flex items-center justify-between px-5 py-3 border-t border-white/8 shrink-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.35, ease }}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <motion.button whileTap={{ scale: 0.85 }} onClick={handleLike} disabled={likePending}>
                  <Heart size={20} className={isLiked ? "fill-[#D9206E] text-[#D9206E]" : "text-white"} />
                </motion.button>
                <button onClick={() => setLikesOpen(true)} className="text-white text-sm hover:underline">
                  {p.likeCount ?? 0}
                </button>
              </div>
              <button className="flex items-center gap-1.5">
                <MessageCircle size={20} className="text-white" />
                <span className="text-white text-sm">{p.commentCount ?? 0}</span>
              </button>
              <motion.button whileTap={{ scale: 0.85 }} onClick={handleShare}>
                <Send size={20} className="text-white" />
              </motion.button>
            </div>
            <motion.button whileTap={{ scale: 0.85 }} onClick={handleSave} disabled={savePending}>
              <Bookmark size={20} className={isSaved ? "fill-white text-white" : "text-white"} />
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── Mobile: stacked layout ── */}
      <div className="md:hidden flex flex-col bg-[#0a0a0a]">
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease }}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="cursor-pointer w-9 h-9 rounded-full overflow-hidden bg-zinc-800 shrink-0" onClick={() => router.push(`/profile/${p.author?.username}`)}>
              {p.author?.avatarUrl ? (
                <img src={p.author.avatarUrl} alt={p.author.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-xs font-semibold">
                  {p.author?.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{p.author?.name}</p>
              <p className="text-zinc-500 text-xs">{dayjs(p.createdAt).fromNow()}</p>
            </div>
          </div>

          <motion.img
            src={p.imageUrl}
            alt={p.caption ?? "Post"}
            className="w-full object-cover max-h-[40vh]"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08, duration: 0.4, ease }}
          />

          <motion.div
            className="flex items-center justify-between px-4 py-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18, duration: 0.3 }}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex items-center gap-1.5 select-none"
                onPointerDown={onLongPressStart}
                onPointerUp={() => { onLongPressEnd(); onLikeTap(); }}
                onPointerLeave={onLongPressEnd}
                onPointerCancel={onLongPressEnd}
              >
                <Heart size={20} className={isLiked ? "fill-[#D9206E] text-[#D9206E]" : "text-white"} />
                <span className="text-white text-sm">{p.likeCount ?? 0}</span>
              </div>
              <button className="flex items-center gap-1.5">
                <MessageCircle size={20} className="text-white" />
                <span className="text-white text-sm">{p.commentCount ?? 0}</span>
              </button>
              <motion.button whileTap={{ scale: 0.85 }} onClick={handleShare}>
                <Send size={20} className="text-white" />
              </motion.button>
            </div>
            <motion.button whileTap={{ scale: 0.85 }} onClick={handleSave} disabled={savePending}>
              <Bookmark size={20} className={isSaved ? "fill-white text-white" : "text-white"} />
            </motion.button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 38 }}
          className="rounded-t-2xl flex flex-col bg-[#111111] min-h-[50vh]"
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
            <div />
            <button onClick={handleClose} className="text-zinc-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            <CommentSection postId={post.id} />
          </div>
        </motion.div>
      </div>

      <LikedByModal postId={post.id} open={likesOpen} onClose={() => setLikesOpen(false)} />
    </>
  );
}