"use client";

import { useState, useEffect } from "react";
import { useMiniAppSdk } from "~/hooks/use-miniapp-sdk";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Avatar } from "~/components/ui/avatar";
import { Heart, MessageCircle, Users, Calendar } from "lucide-react";

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

export function FollowStreaks() {
  const { isSDKLoaded, context } = useMiniAppSdk();
  const user = context?.user;
  const [followStreaks, setFollowStreaks] = useState<FollowStreak[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFollowStreaks = async () => {
    if (!user?.fid) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/streaks/follow-likes?fid=${user.fid}`);
      const result = await response.json();

      if (result.success) {
        setFollowStreaks(result.data);
      } else {
        setError(result.error || 'Failed to fetch follow streaks');
      }
    } catch (err) {
      setError('Failed to load follow streaks data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSDKLoaded && user?.fid) {
      fetchFollowStreaks();
    }
  }, [isSDKLoaded, user?.fid]);

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return 'Just now';
    }
  };

  if (!isSDKLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (!user?.fid) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-600">
          Please connect your Farcaster account to view follow streaks.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="w-7 h-7 text-pink-500" />
          Follow Like Streaks
        </h2>
        <Button
          onClick={fetchFollowStreaks}
          disabled={loading}
          size="sm"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg mb-6">
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {loading && followStreaks.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
          <span className="ml-3 text-gray-600">Loading follow streaks...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {followStreaks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No Like Streaks Found</p>
              <p className="text-sm">Start liking posts from people you follow to build streaks!</p>
            </div>
          ) : (
            followStreaks.map((streak) => (
              <div
                key={streak.fid}
                className={`p-4 rounded-lg border transition-all ${
                  streak.streak > 0
                    ? 'bg-gradient-to-r from-pink-50 to-red-50 border-pink-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar and User Info */}
                  <div className="flex items-center gap-3 flex-grow">
                    <Avatar className="w-12 h-12">
                      <img
                        src={streak.pfp_url || '/default-avatar.png'}
                        alt={streak.display_name || streak.username}
                        className="w-full h-full object-cover"
                      />
                    </Avatar>

                    <div className="flex-grow">
                      <h3 className="font-semibold text-gray-900">
                        {streak.display_name || streak.username}
                      </h3>
                      <p className="text-sm text-gray-600">@{streak.username}</p>
                    </div>
                  </div>

                  {/* Streak Stats */}
                  <div className="flex gap-6 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Heart className="w-4 h-4 text-pink-500" />
                      </div>
                      <div className={`text-xl font-bold ${
                        streak.streak > 0 ? 'text-pink-600' : 'text-gray-400'
                      }`}>
                        {streak.streak}
                      </div>
                      <div className="text-xs text-gray-500">streak</div>
                    </div>

                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <MessageCircle className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="text-lg font-medium text-blue-600">
                        {streak.likedCasts}/{streak.totalCasts}
                      </div>
                      <div className="text-xs text-gray-500">liked</div>
                    </div>

                    {streak.lastLikedDate && (
                      <div className="hidden sm:block">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Calendar className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="text-sm font-medium text-green-600">
                          {formatRelativeTime(streak.lastLikedDate)}
                        </div>
                        <div className="text-xs text-gray-500">last like</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Streak Description */}
                <div className="mt-3 pl-15">
                  <p className="text-sm text-gray-600">
                    {streak.streak > 0 ? (
                      <span className="text-pink-700">
                        <strong>{streak.streak} consecutive casts liked!</strong> You&apos;re on a roll with @{streak.username}&apos;s content.
                      </span>
                    ) : streak.likedCasts > 0 ? (
                      <span>
                        Liked {streak.likedCasts} of their last {streak.totalCasts} casts, but no current streak.
                      </span>
                    ) : (
                      <span>
                        No recent likes on their {streak.totalCasts} recent casts.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Follow Streaks Info */}
      <div className="mt-6 p-4 bg-pink-50 rounded-lg">
        <h4 className="font-semibold text-pink-900 mb-2">How Like Streaks Work</h4>
        <div className="text-sm text-pink-800 space-y-1">
          <p>• Like consecutive recent casts from people you follow</p>
          <p>• Streak breaks if you miss liking their latest cast</p>
          <p>• Only counts main casts, not replies</p>
          <p>• Shows your engagement with your network</p>
        </div>
      </div>
    </Card>
  );
}