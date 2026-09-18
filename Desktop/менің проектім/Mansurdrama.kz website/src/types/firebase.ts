/**
 * Firebase Realtime Database деректерінің TypeScript типтері.
 *
 * Prisma+SQLite негізгі дерекқор болып қала береді, ал RTDB
 * real-time қабат — көрулер, live статистика, қолданушы әрекеттері.
 *
 * Деректер RTDB-де осы пішінде сақталады:
 *   /views/dramas/{dramaId}: number
 *   /plays/episodes/{dramaId}/{episodeId}: number
 *   /stats/total: { dramas, episodes, users, views, lastUpdated }
 *   /recent/{pushId}: { type, dramaId?, episodeId?, ts }
 */

/** Драманың жалпы көрулері (RTDB-де сақталады, Prisma-мен қатар) */
export interface LiveViews {
  total: number;
  lastViewedAt: number; // unix ms
}

/** Бір эпизодтың ойнату есептегіші */
export interface LiveEpisodePlays {
  total: number;
  lastPlayedAt: number;
}

/** Жалпы сайт статистикасы (админ панелі үшін) */
export interface LiveSiteStats {
  dramas: number;
  episodes: number;
  users: number;
  views: number;
  lastUpdated: number;
}

/** Қолданушы әрекеттерінің логы (аналитика, audit) */
export interface UserEvent {
  type: "view" | "play" | "search" | "login";
  dramaId?: string;
  episodeId?: string;
  query?: string;
  ts: number; // unix ms
  // RTDB push() арқылы қосылған кезде pushId-ді қайтарамыз
  pushId?: string;
}

/** Track endpoint-ке жіберілетін сұраныс пішіні */
export type TrackEventType = "view" | "play";

export interface TrackRequest {
  type: TrackEventType;
  dramaId: string;
  episodeId?: string;
}

export interface TrackResponse {
  success: boolean;
  error?: string;
  data?: {
    newTotal?: number;
  };
}
