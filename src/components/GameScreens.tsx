"use client";

import React, { useState, useEffect } from "react";
import { useGame } from "@/context/GameContext";

export function DiscussionScreen() {
  const { state, startVoting } = useGame();
  const [timeLeft, setTimeLeft] = useState(state.settings.timeLimitEnabled ? state.settings.timeLimitSeconds : 0);

  useEffect(() => {
    if (!state.settings.timeLimitEnabled || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [state.settings.timeLimitEnabled, timeLeft]);

  return (
    <div className="animate-fade-in" style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>💬</div>
      <h2 style={{ fontSize: 28, marginBottom: 10 }}>Discussion Time!</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 40 }}>
        Ask questions and find the impostor.
      </p>

      {state.settings.timeLimitEnabled && (
        <div style={{ fontSize: 48, fontWeight: 900, marginBottom: 40, color: timeLeft <= 10 ? 'var(--danger)' : 'var(--primary)' }}>
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      )}

      <button className="btn btn-primary" onClick={startVoting}>
        GO TO VOTING
      </button>
    </div>
  );
}

export function VotingScreen() {
  const { state, submitVote, finishVoting } = useGame();
  
  if (!state.round) return null;

  // We need to loop through each player to cast their vote.
  // We'll track who is currently voting.
  const voters = state.players.filter(p => !state.round?.eliminatedIds.includes(p.id));
  const currentVoterIndex = Object.keys(state.round.votes).length;
  
  if (currentVoterIndex >= voters.length) {
    // All votes cast
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🗳️</div>
        <h2 style={{ fontSize: 28, marginBottom: 40 }}>All votes cast!</h2>
        <button className="btn btn-primary" onClick={finishVoting}>
          REVEAL RESULTS
        </button>
      </div>
    );
  }

  const currentVoter = voters[currentVoterIndex];

  return (
    <div className="animate-fade-in" style={{ padding: '20px', paddingBottom: 100 }}>
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <h2 style={{ fontSize: 24, marginBottom: 10 }}>Vote for the Impostor</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Pass to <strong>{currentVoter.name}</strong> to vote</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        {state.players
          .filter(p => p.id !== currentVoter.id && !state.round?.eliminatedIds.includes(p.id))
          .map(player => (
          <button 
            key={player.id}
            className="card"
            style={{ 
              width: '100%', 
              textAlign: 'left', 
              fontSize: 20, 
              fontWeight: 700, 
              border: 'none', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 15
            }}
            onClick={() => submitVote(currentVoter.id, player.id)}
          >
            <div style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              👤
            </div>
            {player.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function EliminationRevealScreen() {
  const { state, continueEliminationRound } = useGame();

  if (!state.round) return null;

  return (
    <div className="animate-fade-in" style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>📢</div>
      <h2 style={{ fontSize: 24, marginBottom: 40, lineHeight: 1.5 }}>
        {state.round.eliminationMessage}
      </h2>
      
      <button className="btn btn-primary" onClick={continueEliminationRound}>
        CONTINUE
      </button>
    </div>
  );
}

export function ResultsScreen() {
  const { state, nextRound, resetGame } = useGame();
  
  if (!state.round) return null;

  const impostors = state.players.filter(p => state.round?.impostorIds.includes(p.id));

  // Sort players by score
  const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);

  return (
    <div className="animate-fade-in" style={{ padding: '20px', paddingBottom: 100 }}>
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <div style={{ fontSize: 64, marginBottom: 10 }}>🎭</div>
        <h2 style={{ fontSize: 28, marginBottom: 5 }}>The Word Was</h2>
        <h1 style={{ fontSize: 36, color: 'var(--primary)', marginBottom: 20 }}>{state.round.word}</h1>
        
        <h3 style={{ color: 'var(--text-secondary)' }}>
          The Impostor{impostors.length > 1 ? 's were' : ' was'}:
        </h3>
        <h2 style={{ fontSize: 28, color: 'var(--danger)', marginTop: 5 }}>
          {impostors.map(i => i.name).join(', ')}
        </h2>
      </div>

        {state.settings.mode === 'elimination' ? (
          <div style={{ marginTop: 30 }}>
            <h1 style={{ fontSize: 42, color: state.round.winners === 'crew' ? 'var(--primary)' : 'var(--danger)', fontWeight: 900, textTransform: 'uppercase' }}>
              {state.round.winners === 'crew' ? "Crewmates Win!" : "Impostors Win!"}
            </h1>
          </div>
        ) : (
          <div className="card" style={{ marginTop: 30 }}>
            <div className="card-header">🏆 Leaderboard</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              {sortedPlayers.map((player, index) => (
                <div key={player.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: index < sortedPlayers.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 700 }}>
                    <span style={{ color: 'var(--text-secondary)', width: 24 }}>#{index + 1}</span>
                    {player.name}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)' }}>
                    {player.score} <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginTop: 40 }}>
        <button className="btn btn-primary" onClick={nextRound}>
          PLAY NEXT ROUND
        </button>
        <button className="btn btn-secondary" onClick={resetGame}>
          END GAME (RESET)
        </button>
      </div>
    </div>
  );
}
