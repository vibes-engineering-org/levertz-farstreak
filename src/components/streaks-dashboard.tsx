"use client";

import { useState, useEffect } from "react";
import { useMiniAppSdk } from "~/hooks/use-miniapp-sdk";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Avatar } from "~/components/ui/avatar";
import { Flame, Calendar, TrendingUp, Users } from "lucide-react";

interface UserStreakData {
  currentStreak: number;
  longestStreak: number;
  totalCasts: number;
  lastCastDate: string | null;
}

interface RecentCast {
  hash: string;
  timestamp: string;
  text: string;
  reactions: {
    likes_count: number;
    recasts_count: number;
  };
}

export function StreaksDashboard() {
  const { isSDKLoaded, context } = useMiniAppSdk();
  const user = context?.user;
  const [userStreaks, setUserStreaks] = useState<UserStreakData | null>(null);
  const [recentCasts, setRecentCasts] = useState<RecentCast[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserStreaks = async () => {
    if (!user?.fid) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/streaks/user-casts?fid=${user.fid}`);
      const result = await response.json();

      if (result.success) {
        setUserStreaks(result.data);
        setRecentCasts(result.casts || []);
      } else {
        setError(result.error || 'Failed to fetch streak data');
      }
    } catch (err) {
      setError('Failed to load streak data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSDKLoaded && user?.fid) {
      fetchUserStreaks();
    }
  }, [isSDKLoaded, user?.fid]);

  if (!isSDKLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user?.fid) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-600">
          Please connect your Farcaster account to view streak data.
        </div>
      </Card>
    );
  }

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

  return (
    <div className="space-y-6">
      {/* User Profile Header */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <img
              src={user.pfpUrl || '/default-avatar.png'}
              alt={user.displayName || user.username}
              className="w-full h-full object-cover"
            />
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{user.displayName || user.username}</h1>
            <p className="text-gray-600">@{user.username}</p>
          </div>
          <Button
            onClick={fetchUserStreaks}
            disabled={loading}
            className="ml-auto"
            size="sm"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-red-700">{error}</div>
        </Card>
      )}

      {/* Streak Stats */}
      {userStreaks && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-full">
                <Flame className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Streak</p>
                <p className="text-3xl font-bold text-orange-600">
                  {userStreaks.currentStreak}
                </p>
                <p className="text-xs text-gray-500">days</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Longest Streak</p>
                <p className="text-3xl font-bold text-purple-600">
                  {userStreaks.longestStreak}
                </p>
                <p className="text-xs text-gray-500">days</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Casts</p>
                <p className="text-3xl font-bold text-blue-600">
                  {userStreaks.totalCasts}
                </p>
                <p className="text-xs text-gray-500">last 30 days</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Cast</p>
                <p className="text-lg font-semibold text-green-600">
                  {userStreaks.lastCastDate
                    ? formatRelativeTime(userStreaks.lastCastDate)
                    : 'None'
                  }
                </p>
                <p className="text-xs text-gray-500">activity</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Recent Casts */}
      {recentCasts.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Casts</h2>
          <div className="space-y-4">
            {recentCasts.map((cast) => (
              <div key={cast.hash} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm text-gray-500">{formatRelativeTime(cast.timestamp)}</p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>{cast.reactions.likes_count} likes</span>
                    <span>{cast.reactions.recasts_count} recasts</span>
                  </div>
                </div>
                <p className="text-gray-900">{cast.text}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Streak Tips */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <h3 className="text-lg font-semibold mb-3">Keep Your Streak Going!</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>• Cast at least once per day to maintain your streak</p>
          <p>• You have a 24-hour window between casts</p>
          <p>• Quality content gets more engagement</p>
          <p>• Check back daily to track your progress</p>
        </div>
      </Card>
    </div>
  );
}