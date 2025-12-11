import { NextRequest, NextResponse } from 'next/server';

interface NeynarFollowingResponse {
  users: Array<{
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
  }>;
}

interface NeynarReactionsResponse {
  reactions: Array<{
    reaction_type: string;
    hash: string;
    cast: {
      hash: string;
      timestamp: string;
      author: {
        fid: number;
        username: string;
        display_name: string;
      };
    };
  }>;
}

interface FollowStreak {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  streak: number;
  totalCasts: number;
  likedCasts: number;
  lastLikedDate: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userFid = searchParams.get('fid');

    if (!userFid) {
      return NextResponse.json({ error: 'FID is required' }, { status: 400 });
    }

    const neynarApiKey = process.env.NEYNAR_API_KEY;
    if (!neynarApiKey) {
      return NextResponse.json({ error: 'Neynar API key not configured' }, { status: 500 });
    }

    // Get user's following list
    const followingResponse = await fetch(
      `https://api.neynar.com/v1/farcaster/user-following?fid=${userFid}&limit=150`,
      {
        headers: {
          'api_key': neynarApiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!followingResponse.ok) {
      throw new Error(`Failed to fetch following list: ${followingResponse.status}`);
    }

    const followingData: NeynarFollowingResponse = await followingResponse.json();

    // Get user's recent reactions (likes)
    const reactionsResponse = await fetch(
      `https://api.neynar.com/v2/farcaster/reactions/user?fid=${userFid}&reaction_type=like&limit=150`,
      {
        headers: {
          'api_key': neynarApiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!reactionsResponse.ok) {
      throw new Error(`Failed to fetch reactions: ${reactionsResponse.status}`);
    }

    const reactionsData: NeynarReactionsResponse = await reactionsResponse.json();

    // Process follow streaks
    const followStreaks: FollowStreak[] = [];
    const followingFids = new Set(followingData.users.map(u => u.fid));

    // Group reactions by author (only for followed users)
    const reactionsByAuthor = new Map<number, any[]>();

    reactionsData.reactions
      .filter(reaction => followingFids.has(reaction.cast.author.fid))
      .forEach(reaction => {
        const authorFid = reaction.cast.author.fid;
        if (!reactionsByAuthor.has(authorFid)) {
          reactionsByAuthor.set(authorFid, []);
        }
        reactionsByAuthor.get(authorFid)!.push(reaction);
      });

    // Calculate streaks for each followed user
    for (const followedUser of followingData.users) {
      const userReactions = reactionsByAuthor.get(followedUser.fid) || [];

      if (userReactions.length === 0) {
        followStreaks.push({
          fid: followedUser.fid,
          username: followedUser.username,
          display_name: followedUser.display_name,
          pfp_url: followedUser.pfp_url,
          streak: 0,
          totalCasts: 0,
          likedCasts: 0,
          lastLikedDate: null,
        });
        continue;
      }

      // Get the user's recent casts to compare with likes
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const startTime = Math.floor(sevenDaysAgo.getTime() / 1000);

        const castsResponse = await fetch(
          `https://api.neynar.com/v2/farcaster/feed/user/casts?fid=${followedUser.fid}&limit=50&include_replies=false&start_time=${startTime}`,
          {
            headers: {
              'api_key': neynarApiKey,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!castsResponse.ok) {
          throw new Error(`Failed to fetch casts for ${followedUser.username}`);
        }

        const castsData = await castsResponse.json();
        const userCasts = castsData.casts || [];

        // Create a set of liked cast hashes
        const likedHashes = new Set(userReactions.map(r => r.cast.hash));

        // Sort casts by timestamp (newest first)
        const sortedCasts = userCasts.sort((a: any, b: any) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        // Calculate streak (consecutive liked casts from most recent)
        let streak = 0;
        for (const cast of sortedCasts) {
          if (likedHashes.has(cast.hash)) {
            streak++;
          } else {
            break;
          }
        }

        // Get last liked date
        const sortedReactions = userReactions.sort((a, b) =>
          new Date(b.cast.timestamp).getTime() - new Date(a.cast.timestamp).getTime()
        );

        followStreaks.push({
          fid: followedUser.fid,
          username: followedUser.username,
          display_name: followedUser.display_name,
          pfp_url: followedUser.pfp_url,
          streak,
          totalCasts: userCasts.length,
          likedCasts: userReactions.length,
          lastLikedDate: sortedReactions[0]?.cast.timestamp || null,
        });

      } catch (castError) {
        console.error(`Error processing casts for ${followedUser.username}:`, castError);
        followStreaks.push({
          fid: followedUser.fid,
          username: followedUser.username,
          display_name: followedUser.display_name,
          pfp_url: followedUser.pfp_url,
          streak: 0,
          totalCasts: 0,
          likedCasts: userReactions.length,
          lastLikedDate: userReactions[0]?.cast.timestamp || null,
        });
      }
    }

    // Sort by streak (desc), then by liked casts (desc)
    followStreaks.sort((a, b) => {
      if (b.streak !== a.streak) return b.streak - a.streak;
      return b.likedCasts - a.likedCasts;
    });

    return NextResponse.json({
      success: true,
      data: followStreaks.filter(s => s.streak > 0 || s.likedCasts > 0).slice(0, 20), // Top 20 with activity
    });

  } catch (error) {
    console.error('Error fetching follow likes streaks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch follow likes data' },
      { status: 500 }
    );
  }
}