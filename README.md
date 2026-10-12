# API Police

A browser extension that intercepts `fetch`/`XMLHttpRequest` calls matching a URL
pattern and returns a fully custom response instead of hitting the network.
Configure rules from the extension's own page (opened via the toolbar popup).

## How it works

- A content script running in the page's **isolated world** reads rules from
  `chrome.storage.local` and relays them into the page via `window.postMessage`.
- A second content script running in the page's **main world** patches
  `window.fetch` and `window.XMLHttpRequest`. When a request's URL matches an
  enabled rule, it short-circuits the call and resolves with the status,
  content type, and body you defined, instead of making the real request.
- This only intercepts requests the page itself makes via `fetch`/XHR (not
  `<img>`/`<iframe>`/navigation loads, and not requests from other
  extensions or service workers).
- There's a brief window right at page load before rules arrive from storage
  (storage reads are async); requests fired in that first tick won't be
  intercepted. In practice this only matters for calls made synchronously at
  parse time, which is rare for API calls.

## Load it locally

### Chrome / Edge / Brave

1. Go to `chrome://extensions`.
2. Enable "Developer mode" (top right).
3. Click "Load unpacked" and select this folder.

### Firefox

1. Rename or copy `manifest.firefox.json` over `manifest.json` (Firefox needs
   the `browser_specific_settings.gecko.id` field; Chrome ignores it but
   some versions warn on unknown keys, so keep them as two files and swap
   as needed), **or** just point Firefox at `manifest.firefox.json` directly
   if your Firefox version supports `--manifest` style loading.
2. Go to `about:debugging#/runtime/this-firefox`.
3. Click "Load Temporary Add-on" and select `manifest.json` (or the
   Firefox-specific one, renamed to `manifest.json`, inside this folder).

Temporary add-ons are removed when Firefox restarts; reload as needed during
development.

## Usage

1. Click the toolbar icon, then "Open Rule Manager".
2. Add a rule: a URL pattern (substring or `*` wildcard), HTTP method, status
   code, content type, and the response body you want returned.
3. Save it, then enabled rules apply immediately to matching requests across
   all open tabs/pages (new page loads pick up rules right away; existing
   open tabs will use rules on their next request after the rule is saved,
   since `chrome.storage.onChanged` pushes updates live).
4. Use the popup's "Enabled" checkbox to quickly turn all interception on/off
   without deleting rules.

## Rule matching

- **Contains**: matches if the pattern is a substring of the request URL.
- **Wildcard**: `*` matches any characters; the rest of the pattern must
  match exactly (e.g. `https://api.example.com/users/*` matches
  `https://api.example.com/users/42` but not `.../users/42/orders`).
