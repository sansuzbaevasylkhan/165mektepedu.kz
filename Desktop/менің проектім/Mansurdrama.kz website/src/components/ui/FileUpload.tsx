"use client";

import { useState, useRef, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileVideo, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedFile {
  url: string;
  filename: string;
  size: number;
}

interface FileUploadProps {
  accept: "image" | "video" | "both";
  value?: UploadedFile;
  onChange: (file: UploadedFile | null) => void;
  onProgress?: (progress: number) => void;
  endpoint?: string;
  className?: string;
  maxSizeMB?: number;
}

export function FileUpload({
  accept,
  value,
  onChange,
  onProgress,
  endpoint = "/api/upload",
  className,
  maxSizeMB = 500,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptTypes =
    accept === "image"
      ? "image/*"
      : accept === "video"
        ? "video/mp4,video/*"
        : "image/*,video/mp4,video/*";

  const isImage = value?.url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i);

  const upload = async (file: File) => {
    setError(null);
    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > maxSizeMB) {
      setError(`Файл тым үлкен (макс ${maxSizeMB}MB)`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      const subdir = accept === "image" ? "posters" : "videos";
      formData.append("file", file);
      formData.append("subdir", subdir);

      // Use XMLHttpRequest for progress tracking
      const result = await new Promise<UploadedFile>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setProgress(pct);
            onProgress?.(pct);
          }
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch {
              reject(new Error("Invalid response"));
            }
          } else {
            try {
              const data = JSON.parse(xhr.responseText);
              reject(new Error(data.error || "Upload failed"));
            } catch {
              reject(new Error("Upload failed"));
            }
          }
        });
        xhr.addEventListener("error", () => reject(new Error("Network error")));
        xhr.open("POST", endpoint);
        xhr.send(formData);
      });

      onChange(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Жүктеу қатесі";
      setError(msg);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  const clear = () => {
    onChange(null);
    setError(null);
  };

  if (value) {
    return (
      <div className={cn("relative rounded-xl overflow-hidden border border-white/10 bg-white/5", className)}>
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value.url} alt="Preview" className="w-full h-48 object-cover" />
        ) : (
          <div className="flex items-center gap-3 p-4">
            <FileVideo className="h-8 w-8 text-primary-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate font-medium">{value.filename}</p>
              <p className="text-xs text-white/50">{(value.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
        )}
        <button
          type="button"
          onClick={clear}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all min-h-[140px]",
          dragOver
            ? "border-primary-500 bg-primary-500/10"
            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptTypes}
          onChange={handleSelect}
          className="hidden"
        />
        {uploading ? (
          <>
            <div className="h-10 w-10 border-4 border-white/20 border-t-primary-500 rounded-full animate-spin" />
            <p className="text-sm text-white/70">Жүктелуде... {progress}%</p>
            <div className="w-full max-w-xs h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </>
        ) : (
          <>
            {accept === "image" ? (
              <ImageIcon className="h-10 w-10 text-white/40" />
            ) : (
              <Upload className="h-10 w-10 text-white/40" />
            )}
            <p className="text-sm text-white/70 text-center">
              <span className="text-primary-400 font-semibold">Файлды таңдаңыз</span> немесе сүйреп апарыңыз
            </p>
            <p className="text-xs text-white/40">
              {accept === "image" ? "PNG, JPG, WEBP" : "MP4, MOV, AVI"} • макс {maxSizeMB}MB
            </p>
          </>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-rose-400 mt-2"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export type { UploadedFile };
