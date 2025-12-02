// Scraper utilities for fetching engagement data from various platforms
// These are stubs - actual implementation requires platform-specific APIs or scraping

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
export async function fetchGitHubStats(repoUrl: string): Promise<GitHubStats | null> {
  try {
    // Extract owner/repo from URL
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

// Zenn - requires scraping or unofficial API
export async function fetchZennEngagement(url: string): Promise<EngagementData | null> {
  // TODO: Implement Zenn scraping
  // Zenn doesn't have a public API, would need to scrape the page
  console.log('Zenn scraping not implemented:', url);
  return null;
}

// Qiita - has public API
export async function fetchQiitaEngagement(url: string): Promise<EngagementData | null> {
  try {
    // Extract item ID from URL (e.g., https://qiita.com/user/items/abc123)
    const match = url.match(/qiita\.com\/[^/]+\/items\/([^/]+)/);
    if (!match) return null;

    const itemId = match[1];
    const res = await fetch(`https://qiita.com/api/v2/items/${itemId}`);

    if (!res.ok) return null;

    const data = await res.json();
    return {
      likes: data.likes_count ?? 0,
      comments: data.comments_count ?? 0,
      shares: data.stocks_count ?? 0, // Qiita uses "stocks" as bookmarks
    };
  } catch {
    return null;
  }
}

// Note - requires scraping
export async function fetchNoteEngagement(url: string): Promise<EngagementData | null> {
  // TODO: Implement Note scraping
  console.log('Note scraping not implemented:', url);
  return null;
}

// X (Twitter) - requires API access with auth
export async function fetchXEngagement(url: string): Promise<EngagementData | null> {
  // TODO: Implement X API integration (requires API key)
  console.log('X API not implemented:', url);
  return null;
}

// Reddit - has public API (with rate limits)
export async function fetchRedditEngagement(url: string): Promise<EngagementData | null> {
  try {
    // Reddit JSON API - append .json to post URL
    const jsonUrl = url.replace(/\/?$/, '.json');
    const res = await fetch(jsonUrl, {
      headers: {
        'User-Agent': 'open-sen:v1.0.0',
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
