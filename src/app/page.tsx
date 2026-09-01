"use client";

import { useGame } from "@/context/GameContext";
import { SetupScreen } from "@/components/SetupScreen";
import { PassScreen, RevealScreen } from "@/components/RoleScreens";
import { DiscussionScreen, VotingScreen, ResultsScreen, EliminationRevealScreen } from "@/components/GameScreens";
import { useEffect, useState } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { state } = useGame();

  // Prevent hydration mismatch for localStorage
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)' }} />;
  }

  const renderScreen = () => {
    switch (state.status) {
      case "setup":
        return <SetupScreen />;
      case "pass":
        return <PassScreen />;
      case "reveal":
        return <RevealScreen />;
      case "discussion":
        return <DiscussionScreen />;
      case "voting":
        return <VotingScreen />;
      case "elimination_reveal":
        return <EliminationRevealScreen />;
      case "results":
        return <ResultsScreen />;
      default:
        return <SetupScreen />;
    }
  };

  return (
    <main className="container">
      <header style={{ padding: '20px 0', textAlign: 'center' }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, textTransform: 'uppercase', letterSpacing: -1.5 }}>
          WHO<span style={{ color: 'var(--primary)' }}>?</span>
        </h1>
      </header>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {renderScreen()}
      </div>
    </main>
  );
}
