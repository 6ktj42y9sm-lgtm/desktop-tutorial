const STORAGE_KEY = "wayline-route-planner-v1";
const DEFAULT_SETTINGS = { stopTimerMinutes: 3, travelMinutesPerStop: 8, navigationApp: "google" };

const icon = (name) => {
  const paths = {
    route: '<path d="M5 19.5V17a3 3 0 0 1 3-3h7a3 3 0 0 0 3-3V9M8 6.5 5 9.5l3 3M16 6.5l3 3-3 3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    clock: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 7v5l3.2 2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.3" fill="none" stroke="currentColor" stroke-width="1.7"/>',
    people: '<path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.5 19c.5-2.8 2.3-4.2 5.5-4.2 1.1 0 2 .2 2.8.5M16 11a2.5 2.5 0 1 0 0-5M15 15c3.2 0 5 1.3 5.5 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    edit: '<path d="m14 5 5 5M5 19l4-.8L19 8.2 15.8 5 5.8 15 5 19Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
    copy: '<rect x="8" y="8" width="11" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" stroke-width="1.6"/>',
    nav: '<path d="m4 5 16-2-5 18-3.2-7.8L4 10l11-1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
    pickup: '<path d="M12 19V5m-5 5 5-5 5 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    dropoff: '<path d="M12 5v14m-5-5 5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    bus: '<path d="M5 17V7c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v10M5 13h14M8 17v2m8-2v2M8 9h.01M16 9h.01" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || ""}</svg>`;
};

const sampleRoutes = [
  {
    id: "route-northside",
    name: "Northside morning run",
    stops: [
      { id: "stop-ns-1", name: "Maple & 4th", address: "1220 Maple Street, Denver, CO", people: [{ id: "rider-ns-1", name: "Avery Brooks", direction: "pickup", note: "" }, { id: "rider-ns-2", name: "Riley Chen", direction: "pickup", note: "" }] },
      { id: "stop-ns-2", name: "Pinecrest Apartments", address: "800 E 12th Avenue, Denver, CO", people: [{ id: "rider-ns-3", name: "Sam Rivera", direction: "pickup", note: "" }] },
      { id: "stop-ns-3", name: "Lincoln Elementary", address: "1235 Lincoln Street, Denver, CO", people: [{ id: "rider-ns-4", name: "Avery Brooks", direction: "dropoff", note: "" }, { id: "rider-ns-5", name: "Riley Chen", direction: "dropoff", note: "" }, { id: "rider-ns-6", name: "Sam Rivera", direction: "dropoff", note: "" }] },
    ],
  },
  {
    id: "route-west-loop",
    name: "West loop · afternoon",
    stops: [
      { id: "stop-wl-1", name: "Cedar Grove", address: "4900 W 32nd Avenue, Denver, CO", people: [{ id: "rider-wl-1", name: "Jamie Patel", direction: "pickup", note: "" }] },
      { id: "stop-wl-2", name: "Park Hill Library", address: "4705 Montview Boulevard, Denver, CO", people: [{ id: "rider-wl-2", name: "Taylor Reed", direction: "pickup", note: "" }] },
      { id: "stop-wl-3", name: "Eastview Middle School", address: "1005 Elm Street, Denver, CO", people: [{ id: "rider-wl-3", name: "Jamie Patel", direction: "dropoff", note: "" }, { id: "rider-wl-4", name: "Taylor Reed", direction: "dropoff", note: "" }] },
    ],
  },
  {
    id: "route-lake",
    name: "Lakeside shuttle",
    stops: [
      { id: "stop-lk-1", name: "Willow Park entrance", address: "3010 W 10th Avenue, Denver, CO", people: [{ id: "rider-lk-1", name: "Morgan Lee", direction: "pickup", note: "" }] },
      { id: "stop-lk-2", name: "Community Center", address: "1820 Federal Boulevard, Denver, CO", people: [{ id: "rider-lk-2", name: "Morgan Lee", direction: "dropoff", note: "" }] },
    ],
  },
];

const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character]));
const createId = (prefix) => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`}`;
const getRouteMinutes = (route, settings) => route.stops.length * (settings.travelMinutesPerStop + settings.stopTimerMinutes);
const formatDuration = (minutes) => minutes >= 60
  ? `${Math.floor(minutes / 60)} hr${Math.floor(minutes / 60) === 1 ? "" : "s"}${minutes % 60 ? ` ${minutes % 60} min` : ""}`
  : `${minutes} min`;
const formatClock = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

function readSavedData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { routes: sampleRoutes, settings: DEFAULT_SETTINGS, isNew: true };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.routes) || !parsed.settings) throw new Error("Saved route data has an invalid format.");
    return {
      routes: parsed.routes.filter((route) => route && typeof route.id === "string" && typeof route.name === "string" && Array.isArray(route.stops)),
      settings: {
        stopTimerMinutes: Number(parsed.settings.stopTimerMinutes) || DEFAULT_SETTINGS.stopTimerMinutes,
        travelMinutesPerStop: Number(parsed.settings.travelMinutesPerStop) || DEFAULT_SETTINGS.travelMinutesPerStop,
        navigationApp: ["google", "apple", "waze"].includes(parsed.settings.navigationApp)
          ? parsed.settings.navigationApp
          : DEFAULT_SETTINGS.navigationApp,
      },
      isNew: false,
    };
  } catch (error) {
    console.error("Could not load saved Carriage House data.", error);
    return { routes: sampleRoutes, settings: DEFAULT_SETTINGS, loadError: true };
  }
}

const initialData = readSavedData();
const state = {
  routes: initialData.routes,
  settings: initialData.settings,
  selectedRouteId: initialData.routes[0]?.id || null,
  activeRouteId: null,
  currentStopIndex: 0,
  remainingSeconds: null,
  timerId: null,
  draft: null,
};

const routeList = document.querySelector("#route-list");
const routeDetail = document.querySelector("#route-detail");
const routeModal = document.querySelector("#route-modal");
const stopEditorList = document.querySelector("#stop-editor-list");
const notice = document.querySelector("#notice");

function showNotice(message) {
  notice.textContent = message;
  notice.hidden = false;
  window.clearTimeout(showNotice.timeoutId);
  showNotice.timeoutId = window.setTimeout(() => { notice.hidden = true; }, 5500);
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ routes: state.routes, settings: state.settings }));
    document.querySelector(".page-footer span:last-child").innerHTML = "<i></i> All changes saved locally";
    return true;
  } catch (error) {
    console.error("Could not save Carriage House data.", error);
    document.querySelector(".page-footer span:last-child").textContent = "Could not save changes";
    showNotice("Your browser could not save these changes. Check available storage space or privacy settings.");
    return false;
  }
}

function render() {
  const selected = state.routes.find((route) => route.id === state.selectedRouteId) || null;
  const routeCount = state.routes.length;
  const stopCount = state.routes.reduce((total, route) => total + route.stops.length, 0);
  const totalMinutes = state.routes.reduce((total, route) => total + getRouteMinutes(route, state.settings), 0);
  document.querySelector("#nav-route-count").textContent = routeCount;
  document.querySelector("#stat-routes").textContent = routeCount;
  document.querySelector("#stat-stops").textContent = stopCount;
  document.querySelector("#stat-duration").textContent = formatDuration(totalMinutes);

  routeList.innerHTML = state.routes.length ? state.routes.map((route) => `
    <button class="route-item ${route.id === state.selectedRouteId ? "selected" : ""}" type="button" data-route="${escapeHTML(route.id)}" aria-pressed="${route.id === state.selectedRouteId}">
      <span class="route-glyph">${icon("route")}</span>
      <span class="route-item-copy"><strong>${escapeHTML(route.name)}</strong><span>${route.stops.length} stop${route.stops.length === 1 ? "" : "s"}</span></span>
      <span class="route-item-duration">${formatDuration(getRouteMinutes(route, state.settings))}</span>
    </button>`).join("") : `<div class="routes-footnote">No routes yet. Create one to get started.</div>`;

  if (!selected) {
    routeDetail.innerHTML = `<section class="empty-state"><span class="empty-icon">${icon("route")}</span><h2>Your next route starts here</h2><p>Add your stops in the order you want, then add the riders you’ll pick up or drop off.</p><button class="button button-primary" type="button" data-action="new">${icon("route")} Create your first route</button></section>`;
    return;
  }

  const isActive = state.activeRouteId === selected.id;
  const stopIndex = isActive ? state.currentStopIndex : 0;
  const completed = isActive ? stopIndex : 0;
  const currentStop = selected.stops[stopIndex];
  const estimatedArrival = (index) => `~${formatDuration(state.settings.travelMinutesPerStop * (index + 1))}`;
  const peopleCount = selected.stops.reduce((total, stop) => total + stop.people.length, 0);
  const allDone = isActive && stopIndex >= selected.stops.length;

  routeDetail.innerHTML = `
    <section class="route-overview">
      <div class="map-art" aria-label="Illustration of a route connecting stops">
        <span class="map-label label-one">NORTH PARK</span><span class="map-label label-two">RIVER WALK</span><span class="map-label label-three">MAIN ST</span>
        <svg class="map-route" viewBox="0 0 640 146" preserveAspectRatio="none" aria-hidden="true"><path d="M160 91 C219 88 216 55 318 58 S415 91 489 79" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/><path d="M160 91 C219 88 216 55 318 58 S415 91 489 79" fill="none" stroke="#419b78" stroke-width="3" stroke-linecap="round" stroke-dasharray="5 5"/></svg>
        <span class="map-pin pin-one"><span>1</span></span><span class="map-pin pin-two"><span>2</span></span><span class="map-pin pin-three"><span>${selected.stops.length}</span></span>
        <div class="map-controls" aria-hidden="true"><span>+</span><span>−</span></div>
      </div>
      <div class="overview-content">
        <div class="overview-heading">
          <div><div class="route-kicker">${isActive ? "ROUTE IN PROGRESS" : "YOUR SELECTED ROUTE"}</div><h2>${escapeHTML(selected.name)}</h2><p>${selected.stops.length ? escapeHTML(selected.stops[0].address) : "No stops on this route yet"}</p></div>
          <div class="route-actions">
            <button class="action-button" type="button" data-action="edit" data-route-id="${escapeHTML(selected.id)}">${icon("edit")} Edit</button>
            <button class="action-button" type="button" data-action="copy" data-route-id="${escapeHTML(selected.id)}">${icon("copy")} Copy</button>
            <button class="action-button" type="button" data-action="delete" data-route-id="${escapeHTML(selected.id)}" aria-label="Delete route">Delete</button>
          </div>
        </div>
        <div class="overview-meta">
          <span class="meta-item">${icon("pin")} <strong>${selected.stops.length}</strong> stops</span>
          <span class="meta-item">${icon("people")} <strong>${peopleCount}</strong> rider entries</span>
          <span class="meta-item">${icon("clock")} <strong>${formatDuration(getRouteMinutes(selected, state.settings))}</strong> estimated total</span>
        </div>
      </div>
    </section>

    <section class="stops-card">
      <div class="stops-heading"><div><h2>Route stops</h2><p>${isActive ? (allDone ? "Route complete — nice work!" : `Up next · ${escapeHTML(currentStop?.name || "")}`) : "Your stops, in the order you’ll visit them"}</p></div>
        ${isActive && !allDone ? `<a class="button button-primary" href="${mapsUrl(currentStop)}" target="_blank" rel="noopener noreferrer" data-navigate="${escapeHTML(selected.id)}" data-stop-index="${stopIndex}">${icon("nav")} Navigate to next</a>` : isActive ? `<button class="button button-primary" type="button" data-action="finish-route">Finish route</button>` : `<button class="button button-quiet" type="button" data-action="start-route" data-route-id="${escapeHTML(selected.id)}">Start route</button>`}
      </div>
      <div class="stop-list">${selected.stops.length ? selected.stops.map((stop, index) => `
        <article class="stop-row ${isActive && index === stopIndex ? "is-next" : ""} ${isActive && index < completed ? "is-done" : ""}">
          <div class="stop-track"><span class="stop-number">${isActive && index < completed ? "✓" : index + 1}</span></div>
          <div class="stop-main">
            <div class="stop-name-line"><span class="stop-name">${escapeHTML(stop.name)}</span>${isActive && index === stopIndex ? `<span class="next-badge">${index === 0 ? "NEXT STOP" : "UP NEXT"}</span>` : ""}${isActive && index < completed ? `<span class="done-badge">Completed</span>` : ""}</div>
            <span class="stop-address">${escapeHTML(stop.address)}</span>
            ${stop.people.length ? `<div class="rider-pills">${stop.people.map((person) => `<span class="rider-pill ${person.direction === "dropoff" ? "dropoff" : ""}" ${person.note ? `title="${escapeHTML(person.note)}"` : ""}>${icon(person.direction === "dropoff" ? "dropoff" : "pickup")}<span>${escapeHTML(person.name)} · ${person.direction === "dropoff" ? "Drop-off" : "Pickup"}${person.note ? ` <span class="rider-note">· ${escapeHTML(person.note)}</span>` : ""}</span></span>`).join("")}</div>` : `<div class="rider-pills"><span class="rider-pill">No riders assigned</span></div>`}
          </div>
          <div class="stop-end">${isActive && index === stopIndex ? `<a class="stop-nav" href="${mapsUrl(stop)}" target="_blank" rel="noopener noreferrer" data-navigate="${escapeHTML(selected.id)}" data-stop-index="${index}">${icon("nav")} Directions</a>` : `<time>${estimatedArrival(index)}</time>`}</div>
        </article>`).join("") : `<p class="page-subtitle">Add stops to start planning this route.</p>`}</div>
    </section>

    ${isActive && !allDone ? `<section class="timer-card">
      <div class="timer-copy"><span class="timer-icon">${icon("clock")}</span><div><strong>${state.remainingSeconds === null ? "Stop timer" : state.timerId ? "Time at this stop" : "Timer paused"}</strong><p>${state.remainingSeconds === null ? `Set for ${state.settings.stopTimerMinutes} min · advances when the timer ends` : `Stop ${stopIndex + 1} of ${selected.stops.length} · ${escapeHTML(currentStop?.name || "")}`}</p></div></div>
      ${state.remainingSeconds !== null ? `<span class="timer-clock" role="timer" aria-live="off">${formatClock(state.remainingSeconds)}</span>` : `<span class="timer-clock">${String(state.settings.stopTimerMinutes).padStart(2, "0")}:00</span>`}
      <div class="timer-actions">${state.remainingSeconds === null ? `<button class="button button-primary" type="button" data-action="timer-start">Start timer</button>` : `<button class="button button-primary" type="button" data-action="${state.timerId ? "timer-pause" : "timer-resume"}">${state.timerId ? "Pause" : "Resume"}</button><button class="button button-quiet" type="button" data-action="timer-reset">Reset</button>`}<button class="button button-quiet" type="button" data-action="complete-stop">Complete stop</button></div>
    </section>` : ""}
  `;
}

function mapsUrl(stop) {
  const destination = stop ? `${stop.name}, ${stop.address}` : "";
  const encodedDestination = encodeURIComponent(destination);
  switch (state.settings.navigationApp) {
    case "apple":
      return `https://maps.apple.com/?daddr=${encodedDestination}&dirflg=d`;
    case "waze":
      return `https://waze.com/ul?q=${encodedDestination}&navigate=yes`;
    default:
      return `https://www.google.com/maps/dir/?api=1&destination=${encodedDestination}&travelmode=driving`;
  }
}

function openRouteEditor(route = null) {
  state.draft = route ? JSON.parse(JSON.stringify(route)) : { id: null, name: "", stops: [{ id: createId("stop"), name: "", address: "", people: [] }] };
  document.querySelector("#route-modal-title").textContent = route ? "Edit route" : "Create a route";
  document.querySelector("#route-form [type=submit]").textContent = route ? "Save changes" : "Save route";
  document.querySelector("#route-name").value = state.draft.name;
  renderStopEditors();
  routeModal.hidden = false;
  document.querySelector("#route-name").focus();
}

function renderStopEditors() {
  document.querySelector("#editor-stop-count").textContent = state.draft.stops.length;
  stopEditorList.innerHTML = state.draft.stops.map((stop, stopIndex) => `
    <section class="stop-editor" data-stop-id="${escapeHTML(stop.id)}">
      <div class="editor-stop-top"><strong class="editor-stop-title"><span class="editor-stop-number">${stopIndex + 1}</span> Stop ${stopIndex + 1}</strong><div class="stop-editor-actions">${stopIndex > 0 ? `<button class="reorder-stop" type="button" data-editor-action="move-stop" data-direction="-1" data-stop-id="${escapeHTML(stop.id)}" aria-label="Move stop ${stopIndex + 1} up">↑</button>` : ""}${stopIndex < state.draft.stops.length - 1 ? `<button class="reorder-stop" type="button" data-editor-action="move-stop" data-direction="1" data-stop-id="${escapeHTML(stop.id)}" aria-label="Move stop ${stopIndex + 1} down">↓</button>` : ""}${state.draft.stops.length > 1 ? `<button class="remove-stop" type="button" data-editor-action="remove-stop" data-stop-id="${escapeHTML(stop.id)}">Remove</button>` : ""}</div></div>
      <div class="stop-input-grid">
        <input class="editor-input" data-stop-field="name" value="${escapeHTML(stop.name)}" placeholder="Stop name (e.g. Main Street)" aria-label="Stop ${stopIndex + 1} name" maxlength="60" required>
        <input class="editor-input" data-stop-field="address" value="${escapeHTML(stop.address)}" placeholder="Street address or place" aria-label="Stop ${stopIndex + 1} address for navigation" maxlength="160" required>
      </div>
      <div class="people-editor">${stop.people.map((person) => `
        <div class="person-editor" data-person-id="${escapeHTML(person.id)}">
          <input class="person-name" data-person-field="name" value="${escapeHTML(person.name)}" placeholder="Rider name" aria-label="Rider name" maxlength="60" required>
          <select class="person-direction" data-person-field="direction" aria-label="Pickup or drop-off"><option value="pickup" ${person.direction === "pickup" ? "selected" : ""}>↑ Pickup</option><option value="dropoff" ${person.direction === "dropoff" ? "selected" : ""}>↓ Drop-off</option></select>
          <input class="person-note" data-person-field="note" value="${escapeHTML(person.note || "")}" placeholder="Note (optional)" aria-label="Optional rider note" maxlength="120">
          <button class="remove-person" type="button" data-editor-action="remove-person" data-person-id="${escapeHTML(person.id)}" aria-label="Remove rider">×</button>
        </div>`).join("")}
        <button class="add-person" type="button" data-editor-action="add-person" data-stop-id="${escapeHTML(stop.id)}">+ Add a rider profile</button>
      </div>
    </section>`).join("");
}

function getStopById(stopId) {
  return state.draft.stops.find((stop) => stop.id === stopId);
}

function advanceStop() {
  const route = state.routes.find((item) => item.id === state.activeRouteId);
  if (!route) return;
  window.clearInterval(state.timerId);
  state.timerId = null;
  state.remainingSeconds = null;
  state.currentStopIndex += 1;
  if (state.currentStopIndex >= route.stops.length) {
    state.activeRouteId = null;
    state.currentStopIndex = 0;
    showNotice(`Route “${route.name}” complete. Great work!`);
  } else {
    showNotice(`Stop complete. ${route.stops[state.currentStopIndex].name} is up next.`);
  }
  render();
}

function startTimer() {
  if (state.remainingSeconds === null) state.remainingSeconds = state.settings.stopTimerMinutes * 60;
  if (state.timerId) return;
  state.timerId = window.setInterval(() => {
    state.remainingSeconds -= 1;
    if (state.remainingSeconds <= 0) {
      advanceStop();
      return;
    }
    const clock = routeDetail.querySelector(".timer-clock");
    if (clock) clock.textContent = formatClock(state.remainingSeconds);
  }, 1000);
  render();
}

routeList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-route]");
  if (!button) return;
  if (state.activeRouteId && state.activeRouteId !== button.dataset.route) {
    const activeRoute = state.routes.find((route) => route.id === state.activeRouteId);
    if (!window.confirm(`End the active route${activeRoute ? ` “${activeRoute.name}”` : ""} and switch routes?`)) return;
    window.clearInterval(state.timerId);
    state.timerId = null;
    state.activeRouteId = null;
    state.remainingSeconds = null;
    state.currentStopIndex = 0;
  }
  state.selectedRouteId = button.dataset.route;
  render();
});

document.addEventListener("click", (event) => {
  const close = event.target.closest("[data-close]");
  if (close) {
    document.getElementById(close.dataset.close).hidden = true;
    return;
  }
  const trigger = event.target.closest("#new-route, #new-route-small, #add-route-row, [data-action='new']");
  if (trigger) {
    openRouteEditor();
    return;
  }
  const settingsTrigger = event.target.closest("#sidebar-settings, #top-settings");
  if (settingsTrigger) {
    document.querySelector("#timer-setting").value = state.settings.stopTimerMinutes;
    document.querySelector("#drive-setting").value = state.settings.travelMinutesPerStop;
    document.querySelector("#navigation-setting").value = state.settings.navigationApp;
    document.querySelector("#settings-modal").hidden = false;
    return;
  }
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const route = state.routes.find((item) => item.id === (button.dataset.routeId || state.selectedRouteId));
  switch (button.dataset.action) {
    case "edit":
      if (route) {
        if (state.activeRouteId === route.id) {
          if (!window.confirm("Editing this active route will stop its current run. Continue?")) break;
          window.clearInterval(state.timerId);
          state.timerId = null;
          state.activeRouteId = null;
          state.remainingSeconds = null;
          state.currentStopIndex = 0;
        }
        openRouteEditor(route);
      }
      break;
    case "copy":
      if (route) {
        const copy = JSON.parse(JSON.stringify(route));
        copy.id = createId("route");
        copy.name = `${route.name} (copy)`;
        copy.stops = copy.stops.map((stop) => ({ ...stop, id: createId("stop"), people: stop.people.map((person) => ({ ...person, id: createId("rider") })) }));
        state.routes.push(copy);
        state.selectedRouteId = copy.id;
        persist();
        render();
        showNotice(`“${route.name}” copied. You can edit the new route whenever you like.`);
      }
      break;
    case "delete":
      if (route && window.confirm(`Delete “${route.name}” and all its stops? This cannot be undone.`)) {
        state.routes = state.routes.filter((item) => item.id !== route.id);
        if (state.activeRouteId === route.id) {
          window.clearInterval(state.timerId);
          state.timerId = null;
          state.activeRouteId = null;
          state.remainingSeconds = null;
          state.currentStopIndex = 0;
        }
        state.selectedRouteId = state.routes[0]?.id || null;
        persist();
        render();
      }
      break;
    case "start-route":
      state.activeRouteId = route?.id || null;
      state.selectedRouteId = route?.id || state.selectedRouteId;
      state.currentStopIndex = 0;
      state.remainingSeconds = null;
      window.clearInterval(state.timerId);
      state.timerId = null;
      render();
      showNotice("Route started. Navigate to your first stop, then start the timer when you’re ready.");
      break;
    case "timer-start":
    case "timer-resume":
      startTimer();
      break;
    case "timer-pause":
      window.clearInterval(state.timerId);
      state.timerId = null;
      render();
      break;
    case "timer-reset":
      window.clearInterval(state.timerId);
      state.timerId = null;
      state.remainingSeconds = state.settings.stopTimerMinutes * 60;
      render();
      break;
    case "complete-stop":
      advanceStop();
      break;
    case "finish-route":
      state.activeRouteId = null;
      state.currentStopIndex = 0;
      render();
      showNotice("Route completed. Nice work!");
      break;
  }
});

routeDetail.addEventListener("click", (event) => {
  const link = event.target.closest("[data-navigate]");
  if (link) {
    state.activeRouteId = link.dataset.navigate;
    state.selectedRouteId = link.dataset.navigate;
    state.currentStopIndex = Number(link.dataset.stopIndex);
  }
});

document.querySelector("#add-stop").addEventListener("click", () => {
  state.draft.stops.push({ id: createId("stop"), name: "", address: "", people: [] });
  renderStopEditors();
  stopEditorList.lastElementChild?.querySelector('[data-stop-field="name"]')?.focus();
});

stopEditorList.addEventListener("input", (event) => {
  const editor = event.target.closest(".stop-editor");
  if (!editor) return;
  const stop = getStopById(editor.dataset.stopId);
  if (!stop) return;
  if (event.target.dataset.stopField) stop[event.target.dataset.stopField] = event.target.value;
  if (event.target.dataset.personField) {
    const personEditor = event.target.closest(".person-editor");
    const person = stop.people.find((item) => item.id === personEditor?.dataset.personId);
    if (person) person[event.target.dataset.personField] = event.target.value;
  }
});

stopEditorList.addEventListener("change", (event) => {
  if (event.target.dataset.personField !== "direction") return;
  const stop = getStopById(event.target.closest(".stop-editor")?.dataset.stopId);
  const person = stop?.people.find((item) => item.id === event.target.closest(".person-editor")?.dataset.personId);
  if (person) person.direction = event.target.value;
});

stopEditorList.addEventListener("click", (event) => {
  const action = event.target.closest("[data-editor-action]");
  if (!action) return;
  if (action.dataset.editorAction === "add-person") {
    const stop = getStopById(action.dataset.stopId);
    stop?.people.push({ id: createId("rider"), name: "", direction: "pickup", note: "" });
    renderStopEditors();
    stopEditorList.querySelector(`[data-stop-id="${CSS.escape(action.dataset.stopId)}"] .person-name:last-of-type`)?.focus();
  }
  if (action.dataset.editorAction === "remove-person") {
    const editor = action.closest(".stop-editor");
    const stop = getStopById(editor?.dataset.stopId);
    if (stop) {
      stop.people = stop.people.filter((person) => person.id !== action.dataset.personId);
      renderStopEditors();
    }
  }
  if (action.dataset.editorAction === "remove-stop") {
    state.draft.stops = state.draft.stops.filter((stop) => stop.id !== action.dataset.stopId);
    renderStopEditors();
  }
  if (action.dataset.editorAction === "move-stop") {
    const index = state.draft.stops.findIndex((stop) => stop.id === action.dataset.stopId);
    const destination = index + Number(action.dataset.direction);
    if (index >= 0 && destination >= 0 && destination < state.draft.stops.length) {
      [state.draft.stops[index], state.draft.stops[destination]] = [state.draft.stops[destination], state.draft.stops[index]];
      renderStopEditors();
    }
  }
});

document.querySelector("#route-form").addEventListener("submit", (event) => {
  event.preventDefault();
  state.draft.name = document.querySelector("#route-name").value.trim();
  const invalidStop = state.draft.stops.find((stop) => !stop.name.trim() || !stop.address.trim());
  const invalidPerson = state.draft.stops.flatMap((stop) => stop.people).find((person) => !person.name.trim());
  if (!state.draft.name || !state.draft.stops.length || invalidStop || invalidPerson) {
    showNotice("Add a route name, at least one stop with its address, and a name for each rider profile.");
    return;
  }
  state.draft.stops.forEach((stop) => {
    stop.name = stop.name.trim();
    stop.address = stop.address.trim();
    stop.people.forEach((person) => { person.name = person.name.trim(); person.note = person.note.trim(); });
  });
  const existingIndex = state.routes.findIndex((route) => route.id === state.draft.id);
  if (existingIndex >= 0) state.routes[existingIndex] = state.draft;
  else {
    state.draft.id = createId("route");
    state.routes.push(state.draft);
  }
  state.selectedRouteId = state.draft.id;
  state.draft = null;
  routeModal.hidden = true;
  persist();
  render();
  showNotice("Route saved. Your changes are stored on this device.");
});

document.querySelector("#settings-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const timerMinutes = Number(document.querySelector("#timer-setting").value);
  const travelMinutes = Number(document.querySelector("#drive-setting").value);
  const navigationApp = document.querySelector("#navigation-setting").value;
  if (!Number.isInteger(timerMinutes) || timerMinutes < 1 || timerMinutes > 60 || !Number.isInteger(travelMinutes) || travelMinutes < 1 || travelMinutes > 180) {
    showNotice("Enter a whole number of minutes within the ranges shown.");
    return;
  }
  if (!["google", "apple", "waze"].includes(navigationApp)) {
    showNotice("Choose a supported navigation app.");
    return;
  }
  state.settings = { stopTimerMinutes: timerMinutes, travelMinutesPerStop: travelMinutes, navigationApp };
  if (state.activeRouteId && state.remainingSeconds !== null && !state.timerId) state.remainingSeconds = timerMinutes * 60;
  persist();
  render();
  document.querySelector("#settings-modal").hidden = true;
  showNotice("Preferences saved. Route estimates have been updated.");
});

document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) backdrop.hidden = true;
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") document.querySelectorAll(".modal-backdrop").forEach((modal) => { modal.hidden = true; });
});

let deferredInstallPrompt = null;
const installButton = document.querySelector("#install-app");

function openInstallHelp() {
  const message = document.querySelector("#install-message");
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then((choice) => {
      if (choice.outcome === "accepted") showNotice("Carriage House is being installed on your device.");
      deferredInstallPrompt = null;
      installButton.hidden = true;
    }).catch((error) => {
      console.error("The app installation prompt failed.", error);
      showNotice("The install prompt could not be opened. Try your browser’s Install app option.");
    });
    return;
  }

  if (window.location.protocol === "file:") {
    message.innerHTML = "<p>To install Carriage House, it first needs to be published at a secure HTTPS web address. Opening this local file is great for trying it out, but browsers do not install apps from file URLs.</p>";
  } else if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone) {
    message.innerHTML = "<ol><li>Open this page in Safari.</li><li>Tap the <strong>Share</strong> button.</li><li>Choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</li></ol>";
  } else {
    message.innerHTML = "<p>Open your browser’s menu and choose <strong>Install app</strong> or <strong>Add to Home Screen</strong>. The exact label depends on your browser and device.</p>";
  }
  document.querySelector("#install-modal").hidden = false;
}

installButton.addEventListener("click", openInstallHelp);
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.hidden = false;
});
window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installButton.hidden = true;
  showNotice("Carriage House is installed and ready for your routes.");
});

if (window.location.protocol !== "file:" && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch((error) => {
    console.error("Carriage House could not register offline support.", error);
    showNotice("Offline support could not be enabled. Check that this site is served over HTTPS.");
  });
}

if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone) installButton.hidden = false;
if (window.location.protocol === "file:") installButton.hidden = false;
if (initialData.loadError) showNotice("Saved data could not be read. Sample routes are shown; check the browser console for details.");
if (initialData.isNew) persist();
render();
