function initializeScatterplot() {
  if (typeof drawScatterplot !== 'function') return;
  drawScatterplot().then(() => {
    if (typeof createScatterTooltip === 'function') createScatterTooltip();
    if (typeof handleScatterMouseEvents === 'function') handleScatterMouseEvents();
  }).catch(error => {
    console.error('Scatterplot initialization failed:', error);
  });
}
