import React, { useState, useEffect } from "react";
import Confetti from "react-confetti";

const scoringCategories = [
  {
    title: "Singles",
    options: [
      { label: "1 x (1)", value: 100 },
      { label: "1 x (5)", value: 50 },
    ],
  },
  {
    title: "Three of a Kind",
    options: [
      { label: "3 x 1s", value: 300 },
      { label: "3 x 2s", value: 200 },
      { label: "3 x 3s", value: 300 },
      { label: "3 x 4s", value: 400 },
      { label: "3 x 5s", value: 500 },
      { label: "3 x 6s", value: 600 },
    ],
  },
  {
    title: "Combos",
    options: [
      { label: "Straight 1–6", value: 1500 },
      { label: "Three Pairs", value: 1500 },
      { label: "4 + Pair", value: 1500 },
      { label: "Two Triplets", value: 2500 },
      { label: "4 of a Kind", value: 1000 },
      { label: "5 of a Kind", value: 2000 },
      { label: "6 of a Kind", value: 3000 },
    ],
  },
];

export default function FarkleCalculator() {
  const [players, setPlayers] = useState([]);
  const [newPlayer, setNewPlayer] = useState("");
  const [currentTurn, setCurrentTurn] = useState(0);

  const [turnPoints, setTurnPoints] = useState(0);

  const [stealPool, setStealPool] = useState(0);
  const [stealIndex, setStealIndex] = useState(null);
  const [originalFarkler, setOriginalFarkler] = useState(null);
  const [isStealPhase, setIsStealPhase] = useState(false);

  const [gameOver, setGameOver] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState(null);

  // SSR-safe window size
  const [windowWidth, setWindowWidth] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);

  useEffect(() => {
    const resize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const addPlayer = () => {
    if (!newPlayer.trim()) return;
    setPlayers(p => [...p, { name: newPlayer.trim(), score: 0 }]);
    setNewPlayer("");
  };

  const addPoints = val => setTurnPoints(p => p + val);

  const nextPlayer = () =>
    setCurrentTurn(t => (t + 1) % players.length);

  // ------------------------
  // NORMAL TURN END
  // ------------------------
  const endTurnWithScore = () => {
    if (players.length === 0 || gameOver) return;

    const isFirstTurn = players[currentTurn].score === 0;
    if (isFirstTurn && turnPoints < 500) return;

    setPlayers(prev => {
      const updated = [...prev];
      updated[currentTurn] = {
        ...updated[currentTurn],
        score: updated[currentTurn].score + turnPoints,
      };
      return updated;
    });

    setTurnPoints(0);
    nextPlayer();
  };

  // ------------------------
  // START A FARKLE
  // ------------------------
  const farkle = () => {
    if (players.length < 2 || turnPoints === 0 || gameOver) return;

    setStealPool(turnPoints);
    setTurnPoints(0);

    setOriginalFarkler(currentTurn);
    setStealIndex((currentTurn + 1) % players.length);
    setIsStealPhase(true);
  };

  // ------------------------
  // DECLINE FARKLE
  // ------------------------
  const declineFarkle = () => {
    setStealPool(0);
    setTurnPoints(0);

    setCurrentTurn(stealIndex);
    setStealIndex(null);
    setOriginalFarkler(null);
    setIsStealPhase(false);
  };

  // ------------------------
  // STEALER FARKLES
  // ------------------------
  const stealFarkle = () => {
    const next = (stealIndex + 1) % players.length;

    setStealPool(p => p + turnPoints);
    setTurnPoints(0);

    if (next === originalFarkler) {
      setStealPool(0);
      setCurrentTurn(originalFarkler);
      setStealIndex(null);
      setOriginalFarkler(null);
      setIsStealPhase(false);
      return;
    }

    setStealIndex(next);
  };

  // ------------------------
  // CLAIM STEAL
  // ------------------------
  const claimSteal = () => {
    const total = stealPool + turnPoints;

    setPlayers(prev => {
      const updated = [...prev];
      updated[stealIndex] = {
        ...updated[stealIndex],
        score: updated[stealIndex].score + total,
      };
      return updated;
    });

    setCurrentTurn(stealIndex);
    setStealPool(0);
    setTurnPoints(0);
    setStealIndex(null);
    setOriginalFarkler(null);
    setIsStealPhase(false);
  };

  // ------------------------
  // REMOVE PLAYER SAFE
  // ------------------------
  const removePlayer = i => {
    setPlayers(prev => {
      const updated = prev.filter((_, idx) => idx !== i);
      if (currentTurn >= updated.length) setCurrentTurn(0);
      return updated;
    });
  };

  return (
    <div className="p-3 max-w-md mx-auto space-y-4">
      <h1 className="text-3xl font-bold">Farkle – House Rules</h1>

      {gameOver && windowWidth > 0 && (
        <Confetti width={windowWidth} height={windowHeight} />
      )}

      <div className="flex gap-2">
        <input
          className="border p-2 flex-1"
          value={newPlayer}
          onChange={e => setNewPlayer(e.target.value)}
          placeholder="Player name"
        />
        <button className="bg-blue-600 text-white p-2" onClick={addPlayer}>
          Add
        </button>
      </div>

      {players.map((p, i) => (
        <div key={i} className="p-2 bg-gray-100 rounded">
          <strong>{p.name}</strong> — {p.score}
          <button className="ml-2 text-red-600" onClick={() => removePlayer(i)}>
            ✕
          </button>
        </div>
      ))}

      <h2 className="font-bold">
        {isStealPhase
          ? `Steal Pool: ${stealPool}`
          : `Turn Points: ${turnPoints}`}
      </h2>

      {scoringCategories.map(cat => (
        <div key={cat.title}>
          <h3 className="font-bold">{cat.title}</h3>
          <div className="grid grid-cols-2 gap-2">
            {cat.options.map(o => (
              <button
                key={o.label}
                className="border p-2 rounded"
                onClick={() => addPoints(o.value)}
              >
                {o.label} (+{o.value})
              </button>
            ))}
          </div>
        </div>
      ))}

      {!isStealPhase && (
        <div className="flex gap-2">
          <button
            disabled={players[currentTurn]?.score === 0 && turnPoints < 500}
            className={`flex-1 p-3 rounded font-bold ${
              players[currentTurn]?.score === 0 && turnPoints < 500
                ? "bg-gray-400"
                : "bg-green-600 text-white"
            }`}
            onClick={endTurnWithScore}
          >
            End Turn
          </button>

          <button
            disabled={players.length < 2 || turnPoints === 0}
            className={`flex-1 p-3 rounded font-bold ${
              players.length < 2 || turnPoints === 0
                ? "bg-gray-400"
                : "bg-red-600 text-white"
            }`}
            onClick={farkle}
          >
            Farkle
          </button>
        </div>
      )}

      {isStealPhase && (
        <div className="bg-yellow-200 p-3 rounded space-y-2">
          <p>Stealer: {players[stealIndex]?.name}</p>

          <div className="flex gap-2">
            <button className="bg-green-600 text-white p-2 flex-1" onClick={claimSteal}>
              Claim Steal
            </button>
            <button className="bg-red-600 text-white p-2 flex-1" onClick={stealFarkle}>
              Farkle
            </button>
            <button className="bg-blue-600 text-white p-2 flex-1" onClick={declineFarkle}>
              Decline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
