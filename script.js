const API_URL = "http://localhost:3000/api";
let chart;

// 1. Initial Load: Fetch data from MySQL
async function init() {
    try {
        // Get Config
        const configRes = await fetch(`${API_URL}/config`);
        const config = await configRes.json();
        if (config) {
            document.getElementById('days').value = config.days || 30;
            document.getElementById('rate').value = config.rate || 8;
            document.getElementById('fixed').value = config.fixed_charge || 150;
            document.getElementById('tax').value = config.tax || 5;
        }

        // Get Appliances
        const appRes = await fetch(`${API_URL}/appliances`);
        const appliances = await appRes.json();
        
        const container = document.getElementById('cards');
        container.innerHTML = '';
        
        if (appliances.length > 0) {
            appliances.forEach(app => renderApplianceUI(app));
        }
        
        calculate();
    } catch (err) {
        console.error("Connection to server failed. Make sure server.js is running.");
    }
}

// 2. Render a card into the UI
function renderApplianceUI(app) {
    const html = `
    <div class="glass rounded-3xl p-6 appliance-card border border-white/5" data-id="${app.id}">
        <div class="grid md:grid-cols-5 gap-4">
            <div>
                <label class="text-[10px] uppercase font-bold text-slate-500">Device Name</label>
                <input type="text" class="name input mt-1 w-full rounded-xl p-3 text-sm" value="${app.name}" oninput="save(${app.id})">
            </div>
            <div>
                <label class="text-[10px] uppercase font-bold text-slate-500">Watts</label>
                <input type="number" class="power input mt-1 w-full rounded-xl p-3 text-sm" value="${app.power}" oninput="save(${app.id})">
            </div>
            <div>
                <label class="text-[10px] uppercase font-bold text-slate-500">Hrs/Day</label>
                <input type="number" class="hours input mt-1 w-full rounded-xl p-3 text-sm" value="${app.hours}" oninput="save(${app.id})">
            </div>
            <div>
                <label class="text-[10px] uppercase font-bold text-slate-500">Qty</label>
                <input type="number" class="qty input mt-1 w-full rounded-xl p-3 text-sm" value="${app.qty}" oninput="save(${app.id})">
            </div>
            <div class="flex items-end">
                <button onclick="remove(${app.id})" class="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl py-3 text-sm font-bold transition">Remove</button>
            </div>
        </div>
    </div>`;
    document.getElementById('cards').insertAdjacentHTML('beforeend', html);
}

// 3. Add New (Database First)
async function addNewAppliance() {
    const newApp = { name: "New Device", power: 100, hours: 5, qty: 1 };
    
    const res = await fetch(`${API_URL}/appliances`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(newApp)
    });
    const result = await res.json();
    
    renderApplianceUI({ id: result.id, ...newApp });
    calculate();
}

// 4. Save to Database & Recalculate
async function save(id) {
    const card = document.querySelector(`[data-id="${id}"]`);
    const data = {
        id: id,
        name: card.querySelector('.name').value,
        power: parseFloat(card.querySelector('.power').value) || 0,
        hours: parseFloat(card.querySelector('.hours').value) || 0,
        qty: parseFloat(card.querySelector('.qty').value) || 0
    };

    await fetch(`${API_URL}/appliances`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });

    calculate();
}

// 5. The Main Calculation Logic
function calculate() {
    const days = parseFloat(document.getElementById('days').value) || 0;
    const rate = parseFloat(document.getElementById('rate').value) || 0;
    const fixed = parseFloat(document.getElementById('fixed').value) || 0;
    const taxP = parseFloat(document.getElementById('tax').value) || 0;

    const cards = document.querySelectorAll('.appliance-card');
    let totalUnits = 0;
    let labels = [];
    let values = [];

    cards.forEach(card => {
        const p = parseFloat(card.querySelector('.power').value) || 0;
        const h = parseFloat(card.querySelector('.hours').value) || 0;
        const q = parseFloat(card.querySelector('.qty').value) || 0;
        const n = card.querySelector('.name').value || "Device";

        const units = (p * h * q * days) / 1000;
        totalUnits += units;
        
        labels.push(n);
        values.push(units);
    });

    const energyCost = totalUnits * rate;
    const taxAmt = (energyCost + fixed) * (taxP / 100);
    const grandTotal = energyCost + fixed + taxAmt;

    // Update UI
    document.getElementById('unitsMetric').innerText = totalUnits.toFixed(1);
    document.getElementById('billMetric').innerText = "₹" + Math.round(grandTotal);
    document.getElementById('energyCost').innerText = "₹" + energyCost.toFixed(2);
    document.getElementById('fixedCost').innerText = "₹" + fixed.toFixed(2);
    document.getElementById('taxCost').innerText = "₹" + taxAmt.toFixed(2);
    document.getElementById('finalBill').innerText = "₹" + Math.round(grandTotal);

    updateChart(labels, values);
}

// 6. Delete
async function remove(id) {
    await fetch(`${API_URL}/appliances/${id}`, { method: 'DELETE' });
    document.querySelector(`[data-id="${id}"]`).remove();
    calculate();
}

// 7. Config Auto-Save
['days', 'rate', 'fixed', 'tax'].forEach(id => {
    document.getElementById(id).addEventListener('input', async () => {
        const config = {
            days: document.getElementById('days').value,
            rate: document.getElementById('rate').value,
            fixed: document.getElementById('fixed').value,
            tax: document.getElementById('tax').value
        };
        await fetch(`${API_URL}/config`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(config)
        });
        calculate();
    });
});

// 8. Chart Update
function updateChart(labels, values) {
    const ctx = document.getElementById('chart').getContext('2d');
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#a855f7'],
                borderWidth: 0
            }]
        },
        options: {
            plugins: { legend: { display: true, position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } } }
        }
    });
}

// Start
init();