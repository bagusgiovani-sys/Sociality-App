"use client";

import { Comment } from "@/types/comment";
import { useDeleteComment } from "@/hooks/useComments";
import { useAppSelector } from "@/store";
import { useRouter } from "next/navigation";
import dayjs from "@/lib/dayjs";
import { Trash2 } from "lucide-react";

interface Props {
  comment: Comment;
  postId: number;
}

export default function CommentItem({ comment, postId }: Props) {
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);
  const { mutate: deleteComment, isPending } = useDeleteComment(postId);
  const isOwner = user?.id === comment.author.id;

  return (
    <div className="flex items-start gap-3 px-5 py-3">
      <div
        onClick={() => router.push(`/profile/${comment.author.username}`)}
        className="cursor-pointer w-9 h-9 rounded-full overflow-hidden bg-zinc-800 shrink-0"
      >
        {comment.author.avatarUrl ? (
          <img src={comment.author.avatarUrl} alt={comment.author.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-xs font-semibold">
            {comment.author.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold">{comment.author.name}</p>
        <p className="text-zinc-400 text-xs mb-1">{dayjs(comment.createdAt).fromNow()}</p>
        <p className="text-white text-sm leading-relaxed">{comment.text}</p>
      </div>

      {isOwner && (
        <button
          onClick={() => deleteComment(comment.id)}
          disabled={isPending}
          className={`shrink-0 mt-1 transition-colors ${isPending ? "text-zinc-700" : "text-zinc-600 hover:text-accent-red"}`}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}