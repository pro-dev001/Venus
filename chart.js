// // main.js
// const API = "http://127.0.0.1:5000"; // backend base
// const usernameKey = "venus_username"; // assume your login sets this; fallback
// let username = localStorage.getItem(usernameKey) || "demo_user";
// localStorage.setItem(usernameKey, username);

// const chartEl = document.getElementById("chart");
// const ctx = chartEl.getContext("2d");
// const pairSelect = document.getElementById("trade");
// const timerSelect = document.getElementById("timer");
// const amountSelect = document.getElementById("amount");
// const buyBtn = document.getElementById("buyBtn");
// const sellBtn = document.getElementById("sellBtn");
// const balanceDisplay = document.getElementById("balanceDisplay");
// const scrollbar = document.getElementById("scrollbar");

// let balance = 1000.0;
// let chart;
// let historyPerPair = {}; // store long histories per pair
// let activeTrades = {}; // trade_id => trade object (with timers)
// let chartTickInterval = 700; // ms base; we'll vary it

// // create long initial history for a pair
// function ensurePair(pair) {
//   if (historyPerPair[pair]) return;
//   const n = 2000; // very long history
//   let price = 1 + Math.random() * 0.5;
//   const times = [];
//   const values = [];
//   const now = Date.now();
//   for (let i = 0; i < n; i++) {
//     times.push(new Date(now - (n - i) * 1000));
//     price += (Math.random() - 0.5) * 0.01;
//     values.push(price);
//   }
//   historyPerPair[pair] = { times, values, rngSeed: Math.random() };
// }

// // build chart (Chart.js) with a single dataset for main line
// function buildChart(pair) {
//   ensurePair(pair);
//   const hist = historyPerPair[pair];
//   if (chart) chart.destroy();

//   chart = new Chart(ctx, {
//     type: "line",
//     data: {
//       labels: hist.times,
//       datasets: [
//         {
//           label: pair,
//           data: hist.values,
//           borderColor: "#ffffff",
//           borderWidth: 2,
//           pointRadius: 0,
//           fill: false,
//         },
//       ],
//     },
//     options: {
//       animation: false,
//       parsing: false,
//       normalized: true,
//       scales: {
//         x: {
//           type: "time",
//           time: { unit: "second" },
//           ticks: { color: "#cfcfcf" },
//           grid: { color: "rgba(255,255,255,0.06)" },
//         },
//         y: {
//           ticks: { color: "#cfcfcf" },
//           grid: { color: "rgba(0,120,255,0.06)" },
//         },
//       },
//       plugins: {
//         legend: { display: false },
//       },
//     },
//   });
// }

// // update chart by pushing a new point with variable speed
// function tickChart() {
//   const pair = pairSelect.value;
//   ensurePair(pair);
//   const hist = historyPerPair[pair];

//   // speed variation: choose slow/norm/fast randomly each tick
//   const speedChoice = Math.random();
//   let multiplier = 1;
//   if (speedChoice < 0.45) multiplier = 0.6;
//   else if (speedChoice < 0.85) multiplier = 1;
//   else multiplier = 1.8;

//   // step size depends on multiplier and the pair seed
//   const last = hist.values[hist.values.length - 1];
//   const step = (Math.random() - 0.5) * 0.01 * multiplier;
//   const next = last + step;

//   hist.times.push(new Date());
//   hist.values.push(next);

//   // keep long history - do not allow user to scroll to the end quickly
//   if (hist.times.length > 30000) { // extremely long cap
//     hist.times.splice(0, 1000);
//     hist.values.splice(0, 1000);
//   }

//   // update chart dataset
//   chart.data.labels = hist.times;
//   chart.data.datasets[0].data = hist.values;
//   chart.update("none");

//   // check active trades to update any countdowns on the page (frontend markers will be stored in DOM)
//   checkLocalTradeExpiries();
// }

// // draw horizontal entry line for a trade (keeps across dataset length)
// // We'll add a separate dataset for each active trade so it draws the line persistently.
// function drawTradeMarker(trade) {
//   // trade: { trade_id, pair, side, amount, entry, placed_at, expires_at }
//   const pair = trade.pair;
//   // only add marker to chart when viewing the same pair
//   if (pairSelect.value !== pair) return;

//   // horizontal series spanning chart currently visible range (we use labels first and last)
//   const labels = chart.data.labels;
//   const first = labels[0];
//   const last = labels[labels.length - 1];
//   const y = trade.entry;

//   // create dataset for marker; use dashed line from first to last label
//   const ds = {
//     label: `trade-${trade.trade_id}`,
//     data: [{ x: first, y }, { x: last, y }],
//     borderColor: trade.side === "buy" ? "lime" : "red",
//     borderWidth: 2,
//     borderDash: [6, 6],
//     pointRadius: 0,
//     fill: false,
//     // keep on top by giving high z
//     order: 99,
//   };
//   // remove existing same-trade dataset if present
//   chart.data.datasets = chart.data.datasets.filter(d => d.label !== ds.label);
//   chart.data.datasets.push(ds);
//   chart.update("none");
// }

// // remove a trade marker dataset when settled
// function removeTradeMarker(trade_id) {
//   chart.data.datasets = chart.data.datasets.filter(d => d.label !== `trade-${trade_id}`);
//   chart.update("none");
// }

// // update markers for all active trades for the visible pair
// function refreshAllMarkers() {
//   // clear previous marker datasets (those with label starting "trade-")
//   chart.data.datasets = chart.data.datasets.filter(d => !d.label || !String(d.label).startsWith("trade-"));
//   // add markers for active trades of this pair
//   for (const tId in activeTrades) {
//     const t = activeTrades[tId];
//     if (!t.settled) drawTradeMarker(t);
//   }
// }

// // place trade: call backend, debit immediately in UI, create local countdown and marker
// async function placeTrade(side) {
//   const amount = parseFloat(amountSelect.value);
//   const duration_seconds = parseInt(timerSelect.value);
//   const pair = pairSelect.value;
//   // entry price = last chart point
//   const hist = historyPerPair[pair];
//   const entry = hist.values[hist.values.length - 1];

//   // send to server
//   const payload = {
//     username,
//     side,
//     amount,
//     pair,
//     duration_seconds,
//     entry_price: entry
//   };
//   const res = await fetch(`${API}/place_trade`, {
//     method: "POST",
//     headers: {"Content-Type":"application/json"},
//     body: JSON.stringify(payload)
//   });
//   const j = await res.json();
//   if (!j.ok) {
//     alert(j.error || "Trade failed");
//     return;
//   }

//   // update local balance from server response
//   balance = j.new_balance;
//   updateBalanceUI();

//   // construct trade object and store locally
//   const trade = {
//     trade_id: j.trade_id,
//     username,
//     side, amount,
//     pair,
//     entry: parseFloat(j.entry_price || entry),
//     placed_at: j.placed_at,
//     expires_at: j.expires_at,
//     settled: false
//   };
//   activeTrades[trade.trade_id] = trade;

//   // draw marker and start countdown
//   drawTradeMarker(trade);
//   startCountdownForTrade(trade);
// }

// // restore active trades from backend on load
// async function restoreActiveTrades() {
//   const res = await fetch(`${API}/active_trades?username=${encodeURIComponent(username)}`);
//   const j = await res.json();
//   if (!j.ok) return;
//   for (const t of j.trades) {
//     t.settled = false;
//     activeTrades[t.trade_id] = t;
//     // ensure pair history exists
//     ensurePair(t.pair);
//     // if viewing same pair, draw marker
//     drawTradeMarker(t);
//     startCountdownForTrade(t);
//   }
// }

// // start a countdown element for an active trade; also show the remaining time
// function startCountdownForTrade(trade) {
//   // if already has DOM element, skip
//   const existing = document.getElementById(`countdown-${trade.trade_id}`);
//   if (existing) return;

//   // create a small DOM box under chart to show countdown
//   const box = document.createElement("div");
//   box.id = `countdown-${trade.trade_id}`;
//   box.style.position = "relative";
//   box.style.margin = "6px 0";
//   box.style.padding = "6px 10px";
//   box.style.background = "rgba(0,0,0,0.4)";
//   box.style.border = "1px solid rgba(255,255,255,0.06)";
//   box.style.color = "white";
//   box.style.fontSize = "13px";
//   box.style.display = "inline-block";
//   box.style.borderRadius = "6px";
//   box.innerText = `${trade.side.toUpperCase()} ${trade.amount} — Expires in ?s`;
//   // append below chart
//   chartEl.parentElement.appendChild(box);

//   // periodic updater until the trade is settled
//   function tick() {
//     // if trade is settled server-side, remove
//     if (!activeTrades[trade.trade_id] || activeTrades[trade.trade_id].settled) {
//       box.remove();
//       removeTradeMarker(trade.trade_id);
//       return;
//     }
//     const remainingMs = new Date(trade.expires_at).getTime() - Date.now();
//     if (remainingMs <= 0) {
//       box.innerText = `${trade.side.toUpperCase()} ${trade.amount} — settling...`;
//       // trigger server-side settle right away (frontend will call check_trades)
//       pollSettleTrades(); // tells server to settle expired trades
//       return;
//     } else {
//       const seconds = Math.ceil(remainingMs / 1000);
//       box.innerText = `${trade.side.toUpperCase()} ${trade.amount} — Expires in ${seconds}s`;
//       requestAnimationFrame(() => setTimeout(tick, 500));
//     }
//   }
//   tick();
// }

// // poll the server to settle expired trades and receive results
// async function pollSettleTrades() {
//   // call server check_trades (it will settle all expired trades)
//   const res = await fetch(`${API}/check_trades`, {
//     method: "POST",
//     headers: {"Content-Type":"application/json"},
//     body: JSON.stringify({ username })
//   });
//   const j = await res.json();
//   if (!j.ok) return;
//   // update local activeTrades based on results
//   for (const s of j.settled) {
//     const id = s.trade_id;
//     if (activeTrades[id]) {
//       activeTrades[id].settled = true;
//       activeTrades[id].result = s.result;
//       activeTrades[id].exit = s.exit;
//       // update UI: notify user and update balance by fetching current balance from server
//       if (s.result === "win") {
//         alert(`✅ Trade ${id} won — credited. Exit ${s.exit}`);
//       } else {
//         alert(`❌ Trade ${id} lost. Exit ${s.exit}`);
//       }
//       // remove marker and countdown
//       const el = document.getElementById(`countdown-${id}`);
//       if (el) el.remove();
//       removeTradeMarker(id);
//       // fetch fresh balance
//       await refreshBalanceFromServer();
//       delete activeTrades[id];
//     }
//   }
// }

// // refresh balance from server
// async function refreshBalanceFromServer() {
//   const res = await fetch(`${API}/get_balance?username=${encodeURIComponent(username)}`);
//   const j = await res.json();
//   if (j.ok) {
//     balance = j.balance;
//     updateBalanceUI();
//   }
// }

// function updateBalanceUI() {
//   balanceDisplay.innerHTML = `${balance.toFixed(2)} <span class="down">🔽</span>`;
// }

// // set up scrollbar so user can scrub timeline (very simple)
// function setupScrollBar() {
//   scrollbar.innerHTML = "";
//   const thumb = document.createElement("div");
//   thumb.style.height = "100%";
//   thumb.style.width = "10%";
//   thumb.style.background = "linear-gradient(90deg,#00ff88,#0088ff)";
//   thumb.style.borderRadius = "6px";
//   thumb.style.position = "relative";
//   thumb.style.left = "0";
//   thumb.style.cursor = "pointer";
//   scrollbar.appendChild(thumb);

//   let dragging = false;
//   let startX = 0;
//   let startLeft = 0;
//   thumb.addEventListener("mousedown", (e) => {
//     dragging = true;
//     startX = e.clientX;
//     startLeft = parseFloat(thumb.style.left) || 0;
//     document.body.style.userSelect = "none";
//   });
//   window.addEventListener("mousemove", (e) => {
//     if (!dragging) return;
//     const dx = e.clientX - startX;
//     let newLeft = Math.max(0, Math.min(90, startLeft + dx / 10));
//     thumb.style.left = `${newLeft}%`;
//     // compute scrub position relative to history length
//     const pair = pairSelect.value;
//     ensurePair(pair);
//     const hist = historyPerPair[pair];
//     const pct = newLeft / 90; // 0..1
//     const idx = Math.floor(pct * (hist.values.length - 1));
//     // move chart window so label idx ends up centered: we will slice a window of size ~600
//     const windowSize = 600;
//     const start = Math.max(0, Math.min(hist.values.length - windowSize, idx - Math.floor(windowSize/2)));
//     chart.data.labels = hist.times.slice(start, start + windowSize);
//     chart.data.datasets[0].data = hist.values.slice(start, start + windowSize);
//     chart.update("none");
//   });
//   window.addEventListener("mouseup", () => {
//     dragging = false;
//     document.body.style.userSelect = "";
//   });
// }

// // glue & events
// pairSelect.addEventListener("change", (e) => {
//   const pair = e.target.value;
//   if (!historyPerPair[pair]) ensurePair(pair);
//   buildChart(pair);
//   refreshAllMarkers();
// });

// buyBtn.addEventListener("click", () => placeTrade("buy"));
// sellBtn.addEventListener("click", () => placeTrade("sell"));

// // startup
// (async function init() {
//   await refreshBalanceFromServer();
//   ensurePair(pairSelect.value);
//   buildChart(pairSelect.value);
//   setupScrollBar();
//   // poll active trades and redraw
//   await restoreActiveTrades();
//   // tick chart variable speed: we'll call tickChart at randomized intervals
//   (function loopTick() {
//     tickChart();
//     // randomize next tick between 300ms and 1000ms
//     const nextMs = 300 + Math.random() * 700;
//     setTimeout(loopTick, nextMs);
//   })();

//   // poll server every 3s for settlements (and refresh active trades)
//   setInterval(async () => {
//     await pollSettleTrades();
//   }, 3000);

// })();
