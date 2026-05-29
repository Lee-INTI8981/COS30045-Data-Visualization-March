let dataStore = {
    home: [],
    tv: [],
    about: [],
    story: []
};

function showPage(pageId) {
    let pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.add('hidden'));

    document.getElementById(pageId).classList.remove('hidden');

    let navItems = document.querySelectorAll('nav li');
    navItems.forEach(n => n.classList.remove('active'));

    document.getElementById('nav-' + pageId).classList.add('active');

    // Render bar chart when visualization-barchart is shown
    if (pageId === 'visualization-barchart') {
      renderBarChart();
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
