let dataStore = {
    home: [],
    tv: [],
    about: [],
    story: []
};

let histogramCurrentTech = 'All';

function showPage(pageId) {
    let pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.add('hidden'));

    document.getElementById(pageId).classList.remove('hidden');

    let navItems = document.querySelectorAll('nav li');
    navItems.forEach(n => n.classList.remove('active'));

    document.getElementById('nav-' + pageId).classList.add('active');

    if (pageId === 'visualization-barchart') {
      renderBarChart();
    }

    if (pageId === 'visualization-multichart') {
      renderMultiChart();
    }

    if (pageId === 'visualization-histogram') {
      renderHistogram();
      if (typeof initializeScatterplot === 'function') {
        initializeScatterplot();
      }
    }
}

function renderBarChart() {
  fetch("data/Energy Based on Brand.csv")
    .then(response => response.text())
    .then(text => {
      let rows = text.split("\n").slice(1); // Skip header
      let data = [];

      rows.forEach(row => {
        if (!row.trim()) return;
        let cols = row.split(",");
        if (cols.length < 2) return;

        let brand = cols[0].replace(/"/g, "").trim();
        let energy = parseFloat(cols[1].trim());

        if (brand && !isNaN(energy)) {
          data.push({ brand, energy });
        }
      });

      // Sort by energy descending and take top 15
      data.sort((a, b) => b.energy - a.energy);
      data = data.slice(0, 15);

      // Compute summary statistics for the top items
      const maxBrand = data[0];
      const minBrand = data[data.length - 1];
      const avgEnergy = d3.mean(data, d => d.energy);
      const medianIndex = Math.floor(data.length / 2);
      const medianBrand = data[medianIndex];

      // Create bar chart with D3
      const container = document.getElementById("bar-chart-container");
      if (!container) return;

      container.innerHTML = ""; // Clear previous chart

      // Insert a small summary box above the chart (similar to Exercise 6)
      const summaryDiv = document.createElement('div');
      summaryDiv.className = 'chart-summary';
      summaryDiv.style.background = '#f8f9fa';
      summaryDiv.style.borderRadius = '10px';
      summaryDiv.style.padding = '12px 16px';
      summaryDiv.style.marginBottom = '16px';
      summaryDiv.style.fontFamily = 'Arial, Helvetica, sans-serif';
      summaryDiv.innerHTML = `
        <div style="display:flex;justify-content:space-around;align-items:center;flex-wrap:wrap;gap:12px;">
          <div style="text-align:center;min-width:110px;">
            <div style="font-size:11px;color:#333;">🔴 HIGHEST</div>
            <div style="font-size:14px;font-weight:700;color:#c0392b;">${maxBrand.brand}</div>
            <div style="font-size:12px;color:#e74c3c;">${Math.round(maxBrand.energy)} kWh</div>
          </div>
          <div style="text-align:center;min-width:110px;">
            <div style="font-size:11px;color:#333;">📊 AVERAGE</div>
            <div style="font-size:13px;font-weight:600;color:#555;">${Math.round(avgEnergy)} kWh</div>
          </div>
          <div style="text-align:center;min-width:110px;">
            <div style="font-size:11px;color:#333;">🟢 LOWEST</div>
            <div style="font-size:14px;font-weight:700;color:#2e7d32;">${minBrand.brand}</div>
            <div style="font-size:12px;color:#4caf50;">${Math.round(minBrand.energy)} kWh</div>
          </div>
          <div style="text-align:center;min-width:110px;">
            <div style="font-size:11px;color:#333;">🎯 MEDIAN</div>
            <div style="font-size:13px;font-weight:500;color:#555;">${medianBrand.brand}</div>
            <div style="font-size:11px;color:#888;">${Math.round(medianBrand.energy)} kWh</div>
          </div>
        </div>
        <div style="text-align:center;padding-top:10px;border-top:1px solid #e6e6e6;margin-top:10px;color:#444;font-size:13px;">
          Key insight: <strong>${maxBrand.brand}</strong> has the highest energy usage while <strong>${minBrand.brand}</strong> is the most efficient among the top 15.
        </div>
      `;

      container.appendChild(summaryDiv);

      // For horizontal bars we need wider left margin for brand labels
      const margin = { top: 20, right: 30, bottom: 50, left: 180 };
      const width = container.clientWidth - margin.left - margin.right;
      const height = Math.max(400, data.length * 36) - margin.top - margin.bottom;

      const svg = d3.select(container)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const maxEnergy = d3.max(data, d => d.energy);

      const xScale = d3.scaleLinear()
        .domain([0, maxEnergy * 1.05])
        .range([0, width]);

      const yScale = d3.scaleBand()
        .domain(data.map(d => d.brand))
        .range([0, height])
        .padding(0.2);

      // Draw horizontal bars
      svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => yScale(d.brand))
        .attr("width", d => xScale(d.energy))
        .attr("height", yScale.bandwidth())
        .attr("fill", "#003366");

      // Add energy value labels to the end of bars
      svg.selectAll(".value-label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "value-label")
        .text(d => `${Math.round(d.energy)} kWh`)
        .attr("x", d => xScale(d.energy) + 8)
        .attr("y", d => yScale(d.brand) + yScale.bandwidth() / 2)
        .attr("dominant-baseline", "middle")
        .style("font-size", "12px")
        .style("font-weight", "600")
        .style("fill", "#333");

      // Y axis (brands)
      svg.append("g")
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .style("font-size", "12px")
        .style("font-weight", "600");

      // X axis (energy)
      const xAxis = d3.axisBottom(xScale)
        .ticks(6)
        .tickFormat(d => `${d} kWh`);

      svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis)
        .selectAll("text")
        .style("font-size", "11px");

      // X axis label
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "13px")
        .style("fill", "#333")
        .text("Average Energy Consumption (kWh/year)");
    });
}

function renderMultiChart() {
  renderScatterPlot();
  renderDonutChart();
  renderTechBarChart();
  renderLineChart();
}

function clearChart(containerId) {
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = '';
}

function renderScatterPlot() {
  const container = document.getElementById('scatter-container');
  if (!container) return;
  clearChart('scatter-container');

  const width = container.clientWidth;
  const height = 360;
  const margin = { top: 25, right: 30, bottom: 50, left: 50 };

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  d3.csv('data/Ex5_TV_energy.csv', d => ({
    brand: d.brand,
    tech: d.screen_tech,
    size: +d.screensize,
    energy: +d.energy_consumpt,
    stars: +d.star2
  })).then(data => {
    const filtered = data.filter(d => d.stars > 0 && d.energy > 0);
    const xScale = d3.scaleLinear()
      .domain([d3.min(filtered, d => d.stars) - 0.5, d3.max(filtered, d => d.stars) + 0.5])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(filtered, d => d.energy) * 1.05])
      .range([innerHeight, 0]);

    svg.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(8));

    svg.append('g')
      .call(d3.axisLeft(yScale).ticks(6));

    svg.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', '#333')
      .attr('font-size', '12px')
      .text('Star Rating');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -34)
      .attr('text-anchor', 'middle')
      .attr('fill', '#333')
      .attr('font-size', '12px')
      .text('Energy Consumption (kWh)');

    svg.append('g')
      .selectAll('circle')
      .data(filtered)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.stars) + (Math.random() - 0.5) * 0.25)
      .attr('cy', d => yScale(d.energy))
      .attr('r', 5)
      .attr('fill', '#1f78b4')
      .attr('opacity', 0.85);
  }).catch(error => {
    d3.select(container).append('p').text('Error loading scatter plot data.');
    console.error(error);
  });
}

function renderDonutChart() {
  const container = document.getElementById('donut-container');
  if (!container) return;
  clearChart('donut-container');

  const width = container.clientWidth;
  const height = 360;
  const radius = Math.min(width, height) / 2 - 40;

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${width / 2}, ${height / 2})`);

  const color = d3.scaleOrdinal()
    .domain(['LCD', 'LED', 'OLED'])
    .range(['#4caf50', '#2196f3', '#ff9800']);

  d3.csv('data/Ex5_TV_energy_Allsizes_byScreenType.csv', d => ({
    tech: d.Screen_Tech,
    energy: +d['Mean(Labelled energy consumption (kWh/year))']
  })).then(data => {
    const pie = d3.pie().value(d => d.energy);
    const arc = d3.arc().innerRadius(radius * 0.55).outerRadius(radius);
    const outerArc = d3.arc().innerRadius(radius * 0.9).outerRadius(radius * 0.9);

    svg.selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.tech))
      .attr('stroke', 'white')
      .attr('stroke-width', 2);

    svg.selectAll('text')
      .data(pie(data))
      .enter()
      .append('text')
      .attr('transform', d => `translate(${outerArc.centroid(d)})`)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#333')
      .text(d => `${d.data.tech}: ${Math.round(d.data.energy)} kWh`);

    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '13px')
      .style('font-weight', '700')
      .text('Energy by Technology');
  }).catch(error => {
    d3.select(container).append('p').text('Error loading donut chart data.');
    console.error(error);
  });
}

function renderTechBarChart() {
  const container = document.getElementById('tech-bar-container');
  if (!container) return;
  clearChart('tech-bar-container');

  const width = container.clientWidth;
  const height = 360;
  const margin = { top: 30, right: 20, bottom: 50, left: 80 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  d3.csv('data/Ex5_TV_energy_55inchtv_byScreenType.csv', d => ({
    tech: d.Screen_Tech,
    energy: +d['Mean(Labelled energy consumption (kWh/year))']
  })).then(data => {
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.tech))
      .range([0, innerWidth])
      .padding(0.25);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.energy) * 1.1])
      .range([innerHeight, 0]);

    svg.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale));

    svg.append('g')
      .call(d3.axisLeft(yScale).ticks(6));

    svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.tech))
      .attr('y', d => yScale(d.energy))
      .attr('width', xScale.bandwidth())
      .attr('height', d => innerHeight - yScale(d.energy))
      .attr('fill', '#1f78b4');

    svg.selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('x', d => xScale(d.tech) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.energy) - 8)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#333')
      .text(d => Math.round(d.energy));
  }).catch(error => {
    d3.select(container).append('p').text('Error loading 55-inch bar chart data.');
    console.error(error);
  });
}

function renderLineChart() {
  const container = document.getElementById('line-container');
  if (!container) return;
  clearChart('line-container');

  const width = container.clientWidth;
  const height = 360;
  const margin = { top: 30, right: 40, bottom: 50, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  d3.csv('data/Ex5_ARE_Spot_Prices.csv', d => ({
    year: +d.Year,
    avg: +d['Average Price (notTas-Snowy)']
  })).then(data => {
    const filtered = data.filter(d => !isNaN(d.year) && !isNaN(d.avg));

    const xScale = d3.scaleLinear()
      .domain(d3.extent(filtered, d => d.year))
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(filtered, d => d.avg) * 1.1])
      .range([innerHeight, 0]);

    const line = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.avg));

    svg.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(8).tickFormat(d3.format('d')));

    svg.append('g')
      .call(d3.axisLeft(yScale).ticks(6));

    svg.append('path')
      .datum(filtered)
      .attr('fill', 'none')
      .attr('stroke', '#e6550d')
      .attr('stroke-width', 3)
      .attr('d', line);

    svg.selectAll('.dot')
      .data(filtered)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.year))
      .attr('cy', d => yScale(d.avg))
      .attr('r', 3.5)
      .attr('fill', '#e6550d');
  }).catch(error => {
    d3.select(container).append('p').text('Error loading line chart data.');
    console.error(error);
  });
}

function renderHistogram() {
  const container = document.getElementById('histogram-container');
  if (!container) return;
  clearChart('histogram-container');

  d3.csv('data/Ex6_TVdata.csv', d => ({
    brand: d.brand,
    model: d.model,
    size: +d.screenSize,
    tech: d.screenTech,
    energy: +d.energyConsumption,
    stars: +d.star
  })).then(data => {
    let filtered = data.filter(d => !isNaN(d.energy));
    if (histogramCurrentTech && histogramCurrentTech !== 'All') {
      filtered = filtered.filter(d => d.tech === histogramCurrentTech);
    }

    if (!filtered.length) {
      container.innerHTML = '<p>No data matches the selected technology.</p>';
      return;
    }

    const values = filtered.map(d => d.energy);
    const min = d3.min(values);
    const max = d3.max(values);
    const width = container.clientWidth;
    const height = 440;
    const margin = { top: 24, right: 28, bottom: 44, left: 52 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = d3.scaleLinear()
      .domain([Math.max(0, min * 0.9), max * 1.05])
      .range([0, innerWidth])
      .nice();

    const bins = d3.bin()
      .domain(xScale.domain())
      .thresholds(10)(values);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length)])
      .range([innerHeight, 0])
      .nice();

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    svg.append('g')
      .selectAll('rect')
      .data(bins)
      .enter()
      .append('rect')
      .attr('x', d => xScale(d.x0) + 1)
      .attr('y', d => yScale(d.length))
      .attr('width', d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 2))
      .attr('height', d => innerHeight - yScale(d.length))
      .attr('fill', '#2563eb')
      .attr('rx', 6)
      .attr('opacity', 0.95);

    svg.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(8).tickFormat(d => `${d} kWh`))
      .selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#334155');

    svg.append('g')
      .call(d3.axisLeft(yScale).ticks(6))
      .selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#334155');

    const mean = d3.mean(values);
    const median = d3.median(values);

    svg.append('line')
      .attr('x1', xScale(mean))
      .attr('x2', xScale(mean))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#1f78b4')
      .attr('stroke-dasharray', '4 3')
      .attr('stroke-width', 2);

    svg.append('line')
      .attr('x1', xScale(median))
      .attr('x2', xScale(median))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#16a34a')
      .attr('stroke-dasharray', '4 3')
      .attr('stroke-width', 2);

    svg.append('text')
      .attr('x', xScale(mean))
      .attr('y', -8)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#1f78b4')
      .text('Mean');

    svg.append('text')
      .attr('x', xScale(median))
      .attr('y', -8)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#16a34a')
      .text('Median');

    initializeHistogramControls();
  }).catch(error => {
    d3.select(container).append('p').text('Error loading histogram data.');
    console.error(error);
  });
}

function initializeHistogramControls() {
  const buttons = document.querySelectorAll('.histogram-filter-button');
  if (!buttons.length) return;

  buttons.forEach(button => {
    if (button.hasAttribute('data-histogram-listener')) return;
    button.addEventListener('click', () => {
      histogramCurrentTech = button.dataset.tech;
      buttons.forEach(btn => btn.classList.toggle('active', btn === button));
      renderHistogram();
    });
    button.setAttribute('data-histogram-listener', 'true');
  });
}

function loadCSV() {
    fetch("data.csv")
        .then(response => response.text())
        .then(text => {
            let rows = text.split("\n");

            rows.forEach((row, index) => {
                if (index === 0) return;

                let cols = row.split(",");

                if (cols.length < 4) return;

                let page = cols[0].trim();
                let item = cols[1].trim();
                let power = cols[2].trim();
                let hours = cols[3].trim();

                if (dataStore[page]) {
                    dataStore[page].push({ item, power, hours });
                }
            });

            renderTables();
        });
}

function renderTables() {
    ["home", "tv", "about", "story"].forEach(page => {
        let table = document.getElementById(page + "Table");
        if (!table) return;

        table.innerHTML = "";

        dataStore[page].forEach(d => {
            let row = `<tr>
                <td>${d.item}</td>
                <td>${d.power}</td>
                <td>${d.hours}</td>
            </tr>`;
            table.innerHTML += row;
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const widget = document.getElementById("key-questions-widget");

  // If the widget isn't on the page, do nothing
  if (!widget) return;

  // Set up the Intersection Observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // When the widget enters the viewport
      if (entry.isIntersecting) {
        // Add the class that triggers the CSS transitions
        entry.target.classList.add("is-visible");
        
        // Stop observing once the animation has been triggered
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.2 // Trigger when 20% of the element is visible
  });

  // Start watching the widget
  observer.observe(widget);
});


loadCSV();
