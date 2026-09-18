import { z } from "zod";

export const loginSchema = z.object({
  password: z.string().min(1, "Құпия сөзді енгізіңіз"),
});

export const dramaSchema = z.object({
  title: z.string().min(1, "Дорама атын енгізіңіз").max(200),
  slug: z
    .string()
    .min(1, "Slug міндетті")
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Тек кіші әріптер, сандар және сызықша"),
  description: z.string().max(2000).optional(),
  posterUrl: z.string().min(1, "Постер жүктеңіз"),
  totalEpisodes: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(true),
  episodes: z
    .array(
      z.object({
        episodeNumber: z.number().int().min(1),
        title: z.string().min(1),
        videoUrl: z.string().min(1, "Видео URL міндетті"),
        duration: z.number().int().min(0).default(0),
      })
    )
    .default([]),
});

export const episodeSchema = z.object({
  episodeNumber: z.number().int().min(1),
  title: z.string().min(1),
  videoUrl: z.string().min(1),
  duration: z.number().int().min(0).default(0),
});

export const userSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  avatar: z.string().optional(),
  status: z.enum(["active", "banned", "inactive"]).default("active"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type DramaInput = z.infer<typeof dramaSchema>;
export type EpisodeInput = z.infer<typeof episodeSchema>;
export type UserInput = z.infer<typeof userSchema>;
