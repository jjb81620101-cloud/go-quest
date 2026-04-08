/**
 * Go Quest - 棋盤渲染
 * 處理棋盤 UI 渲染和交互
 */

const Board = (function() {
  let currentGame = null;
  let boardElement = null;
  let onMoveCallback = null;
  let showCoords = true;

  const COORD_LABELS = 'ABCDEFGHJKLMNOPQRSTUVWXYZ'.split('');

  function init(game, elementId, options = {}) {
    currentGame = game;
    boardElement = document.getElementById(elementId);
    showCoords = options.showCoords !== false;
    if (!boardElement) return;
    render();
  }

  function render() {
    if (!boardElement || !currentGame) return;
    const size = currentGame.size;
    boardElement.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    boardElement.style.gridTemplateRows = `repeat(${size}, 1fr)`;

    let html = '';
    html += `<div class="board-background"></div>`;
    html += `<div class="board-lines">`;
    for (let i = 0; i < size; i++) {
      html += `<div class="grid-line horizontal" style="top: ${(i + 0.5) / size * 100}%"></div>`;
    }
    for (let j = 0; j < size; j++) {
      html += `<div class="grid-line vertical" style="left: ${(j + 0.5) / size * 100}%"></div>`;
    }
    html += `</div>`;

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const stone = currentGame.getStone(i, j);
        const isValid = currentGame.isValidMove(i, j) && currentGame.currentPlayer === Game.BLACK;
        const isLastMove = currentGame.lastMove && currentGame.lastMove.x === i && currentGame.lastMove.y === j;

        html += `<div class="intersection ${isValid ? 'valid-move' : ''}"
                      data-x="${i}" data-y="${j}"
                      onclick="Board.handleClick(${i}, ${j})">`;
        if (stone === Game.BLACK) {
          html += `<div class="stone black ${isLastMove ? 'last-move' : ''}"></div>`;
        } else if (stone === Game.WHITE) {
          html += `<div class="stone white ${isLastMove ? 'last-move' : ''}"></div>`;
        }
        html += `</div>`;
      }
    }

    if (showCoords) html += renderCoords(size);
    html += renderStarPoints(size);
    boardElement.innerHTML = html;
  }

  function renderCoords(size) {
    let html = '';
    for (let j = 0; j < size; j++) {
      const label = COORD_LABELS[j];
      html += `<span class="coord coord-column" style="left: ${(j + 0.5) / size * 100}%">${label}</span>`;
    }
    for (let i = 0; i < size; i++) {
      const label = size - i;
      html += `<span class="coord coord-row" style="top: ${(i + 0.5) / size * 100}%">${label}</span>`;
    }
    return html;
  }

  function renderStarPoints(size) {
    const stars = getStarPoints(size);
    let html = '';
    for (const { x, y } of stars) {
      const left = (y + 0.5) / size * 100;
      const top = (x + 0.5) / size * 100;
      html += `<div class="star-point" style="left: ${left}%; top: ${top}%; transform: translate(-50%, -50%)"></div>`;
    }
    return html;
  }

  function getStarPoints(size) {
    const points = [];
    if (size === 9) {
      points.push({ x: 2, y: 2 }, { x: 2, y: 6 }, { x: 6, y: 2 }, { x: 6, y: 6 }, { x: 4, y: 4 });
    } else if (size === 13) {
      for (let i = 3; i <= 9; i += 6) for (let j = 3; j <= 9; j += 6) points.push({ x: i, y: j });
      points.push({ x: 6, y: 6 });
    } else if (size === 19) {
      for (let i = 3; i <= 15; i += 6) for (let j = 3; j <= 15; j += 6) points.push({ x: i, y: j });
      points.push({ x: 9, y: 9 });
    }
    return points;
  }

  function handleClick(x, y) {
    if (!currentGame || currentGame.gameOver) return;
    if (currentGame.currentPlayer !== Game.BLACK) return;
    const result = currentGame.play(x, y);
    if (result.success) {
      render();
      if (onMoveCallback) onMoveCallback(result);
      if (result.capturedStones && result.capturedStones.length > 0) {
        animateCapturedStones(result.capturedStones);
      }
      if (currentGame.gameOver) {
        const result = currentGame.endGame();
        if (onMoveCallback) onMoveCallback({ type: 'gameOver', ...result });
      }
    }
  }

  function animateCapturedStones(stones) {
    for (const { x, y } of stones) {
      const intersection = boardElement.querySelector(`[data-x="${x}"][data-y="${y}"] .stone`);
      if (intersection) intersection.classList.add('captured');
    }
  }

  function onMove(callback) { onMoveCallback = callback; }

  function aiMove(x, y, callback) {
    if (!currentGame) return;
    setTimeout(() => {
      const result = currentGame.play(x, y);
      render();
      if (result.success && callback) callback(result);
      if (result.capturedStones && result.capturedStones.length > 0) {
        animateCapturedStones(result.capturedStones);
      }
    }, 300);
  }

  function update() { render(); }

  function setOptions(options = {}) {
    if ('showCoords' in options) showCoords = options.showCoords;
    render();
  }

  function setSize(size) {
    if (boardElement) {
      boardElement.className = `go-board ${size === 9 ? '' : 'small'}`;
      render();
    }
  }

  return { init, render, handleClick, onMove, aiMove, update, setOptions, setSize };
})();
