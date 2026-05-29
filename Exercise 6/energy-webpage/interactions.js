function createScatterTooltip() {
  if (!innerChartS) return;
  innerChartS.select('#scatter-tooltip').remove();

  const tooltip = innerChartS.append('g')
    .attr('id', 'scatter-tooltip')
    .style('opacity', 0);

  tooltip.append('rect')
    .attr('width', tooltipWidth)
    .attr('height', tooltipHeight)
    .attr('rx', 10)
    .attr('fill', '#4b5563')
    .attr('opacity', 0.85);

  const tooltipText = tooltip.append('text')
    .attr('id', 'scatter-tooltip-text')
    .attr('x', 10)
    .attr('y', 16)
    .attr('fill', '#ffffff')
    .style('font-size', '11px');

  tooltipText.append('tspan')
    .attr('id', 'scatter-tooltip-line1')
    .attr('x', 10)
    .attr('dy', '0em');

  tooltipText.append('tspan')
    .attr('id', 'scatter-tooltip-line2')
    .attr('x', 10)
    .attr('dy', '1.2em');
}

function handleScatterMouseEvents() {
  if (!innerChartS) return;

  const tooltip = innerChartS.select('#scatter-tooltip');
  if (tooltip.empty()) return;

  innerChartS.selectAll('circle')
    .on('mouseenter', function(event, d) {
      const circle = d3.select(this);
      const cx = +circle.attr('cx');
      const cy = +circle.attr('cy');
      tooltip.select('#scatter-tooltip-line1')
        .text(`${d.brand} (${d.tech})`);

      tooltip.select('#scatter-tooltip-line2')
        .text(`${d.energy} kWh | ${d.stars} stars`);

      tooltip
        .transition()
        .duration(120)
        .style('opacity', 1)
        .attr('transform', `translate(${Math.min(cx + 16, xScaleS.range()[1] - tooltipWidth)}, ${Math.max(cy - tooltipHeight - 12, 0)})`);
    })
    .on('mouseleave', function() {
      tooltip.transition()
        .duration(120)
        .style('opacity', 0);
    });
}
