// Shared type definitions for open-sen API

import type { Context } from 'hono'

// Database bindings
export type Bindings = {
  DB: D1Database
}

// Context variables
export type Variables = {
  userId: string | null
}

// App context type
export type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>

// Database models
export interface User {
  id: string
  bio: string | null
  url: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: number
  owner_id: string
  name: string
  description: string | null
  url: string | null
  github_url: string | null
  is_public: number
  created_at: string
}

export interface Post {
  id: number
  project_id: number
  platform: string
  url: string
  posted_at: string
  created_at: string
}

export interface Engagement {
  id: number
  post_id: number
  date: string
  likes: number
  comments: number
  shares: number
  created_at: string
}

export interface GithubStats {
  id: number
  project_id: number
  date: string
  stars: number
  forks: number
  issues: number
  created_at: string
}

// API request/response types
export interface CreateProjectRequest {
  name: string
  description?: string
  url?: string
  github_url?: string
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
  url?: string
  github_url?: string
}

export interface CreatePostRequest {
  project_id: number
  platform: string
  url: string
  posted_at?: string
}

export interface UpdateUserRequest {
  bio?: string
  url?: string
}
