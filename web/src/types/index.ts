// Shared type definitions for open-sen

export interface Post {
  id: number;
  platform: string;
  url: string;
  posted_at: string;
}

export interface GithubStat {
  date: string;
  stars: number;
  forks: number;
  issues?: number;
}

export interface PostEngagement {
  platform: string;
  url: string;
  date: string;
  likes: number;
  comments: number;
  shares: number;
}

export interface Project {
  id: number;
  name: string;
  description?: string | null;
  github_url: string | null;
  owner_id: string;
  created_at: string;
  posts?: Post[];
  github?: GithubStat[];
  postEngagements?: PostEngagement[];
}

export interface EngagementData {
  github: GithubStat[];
  posts: PostEngagement[];
}
