# Carriage House - Bus Route Planner

Carriage House is a browser-based route planner for bus drivers. Create and organize multiple routes, add named stops with street addresses, and attach rider profiles marked for pickup or drop-off. Start a route to open turn-by-turn directions to its next stop, and use the configurable stop timer to advance through the route.

## Run locally

- Open `index.html` directly in a browser, or run **Open Carriage House route planner** from the VS Code Run button to open it in your default browser.

The app does not require a build step.

## Publish and install

The GitHub Actions workflow publishes the static app to GitHub Pages whenever a change is pushed to `main`, or when the workflow is run manually. To enable the first deployment, open the repository's **Settings → Pages** and set the build and deployment source to **GitHub Actions**. After the workflow succeeds, open the Pages URL shown in its deployment output over HTTPS.

On iPhone or iPad, open the HTTPS site in Safari and use **Share → Add to Home Screen**. On Android and supported desktop browsers, use the app's **Install app** button or the browser's **Install app** / **Add to Home Screen** option. The service worker caches the app shell so it can reopen offline after the first online visit. Routes and preferences are saved in the browser on this device; they are not synced between devices.

Choose Google Maps, Apple Maps, or Waze in **Preferences**. Carriage House hands the current stop's address to the selected app, then the driver returns to Carriage House to continue the route. Navigation, traffic, and turn-by-turn guidance are provided by that separate app; Carriage House does not receive live GPS or traffic data. The displayed route total is an estimate based on travel-time and stop-timer settings.

## Features

- Add, edit, copy, and delete routes.
- Add, remove, and reorder stops by adding them in the desired order.
- Give every stop a custom name and address for navigation.
- Add rider profiles at each stop, labeled pickup or drop-off, with optional notes.
- Start, pause, reset, or manually complete a configurable stop timer.
- Automatically advance to the next stop when its timer expires.
- See estimated route durations and rider assignments.
- Install the app on supported phones and tablets from its HTTPS website after publishing to GitHub Pages.
- Reopen the app shell offline after the first visit; navigation requires the selected navigation app and its network access.
