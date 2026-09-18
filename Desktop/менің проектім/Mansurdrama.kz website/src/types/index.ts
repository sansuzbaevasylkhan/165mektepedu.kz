export interface Drama {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  posterUrl: string;
  totalEpisodes: number;
  views: number;
  rating: number;
  isPublished: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  episodes?: Episode[];
}

export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  videoUrl: string;
  duration: number;
  thumbnail?: string | null;
  views: number;
  dramaId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  status: "active" | "banned" | "inactive";
  ip?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface WatchHistory {
  id: string;
  userId: string;
  dramaId: string;
  episodeId: string;
  progress: number;
  completed: boolean;
  watchedAt: string | Date;
}
