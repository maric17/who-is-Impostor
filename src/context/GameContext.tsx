"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export type Player = {
  id: string;
  name: string;
  score: number;
};

export type GameSettings = {
  mode: "classic" | "elimination";
  categories: string[];
  impostorCount: number;
  timeLimitEnabled: boolean;
  timeLimitSeconds: number;
  hintEnabled: boolean;
};

export type GameStatus = "setup" | "pass" | "reveal" | "discussion" | "voting" | "elimination_reveal" | "results";

export type RoundData = {
  category: string;
  word: string;
  impostorIds: string[];
  currentPlayerIndex: number;
  votes: Record<string, string[]>; // voterId -> array of votedPlayerIds
  eliminatedIds: string[];
  eliminationMessage?: string;
  winners?: 'crew' | 'impostors' | null;
};

type GameState = {
  players: Player[];
  settings: GameSettings;
  status: GameStatus;
  round: RoundData | null;
};

type GameContextType = {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  updatePlayerName: (id: string, name: string) => void;
  startGame: (word: string, category: string, impostorIds: string[]) => void;
  nextPlayerReveal: () => void;
  startDiscussion: () => void;
  startVoting: () => void;
  submitVote: (voterId: string, votedIds: string[]) => void;
  finishVoting: () => void;
  continueEliminationRound: () => void;
  nextRound: () => void;
  resetGame: () => void;
};

const defaultState: GameState = {
  players: [
    { id: "1", name: "Player 1", score: 0 },
    { id: "2", name: "Player 2", score: 0 },
    { id: "3", name: "Player 3", score: 0 },
  ],
  settings: {
    mode: "classic",
    categories: ["everyday_objects", "famous_people", "foods_drinks"],
    impostorCount: 1,
    timeLimitEnabled: false,
    timeLimitSeconds: 60,
    hintEnabled: false,
  },
  status: "setup",
  round: null,
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useLocalStorage<GameState>("impostor-game-state", defaultState);

  const addPlayer = (name: string) => {
    setState((prev) => ({
      ...prev,
      players: [...prev.players, { id: Date.now().toString(), name, score: 0 }],
    }));
  };

  const removePlayer = (id: string) => {
    setState((prev) => ({
      ...prev,
      players: prev.players.filter((p) => p.id !== id),
    }));
  };

  const updatePlayerName = (id: string, name: string) => {
    setState((prev) => ({
      ...prev,
      players: prev.players.map((p) => (p.id === id ? { ...p, name } : p)),
    }));
  };

  const startGame = (word: string, category: string, impostorIds: string[]) => {
    setState((prev) => ({
      ...prev,
      status: "pass",
      round: {
        word,
        category,
        impostorIds,
        currentPlayerIndex: 0,
        votes: {},
        eliminatedIds: [],
        winners: null,
      },
    }));
  };

  const nextPlayerReveal = () => {
    setState((prev) => {
      if (!prev.round) return prev;
      return {
        ...prev,
        status: "reveal",
      };
    });
  };

  const startDiscussion = () => {
    setState((prev) => ({
      ...prev,
      status: "discussion",
    }));
  };

  const startVoting = () => {
    setState((prev) => ({
      ...prev,
      status: "voting",
    }));
  };

  const submitVote = (voterId: string, votedIds: string[]) => {
    setState((prev) => {
      if (!prev.round) return prev;
      return {
        ...prev,
        round: {
          ...prev.round,
          votes: {
            ...prev.round.votes,
            [voterId]: votedIds,
          },
        },
      };
    });
  };

  const finishVoting = () => {
    setState((prev) => {
      if (!prev.round) return prev;
      
      // Calculate scores
      let newPlayers = [...prev.players];
      const votes = prev.round.votes;
      const impostorIds = prev.round.impostorIds;
      
      // Count votes for each player
      const voteCounts: Record<string, number> = {};
      prev.players.forEach(p => voteCounts[p.id] = 0);
      
      Object.values(votes).forEach(votedIds => {
        votedIds.forEach(votedId => {
          if (voteCounts[votedId] !== undefined) {
            voteCounts[votedId]++;
          }
        });
      });

      const voteValues = Object.values(voteCounts);
      const maxVotes = Math.max(...voteValues, 0);
      
      if (prev.settings.mode === "classic") {
        const minVotes = Math.min(...voteValues);
        
        newPlayers = newPlayers.map(player => {
          let pointsEarned = 0;
          
          if (impostorIds.includes(player.id)) {
            // Impostor scoring
            if (voteCounts[player.id] !== maxVotes) {
               pointsEarned = 2; // Impostor gets 2 points for not being caught
            }
          } else {
            // Crewmate scoring
            const votedForIds = votes[player.id] || [];
            votedForIds.forEach(votedForId => {
              if (impostorIds.includes(votedForId)) {
                pointsEarned += 1;
              }
            });
          }
          
          return {
            ...player,
            score: player.score + pointsEarned,
          };
        });

        return {
          ...prev,
          status: "results",
          players: newPlayers,
        };
      } else {
        // Elimination Mode
        // Find players with max votes
        const playersWithMaxVotes = Object.keys(voteCounts).filter(id => voteCounts[id] === maxVotes && maxVotes > 0);
        
        let newEliminatedIds = [...(prev.round.eliminatedIds || [])];
        let eliminationMessage = "No one was eliminated.";
        let winners: 'crew' | 'impostors' | null = null;
        let nextStatus: GameStatus = "elimination_reveal";

        if (playersWithMaxVotes.length === 1) {
          const eliminatedId = playersWithMaxVotes[0];
          newEliminatedIds.push(eliminatedId);
          const eliminatedPlayer = prev.players.find(p => p.id === eliminatedId);
          const wasImpostor = impostorIds.includes(eliminatedId);
          
          eliminationMessage = `${eliminatedPlayer?.name} was eliminated. They were ${wasImpostor ? 'an' : 'NOT an'} Impostor.`;
        } else if (playersWithMaxVotes.length > 1) {
          eliminationMessage = "Tie! No one was eliminated.";
        } else {
          eliminationMessage = "No votes cast! No one was eliminated.";
        }

        // Check Win Conditions
        const remainingPlayers = prev.players.filter(p => !newEliminatedIds.includes(p.id));
        const remainingImpostors = remainingPlayers.filter(p => impostorIds.includes(p.id));
        const remainingCrew = remainingPlayers.length - remainingImpostors.length;

        if (remainingImpostors.length === 0) {
          winners = "crew";
          nextStatus = "results";
        } else if (remainingImpostors.length >= remainingCrew) {
          winners = "impostors";
          nextStatus = "results";
        }

        return {
          ...prev,
          status: nextStatus,
          round: {
            ...prev.round,
            eliminatedIds: newEliminatedIds,
            eliminationMessage,
            winners,
          }
        };
      }
    });
  };

  const continueEliminationRound = () => {
    setState((prev) => {
      if (!prev.round) return prev;
      return {
        ...prev,
        status: "discussion",
        round: {
          ...prev.round,
          votes: {}, // reset votes for next round
        }
      };
    });
  };

  const nextRound = () => {
    setState((prev) => ({
      ...prev,
      status: "setup",
      round: null,
    }));
  };

  const resetGame = () => {
    setState((prev) => ({
      ...prev,
      status: "setup",
      round: null,
      players: prev.players.map(p => ({ ...p, score: 0 }))
    }));
  };

  return (
    <GameContext.Provider
      value={{
        state,
        setState,
        addPlayer,
        removePlayer,
        updatePlayerName,
        startGame,
        nextPlayerReveal,
        startDiscussion,
        startVoting,
        submitVote,
        finishVoting,
        continueEliminationRound,
        nextRound,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
