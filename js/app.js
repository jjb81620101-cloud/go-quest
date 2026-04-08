/**
 * Go Quest - 主應用程序
 * 處理所有頁面導航和用戶交互
 */

const App = (function() {
  let currentPage = 'start';
  let selectedCharacter = 'sage';
  let game = null;
  let isPlayerTurn = true;
  let boardSize = 9;
  let aiDifficulty = 2;
  let tutorialProgress = 0;
  let problemFilter = 'all';
  const pages = {};

  function init() {
    document.querySelectorAll('.page').forEach(page => { pages[page.id] = page; });
    showPage('page-start');
    loadProgress();
    console.log('🏌️ Go Quest initialized!');
  }

  function showPage(pageId) {
    Object.values(pages).forEach(page => page.classList.remove('active'));
    const targetPage = pages[pageId];
    if (targetPage) { targetPage.classList.add('active'); currentPage = pageId; }
  }

  function startGame() { showPage('page-character'); }
  function selectCharacter(character) {
    selectedCharacter = character;
    const avatars = { sage: '🧙', warrior: '⚔️', master: '👑' };
    document.getElementById('current-avatar').textContent = avatars[character] || '🧙';
    showPage('page-menu');
  }
  function backToMenu() { showPage('page-menu'); }
  function showSettings() { document.getElementById('modal-settings').classList.add('active'); }
  function closeSettings() { document.getElementById('modal-settings').classList.remove('active'); }
  function toggleCoords(enabled) { if (game) Board.setOptions({ showCoords: enabled }); }
  function toggleSound(enabled) { console.log('Sound:', enabled ? 'on' : 'off'); }
  function toggleTimer(enabled) { console.log('Timer:', enabled ? 'on' : 'off'); }

  function showBattle() { showPage('page-battle'); initBattle(); }

  function initBattle() {
    game = new Game.GoGame(boardSize);
    AI.init(game);
    isPlayerTurn = true;
    Board.init(game, 'go-board', { showCoords: true });
    Board.setSize(boardSize);
    Board.onMove(handlePlayerMove);
    document.getElementById('game-result').style.display = 'none';
    applyHandicap();
    updateBattleUI();
  }

  function handlePlayerMove(result) {
    if (!result.success) return;
    updateBattleUI();
    if (!game.gameOver) {
      isPlayerTurn = false;
      updateBattleUI();
      setTimeout(() => { aiMove(); }, 800);
    } else {
      showGameOver();
    }
  }

  function aiMove() {
    if (game.gameOver) return;
    const move = AI.getMove();
    if (!move) {
      game.pass();
      Board.update();
      showToast('AI 選擇虛著', 'info');
    } else {
      Board.aiMove(move.x, move.y, (result) => {
        updateBattleUI();
        if (game.gameOver) showGameOver();
        else { isPlayerTurn = true; updateBattleUI(); }
      });
    }
  }

  function updateBattleUI() {
    const indicator = document.getElementById('turn-indicator');
    if (game.gameOver) { indicator.textContent = '對局結束'; indicator.className = 'turn-indicator'; }
    else if (isPlayerTurn) { indicator.textContent = '⚫ 你的回合'; indicator.className = 'turn-indicator black'; }
    else { indicator.textContent = '⚪ AI 思考中...'; indicator.className = 'turn-indicator white'; }
    document.getElementById('move-count').textContent = `手數：${game.history.length}`;
  }

  function showGameOver() {
    const result = game.endGame();
    const titleEl = document.getElementById('result-title');
    const msgEl = document.getElementById('result-message');
    if (result.winner === 'black') { titleEl.textContent = '🎉 你贏了！'; msgEl.textContent = `黑棋 勝！`; }
    else if (result.winner === 'white') { titleEl.textContent = '😢 AI 獲勝'; msgEl.textContent = `白棋 勝`; }
    else { titleEl.textContent = '🤝 和局'; msgEl.textContent = `黑 ${result.territory.black} vs 白 ${result.territory.white}`; }
    document.getElementById('game-result').style.display = 'flex';
    if (result.winner === 'black') createVictoryBurst();
  }

  function createVictoryBurst() {
    const burst = document.createElement('div');
    burst.className = 'victory-burst';
    const emojis = ['⭐', '🌟', '✨', '🎉', '🏆'];
    for (let i = 0; i < 20; i++) {
      const star = document.createElement('span');
      star.className = 'victory-star';
      star.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 0.5 + 's';
      burst.appendChild(star);
    }
    document.body.appendChild(burst);
    setTimeout(() => burst.remove(), 2000);
  }

  function undoMove() { if (!isPlayerTurn || !game) return; game.undo(); game.undo(); Board.update(); updateBattleUI(); }
  function pauseGame() { document.getElementById('modal-pause').classList.add('active'); }
  function resumeGame() { document.getElementById('modal-pause').classList.remove('active'); }
  function newGame() { document.getElementById('modal-pause').classList.remove('active'); document.getElementById('game-result').style.display = 'none'; initBattle(); }
  function exitGame() { document.getElementById('modal-pause').classList.remove('active'); backToMenu(); }
  function confirmExit() { if (game && game.history.length > 0) pauseGame(); else backToMenu(); }
  function changeBoardSize(size) {
    boardSize = size;
    document.querySelectorAll('.size-btn').forEach(btn => btn.classList.toggle('active', parseInt(btn.dataset.size) === size));
    Board.setSize(size);
    initBattle();
  }
  function changeDifficulty(level) { aiDifficulty = parseInt(level); AI.setDifficulty(aiDifficulty); }
  function changeHandicap(handicap) { applyHandicap(parseInt(handicap)); }

  function applyHandicap(handicap = 0) {
    if (!game) return;
    game.reset();
    if (handicap > 0 && boardSize === 9) {
      const positions = [{ x: 2, y: 2 }, { x: 2, y: 6 }, { x: 6, y: 2 }, { x: 6, y: 6 }, { x: 4, y: 4 }];
      for (let i = 0; i < Math.min(handicap, 5); i++) game.setStone(positions[i].x, positions[i].y, Game.WHITE);
      Board.update();
    }
  }

  function showProblems() { showPage('page-problems'); renderProblem(); renderProblemsList(); }

  function renderProblem() {
    const problem = Problems.getCurrentProblem();
    document.getElementById('problem-title').textContent = problem.title;
    document.getElementById('problem-desc').textContent = problem.description;
    document.getElementById('problem-feedback').innerHTML = '';
    document.getElementById('problem-feedback').className = 'problem-feedback';
    const problemGame = new Game.GoGame(5);
    problemGame.setStones(problem.setup);
    const boardEl = document.getElementById('problem-board');
    boardEl.innerHTML = '';
    const size = 5;
    boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    boardEl.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    let html = '';
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const stone = problemGame.getStone(i, j);
        const isValid = problemGame.isValidMove(i, j);
        html += `<div class="intersection ${isValid ? 'valid-move' : ''}" data-x="${i}" data-y="${j}" onclick="App.handleProblemClick(${i},${j})">`;
        if (stone === Game.BLACK) html += `<div class="stone black"></div>`;
        else if (stone === Game.WHITE) html += `<div class="stone white"></div>`;
        html += `</div>`;
      }
    }
    boardEl.innerHTML = html;
    document.getElementById('problem-score').textContent = Problems.getScore();
    document.getElementById('problem-streak').textContent = Problems.getStreak();
  }

  function handleProblemClick(x, y) {
    const problem = Problems.getCurrentProblem();
    const result = Problems.checkSolution(x, y, problem);
    const feedbackEl = document.getElementById('problem-feedback');
    if (result.correct) {
      feedbackEl.className = 'problem-feedback correct';
      feedbackEl.innerHTML = '✅ 正確！<br><button class="btn btn-primary" onclick="App.nextProblem()">下一題 →</button>';
      document.getElementById('problem-score').textContent = Problems.getScore();
      document.getElementById('problem-streak').textContent = Problems.getStreak();
    } else {
      feedbackEl.className = 'problem-feedback incorrect';
      feedbackEl.innerHTML = '❌ 不對，再想想...';
    }
  }

  function showHint() { const problem = Problems.getCurrentProblem(); showToast('💡 ' + Problems.getHint(problem), 'info'); }
  function skipProblem() { nextProblem(); }
  function nextProblem() {
    const next = Problems.nextProblem();
    if (next) renderProblem();
    else showToast('🎓 你已完成所有題目！', 'success');
    renderProblemsList();
  }
  function prevProblem() { const prev = Problems.prevProblem(); if (prev) renderProblem(); }
  function renderProblemsList() {
    const grid = document.getElementById('problems-grid');
    const problems = Problems.getProblems(problemFilter);
    grid.innerHTML = problems.map((p, idx) => {
      const isCurrent = p.id === Problems.getCurrentProblem().id;
      return `<div class="problem-slot ${isCurrent ? 'current' : ''}" onclick="App.goToProblem(${p.id - 1})">${p.id}</div>`;
    }).join('');
  }
  function goToProblem(index) { Problems.goToProblem(index); renderProblem(); renderProblemsList(); }
  function setProblemFilter(level) {
    problemFilter = level;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.level === level));
    renderProblemsList();
  }

  function showJoseki() { showPage('page-joseki'); renderJoseki(); }

  function renderJoseki() {
    const joseki = josekiList[currentJoseki];
    document.getElementById('joseki-name').textContent = joseki.name;
    document.getElementById('joseki-desc').textContent = joseki.desc;
    document.querySelectorAll('.joseki-item').forEach((item, idx) => item.classList.toggle('active', idx === currentJoseki));
    const demoBoard = document.getElementById('joseki-demo-board');
    const size = 5;
    demoBoard.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    demoBoard.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    let html = '';
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        html += `<div class="intersection" data-x="${i}" data-y="${j}">`;
        if ((i === 2 && j === 2) || (i === 0 && j === 0) || (i === 0 && j === 4) || (i === 4 && j === 0) || (i === 4 && j === 4)) {
          html += `<div class="star-dot"></div>`;
        }
        html += `</div>`;
      }
    }
    demoBoard.innerHTML = html;
    for (const move of joseki.moves) {
      const intersection = demoBoard.querySelector(`[data-x="${move.x}"][data-y="${move.y}"]`);
      if (intersection) { const stone = document.createElement('div'); stone.className = `stone ${move.color === Game.BLACK ? 'black' : 'white'}`; intersection.appendChild(stone); }
    }
  }

  const josekiList = [
    { id: 'star', name: '星位定石', desc: '星位是快速的開局方式，強調速度和勢力。', moves: [{ x: 2, y: 2, color: Game.BLACK }, { x: 2, y: 4, color: Game.WHITE }] },
    { id: 'komoku', name: '小目定石', desc: '小目是傳統而穩健的開局，重視實地。', moves: [{ x: 1, y: 3, color: Game.BLACK }, { x: 2, y: 4, color: Game.WHITE }] },
    { id: 'hoshi', name: '三三開局', desc: '三三直接搶占角部，比較激進。', moves: [{ x: 2, y: 2, color: Game.BLACK }, { x: 3, y: 3, color: Game.WHITE }] }
  ];
  let currentJoseki = 0;

  function nextJoseki() { currentJoseki = (currentJoseki + 1) % josekiList.length; renderJoseki(); }
  function prevJoseki() { currentJoseki = (currentJoseki - 1 + josekiList.length) % josekiList.length; renderJoseki(); }
  function selectJoseki(id) { const idx = josekiList.findIndex(j => j.id === id); if (idx !== -1) { currentJoseki = idx; renderJoseki(); } }

  function showTutorial() { showPage('page-tutorial'); renderTutorial(); }

  function renderTutorial() {
    const chapter = Tutorial.getCurrentChapter();
    document.getElementById('tutorial-chapter-label').textContent = `第${chapter.id}章`;
    document.getElementById('tutorial-title').textContent = chapter.title;
    document.getElementById('tutorial-body').innerHTML = chapter.content;
    document.querySelectorAll('.chapter').forEach(el => {
      const ch = parseInt(el.dataset.chapter);
      el.classList.remove('active', 'completed');
      if (ch === chapter.id) el.classList.add('active');
    });
    const prevBtn = document.getElementById('btn-prev-chapter');
    const nextBtn = document.getElementById('btn-next-chapter');
    prevBtn.disabled = Tutorial.currentChapter() <= 1;
    prevBtn.style.opacity = Tutorial.currentChapter() <= 1 ? '0.5' : '1';
    nextBtn.textContent = Tutorial.currentChapter() >= Tutorial.chapters.length ? '完成 ✓' : '下一章 →';
  }

  function nextChapter() {
    if (Tutorial.nextChapter()) renderTutorial();
    else { tutorialProgress = 100; showToast('🎓 恭喜完成圍棋基礎教程！', 'success'); saveProgress(); backToMenu(); }
  }
  function prevChapter() { if (Tutorial.prevChapter()) renderTutorial(); }
  function goToChapter(chapterNum) { if (Tutorial.goToChapter(chapterNum)) renderTutorial(); }

  function loadProgress() {
    try {
      const saved = localStorage.getItem('goquest-progress');
      if (saved) { const data = JSON.parse(saved); tutorialProgress = data.tutorialProgress || 0; document.querySelector('.progress-fill').style.width = tutorialProgress + '%'; document.querySelector('.progress-text').textContent = `${tutorialProgress === 100 ? '5' : Math.floor(tutorialProgress / 20)}/5 完成`; }
    } catch (e) { console.log('Could not load progress'); }
  }

  function saveProgress() { try { localStorage.setItem('goquest-progress', JSON.stringify({ tutorialProgress })); } catch (e) { console.log('Could not save progress'); } }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', info: '💡' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span class="toast-message">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'slideIn 0.3s ease reverse'; setTimeout(() => toast.remove(), 300); }, 3000);
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    startGame, selectCharacter, backToMenu, showSettings, closeSettings, toggleCoords, toggleSound, toggleTimer,
    showTutorial, nextChapter, prevChapter, goToChapter,
    showBattle, changeBoardSize, changeDifficulty, changeHandicap, undoMove, pauseGame, resumeGame, newGame, exitGame, confirmExit,
    showProblems, handleProblemClick, showHint, skipProblem, nextProblem, prevProblem, goToProblem, setProblemFilter,
    showJoseki, nextJoseki, prevJoseki, selectJoseki
  };
})();
