"use client";

import { useComments } from "@/hooks/useComments";
import CommentItem from "./CommentItem";
import CommentComposer from "@/components/comments/CommentComposer";
import { MessageCircle } from "lucide-react";

interface Props {
  postId: number;
}

export default function CommentSection({ postId }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useComments(postId);
  const comments = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="flex flex-col h-full bg-[#111111]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/8 shrink-0">
        <h3 className="text-white font-bold text-lg">Comments</h3>
      </div>

      {/* Scrollable body — grows to fill, never pushes composer out */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <MessageCircle size={32} className="text-zinc-700" />
            <p className="text-white text-sm font-semibold">No Comments yet</p>
            <p className="text-zinc-500 text-sm">Start the conversation</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} postId={postId} />
            ))}
          </div>
        )}

        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full py-3 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </button>
        )}
      </div>

      {/* Composer — always visible at bottom */}
      <div className="shrink-0">
        <CommentComposer postId={postId} />
      </div>
    </div>
  );
}