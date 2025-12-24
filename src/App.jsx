import React, { useState, useEffect, useReducer } from "react";
import Confetti from "react-confetti";

/* ===============================
   SCORING
================================ */
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

/* ===============================
   FINAL ROUND REDUCER
================================ */
const finalRoundInitial = {
  active: false,
  starter: null,
  queue: [],
  turnPoints: 0,
};

function finalRoundReducer(state, action) {
  switch (action.type) {
    case "START": {
      const queue = Array.from(
        { length: action.playerCount },
        (_, i) => i
      ).filter(i => i !== action.starter);

      return { active: true, starter: action.starter, queue, turnPoints: 0 };
    }

    case "ADD_POINTS":
      return { ...state, turnPoints: state.turnPoints + action.value };

    case "NEXT_PLAYER":
      return { ...state, queue: state.queue.slice(1), turnPoints: 0 };

    case "RESET":
      return finalRoundInitial;

    default:
      return state;
  }
}

/* ===============================
   COMPONENT
================================ */
export default function FarkleCalculator() {
  const [players, setPlayers] = useState([]);
  const [newPlayer, setNewPlayer] = useState("");
  const [currentTurn, setCurrentTurn] = useState(0);
  const [previousPlayerIndex, setPreviousPlayerIndex] = useState(null);
  const [turnPoints, setTurnPoints] = useState(0);
  const [history, setHistory] = useState([]);

  const [finalRound, dispatchFinalRound] = useReducer(
    finalRoundReducer,
    finalRoundInitial
  );

  const [gameOver, setGameOver] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState(null);

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

  const snapshot = () => {
    setHistory(h => [
      ...h,
      {
        players: JSON.parse(JSON.stringify(players)),
        currentTurn,
        previousPlayerIndex,
        turnPoints,
        finalRound,
      },
    ]);
  };

  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));

    setPlayers(prev.players);
    setCurrentTurn(prev.currentTurn);
    setPreviousPlayerIndex(prev.previousPlayerIndex);
    setTurnPoints(prev.turnPoints);
    dispatchFinalRound({ type: "RESET" });
  };

  const setLastAction = (index, text) => {
    setPlayers(p => {
      const updated = [...p];
      updated[index] = { ...updated[index], lastAction: text };
      return updated;
    });
  };

  const addPlayer = () => {
    if (!newPlayer.trim()) return;
    setPlayers(p => [
      ...p,
      { name: newPlayer.trim(), score: 0, lastAction: "—" },
    ]);
    setNewPlayer("");
  };

  const addPoints = (value, label) => {
    if (gameOver) return;
    snapshot();

    if (finalRound.active) {
      dispatchFinalRound({ type: "ADD_POINTS", value });
    } else {
      setTurnPoints(p => p + value);
    }

    setLastAction(currentTurn, `+${value} (${label})`);
  };

  const endTurn = () => {
    if (gameOver) return;
    snapshot();

    const points = finalRound.active
      ? finalRound.turnPoints
      : turnPoints;

    setPlayers(prev => {
      const updated = [...prev];
      updated[currentTurn].score += points;
      setLastAction(currentTurn, `Banked ${points}`);
      return updated;
    });

    setPreviousPlayerIndex(currentTurn);
    setTurnPoints(0);

    if (!finalRound.active) {
      const scorer = players.findIndex(p => p.score >= 10000);
      if (scorer !== -1) {
        dispatchFinalRound({
          type: "START",
          starter: scorer,
          playerCount: players.length,
        });
        setCurrentTurn(players.findIndex((_, i) => i !== scorer));
        return;
      }
    }

    if (finalRound.active && finalRound.queue.length === 0) {
      const max = Math.max(...players.map(p => p.score));
      setWinnerIndex(players.findIndex(p => p.score === max));
      setGameOver(true);
      dispatchFinalRound({ type: "RESET" });
      return;
    }

    if (finalRound.active) {
      dispatchFinalRound({ type: "NEXT_PLAYER" });
      setCurrentTurn(finalRound.queue[0]);
    } else {
      setCurrentTurn((currentTurn + 1) % players.length);
    }
  };

  const farkle = () => {
    if (!turnPoints && !finalRound.turnPoints) return;
    snapshot();

    const points = finalRound.active
      ? finalRound.turnPoints
      : turnPoints;

    setLastAction(currentTurn, `Farkled (${points})`);
    setPreviousPlayerIndex(currentTurn);
    setTurnPoints(0);
    dispatchFinalRound({ type: "RESET" });
    setCurrentTurn((currentTurn + 1) % players.length);
  };

  return (
    <div className="p-3 max-w-md mx-auto space-y-4">
      <h1 className="text-3xl font-bold">Farkle</h1>

      {gameOver && (
        <>
          <Confetti width={windowWidth} height={windowHeight} />
          <div className="text-center text-2xl font-bold text-green-700">
            🏆 Winner: {players[winnerIndex]?.name}
          </div>
        </>
      )}

      {previousPlayerIndex !== null && players[previousPlayerIndex] && (
        <div className="bg-blue-100 border-l-4 border-blue-600 p-2 rounded text-sm">
          <strong>{players[previousPlayerIndex].name}</strong>{" "}
          {players[previousPlayerIndex].lastAction}
        </div>
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
        <div
          key={i}
          className={`p-2 rounded ${
            i === currentTurn ? "bg-green-300 ring-4 ring-green-700" : "bg-gray-100"
          } ${
            i === previousPlayerIndex ? "ring-4 ring-blue-600 animate-pulse" : ""
          }`}
        >
          <strong>{p.name}</strong> — {p.score}
        </div>
      ))}

      <h2 className="font-bold">
        {finalRound.active
          ? `Final Round Points: ${finalRound.turnPoints}`
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
                onClick={() => addPoints(o.value, o.label)}
              >
                {o.label} (+{o.value})
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <button
          className="bg-red-600 text-white p-3 flex-1"
          disabled={!turnPoints && !finalRound.turnPoints}
          onClick={farkle}
        >
          Farkle
        </button>

        <button
          className="bg-green-600 text-white p-3 flex-1"
          onClick={endTurn}
        >
          End Turn
        </button>

        <button
          disabled={!history.length}
          className="bg-gray-600 text-white p-3 flex-1"
          onClick={undo}
        >
          Undo
        </button>
      </div>
    </div>
  );
}
