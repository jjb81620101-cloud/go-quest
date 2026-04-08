/**
 * Go Quest - 死活題系統
 */

const Problems = (function() {
  const problems = [
    { id: 1, title: '第一題', description: '黑先吃掉白棋', setup: [{ x: 2, y: 2, color: 2 }, { x: 1, y: 2, color: 1 }, { x: 3, y: 2, color: 1 }, { x: 2, y: 1, color: 1 }], solution: { x: 2, y: 0, color: 1 } },
    { id: 2, title: '第二題', description: '黑先吃掉白棋', setup: [{ x: 1, y: 1, color: 2 }, { x: 0, y: 1, color: 1 }, { x: 2, y: 1, color: 1 }, { x: 1, y: 0, color: 1 }, { x: 1, y: 2, color: 1 }], solution: { x: 1, y: 1, color: 1 } },
    { id: 3, title: '第三題', description: '黑先做活', setup: [{ x: 1, y: 1, color: 1 }, { x: 1, y: 2, color: 1 }, { x: 2, y: 1, color: 1 }, { x: 0, y: 1, color: 2 }, { x: 1, y: 0, color: 2 }], solution: { x: 1, y: 3, color: 1 } }
  ];

  let currentIndex = 0;
  let score = 0;
  let streak = 0;

  function getCurrentProblem() { return problems[currentIndex]; }
  function nextProblem() { if (currentIndex < problems.length - 1) { currentIndex++; return true; } return false; }
  function prevProblem() { if (currentIndex > 0) { currentIndex--; return true; } return false; }
  function goToProblem(index) { if (index >= 0 && index < problems.length) { currentIndex = index; return true; } return false; }
  function getProblems(filter) { return problems; }
  function getScore() { return score; }
  function getStreak() { return streak; }
  function getHint(problem) { return '思考如何讓白棋失去所有氣'; }

  function checkSolution(x, y, problem) {
    if (x === problem.solution.x && y === problem.solution.y) {
      score += 10;
      streak++;
      return { correct: true };
    }
    streak = 0;
    return { correct: false };
  }

  return { getCurrentProblem, nextProblem, prevProblem, goToProblem, getProblems, getScore, getStreak, getHint, checkSolution };
})();
