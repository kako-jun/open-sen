// Scraper utilities for fetching engagement data from various platforms
// All implemented scrapers use public APIs that don't require authentication

export interface EngagementData {
  likes: number;
  comments: number;
  shares: number;
}

export interface GitHubStats {
  stars: number;
  forks: number;
  issues: number;
}

// GitHub API (public, no auth needed for basic stats)
// URL format: https://github.com/owner/repo
export async function fetchGitHubStats(repoUrl: string): Promise<GitHubStats | null> {
  try {
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return null;

    const [, owner, repo] = match;
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'open-sen',
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return {
      stars: data.stargazers_count ?? 0,
      forks: data.forks_count ?? 0,
      issues: data.open_issues_count ?? 0,
    };
  } catch {
    return null;
  }
}

// Zenn API (unofficial but public, no auth needed)
// URL format: https://zenn.dev/username/articles/slug
export async function fetchZennEngagement(url: string): Promise<EngagementData | null> {
  try {
    // Extract slug from URL
    const match = url.match(/zenn\.dev\/[^/]+\/articles\/([^/?#]+)/);
    if (!match) return null;

    const slug = match[1];
    const res = await fetch(`https://zenn.dev/api/articles/${slug}`, {
      headers: {
        'User-Agent': 'open-sen',
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const article = data.article;
    if (!article) return null;

    return {
      likes: article.liked_count ?? 0,
      comments: article.comments_count ?? 0,
      shares: article.bookmarked_count ?? 0, // bookmarks as shares
    };
  } catch {
    return null;
  }
}

// Qiita API (public, no auth needed for reading)
// URL format: https://qiita.com/username/items/item_id
export async function fetchQiitaEngagement(url: string): Promise<EngagementData | null> {
  try {
    const match = url.match(/qiita\.com\/[^/]+\/items\/([^/?#]+)/);
    if (!match) return null;

    const itemId = match[1];
    const res = await fetch(`https://qiita.com/api/v2/items/${itemId}`, {
      headers: {
        'User-Agent': 'open-sen',
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return {
      likes: data.likes_count ?? 0,
      comments: data.comments_count ?? 0,
      shares: data.stocks_count ?? 0, // stocks as shares
    };
  } catch {
    return null;
  }
}

// Note API (unofficial v3, no auth needed)
// URL format: https://note.com/username/n/note_key
export async function fetchNoteEngagement(url: string): Promise<EngagementData | null> {
  try {
    // Extract note key from URL
    const match = url.match(/note\.com\/[^/]+\/n\/([^/?#]+)/);
    if (!match) return null;

    const noteKey = match[1];
    const res = await fetch(`https://note.com/api/v3/notes/${noteKey}`, {
      headers: {
        'User-Agent': 'open-sen',
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const note = data.data;
    if (!note) return null;

    return {
      likes: note.likeCount ?? 0,
      comments: note.commentCount ?? 0,
      shares: 0, // Note doesn't expose share count
    };
  } catch {
    return null;
  }
}

// X (Twitter) - UNSUPPORTED
// Requires paid API access with authentication
// See: https://developer.twitter.com/en/docs/twitter-api
export async function fetchXEngagement(_url: string): Promise<EngagementData | null> {
  // X API requires authentication and paid plan
  // Cannot implement without user providing API keys
  return null;
}

// Reddit API (public JSON endpoint, no auth needed)
// URL format: https://www.reddit.com/r/subreddit/comments/post_id/title/
export async function fetchRedditEngagement(url: string): Promise<EngagementData | null> {
  try {
    // Normalize URL and append .json
    const cleanUrl = url.replace(/\/?(\?.*)?$/, '');
    const jsonUrl = `${cleanUrl}.json`;

    const res = await fetch(jsonUrl, {
      headers: {
        'User-Agent': 'open-sen:v1.0.0 (by /u/open-sen)',
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const post = data[0]?.data?.children?.[0]?.data;
    if (!post) return null;

    return {
      likes: post.ups ?? 0,
      comments: post.num_comments ?? 0,
      shares: 0, // Reddit doesn't expose share count
    };
  } catch {
    return null;
  }
}

// Dispatcher function
export async function fetchEngagement(
  platform: string,
  url: string
): Promise<EngagementData | null> {
  switch (platform) {
    case 'zenn':
      return fetchZennEngagement(url);
    case 'qiita':
      return fetchQiitaEngagement(url);
    case 'note':
      return fetchNoteEngagement(url);
    case 'x':
      return fetchXEngagement(url);
    case 'reddit':
      return fetchRedditEngagement(url);
    default:
      return null;
  }
}

// Platform support info
export const PLATFORM_SUPPORT = {
  github: { supported: true, authRequired: false, note: 'Public API' },
  zenn: { supported: true, authRequired: false, note: 'Unofficial API' },
  qiita: { supported: true, authRequired: false, note: 'Public API' },
  note: { supported: true, authRequired: false, note: 'Unofficial API v3' },
  reddit: { supported: true, authRequired: false, note: 'Public JSON endpoint' },
  x: { supported: false, authRequired: true, note: 'Requires paid API plan' },
} as const;
