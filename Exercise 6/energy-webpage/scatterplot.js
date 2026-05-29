function drawScatterplot() {
  const container = document.getElementById('histogram-scatter-container');
  if (!container) return Promise.reject(new Error('Scatter container not found'));

  container.innerHTML = '';
  const width = container.clientWidth;
  const height = 380;
  const margin = { top: 24, right: 30, bottom: 44, left: 58 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  innerChartS = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  return d3.csv('data/Ex6_TVdata.csv', d => ({
    brand: d.brand,
    model: d.model,
    size: +d.screenSize,
    tech: d.screenTech,
    energy: +d.energyConsumption,
    stars: +d.star
  })).then(data => {
    const filtered = data.filter(d => !isNaN(d.energy) && !isNaN(d.stars));

    xScaleS = d3.scaleLinear()
      .domain([d3.min(filtered, d => d.stars) - 0.5, d3.max(filtered, d => d.stars) + 0.5])
      .range([0, innerWidth])
      .nice();

    yScaleS = d3.scaleLinear()
      .domain([0, d3.max(filtered, d => d.energy) * 1.05])
      .range([innerHeight, 0])
      .nice();

    innerChartS.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScaleS).ticks(8).tickFormat(d3.format('d'))) 
      .selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#4a3825');

    innerChartS.append('g')
      .call(d3.axisLeft(yScaleS).ticks(6))
      .selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#4a3825');

    innerChartS.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 34)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#4a3825')
      .text('Star Rating');

    innerChartS.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -42)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#4a3825')
      .text('Labeled Energy Consumption (kWh/year)');

    innerChartS.selectAll('circle')
      .data(filtered)
      .enter()
      .append('circle')
      .attr('cx', d => xScaleS(d.stars))
      .attr('cy', d => yScaleS(d.energy))
      .attr('r', 4.5)
      .attr('fill', d => colorScale(d.tech))
      .attr('opacity', 0.5);

    const legendData = ['LED', 'LCD', 'OLED'];
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 130}, 16)`);

    legend.selectAll('g')
      .data(legendData)
      .enter()
      .append('g')
      .attr('transform', (d, i) => `translate(0, ${i * 22})`)
      .call(g => {
        g.append('rect')
          .attr('width', 14)
          .attr('height', 14)
          .attr('rx', 4)
          .attr('fill', d => colorScale(d));

        g.append('text')
          .attr('x', 20)
          .attr('y', 11)
          .attr('fill', '#4a3825')
          .style('font-size', '12px')
          .text(d => d);
      });
  }).catch(error => {
    d3.select(container).append('p').text('Error drawing scatterplot.');
    console.error(error);
  });
}
