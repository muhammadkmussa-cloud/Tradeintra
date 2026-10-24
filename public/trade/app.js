(() => {
  "use strict";

  const START_BALANCE = 10000;
  const PAYOUT_RATE = 1.95;
  const storageKey = "tradeintra-demo-v1";
  const params = new URLSearchParams(window.location.search);
  const apiBase = window.location.hostname.endsWith("trade.tradeintra.com")
    ? "https://tradeintra.com"
    : "";
  const presetBase = `${apiBase}/deriv-presets`;
  const site = (params.get("site") || "").slice(0, 40);
  const routes = [
    "overview",
    "markets",
    "trade",
    "strategies",
    "signals",
    "reports",
    "learn",
    "settings",
  ];

  const presets = [
    {
      id: "1-3-2-6",
      name: "1-3-2-6",
      family: "stake",
      summary: "A four-step stake sequence that resets after a win.",
      risk: "Four consecutive losses can consume the whole sequence.",
      file: `${presetBase}/1_3_2_6.xml`,
    },
    {
      id: "dalembert",
      name: "D’Alembert",
      family: "recovery",
      summary:
        "Raises the stake by one unit after a loss and lowers it after a win.",
      risk: "Long losing runs can outgrow the account.",
      file: `${presetBase}/dalembert.xml`,
    },
    {
      id: "dalembert-max",
      name: "D’Alembert · max stake",
      family: "recovery",
      summary: "D’Alembert with an explicit maximum stake guardrail.",
      risk: "A cap limits runaway stakes but not market risk.",
      file: `${presetBase}/dalembert_max-stake.xml`,
    },
    {
      id: "martingale",
      name: "Martingale",
      family: "recovery",
      summary: "Doubles the stake after a loss and resets after a win.",
      risk: "High risk. A short losing streak can exceed the balance.",
      file: `${presetBase}/martingale.xml`,
    },
    {
      id: "martingale-max",
      name: "Martingale · max stake",
      family: "recovery",
      summary: "Martingale with an explicit maximum stake guardrail.",
      risk: "High risk. The cap can stop recovery; losses remain.",
      file: `${presetBase}/martingale_max-stake.xml`,
    },
    {
      id: "oscars",
      name: "Oscar’s Grind",
      family: "target",
      summary:
        "Raises the stake by one unit after a win until a session target.",
      risk: "Recovery can be slow and requires discipline.",
      file: `${presetBase}/oscars_grind.xml`,
    },
    {
      id: "oscars-max",
      name: "Oscar’s Grind · max stake",
      family: "target",
      summary: "Oscar’s Grind with an explicit maximum stake guardrail.",
      risk: "The target is not guaranteed. Stop at the loss limit.",
      file: `${presetBase}/oscars_grind_max-stake.xml`,
    },
    {
      id: "reverse-dalembert",
      name: "Reverse D’Alembert",
      family: "stake",
      summary: "Increases the stake after a win and reduces it after a loss.",
      risk: "Winning streaks reverse quickly. Cap exposure.",
      file: `${presetBase}/reverse_dalembert.xml`,
    },
    {
      id: "reverse-martingale",
      name: "Reverse Martingale",
      family: "stake",
      summary: "Doubles the stake after a win and resets after a loss.",
      risk: "A single loss can give back several wins.",
      file: `${presetBase}/reverse_martingale.xml`,
    },
  ];

  const marketSeed = [
    {
      id: "v100",
      name: "Volatility 100 Index",
      base: 1452.38,
      decimals: 2,
      vol: 0.006,
    },
    {
      id: "v75",
      name: "Volatility 75 Index",
      base: 875.21,
      decimals: 2,
      vol: 0.005,
    },
    {
      id: "v50",
      name: "Volatility 50 Index",
      base: 2341.65,
      decimals: 2,
      vol: 0.004,
    },
    {
      id: "v25",
      name: "Volatility 25 Index",
      base: 642.18,
      decimals: 3,
      vol: 0.003,
    },
    { id: "step", name: "Step Index", base: 9032.4, decimals: 1, vol: 0.002 },
    {
      id: "range",
      name: "Range Break 100 Index",
      base: 512.76,
      decimals: 3,
      vol: 0.0035,
    },
  ];

  const state = {
    balance: START_BALANCE,
    selected: marketSeed[0].id,
    markets: {},
    positions: [],
    history: [],
    ticks: 0,
    view: "overview",
    strategyFilter: "all",
  };

  marketSeed.forEach((market) => {
    const points = [];
    let value = market.base;
    for (let i = 0; i < 90; i += 1) {
      value += (Math.random() - 0.5) * market.base * market.vol;
      points.push(Number(value.toFixed(market.decimals)));
    }
    state.markets[market.id] = { ...market, points };
  });

  const $ = (id) => document.getElementById(id);
  const money = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  const price = (market, value) =>
    Number(value).toLocaleString("en-US", {
      minimumFractionDigits: market.decimals,
      maximumFractionDigits: market.decimals,
    });
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function rgb(hex) {
    return [1, 3, 5].map(
      (offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255,
    );
  }
  function luminance(hex) {
    const channels = rgb(hex).map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  }
  function contrast(a, b) {
    const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (high + 0.05) / (low + 0.05);
  }
  function mix(hex, target, amount) {
    const a = rgb(hex);
    const b = rgb(target);
    return `#${a
      .map((value, index) =>
        Math.round(value * (1 - amount) + b[index] * amount)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")}`;
  }
  function lift(hex, background) {
    if (contrast(hex, background) >= 5) return hex;
    for (let amount = 0.05; amount <= 1; amount += 0.05) {
      const next = mix(hex, "#ffffff", amount);
      if (contrast(next, background) >= 5) return next;
    }
    return "#ffffff";
  }
  function darken(hex) {
    if (contrast(hex, "#f2efe6") >= 5) return hex;
    for (let amount = 0.05; amount <= 1; amount += 0.05) {
      const next = mix(hex, "#1a151d", amount);
      if (contrast(next, "#f2efe6") >= 5) return next;
    }
    return "#1a151d";
  }
  function applyBranding() {
    const name = (params.get("name") || "Tradeintra Demo").slice(0, 60);
    const accent = (params.get("accent") || "").replace(/[^0-9a-f]/gi, "");
    const theme = params.get("theme") === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    if (/^[0-9a-f]{6}$/i.test(accent)) {
      const value = `#${accent}`;
      document.documentElement.style.setProperty("--accent", value);
      document.documentElement.style.setProperty(
        "--accent-text-dark",
        lift(value, "#141019"),
      );
      document.documentElement.style.setProperty(
        "--accent-text-light",
        darken(value),
      );
      document.documentElement.style.setProperty(
        "--accent-ink",
        contrast("#0d000a", value) >= 4.5 ? "#0d000a" : "#ffffff",
      );
      document.documentElement.style.setProperty(
        "--accent-text",
        theme === "light" ? darken(value) : lift(value, "#141019"),
      );
    }
    $("operator-name").textContent = `${name} · Demo`;
    $("site-slug").textContent = site || "demo";
    document.title = `${name} — Demo trading`;
    if (site && site !== "demo") {
      const base = window.location.hostname.endsWith("trade.tradeintra.com")
        ? "https://tradeintra.com"
        : "";
      const logo = $("brand-logo");
      const fallback = $("brand-mark");
      logo.onload = () => {
        logo.hidden = false;
        fallback.hidden = true;
      };
      logo.onerror = () => {
        logo.hidden = true;
        fallback.hidden = false;
      };
      logo.src = `${base}/api/site-logo/${encodeURIComponent(site)}`;
    }
  }

  function restore() {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (Number.isFinite(saved.balance)) state.balance = saved.balance;
      if (Array.isArray(saved.history))
        state.history = saved.history.slice(0, 20);
    } catch {
      // Start clean when storage is unavailable or corrupt.
    }
  }

  function persist() {
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          balance: state.balance,
          history: state.history.slice(0, 20),
        }),
      );
    } catch {
      // Storage is optional.
    }
  }

  function currentMarket() {
    return state.markets[state.selected];
  }

  function notice(message, tone = "neutral") {
    const node = $("trade-status");
    if (!node) return;
    node.textContent = message;
    node.dataset.tone = tone;
    window.clearTimeout(notice.timer);
    notice.timer = window.setTimeout(() => {
      node.textContent = "";
    }, 4200);
  }

  function changeFor(market) {
    const points = market.points;
    const first = points[0];
    const last = points[points.length - 1];
    return ((last - first) / first) * 100;
  }

  function drawChart(canvas, market) {
    if (!canvas || canvas.offsetParent === null) return;
    const points = market.points;
    const last = points[points.length - 1];
    const first = points[0];
    const max = Math.max(...points);
    const min = Math.min(...points);
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);
    const pad = { left: 4, right: 8, top: 12, bottom: 10 };
    const span = max - min || 1;
    const x = (index) =>
      pad.left +
      (index / (points.length - 1)) * (rect.width - pad.left - pad.right);
    const y = (value) =>
      pad.top + ((max - value) / span) * (rect.height - pad.top - pad.bottom);

    const grid =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--line")
        .trim() || "#ffffff14";
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i += 1) {
      const lineY = pad.top + (i / 3) * (rect.height - pad.top - pad.bottom);
      ctx.beginPath();
      ctx.moveTo(pad.left, lineY);
      ctx.lineTo(rect.width - pad.right, lineY);
      ctx.stroke();
    }

    const accent =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--accent")
        .trim() || "#fedd00";
    const gradient = ctx.createLinearGradient(0, pad.top, 0, rect.height);
    gradient.addColorStop(0, `${accent}42`);
    gradient.addColorStop(1, `${accent}00`);
    ctx.beginPath();
    points.forEach((value, index) => {
      const px = x(index);
      const py = y(value);
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.lineTo(x(points.length - 1), rect.height - pad.bottom);
    ctx.lineTo(x(0), rect.height - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.beginPath();
    points.forEach((value, index) => {
      const px = x(index);
      const py = y(value);
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x(points.length - 1), y(last), 3.5, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
    return { last, first };
  }

  function renderCharts() {
    const market = currentMarket();
    const trade = drawChart($("chart"), market);
    if (trade) {
      $("chart-title").textContent = market.name;
      $("chart-price").textContent = price(market, trade.last);
      const change = ((trade.last - trade.first) / trade.first) * 100;
      const node = $("chart-change");
      node.textContent = `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`;
      node.className = `change ${change >= 0 ? "up" : "down"}`;
      $("scale-high").textContent =
        `High ${price(market, Math.max(...market.points))}`;
      $("scale-low").textContent =
        `Low ${price(market, Math.min(...market.points))}`;
    }
    drawChart($("overview-chart"), market);
    $("overview-chart-title").textContent = market.name;
    $("overview-chart-price").textContent = price(
      market,
      market.points[market.points.length - 1],
    );
  }

  function selectMarket(id) {
    state.selected = id;
    renderTradeWatchlist();
    renderCharts();
    renderTicket();
  }

  function renderTradeWatchlist() {
    const list = $("market-list");
    if (list.contains(document.activeElement)) return;
    list.replaceChildren();
    marketSeed.forEach((seed) => {
      const market = state.markets[seed.id];
      const last = market.points[market.points.length - 1];
      const previous = market.points[market.points.length - 2] ?? last;
      const button = element(
        "button",
        `market-button ${seed.id === state.selected ? "active" : ""}`,
      );
      button.type = "button";
      button.setAttribute("aria-pressed", String(seed.id === state.selected));
      const copy = element("span");
      copy.append(
        element("strong", "", seed.name),
        element("small", "", "Simulated · 1 tick"),
      );
      const right = element("span", "price", price(seed, last));
      right.style.color =
        last >= previous ? "var(--positive)" : "var(--negative)";
      button.append(copy, right);
      button.addEventListener("click", () => selectMarket(seed.id));
      list.append(button);
    });
  }

  function renderOverviewMarkets() {
    const container = $("overview-markets");
    if (container.contains(document.activeElement)) return;
    container.replaceChildren();
    marketSeed.slice(0, 4).forEach((seed) => {
      const market = state.markets[seed.id];
      const change = changeFor(market);
      const row = element("button", "overview-market");
      row.type = "button";
      const copy = element("span");
      copy.append(
        element("span", "", seed.name),
        element("small", "", "Simulated market"),
      );
      const right = element(
        "strong",
        "",
        price(seed, market.points[market.points.length - 1]),
      );
      right.style.color = change >= 0 ? "var(--positive)" : "var(--negative)";
      row.append(copy, right);
      row.addEventListener("click", () => {
        selectMarket(seed.id);
        setView("trade");
      });
      container.append(row);
    });
  }

  function renderMarketTable() {
    const container = $("market-table");
    if (container.contains(document.activeElement)) return;
    container.replaceChildren();
    const header = element("div", "market-row head");
    ["Market", "Price", "Change", ""].forEach((label) =>
      header.append(element("span", "", label)),
    );
    container.append(header);
    marketSeed.forEach((seed) => {
      const market = state.markets[seed.id];
      const change = changeFor(market);
      const row = element("div", "market-row");
      row.append(
        element("span", "", seed.name),
        element(
          "strong",
          "",
          price(seed, market.points[market.points.length - 1]),
        ),
        element(
          "small",
          change >= 0 ? "up" : "down",
          `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
        ),
      );
      const action = element("button", "", "Trade");
      action.type = "button";
      action.addEventListener("click", () => {
        selectMarket(seed.id);
        setView("trade");
      });
      row.append(action);
      container.append(row);
    });
  }

  function renderStrategies() {
    const filters = $("strategy-filters");
    filters.replaceChildren();
    ["all", "stake", "recovery", "target"].forEach((family) => {
      const button = element(
        "button",
        state.strategyFilter === family ? "active" : "",
        family === "all" ? "All presets" : family,
      );
      button.type = "button";
      button.setAttribute(
        "aria-pressed",
        String(state.strategyFilter === family),
      );
      button.addEventListener("click", () => {
        state.strategyFilter = family;
        renderStrategies();
      });
      filters.append(button);
    });
    const grid = $("strategy-grid");
    grid.replaceChildren();
    presets
      .filter(
        (preset) =>
          state.strategyFilter === "all" ||
          preset.family === state.strategyFilter,
      )
      .forEach((preset) => {
        const card = element("article", "strategy-card");
        card.append(
          element("span", "", preset.family),
          element("h2", "", preset.name),
          element("p", "", preset.summary),
          element("small", "", preset.risk),
        );
        const link = element("a", "", "Open preset XML →");
        link.href = preset.file;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        card.append(link);
        grid.append(card);
      });
  }

  function renderOverviewStrategies() {
    const container = $("overview-strategies");
    container.replaceChildren();
    presets.slice(0, 3).forEach((preset) => {
      const row = element("a", "overview-strategy");
      row.href = preset.file;
      row.target = "_blank";
      row.rel = "noopener noreferrer";
      const copy = element("span");
      copy.append(
        element("span", "", preset.name),
        element("small", "", `${preset.family} · review risk`),
      );
      row.append(copy, element("strong", "", "XML"));
      container.append(row);
    });
  }

  function renderSignals() {
    const container = $("signal-list");
    container.replaceChildren();
    marketSeed.slice(0, 4).forEach((seed) => {
      const market = state.markets[seed.id];
      const change = changeFor(market);
      const card = element("article", "signal-card");
      card.append(
        element("span", "", "SIMULATED OBSERVATION"),
        element(
          "h2",
          "",
          `${seed.name} moved ${change >= 0 ? "up" : "down"} ${Math.abs(change).toFixed(2)}%`,
        ),
        element(
          "p",
          "",
          "Generated from the local demo stream. This is not a recommendation, signal subscription, or performance claim.",
        ),
        element("small", "", `Tick ${state.ticks} · demo only`),
      );
      container.append(card);
    });
  }

  function renderHistory() {
    const container = $("history");
    container.replaceChildren();
    const header = element("div", "history-row head");
    ["Market", "Direction", "Stake", "Result", "P/L"].forEach((label) =>
      header.append(element("span", "", label)),
    );
    container.append(header);
    if (!state.history.length) {
      container.append(
        element("p", "empty-state", "No settled demo trades yet."),
      );
      return;
    }
    state.history.forEach((trade) => {
      const row = element("div", "history-row");
      [
        trade.marketName,
        trade.direction.toUpperCase(),
        money(trade.stake),
        trade.won ? "Win" : "Loss",
        `${trade.pnl >= 0 ? "+" : ""}${money(trade.pnl)}`,
      ].forEach((value, index) => {
        const cell = element("span", "", value);
        if (index === 4)
          cell.style.color =
            trade.pnl >= 0 ? "var(--positive)" : "var(--negative)";
        row.append(cell);
      });
      container.append(row);
    });
  }

  function renderOverviewRecent() {
    const container = $("overview-recent");
    container.replaceChildren();
    if (!state.history.length) {
      container.append(
        element("p", "empty-state", "No settled demo trades yet."),
      );
      return;
    }
    state.history.slice(0, 4).forEach((trade) => {
      const row = element("div", "overview-trade");
      const copy = element("span");
      copy.append(
        element("span", "", trade.marketName),
        element(
          "small",
          "",
          `${trade.direction.toUpperCase()} · ${trade.won ? "Win" : "Loss"}`,
        ),
      );
      const pnl = element(
        "strong",
        "",
        `${trade.pnl >= 0 ? "+" : ""}${money(trade.pnl)}`,
      );
      pnl.style.color = trade.pnl >= 0 ? "var(--positive)" : "var(--negative)";
      row.append(copy, pnl);
      container.append(row);
    });
  }

  function renderReportMetrics() {
    const wins = state.history.filter((trade) => trade.won).length;
    const losses = state.history.length - wins;
    const pnl = state.history.reduce((sum, trade) => sum + trade.pnl, 0);
    $("report-wins").textContent = String(wins);
    $("report-losses").textContent = String(losses);
    $("report-pnl").textContent = `${pnl >= 0 ? "+" : ""}${money(pnl)}`;
    $("report-total").textContent = String(state.history.length);
    $("overview-trades").textContent = String(state.history.length);
    $("overview-pnl").textContent = `${pnl >= 0 ? "+" : ""}${money(pnl)}`;
  }

  function renderBalance() {
    $("balance").textContent = money(state.balance);
    $("overview-balance").textContent = money(state.balance);
    $("overview-open").textContent = String(state.positions.length);
    $("position-count").textContent = `${state.positions.length} open`;
    renderPositions();
    renderPayout();
    renderReportMetrics();
  }

  function renderPayout() {
    $("payout").textContent = money(clampStake() * PAYOUT_RATE);
  }

  function clampStake() {
    const raw = Number($("stake").value);
    return Number.isFinite(raw) ? Math.min(1000, Math.max(1, raw)) : 1;
  }

  function renderTicket() {
    const market = currentMarket();
    const last = market.points[market.points.length - 1];
    $("rise-price").textContent = price(market, last);
    $("fall-price").textContent = price(market, last);
    renderPayout();
  }

  function renderPositions() {
    const container = $("positions");
    container.replaceChildren();
    if (!state.positions.length) {
      container.append(
        element(
          "p",
          "empty-state",
          "No open demo contracts. Choose Rise or Fall to begin.",
        ),
      );
      return;
    }
    state.positions.forEach((position) => {
      const row = element("div", "position");
      const copy = element("span");
      copy.append(
        element(
          "strong",
          "",
          `${position.direction.toUpperCase()} ${position.marketName}`,
        ),
        element("br"),
        element(
          "small",
          "",
          `Stake ${money(position.stake)} · entry ${position.entry} · ${position.remaining} ticks left`,
        ),
      );
      row.append(
        copy,
        element("span", "position-result", "Running"),
        element("span", "", money(position.stake * PAYOUT_RATE)),
      );
      container.append(row);
    });
  }

  function buy(direction) {
    const stake = clampStake();
    if (state.balance < stake) {
      notice("Demo balance is too low for that stake.", "error");
      return;
    }
    const market = currentMarket();
    const entry = market.points[market.points.length - 1];
    const ticks = Number($("duration").value) || 10;
    state.balance = Number((state.balance - stake).toFixed(2));
    state.positions.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      marketId: market.id,
      marketName: market.name,
      direction,
      stake,
      entry: price(market, entry),
      entryValue: entry,
      remaining: ticks,
    });
    renderBalance();
    notice(
      `${direction === "rise" ? "Rise" : "Fall"} demo contract opened for ${money(stake)}.`,
      "ok",
    );
    persist();
  }

  function settlePositions() {
    if (!state.positions.length) return;
    const stillOpen = [];
    state.positions.forEach((position) => {
      position.remaining -= 1;
      if (position.remaining > 0) {
        stillOpen.push(position);
        return;
      }
      const market = state.markets[position.marketId];
      const finalValue = market.points[market.points.length - 1];
      const won =
        position.direction === "rise"
          ? finalValue > position.entryValue
          : finalValue < position.entryValue;
      const payout = won
        ? Number((position.stake * PAYOUT_RATE).toFixed(2))
        : 0;
      state.balance = Number((state.balance + payout).toFixed(2));
      const pnl = Number((payout - position.stake).toFixed(2));
      state.history.unshift({
        marketName: position.marketName,
        direction: position.direction,
        stake: position.stake,
        won,
        pnl,
      });
      state.history = state.history.slice(0, 20);
    });
    state.positions = stillOpen;
    renderBalance();
    renderHistory();
    renderOverviewRecent();
    persist();
  }

  function tick() {
    state.ticks += 1;
    marketSeed.forEach((seed) => {
      const market = state.markets[seed.id];
      const last = market.points[market.points.length - 1];
      const drift = (Math.random() - 0.5) * last * market.vol;
      market.points.push(Number((last + drift).toFixed(seed.decimals)));
      if (market.points.length > 90) market.points.shift();
    });
    renderTradeWatchlist();
    renderOverviewMarkets();
    renderMarketTable();
    renderCharts();
    renderTicket();
    renderSignals();
    settlePositions();
  }

  function reset() {
    state.balance = START_BALANCE;
    state.positions = [];
    state.history = [];
    renderBalance();
    renderHistory();
    renderOverviewRecent();
    persist();
    notice("Demo balance and trade history reset.", "ok");
  }

  function exportCsv() {
    const rows = [
      ["market", "direction", "stake", "result", "pnl"],
      ...state.history.map((trade) => [
        trade.marketName,
        trade.direction,
        trade.stake,
        trade.won ? "win" : "loss",
        trade.pnl,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "tradeintra-demo-report.csv";
    link.click();
    URL.revokeObjectURL(url);
    notice("Demo report exported as CSV.", "ok");
  }

  async function loadDerivSession() {
    if (!site) return null;
    try {
      const response = await fetch(`${apiBase}/api/deriv/session`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) return null;
      const session = await response.json();
      if (!session.authenticated || session.site !== site) return null;
      const mode = $("account-mode");
      mode.textContent =
        session.mode === "mock" ? "Deriv demo session" : "Deriv session";
      $("login-button").textContent = "Sign out of Deriv";
      $("settings-login").hidden = true;
      $("settings-logout").hidden = false;
      $("deriv-status").textContent = session.account
        ? `Connected to Deriv ${session.account.login} · ${session.mode}`
        : "Deriv session connected.";
      return session;
    } catch {
      return null;
    }
  }

  async function logoutDeriv() {
    try {
      await fetch(`${apiBase}/api/deriv/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      window.location.reload();
    }
  }

  function startDerivLogin() {
    if (!site || site === "demo") {
      $("login-dialog").showModal();
      return;
    }
    window.location.href = `${apiBase}/api/deriv/oauth/start?site=${encodeURIComponent(site)}`;
  }

  function setView(view, updateHash = true) {
    const next = routes.includes(view) ? view : "overview";
    state.view = next;
    document.querySelectorAll("[data-view]").forEach((section) => {
      section.hidden = section.dataset.view !== next;
    });
    document.querySelectorAll("[data-route]").forEach((button) => {
      const active = button.dataset.route === next;
      button.classList.toggle("active", active);
      if (button.closest(".app-rail, .mobile-nav")) {
        if (active) button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
      }
    });
    if (updateHash && window.location.hash !== `#${next}`)
      window.location.hash = next;
    if (next === "overview") renderOverviewMarkets();
    if (next === "markets") renderMarketTable();
    if (next === "strategies") renderStrategies();
    if (next === "signals") renderSignals();
    if (next === "reports") renderHistory();
    renderCharts();
    window.scrollTo(0, 0);
  }

  function routeFromHash() {
    const view = window.location.hash.replace(/^#\/?/, "").split("?")[0];
    setView(view || "overview", false);
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.setProperty(
      "--accent-text",
      theme === "light"
        ? getComputedStyle(document.documentElement)
            .getPropertyValue("--accent-text-light")
            .trim()
        : getComputedStyle(document.documentElement)
            .getPropertyValue("--accent-text-dark")
            .trim(),
    );
    renderCharts();
  }

  $("refresh-button").addEventListener("click", () => {
    tick();
    notice("Simulated tick refreshed.", "neutral");
  });
  $("buy-rise").addEventListener("click", () => buy("rise"));
  $("buy-fall").addEventListener("click", () => buy("fall"));
  $("stake").addEventListener("input", renderPayout);
  $("duration").addEventListener("change", renderPayout);
  $("reset-button").addEventListener("click", reset);
  $("settings-reset").addEventListener("click", reset);
  $("export-button").addEventListener("click", exportCsv);

  document.addEventListener("click", (event) => {
    const route = event.target.closest("[data-route]");
    if (route) {
      event.preventDefault();
      setView(route.dataset.route);
      return;
    }
    const theme = event.target.closest("[data-theme-choice]");
    if (theme) setTheme(theme.dataset.themeChoice);
  });

  const dialog = $("login-dialog");
  let derivSession = null;
  $("login-button").addEventListener("click", () => {
    if (derivSession) void logoutDeriv();
    else startDerivLogin();
  });
  $("settings-login").addEventListener("click", startDerivLogin);
  $("settings-logout").addEventListener("click", () => void logoutDeriv());
  $("close-login").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  window.addEventListener("hashchange", routeFromHash);
  window.addEventListener("resize", renderCharts);

  applyBranding();
  restore();
  renderBalance();
  renderHistory();
  renderOverviewRecent();
  renderTradeWatchlist();
  renderOverviewMarkets();
  renderOverviewStrategies();
  renderStrategies();
  renderMarketTable();
  renderSignals();
  renderCharts();
  renderTicket();
  routeFromHash();
  loadDerivSession().then((session) => {
    derivSession = session;
    if (params.get("auth") === "1" && session)
      notice("Deriv demo session connected. Trading remains simulated.", "ok");
  });
  if (params.get("error") === "deriv-login")
    notice("Deriv sign-in was not completed. Try again.", "error");
  window.setInterval(tick, 2000);
})();
