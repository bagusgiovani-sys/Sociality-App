"use client";

import { useCreatePost } from "@/hooks/usePosts";
import { createPostSchema, CreatePostFormData } from "@/schemas/post.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Upload, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreatePostModal({ open, onClose }: Props) {
  const router = useRouter();
  const { mutate: createPost, isPending } = useCreatePost();
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<CreatePostFormData>({
    resolver: zodResolver(createPostSchema),
  });

  const handleFile = (file: File) => {
    setValue("image", file, { shouldValidate: true });
    setPreview(URL.createObjectURL(file));
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);

  const handleClose = () => { reset(); setPreview(null); onClose(); };

  const onSubmit = (data: CreatePostFormData) => {
    createPost(
      { image: data.image, caption: data.caption },
      {
        onSuccess: () => {
          toast.success("Post shared!", { description: "Your post is now live.", position: "top-center" });
          reset(); setPreview(null); onClose();
        },
        onError: () => toast.error("Failed to share post", { description: "Please try again.", position: "top-center" }),
      }
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="flex items-center justify-between px-4 h-14 border-b border-white/8 shrink-0"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <button onClick={handleClose} className="flex items-center gap-2 text-white hover:opacity-70 transition-opacity">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-white font-bold text-base absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">Add Post</h1>
            <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden" />
          </motion.div>

          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg mx-auto px-4 py-6 space-y-6">

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <label className="block text-white text-sm font-semibold mb-3">Photo</label>
                <AnimatePresence mode="wait">
                  {!preview ? (
                    <motion.div
                      key="dropzone"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => fileRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={onDrop}
                      className={`cursor-pointer flex flex-col items-center justify-center gap-2 rounded-xl py-10 bg-[#111111] transition-colors border-[1.5px] border-dashed ${errors.image ? "border-[#D9206E]" : isDragging ? "border-[#7C3AED]" : "border-white/15"
                        }`}
                    >
                      <Upload size={28} className="text-zinc-500" />
                      <p className="text-sm">
                        <span className="font-medium text-[#7C3AED]">Click to upload</span>
                        <span className="text-zinc-400"> or drag and drop</span>
                      </p>
                      <p className="text-xs text-zinc-600">PNG or JPG (max. 5mb)</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.25 }}
                      className="rounded-xl overflow-hidden bg-[#111111]"
                    >
                      <img src={preview} alt="preview" className="w-full object-cover max-h-80" />
                      <div className="flex items-center gap-3 p-3">
                        <button type="button" onClick={() => fileRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-white bg-[#1a1a1a] border border-white/10 hover:bg-[#222] transition-colors">
                          <Upload size={15} /> Change Image
                        </button>
                        <button type="button" onClick={() => { setPreview(null); setValue("image", undefined as any); if (fileRef.current) fileRef.current.value = ""; }} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-[#D9206E] bg-[#1a1a1a] border border-white/10 hover:bg-[#222] transition-colors">
                          <Trash2 size={15} /> Delete Image
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onFileInput} className="hidden" />
                {errors.image && <p className="text-xs mt-1.5 text-[#D9206E]">{errors.image.message}</p>}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <label className="block text-white text-sm font-semibold mb-3">Caption</label>
                <textarea
                  {...register("caption")}
                  placeholder="Create your caption"
                  rows={4}
                  className={`w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none resize-none transition-all bg-[#111111] focus:ring-1 focus:ring-violet-600 ${errors.caption ? "border border-[#D9206E]" : "border border-transparent"}`}
                />
                {errors.caption && <p className="text-xs mt-1.5 text-[#D9206E]">{errors.caption.message}</p>}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.button
                  type="submit"
                  disabled={isPending}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ opacity: 0.9 }}
                  className="w-full py-3.5 rounded-full text-white text-sm font-bold tracking-wide transition-opacity disabled:opacity-50 bg-gradient-to-br from-[#7C3AED] to-[#6D28D9]"
                >
                  {isPending ? "Sharing..." : "Share"}
                </motion.button>
              </motion.div>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}