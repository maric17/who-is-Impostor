"use client";

import React, { useState } from "react";
import { useGame } from "@/context/GameContext";
import { CATEGORIES } from "@/lib/words";

export function SetupScreen() {
  const { state, setState, addPlayer, removePlayer, updatePlayerName, startGame } = useGame();
  
  const [newPlayerName, setNewPlayerName] = useState("");

  const handleStartGame = () => {
    if (state.players.length < 3) {
      alert("Need at least 3 players");
      return;
    }
    if (state.settings.categories.length === 0) {
      alert("Select at least one category");
      return;
    }

    // 1. Pick a random category
    const selectedCategoryIds = state.settings.categories;
    const randomCategoryId = selectedCategoryIds[Math.floor(Math.random() * selectedCategoryIds.length)];
    const category = CATEGORIES.find((c) => c.id === randomCategoryId)!;

    // 2. Pick a random word
    const randomWord = category.words[Math.floor(Math.random() * category.words.length)];

    // 3. Pick impostors
    let impostorIds: string[] = [];
    const playerIds = state.players.map((p) => p.id);
    const shuffledIds = [...playerIds];
    for (let i = shuffledIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]];
    }
    impostorIds = shuffledIds.slice(0, state.settings.impostorCount);

    startGame(randomWord, category.name, impostorIds);
  };

  const handleToggleCategory = (id: string) => {
    setState((prev) => {
      const isSelected = prev.settings.categories.includes(id);
      return {
        ...prev,
        settings: {
          ...prev.settings,
          categories: isSelected
            ? prev.settings.categories.filter((c) => c !== id)
            : [...prev.settings.categories, id],
        },
      };
    });
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 100 }}>
      {/* Game Mode (Dummy) */}
      <div className="card">
        <div className="card-header">🎮 Game Mode</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            className={`btn ${state.settings.mode === 'classic' ? 'btn-dark' : 'btn-secondary'}`} 
            style={{ flex: 1, padding: 12, fontSize: 16 }}
            onClick={() => setState(prev => ({...prev, settings: {...prev.settings, mode: 'classic'}}))}
          >
            👥 Classic
          </button>
          <button 
            className={`btn ${state.settings.mode === 'elimination' ? 'btn-dark' : 'btn-secondary'}`} 
            style={{ flex: 1, padding: 12, fontSize: 16 }}
            onClick={() => setState(prev => ({...prev, settings: {...prev.settings, mode: 'elimination'}}))}
          >
            ⚔️ Elimination
          </button>
        </div>
        <p style={{ marginTop: 15, fontSize: 14, color: 'var(--text-secondary)' }}>
          {state.settings.mode === 'classic' 
            ? "Classic: Gather in the same room. Impostor wins if not caught." 
            : "Elimination: Vote players out one by one until the Impostors are caught."}
        </p>
      </div>

      {/* Players */}
      <div className="card">
        <div className="card-header">🖐️ Players ({state.players.length})</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 15 }}>
          {state.players.map((p) => (
            <div key={p.id} className="tag active" style={{ display: 'flex', alignItems: 'center' }}>
              <input 
                type="text" 
                value={p.name} 
                onChange={(e) => updatePlayerName(p.id, e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', fontWeight: 600, width: 80 }}
              />
              {p.score > 0 && (
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginRight: 5 }}>
                  🏆 {p.score}
                </span>
              )}
              {state.players.length > 3 && (
                <button onClick={() => removePlayer(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontWeight: 'bold' }}>✕</button>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input 
            className="input" 
            placeholder="Add player name" 
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            style={{ padding: '12px', fontSize: 14 }}
          />
          <button 
            className="btn btn-primary" 
            style={{ width: 'auto', padding: '0 20px' }}
            onClick={() => {
              if (newPlayerName.trim()) {
                addPlayer(newPlayerName.trim());
                setNewPlayerName("");
              }
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="card">
        <div className="card-header">🐔 Categories</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {CATEGORIES.map((c) => {
            const isSelected = state.settings.categories.includes(c.id);
            return (
              <button
                key={c.id}
                className={`tag ${isSelected ? 'active' : ''}`}
                onClick={() => handleToggleCategory(c.id)}
              >
                {c.icon} {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Imposters */}
      <div className="card">
        <div className="card-header">🥷 Imposters</div>
        <select 
          className="input"
          value={state.settings.impostorCount}
          onChange={(e) => setState(prev => ({...prev, settings: {...prev.settings, impostorCount: parseInt(e.target.value)}}))}
        >
          <option value={1}>1 Imposter</option>
          {state.players.length >= 5 && <option value={2}>2 Imposters</option>}
          {state.players.length >= 7 && <option value={3}>3 Imposters</option>}
        </select>
      </div>

      {/* Start Button Fixed at Bottom */}
      <div style={{ position: 'fixed', bottom: 20, left: 20, right: 20, zIndex: 10, display: 'flex', justifyContent: 'center' }}>
        <button 
          className="btn btn-primary" 
          onClick={handleStartGame}
          style={{ maxWidth: 460, width: '100%', boxShadow: '0 8px 30px rgba(214, 255, 54, 0.4)' }}
        >
          ▶ START GAME
        </button>
      </div>
    </div>
  );
}
