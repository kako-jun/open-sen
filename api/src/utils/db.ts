// Database utility functions

import type { Project, Post } from '../types'

/**
 * Check if a project exists and belongs to the given user
 * Returns the project if owned, null otherwise
 */
export async function getOwnedProject(
  db: D1Database,
  projectId: string | number,
  userId: string
): Promise<Project | null> {
  const project = await db.prepare(
    'SELECT * FROM projects WHERE id = ?'
  ).bind(projectId).first() as Project | null

  if (!project || project.owner_id !== userId) {
    return null
  }

  return project
}

/**
 * Check if a post exists and belongs to a project owned by the user
 * Returns the post with owner_id if owned, null otherwise
 */
export async function getOwnedPost(
  db: D1Database,
  postId: string | number,
  userId: string
): Promise<(Post & { owner_id: string }) | null> {
  const result = await db.prepare(`
    SELECT p.*, proj.owner_id
    FROM posts p
    JOIN projects proj ON p.project_id = proj.id
    WHERE p.id = ?
  `).bind(postId).first() as (Post & { owner_id: string }) | null

  if (!result || result.owner_id !== userId) {
    return null
  }

  return result
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Build dynamic UPDATE query from partial data
 * Returns [query, values] for use with bind()
 */
export function buildUpdateQuery(
  table: string,
  data: Record<string, unknown>,
  whereColumn: string,
  whereValue: unknown
): [string, unknown[]] {
  const updates: string[] = []
  const values: unknown[] = []

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`${key} = ?`)
      values.push(value)
    }
  }

  if (updates.length === 0) {
    return ['', []]
  }

  values.push(whereValue)
  const query = `UPDATE ${table} SET ${updates.join(', ')} WHERE ${whereColumn} = ?`

  return [query, values]
}
