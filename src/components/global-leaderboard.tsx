"use client";

import { useState, useEffect } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Avatar } from "~/components/ui/avatar";
import { Trophy, Medal, Award, Flame, TrendingUp, Users } from "lucide-react";

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

export function GlobalLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/streaks/leaderboard');
      const result = await response.json();

      if (result.success) {
        setLeaderboard(result.data);
      } else {
        setError(result.error || 'Failed to fetch leaderboard');
      }
    } catch (err) {
      setError('Failed to load leaderboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-orange-500" />;
    return <span className="text-lg font-semibold text-gray-600">#{rank}</span>;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="w-7 h-7 text-yellow-500" />
          Global Streak Leaderboard
        </h2>
        <Button
          onClick={fetchLeaderboard}
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

      {loading && leaderboard.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading leaderboard...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No streak data available. Try refreshing to load the latest data.
            </div>
          ) : (
            leaderboard.map((entry, index) => {
              const rank = index + 1;
              return (
                <div
                  key={entry.fid}
                  className={`p-4 rounded-lg border transition-all ${
                    rank <= 3
                      ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-8 flex justify-center">
                      {getRankIcon(rank)}
                    </div>

                    {/* Avatar and User Info */}
                    <div className="flex items-center gap-3 flex-grow">
                      <Avatar className="w-12 h-12">
                        <img
                          src={entry.pfp_url || '/default-avatar.png'}
                          alt={entry.display_name || entry.username}
                          className="w-full h-full object-cover"
                        />
                      </Avatar>

                      <div className="flex-grow">
                        <h3 className="font-semibold text-gray-900">
                          {entry.display_name || entry.username}
                        </h3>
                        <p className="text-sm text-gray-600">@{entry.username}</p>
                      </div>

                      {/* Followers */}
                      <div className="hidden sm:flex items-center gap-1 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        {formatNumber(entry.follower_count)}
                      </div>
                    </div>

                    {/* Streak Stats */}
                    <div className="flex gap-6 text-center">
                      <div>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Flame className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="text-xl font-bold text-orange-600">
                          {entry.currentStreak}
                        </div>
                        <div className="text-xs text-gray-500">current</div>
                      </div>

                      <div>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingUp className="w-4 h-4 text-purple-500" />
                        </div>
                        <div className="text-xl font-bold text-purple-600">
                          {entry.longestStreak}
                        </div>
                        <div className="text-xs text-gray-500">longest</div>
                      </div>

                      <div className="hidden md:block">
                        <div className="text-sm font-medium text-gray-700 mb-1">
                          {entry.totalCasts}
                        </div>
                        <div className="text-xs text-gray-500">casts</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Leaderboard Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">How Rankings Work</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Ranked by current streak first, then longest streak</p>
          <p>• Updated based on global trending feed activity</p>
          <p>• Shows top 25 users with active streaks</p>
          <p>• Follower count used as tiebreaker</p>
        </div>
      </div>
    </Card>
  );
}