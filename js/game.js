/**
 * Go Quest - 圍棋規則引擎
 * 處理棋盤狀態、棋子邏輯、吃子規則
 */

const Game = (function() {
  const EMPTY = 0;
  const BLACK = 1;
  const WHITE = 2;
  const DIRECTIONS = [[-1, 0], [0, 1], [1, 0], [0, -1]];

  class GoGame {
    constructor(size = 9) {
      this.size = size;
      this.reset();
    }

    reset() {
      this.board = Array(this.size).fill(null).map(() => Array(this.size).fill(EMPTY));
      this.currentPlayer = BLACK;
      this.history = [];
      this.captures = { [BLACK]: 0, [WHITE]: 0 };
      this.koPoint = null;
      this.lastMove = null;
      this.consecutivePasses = 0;
      this.gameOver = false;
      this.winner = null;
    }

    isValidPosition(x, y) { return x >= 0 && x < this.size && y >= 0 && y < this.size; }
    getStone(x, y) { if (!this.isValidPosition(x, y)) return null; return this.board[x][y]; }
    getNeighbors(x, y) {
      const neighbors = [];
      for (const [dx, dy] of DIRECTIONS) {
        const nx = x + dx, ny = y + dy;
        if (this.isValidPosition(nx, ny)) neighbors.push({ x: nx, y: ny, stone: this.board[nx][ny] });
      }
      return neighbors;
    }

    getGroup(x, y) {
      const stone = this.getStone(x, y);
      if (stone === EMPTY) return { stones: [], liberties: 0 };
      const group = [], visited = new Set(), queue = [{ x, y }];
      while (queue.length > 0) {
        const { x: cx, y: cy } = queue.shift();
        const key = `${cx},${cy}`;
        if (visited.has(key)) continue;
        if (this.getStone(cx, cy) !== stone) continue;
        visited.add(key);
        group.push({ x: cx, y: cy });
        for (const { x: nx, y: ny } of this.getNeighbors(cx, cy)) {
          if (!visited.has(`${nx},${ny}`)) queue.push({ x: nx, y: ny });
        }
      }
      const liberties = new Set();
      for (const { x: sx, y: sy } of group) {
        for (const { x: nx, y: ny, stone: nStone } of this.getNeighbors(sx, sy)) {
          if (nStone === EMPTY) liberties.add(`${nx},${ny}`);
        }
      }
      return { stones: group, liberties: liberties.size };
    }

    isValidMove(x, y, player = this.currentPlayer) {
      if (this.getStone(x, y) !== EMPTY) return false;
      if (this.koPoint && this.koPoint.x === x && this.koPoint.y === y) return false;
      const tempBoard = this.board.map(row => [...row]);
      tempBoard[x][y] = player;
      const opponent = player === BLACK ? WHITE : BLACK;
      let wouldCapture = false;
      for (const [dx, dy] of DIRECTIONS) {
        const nx = x + dx, ny = y + dy;
        if (this.isValidPosition(nx, ny) && tempBoard[nx][ny] === opponent) {
          const group = this.getGroupOnBoard(nx, ny, tempBoard);
          if (group.liberties === 0) {
            wouldCapture = true;
            for (const stone of group.stones) tempBoard[stone.x][stone.y] = EMPTY;
          }
        }
      }
      const ownGroup = this.getGroupOnBoard(x, y, tempBoard);
      if (ownGroup.liberties === 0 && !wouldCapture) return false;
      return true;
    }

    getGroupOnBoard(x, y, board) {
      const stone = board[x][y];
      if (stone === EMPTY) return { stones: [], liberties: 0 };
      const group = [], visited = new Set(), queue = [{ x, y }];
      while (queue.length > 0) {
        const { x: cx, y: cy } = queue.shift();
        const key = `${cx},${cy}`;
        if (visited.has(key)) continue;
        if (board[cx][cy] !== stone) continue;
        visited.add(key);
        group.push({ x: cx, y: cy });
        for (const [dx, dy] of DIRECTIONS) {
          const nx = cx + dx, ny = cy + dy;
          if (nx >= 0 && nx < this.size && ny >= 0 && ny < this.size && !visited.has(`${nx},${ny}`)) {
            queue.push({ x: nx, y: ny });
          }
        }
      }
      const liberties = new Set();
      for (const { x: sx, y: sy } of group) {
        for (const [dx, dy] of DIRECTIONS) {
          const nx = sx + dx, ny = sy + dy;
          if (nx >= 0 && nx < this.size && ny >= 0 && ny < this.size && board[nx][ny] === EMPTY) {
            liberties.add(`${nx},${ny}`);
          }
        }
      }
      return { stones: group, liberties: liberties.size };
    }

    play(x, y) {
      if (this.gameOver) return { success: false, reason: '遊戲結束' };
      if (!this.isValidMove(x, y)) return { success: false, reason: '無效的落子' };
      this.history.push({
        board: this.board.map(row => [...row]),
        currentPlayer: this.currentPlayer,
        koPoint: this.koPoint ? { ...this.koPoint } : null,
        captures: { ...this.captures }
      });
      if (this.history.length > 200) this.history.shift();
      this.board[x][y] = this.currentPlayer;
      this.lastMove = { x, y, player: this.currentPlayer };
      this.consecutivePasses = 0;
      const opponent = this.currentPlayer === BLACK ? WHITE : BLACK;
      const capturedStones = [];
      for (const [dx, dy] of DIRECTIONS) {
        const nx = x + dx, ny = y + dy;
        if (this.isValidPosition(nx, ny) && this.board[nx][ny] === opponent) {
          const group = this.getGroup(nx, ny);
          if (group.liberties === 0) {
            for (const stone of group.stones) {
              this.board[stone.x][stone.y] = EMPTY;
              capturedStones.push(stone);
            }
            this.captures[this.currentPlayer] += group.stones.length;
          }
        }
      }
      if (capturedStones.length === 1) {
        const captured = capturedStones[0];
        this.board[captured.x][captured.y] = opponent;
        const ownGroup = this.getGroup(x, y);
        this.board[captured.x][captured.y] = EMPTY;
        if (ownGroup.stones.length === 1 && ownGroup.liberties === 1) {
          this.koPoint = { x: captured.x, y: captured.y };
        } else {
          this.koPoint = null;
        }
      } else {
        this.koPoint = null;
      }
      this.currentPlayer = opponent;
      return { success: true, x, y, player: this.currentPlayer === BLACK ? 'black' : 'white', capturedStones, nextPlayer: this.currentPlayer };
    }

    pass() {
      if (this.gameOver) return { success: false, reason: '遊戲結束' };
      this.history.push({ board: this.board.map(row => [...row]), currentPlayer: this.currentPlayer, koPoint: this.koPoint ? { ...this.koPoint } : null, captures: { ...this.captures } });
      this.consecutivePasses++;
      this.koPoint = null;
      this.currentPlayer = this.currentPlayer === BLACK ? WHITE : BLACK;
      if (this.consecutivePasses >= 2) return this.endGame();
      return { success: true, consecutivePasses: this.consecutivePasses };
    }

    undo() {
      if (this.history.length === 0) return { success: false, reason: '沒有可撤回的步驟' };
      const lastState = this.history.pop();
      this.board = lastState.board;
      this.currentPlayer = lastState.currentPlayer;
      this.koPoint = lastState.koPoint;
      this.captures = lastState.captures;
      this.lastMove = this.history.length > 0 ? { ...this.history[this.history.length - 1].board.find(s => s !== EMPTY) } : null;
      return { success: true };
    }

    endGame() {
      this.gameOver = true;
      const territory = this.calculateTerritory();
      return { gameOver: true, territory, winner: territory.black > territory.white ? 'black' : territory.white > territory.black ? 'white' : 'draw' };
    }

    calculateTerritory() {
      const visited = new Set();
      const territory = { black: 0, white: 0 };
      const komi = 6.5;
      for (let x = 0; x < this.size; x++) {
        for (let y = 0; y < this.size; y++) {
          if (this.board[x][y] === EMPTY && !visited.has(`${x},${y}`)) {
            const { region, bordering } = this.floodFillTerritory(x, y, visited);
            if (bordering.black && !bordering.white) territory.black += region.length;
            else if (bordering.white && !bordering.black) territory.white += region.length;
          }
        }
      }
      let blackStones = 0, whiteStones = 0;
      for (let x = 0; x < this.size; x++) {
        for (let y = 0; y < this.size; y++) {
          if (this.board[x][y] === BLACK) blackStones++;
          if (this.board[x][y] === WHITE) whiteStones++;
        }
      }
      const blackScore = territory.black + blackStones;
      const whiteScore = territory.white + whiteStones + komi;
      return { black: blackScore, white: whiteScore, komi };
    }

    floodFillTerritory(startX, startY, visited) {
      const region = [], bordering = { black: false, white: false };
      const queue = [{ x: startX, y: startY }];
      while (queue.length > 0) {
        const { x, y } = queue.shift();
        const key = `${x},${y}`;
        if (visited.has(key)) continue;
        const stone = this.getStone(x, y);
        if (stone === EMPTY) {
          visited.add(key);
          region.push({ x, y });
          for (const [dx, dy] of DIRECTIONS) {
            const nx = x + dx, ny = y + dy;
            if (this.isValidPosition(nx, ny) && !visited.has(`${nx},${ny}`)) {
              const neighbor = this.getStone(nx, ny);
              if (neighbor === EMPTY) queue.push({ x: nx, y: ny });
            }
          }
        } else {
          if (stone === BLACK) bordering.black = true;
          if (stone === WHITE) bordering.white = true;
        }
      }
      return { region, bordering };
    }

    getValidMoves() {
      const moves = [];
      for (let x = 0; x < this.size; x++) for (let y = 0; y < this.size; y++) if (this.isValidMove(x, y)) moves.push({ x, y });
      return moves;
    }

    setSize(size) { this.size = size; this.reset(); }
    setStone(x, y, color) { if (this.isValidPosition(x, y)) this.board[x][y] = color; }
    setStones(positions) { for (const { x, y, color } of positions) this.setStone(x, y, color); }
  }

  return { EMPTY, BLACK, WHITE, DIRECTIONS, GoGame };
})();
