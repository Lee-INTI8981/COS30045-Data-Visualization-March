let innerChartS;
let xScaleS;
let yScaleS;
const tooltipWidth = 170;
const tooltipHeight = 60;
const colorScale = d3.scaleOrdinal()
  .domain(['LED', 'LCD', 'OLED'])
  .range(['#d97706', '#b45309', '#166534']);
