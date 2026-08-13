/* 山侈·超级能量人格档案 — 六维营养偏好雷达图 */
window.renderRadarChart = function (nScore) {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var rule = style.getPropertyValue('--rule').trim();

  var D = window.QUIZ_DATA;
  var container = document.getElementById('radar-chart');
  if (!container) return;

  var chart = echarts.init(container, null, { renderer: 'svg' });

  var indicators = D.NUTRITION_DIMS.map(function (d) {
    return { name: d.name, max: 8 };
  });
  var values = D.NUTRITION_DIMS.map(function (d) {
    return nScore[d.key] || 0;
  });

  chart.setOption({
    animation: true,
    animationDuration: 900,
    radar: {
      indicator: indicators,
      center: ['50%', '54%'],
      radius: '66%',
      shape: 'polygon',
      splitNumber: 4,
      axisName: {
        color: ink,
        fontSize: 13,
        fontWeight: 600,
        padding: [4, 6]
      },
      splitLine: { lineStyle: { color: rule, width: 1 } },
      splitArea: {
        areaStyle: {
          color: ['rgba(232,85,42,0.02)', 'rgba(232,85,42,0.05)']
        }
      },
      axisLine: { lineStyle: { color: rule } }
    },
    series: [{
      type: 'radar',
      symbol: 'circle',
      symbolSize: 7,
      lineStyle: { color: accent, width: 2.5 },
      itemStyle: { color: accent, borderColor: '#fff', borderWidth: 2 },
      areaStyle: {
        color: {
          type: 'radial', x: 0.5, y: 0.5, r: 0.7,
          colorStops: [
            { offset: 0, color: 'rgba(232,85,42,0.28)' },
            { offset: 1, color: 'rgba(232,85,42,0.08)' }
          ]
        }
      },
      data: [{ value: values, name: '六维偏好' }],
      label: {
        show: true,
        color: accent,
        fontSize: 12,
        fontWeight: 700,
        formatter: function (p) { return p.value; },
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 8,
        padding: [2, 5]
      }
    }]
  });

  // 自适应宽度：自然宽度过小时（视口异常）使用兜底宽度
  function fitChart() {
    container.style.width = '';
    var w = container.offsetWidth;
    if (w < 100) {
      container.style.width = '320px';
    }
    chart.resize();
  }

  setTimeout(fitChart, 120);
  window.addEventListener('resize', fitChart);
};
