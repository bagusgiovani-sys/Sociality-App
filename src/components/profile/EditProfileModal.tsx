"use client";

import { useUpdateMe, useMe } from "@/hooks/useMe";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, ProfileFormData } from "@/schemas/profile.schema";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ open, onClose }: Props) {
  const { data: meData } = useMe();
  const user = meData?.profile ?? meData;
  const { mutate: updateMe, isPending } = useUpdateMe();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (user && open) {
      reset({ name: user.name ?? "", username: user.username ?? "", phone: user.phone ?? "", bio: (user as any).bio ?? "" });
      setAvatarPreview(user.avatarUrl ?? null);
      setAvatarFile(null);
    }
  }, [user, open]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onSubmit = (data: ProfileFormData) => {
    updateMe(
      { ...data, avatar: avatarFile ?? undefined },
      {
        onSuccess: () => { toast.success("Profile updated!", { position: "top-center" }); onClose(); },
        onError: () => { toast.error("Failed to update profile", { position: "top-center" }); },
      }
    );
  };

  const inputBase = "w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-violet-600 transition-all bg-[#111111]";
  const inputCls = (hasError: boolean) => `${inputBase} ${hasError ? "border border-[#D9206E]" : "border border-transparent"}`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#0a0a0a]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="sticky top-0 z-10 flex items-center gap-3 px-4 h-14 border-b border-white/8 bg-[#0a0a0a] shrink-0"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <button onClick={onClose} className="text-white hover:opacity-70 transition-opacity">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-white font-bold text-base">Edit Profile</h1>
          </motion.div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
            <motion.div
              className="flex flex-col items-center mb-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-800 mb-3">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => fileRef.current?.click()} className="px-5 py-1.5 rounded-full text-sm font-medium text-white border border-zinc-700 hover:border-zinc-500 transition-colors">
                Change Photo
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </motion.div>

            <div className="space-y-4">
              {[
                { label: "Name", key: "name", type: "text" },
                { label: "Username", key: "username", type: "text" },
                { label: "Number Phone", key: "phone", type: "tel" },
              ].map(({ label, key, type }, i) => (
                <motion.div key={key} className="space-y-1.5" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                  <label className="block text-white text-sm font-medium">{label}</label>
                  <input {...register(key as any)} type={type} className={inputCls(!!(errors as any)[key])} />
                  {(errors as any)[key] && <p className="text-xs text-[#D9206E]">{(errors as any)[key].message}</p>}
                </motion.div>
              ))}

              <motion.div className="space-y-1.5" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                <label className="block text-white text-sm font-medium">Email</label>
                <input value={user?.email ?? ""} readOnly className={`${inputBase} border border-transparent opacity-60 cursor-not-allowed`} />
              </motion.div>

              <motion.div className="space-y-1.5" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                <label className="block text-white text-sm font-medium">Bio</label>
                <textarea {...register("bio")} rows={3} className={`${inputCls(!!errors.bio)} resize-none`} />
                {errors.bio && <p className="text-xs text-[#D9206E]">{errors.bio.message}</p>}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                <motion.button
                  type="submit"
                  disabled={isPending}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ opacity: 0.9 }}
                  className="w-full py-3.5 rounded-full text-white text-sm font-bold tracking-wide mt-2 transition-opacity disabled:opacity-50 bg-gradient-to-br from-[#7C3AED] to-[#6D28D9]"
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </motion.button>
              </motion.div>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}