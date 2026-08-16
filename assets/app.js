/* 山侈·超级能量人格档案 — 交互逻辑与计分引擎 */
(function () {
  var D = window.QUIZ_DATA;
  var TOTAL = D.QUESTIONS.length;

  var state = {
    answers: [],          // 每题 'a' 或 'b'
    current: 0,           // 当前题号 0-11
    started: false
  };

  var screens = {};
  var elQuestion, elOptionA, elOptionB, elProgress, elProgressNum, elBackBtn;

  /* ---------- 计分 ---------- */
  function computeResult(answers) {
    // 人格四组得分
    var pScore = {}; // K,Y,R,C,S,X,B,Q
    D.PERSONALITY_GROUPS.forEach(function (g) {
      pScore[g.a] = 0;
      pScore[g.b] = 0;
    });
    D.PERSONALITY_GROUPS.forEach(function (g) {
      for (var i = g.range[0]; i <= g.range[1]; i++) {
        pScore[answers[i] === 'a' ? g.a : g.b]++;
      }
    });
    // 取每组较高字母（每组3题不会平分）
    var code = D.PERSONALITY_GROUPS.map(function (g) {
      return pScore[g.a] >= pScore[g.b] ? g.a : g.b;
    }).join('');

    // 六维营养得分
    var nScore = {};
    D.NUTRITION_DIMS.forEach(function (d) { nScore[d.key] = 0; });
    answers.forEach(function (ans, i) {
      var dims = ans === 'a' ? D.NUTRITION_RULES[i].a : D.NUTRITION_RULES[i].b;
      dims.forEach(function (k) { nScore[k]++; });
    });

    // 补足方向：得分最低 1-2 项，并列按 SUPPLEMENT_PRIORITY 排序
    var order = D.SUPPLEMENT_PRIORITY.slice();
    var sorted = order.map(function (k) {
      return { key: k, score: nScore[k] };
    }).sort(function (x, y) {
      if (x.score !== y.score) return x.score - y.score;
      return order.indexOf(x.key) - order.indexOf(y.key);
    });
    var lowest = sorted[0].score;
    var supplement = sorted.filter(function (s) { return s.score === lowest; });
    if (supplement.length === 1) {
      // 取最低 + 次低
      var second = sorted[1];
      supplement.push(second);
    }
    // 限制最多两项
    supplement = supplement.slice(0, 2);

    return {
      code: code,
      personality: D.PERSONALITIES[code],
      nScore: nScore,
      pScore: pScore,
      supplement: supplement
    };
  }

  /* ---------- 屏幕切换 ---------- */
  function show(name) {
    Object.keys(screens).forEach(function (k) {
      screens[k].classList.toggle('is-active', k === name);
    });
    window.scrollTo(0, 0);
  }

  /* ---------- 渲染题目 ---------- */
  function renderQuestion() {
    var idx = state.current;
    var item = D.QUESTIONS[idx];
    elProgress.style.width = ((idx) / TOTAL * 100) + '%';
    elProgressNum.textContent = (idx + 1) + ' / ' + TOTAL;
    elQuestion.textContent = item.q;
    elOptionA.querySelector('.opt-text').textContent = item.a;
    elOptionB.querySelector('.opt-text').textContent = item.b;
    elBackBtn.style.visibility = idx === 0 ? 'hidden' : 'visible';

    // 选中态回显
    elOptionA.classList.toggle('is-chosen', state.answers[idx] === 'a');
    elOptionB.classList.toggle('is-chosen', state.answers[idx] === 'b');

    // 进场动画
    var card = document.querySelector('.quiz-card');
    card.classList.remove('animate-in');
    void card.offsetWidth;
    card.classList.add('animate-in');
  }

  function choose(val) {
    state.answers[state.current] = val;
    var el = val === 'a' ? elOptionA : elOptionB;
    el.classList.add('is-chosen');
    var other = val === 'a' ? elOptionB : elOptionA;
    other.classList.remove('is-chosen');

    setTimeout(function () {
      if (state.current < TOTAL - 1) {
        state.current++;
        renderQuestion();
      } else {
        finish();
      }
    }, 320);
  }

  function goBack() {
    if (state.current > 0) {
      state.current--;
      renderQuestion();
    }
  }

  /* ---------- 完成 → 加载 → 结果 ---------- */
  function finish() {
    show('loading');
    var dots = 0;
    var timer = setInterval(function () { dots = (dots + 1) % 4; }, 400);
    setTimeout(function () {
      clearInterval(timer);
      var result = computeResult(state.answers);
      renderResult(result);
      show('result');
      // 渲染雷达图
      if (window.renderRadarChart) {
        window.renderRadarChart(result.nScore);
      }
    }, 2200);
  }

  /* ---------- 渲染结果页 ---------- */
  function renderResult(r) {
    var p = r.personality;
    document.getElementById('result-code').textContent = r.code;
    document.getElementById('result-name').textContent = p.name;
    document.getElementById('result-oneline').textContent = p.oneline;

    // 标签
    var tagBox = document.getElementById('result-tags');
    tagBox.innerHTML = '';
    p.tags.forEach(function (t) {
      var span = document.createElement('span');
      span.className = 'tag';
      span.textContent = t;
      tagBox.appendChild(span);
    });

    document.getElementById('result-analysis').textContent = p.analysis;
    document.getElementById('result-advantage').textContent = p.advantage;
    document.getElementById('result-ignore').textContent = p.ignore;
    document.getElementById('result-formula').textContent = p.formula;

    document.getElementById('rec-pot').textContent = p.rec.pot;
    document.getElementById('rec-set').textContent = p.rec.set;
    document.getElementById('rec-add').textContent = p.rec.add;

    // 补足方向
    var dimMap = {};
    D.NUTRITION_DIMS.forEach(function (d) { dimMap[d.key] = d.name; });
    var supText = r.supplement.map(function (s) { return dimMap[s.key]; }).join(' ＋ ');
    document.getElementById('result-supplement').textContent = supText;
  }

  /* ---------- 重新测试 ---------- */
  function restart() {
    state.answers = [];
    state.current = 0;
    show('cover');
  }

  /* ---------- 保存档案 ---------- */
  function share() {
    var code = document.getElementById('result-code').textContent;
    var name = document.getElementById('result-name').textContent;
    var oneline = document.getElementById('result-oneline').textContent;
    var analysis = document.getElementById('result-analysis').textContent;
    var advantage = document.getElementById('result-advantage').textContent;
    var ignore = document.getElementById('result-ignore').textContent;
    var formula = document.getElementById('result-formula').textContent;
    var supplement = document.getElementById('result-supplement').textContent;
    var recPot = document.getElementById('rec-pot').textContent;
    var recSet = document.getElementById('rec-set').textContent;
    var recAdd = document.getElementById('rec-add').textContent;
    var tags = Array.from(document.querySelectorAll('#result-tags .tag')).map(function (t) { return t.textContent; }).join(' ｜ ');

    var date = new Date();
    var dateStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');

    var content = '山侈 · 超级能量人格档案\n' +
      '========================================\n\n' +
      '生成日期：' + dateStr + '\n\n' +
      '【人格代码】' + code + '\n' +
      '【人格名称】' + name + '\n' +
      '【人格标签】' + tags + '\n\n' +
      '【一句话结论】\n' + oneline + '\n\n' +
      '【人格解析】\n' + analysis + '\n\n' +
      '【饮食优势】\n' + advantage + '\n\n' +
      '【容易被忽略的方向】\n' + ignore + '\n\n' +
      '【本次优先补足方向】\n' + supplement + '\n\n' +
      '【专属补能公式】\n' + formula + '\n\n' +
      '【山侈为你推荐】\n' +
      '  锅底：' + recPot + '\n' +
      '  套餐：' + recSet + '\n' +
      '  建议加菜：' + recAdd + '\n\n' +
      '========================================\n' +
      '本结果依据答题时的饮食选择生成，仅用于饮食偏好分析与点餐参考，\n' +
      '不代表真实营养摄入量、身体状况或医学诊断。';

    var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = '山侈超级能量人格档案_' + code + '_' + dateStr + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('档案已保存到下载文件夹');
  }

  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function () { t.classList.remove('show'); }, 2000);
  }

  /* ---------- 初始化 ---------- */
  function init() {
    screens.cover = document.getElementById('screen-cover');
    screens.quiz = document.getElementById('screen-quiz');
    screens.loading = document.getElementById('screen-loading');
    screens.result = document.getElementById('screen-result');

    elQuestion = document.getElementById('question-text');
    elOptionA = document.getElementById('option-a');
    elOptionB = document.getElementById('option-b');
    elProgress = document.getElementById('progress-bar');
    elProgressNum = document.getElementById('progress-num');
    elBackBtn = document.getElementById('back-btn');

    document.getElementById('start-btn').addEventListener('click', function () {
      state.started = true;
      state.current = 0;
      state.answers = [];
      renderQuestion();
      show('quiz');
    });
    elOptionA.addEventListener('click', function () { choose('a'); });
    elOptionB.addEventListener('click', function () { choose('b'); });
    elBackBtn.addEventListener('click', goBack);
    document.getElementById('restart-btn').addEventListener('click', restart);
    document.getElementById('share-btn').addEventListener('click', share);

    show('cover');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
