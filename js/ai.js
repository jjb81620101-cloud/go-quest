/**
 * Go Quest - AI 引擎
 */

const AI = (function() {
  let currentGame = null;
  let difficulty = 2;

  function init(game) { currentGame = game; }

  function setDifficulty(level) { difficulty = level; }

  function getMove() {
    if (!currentGame) return null;
    const validMoves = currentGame.getValidMoves();
    if (validMoves.length === 0) return null;

    const candidates = validMoves.slice();

    if (difficulty === 1) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }

    let bestScore = -Infinity;
    let bestMoves = [];

    for (const move of candidates) {
      const score = evaluateMove(move.x, move.y);
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [move];
      } else if (score === bestScore) {
        bestMoves.push(move);
      }
    }

    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  function evaluateMove(x, y) {
    let score = 0;
    const neighbors = currentGame.getNeighbors(x, y);
    let friendlyNeighbors = 0;
    let emptyNeighbors = 0;

    for (const n of neighbors) {
      if (n.stone === currentGame.currentPlayer) friendlyNeighbors++;
      else if (n.stone === 0) emptyNeighbors++;
    }

    score += friendlyNeighbors * 3;
    score += emptyNeighbors * 2;

    const group = currentGame.getGroup(x, y);
    score += group.liberties * 5;

    if (x === 0 || x === currentGame.size - 1 || y === 0 || y === currentGame.size - 1) {
      score -= 10;
    }

    return score;
  }

  return { init, setDifficulty, getMove };
})();
