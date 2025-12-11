import { NextRequest, NextResponse } from 'next/server';

interface NeynarFeedResponse {
  casts: Array<{
    hash: string;
    timestamp: string;
    author: {
      fid: number;
      username: string;
      display_name: string;
      pfp_url: string;
      follower_count: number;
    };
  }>;
}

interface LeaderboardEntry {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  follower_count: number;
  currentStreak: number;
  longestStreak: number;
  totalCasts: number;
}

function calculateUserStreak(casts: any[]): { currentStreak: number; longestStreak: number } {
  if (casts.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Group casts by date
  const castsByDate = new Map<string, any[]>();
  casts.forEach(cast => {
    const date = new Date(cast.timestamp).toISOString().split('T')[0];
    if (!castsByDate.has(date)) {
      castsByDate.set(date, []);
    }
    castsByDate.get(date)!.push(cast);
  });

  const dates = Array.from(castsByDate.keys()).sort().reverse();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Calculate current streak
  let currentStreak = 0;
  let startDate = castsByDate.has(today) ? today : yesterday;
  let currentDate = new Date(startDate);

  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    if (castsByDate.has(dateStr)) {
      currentStreak++;
    } else {
      break;
    }
    currentDate.setDate(currentDate.getDate() - 1);
  }

  // Calculate longest streak
  let longestStreak = 0;
  for (let i = 0; i < dates.length; i++) {
    let tempStreak = 1;
    for (let j = i + 1; j < dates.length; j++) {
      const currentDate = new Date(dates[j - 1]);
      const nextDate = new Date(dates[j]);
      const daysDiff = (currentDate.getTime() - nextDate.getTime()) / (24 * 60 * 60 * 1000);

      if (daysDiff === 1) {
        tempStreak++;
      } else {
        break;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
}

export async function GET(request: NextRequest) {
  try {
    const neynarApiKey = process.env.NEYNAR_API_KEY;
    if (!neynarApiKey) {
      return NextResponse.json({ error: 'Neynar API key not configured' }, { status: 500 });
    }

    // Get global feed to find active users
    const response = await fetch(
      'https://api.neynar.com/v2/farcaster/feed?feed_type=filter&filter_type=global_trending&limit=100',
      {
        headers: {
          'api_key': neynarApiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status}`);
    }

    const feedData: NeynarFeedResponse = await response.json();

    // Group casts by author to get unique users
    const userCasts = new Map<number, any[]>();
    feedData.casts.forEach(cast => {
      const fid = cast.author.fid;
      if (!userCasts.has(fid)) {
        userCasts.set(fid, []);
      }
      userCasts.get(fid)!.push(cast);
    });

    // Calculate streaks for each user
    const leaderboard: LeaderboardEntry[] = [];

    for (const [fid, casts] of userCasts.entries()) {
      if (casts.length === 0) continue;

      const author = casts[0].author;

      // Fetch more detailed cast history for this user (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startTime = Math.floor(thirtyDaysAgo.getTime() / 1000);

      try {
        const userCastsResponse = await fetch(
          `https://api.neynar.com/v2/farcaster/feed/user/casts?fid=${fid}&limit=150&include_replies=false&start_time=${startTime}`,
          {
            headers: {
              'api_key': neynarApiKey,
              'Content-Type': 'application/json',
            },
          }
        );

        if (userCastsResponse.ok) {
          const userCastsData = await userCastsResponse.json();
          const { currentStreak, longestStreak } = calculateUserStreak(userCastsData.casts);

          if (currentStreak > 0 || longestStreak > 0) {
            leaderboard.push({
              fid: author.fid,
              username: author.username,
              display_name: author.display_name,
              pfp_url: author.pfp_url,
              follower_count: author.follower_count,
              currentStreak,
              longestStreak,
              totalCasts: userCastsData.casts.length,
            });
          }
        }
      } catch (userError) {
        console.error(`Error fetching casts for user ${fid}:`, userError);
        // Continue with other users
      }
    }

    // Sort by current streak (desc), then longest streak (desc), then follower count (desc)
    leaderboard.sort((a, b) => {
      if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
      if (b.longestStreak !== a.longestStreak) return b.longestStreak - a.longestStreak;
      return b.follower_count - a.follower_count;
    });

    // Return top 25
    return NextResponse.json({
      success: true,
      data: leaderboard.slice(0, 25),
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}