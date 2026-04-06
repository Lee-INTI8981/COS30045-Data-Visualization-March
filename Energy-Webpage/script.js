let dataStore = {
    home: [],
    tv: [],
    about: []
};

function showPage(pageId) {
    let pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.add('hidden'));

    document.getElementById(pageId).classList.remove('hidden');

    let navItems = document.querySelectorAll('nav li');
    navItems.forEach(n => n.classList.remove('active'));

    document.getElementById('nav-' + pageId).classList.add('active');
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
    ["home", "tv", "about"].forEach(page => {
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

loadCSV();
