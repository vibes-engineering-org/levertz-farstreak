"use client";

import { useState } from "react";
import { PROJECT_TITLE } from "~/lib/constants";
import { StreaksDashboard } from "~/components/streaks-dashboard";
import { GlobalLeaderboard } from "~/components/global-leaderboard";
import { FollowStreaks } from "~/components/follow-streaks";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Flame, Trophy, Heart } from "lucide-react";

type TabType = "dashboard" | "leaderboard" | "follows";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  const tabs = [
    { id: "dashboard", label: "My Streaks", icon: Flame },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "follows", label: "Follow Likes", icon: Heart },
  ];

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 min-h-screen">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {PROJECT_TITLE}
        </h1>
        <p className="text-gray-600">
          Track your Farcaster casting streaks and compete with others
        </p>
      </div>

      {/* Tab Navigation */}
      <Card className="p-2 mb-6">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className="flex-1 gap-2"
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </Card>

      {/* Tab Content */}
      {activeTab === "dashboard" && <StreaksDashboard />}
      {activeTab === "leaderboard" && <GlobalLeaderboard />}
      {activeTab === "follows" && <FollowStreaks />}
    </div>
  );
}
