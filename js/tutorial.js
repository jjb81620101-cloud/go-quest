/**
 * Go Quest - 教學系統
 */

const Tutorial = (function() {
  const chapters = [
    { id: 1, title: '圍棋基本規則', content: '<p>圍棋起源于中國，有4000多年的歷史。</p><p>棋盤由19×19條線組成，我們在交叉點上放置棋子。</p><p>黑白雙方輪流落子，黑棋先行。</p>' },
    { id: 2, title: '如何吃子', content: '<p>當一枚棋子的所有相鄰位置都被對方棋子占據時，它就會被吃掉。</p><p>這叫做「無氣」，被包圍的棋子會從棋盤上移除。</p><p>試著包圍對方的棋子來吃掉它們！</p>' },
    { id: 3, title: '禁著點', content: '<p>有些位置不能落子：</p><ul><li>已有棋子的位置</li><li>落子後會讓自己立即被吃的（除非能吃掉對方）</li><li>劫的位置（剛被提掉的位置）</li></ul>' },
    { id: 4, title: '圍地', content: '<p>除了吃子，圍棋的目的還包括圍地面積。</p><p>用棋子包圍空交叉點，這些空地就屬於你。</p><p>比賽结束时，占據更大面積的一方獲勝。</p>' },
    { id: 5, title: '基本策略', content: '<p>開局時，先占角再占邊，逐步向中央發展。</p><p>保持棋子在中央有「眼」，避免被包圍。</p><p>適時進攻，適時防守，這就是圍棋的藝術！</p>' }
  ];

  let currentChapterIndex = 0;

  function getCurrentChapter() { return chapters[currentChapterIndex]; }
  function currentChapter() { return currentChapterIndex + 1; }
  function nextChapter() { if (currentChapterIndex < chapters.length - 1) { currentChapterIndex++; return true; } return false; }
  function prevChapter() { if (currentChapterIndex > 0) { currentChapterIndex--; return true; } return false; }
  function goToChapter(num) { if (num >= 1 && num <= chapters.length) { currentChapterIndex = num - 1; return true; } return false; }

  return { chapters, getCurrentChapter, currentChapter, nextChapter, prevChapter, goToChapter };
})();
