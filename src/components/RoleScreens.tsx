"use client";

import React, { useState } from "react";
import { useGame } from "@/context/GameContext";

export function PassScreen() {
  const { state, nextPlayerReveal } = useGame();
  
  if (!state.round) return null;
  const currentPlayer = state.players[state.round.currentPlayerIndex];

  return (
    <div className="animate-fade-in" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '40px 20px' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>📱</div>
      <h2 style={{ fontSize: 24, marginBottom: 10 }}>Pass the device to</h2>
      <h1 style={{ fontSize: 36, color: 'var(--primary)', marginBottom: 40 }}>{currentPlayer.name}</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 40 }}>
        Make sure no one else is looking!
      </p>
      
      <button className="btn btn-primary" onClick={nextPlayerReveal}>
        I am {currentPlayer.name}
      </button>
    </div>
  );
}

export function RevealScreen() {
  const { state, setState, startDiscussion } = useGame();
  const [showRole, setShowRole] = useState(false);

  if (!state.round) return null;
  
  const currentPlayer = state.players[state.round.currentPlayerIndex];
  const isImpostor = state.round.impostorIds.includes(currentPlayer.id);
  const isLastPlayer = state.round.currentPlayerIndex === state.players.length - 1;

  const handleNext = () => {
    if (isLastPlayer) {
      startDiscussion();
    } else {
      setState(prev => {
        if (!prev.round) return prev;
        return {
          ...prev,
          status: "pass",
          round: {
            ...prev.round,
            currentPlayerIndex: prev.round.currentPlayerIndex + 1
          }
        };
      });
    }
  };

  return (
    <div className="animate-fade-in" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '40px 20px' }}>
      {!showRole ? (
        <>
          <div style={{ fontSize: 64, marginBottom: 20 }}>👀</div>
          <h2 style={{ fontSize: 24, marginBottom: 40 }}>Tap to reveal your role</h2>
          <button 
            className="btn btn-dark" 
            style={{ padding: '40px 20px', fontSize: 24 }}
            onPointerDown={() => setShowRole(true)}
          >
            TAP & HOLD TO REVEAL
          </button>
        </>
      ) : (
        <div className="animate-fade-in">
          <div style={{ fontSize: 64, marginBottom: 20 }}>
            {isImpostor ? '🥷' : '✅'}
          </div>
          <h2 style={{ fontSize: 24, marginBottom: 10 }}>Your role:</h2>
          
          {isImpostor ? (
            <div style={{ margin: '30px 0' }}>
              <h1 style={{ fontSize: 42, color: 'var(--danger)', fontWeight: 900, textTransform: 'uppercase' }}>
                IMPOSTOR
              </h1>
              <p style={{ marginTop: 10, fontSize: 18, color: 'var(--text-secondary)' }}>
                Try to blend in! The category is <strong style={{color: 'var(--text-primary)'}}>{state.round.category}</strong>.
              </p>
            </div>
          ) : (
            <div style={{ margin: '30px 0' }}>
              <p style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 5 }}>The word is</p>
              <h1 style={{ fontSize: 42, color: 'var(--primary)', fontWeight: 900 }}>
                {state.round.word}
              </h1>
            </div>
          )}

          <button className="btn btn-primary" onClick={handleNext} style={{ marginTop: 40 }}>
            {isLastPlayer ? "START DISCUSSION" : "HIDE & NEXT"}
          </button>
        </div>
      )}
    </div>
  );
}
