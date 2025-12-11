import { NextRequest, NextResponse } from 'next/server';

interface NeynarCast {
  hash: string;
  timestamp: string;
  author: {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
  };
  text: string;
  reactions: {
    likes_count: number;
    recasts_count: number;
  };
}

interface NeynarCastsResponse {
  casts: NeynarCast[];
  next?: {
    cursor: string;
  };
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalCasts: number;
  lastCastDate: string | null;
}

function calculateStreaks(casts: NeynarCast[]): StreakData {
  if (casts.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCasts: 0,
      lastCastDate: null,
    };
  }

  // Sort casts by timestamp (newest first)
  const sortedCasts = casts.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const now = new Date();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Group casts by date (UTC)
  const castsByDate = new Map<string, NeynarCast[]>();

  sortedCasts.forEach(cast => {
    const date = new Date(cast.timestamp).toISOString().split('T')[0];
    if (!castsByDate.has(date)) {
      castsByDate.set(date, []);
    }
    castsByDate.get(date)!.push(cast);
  });

  const dates = Array.from(castsByDate.keys()).sort().reverse(); // newest first

  // Calculate current streak (from today backwards)
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Start checking from today or yesterday if no casts today
  let startDate = castsByDate.has(today) ? today : yesterday;
  let currentDate = new Date(startDate);

  // Calculate current streak
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
  tempStreak = 0;
  for (let i = 0; i < dates.length; i++) {
    tempStreak = 1;

    // Look ahead for consecutive days
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

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    totalCasts: casts.length,
    lastCastDate: sortedCasts[0]?.timestamp || null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');

    if (!fid) {
      return NextResponse.json({ error: 'FID is required' }, { status: 400 });
    }

    const neynarApiKey = process.env.NEYNAR_API_KEY;
    if (!neynarApiKey) {
      return NextResponse.json({ error: 'Neynar API key not configured' }, { status: 500 });
    }

    // Fetch user's casts from the last 30 days to calculate streaks
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startTime = Math.floor(thirtyDaysAgo.getTime() / 1000);

    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/feed/user/casts?fid=${fid}&limit=150&include_replies=false&start_time=${startTime}`,
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

    const data: NeynarCastsResponse = await response.json();
    const streakData = calculateStreaks(data.casts);

    return NextResponse.json({
      success: true,
      data: streakData,
      casts: data.casts.slice(0, 10), // Return latest 10 casts for display
    });

  } catch (error) {
    console.error('Error fetching user casts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user cast data' },
      { status: 500 }
    );
  }
}