# firefox-ui

A [Zen Browser](https://zen-browser.app)-style interface for regular Firefox. No fork, no custom build: a `userChrome.css` theme plus a few small scripts on top of the Firefox you already have, so you keep Firefox's updates, extensions and sync.

Colors and sizes are measured from Zen's dark theme, and the behavior follows Zen's own source where it could be copied.

Tested on Firefox 157 on Linux. Not affiliated with Zen Browser or Mozilla.

## What you get

**Layout**
- Everything in a left sidebar: nav buttons, URL bar, pinned tabs as tiles, then your tabs. Built on Firefox's native vertical tabs.
- The page sits in a rounded card next to it.
- Downloads in the sidebar's bottom-left corner, a "+" menu in the bottom-right (New Tab, New Split View).
- Close buttons on tabs appear on hover.
- Right-click menus and panels in the same dark colors as the sidebar.

**URL bar**
- Click it and it expands in place over the sidebar. Focus it any other way and it floats as a centered command palette.
- The palette appears in one piece and never grows past 5 results; more results scroll.
- A single Esc closes it.
- The copy-URL and extensions buttons show up when you hover the URL bar.

**Like Zen**
- **Ctrl+T** opens the palette instead of an empty tab. What you pick opens in a new tab; Esc leaves no tab behind. The sidebar's "New Tab" does the same.
- **Compact mode:** the sidebar button hides the sidebar. Hover the left edge of the window and it slides back out over the page.
- **Startup:** a new window waits on an empty page with the palette open, instead of showing the last tab. Your restored tabs stay in the sidebar.
- **Ctrl+Shift+C** copies the page URL with tracking parameters removed, with a confirmation toast.

## Shortcuts

| Keys | Does |
|---|---|
| Ctrl+T | Open the search palette (opens in a new tab) |
| Ctrl+L | Focus the URL bar (floats centered) |
| Esc | Close the URL bar / palette |
| Ctrl+Shift+C | Copy the page URL |
| Ctrl+Shift+Alt+C | Copy the page URL as a Markdown link |
| Ctrl+Alt+Z | Toggle compact mode |

Ctrl+Shift+C normally opens the DevTools inspector; F12 and Ctrl+Shift+I still open DevTools.

## Install

The theme and the scripts install separately. The theme on its own gives you the look; the scripts add the behavior (Ctrl+T, "+" menu, compact mode, startup palette, copy URL).

**1. Theme** — links `chrome/` and `user.js` from this repo into your Firefox profile, backing up anything already there:

```sh
git clone https://github.com/haiderking1/firefox-ui.git
cd firefox-ui
./install.sh            # your default profile
./install.sh <profile>  # or a specific profile folder
```

**2. Scripts (optional)** — Firefox only runs scripts like these through an "autoconfig" loader in its install folder, so this step needs root, once:

```sh
sudo ./install-autoconfig.sh                    # Firefox in /usr/lib/firefox
sudo ./install-autoconfig.sh /path/to/firefox   # or wherever yours is
```

It copies two small files, `firefox-ui.cfg` and `defaults/pref/firefox-ui-autoconfig.js`, which Firefox updates leave alone. The loader runs every `*.uc.js` file in your profile's `chrome/` folder with full browser privileges, so only put scripts you trust there.

**3. Quit Firefox completely (Ctrl+Q) and start it again.**

Because the files are linked, not copied, a `git pull` here updates your Firefox on its next restart.

## Customize

Colors, sidebar width and spacing are variables at the top of `chrome/userChrome.css`; compact mode's timing is in its "Compact mode" section.

To inspect Firefox's own interface like a web page, enable `devtools.chrome.enabled` and `devtools.debugger.remote-enabled` in `about:config`, then press Ctrl+Alt+Shift+I.

## When Firefox updates

This styles and scripts Firefox's internal interface, which Mozilla changes now and then, so an update can break a piece of it. Fixes are usually small selector changes.

A few things learned along the way, if you're editing it:
- `userChrome.css` loses to Firefox's own styles unless a rule is `!important`.
- `::part()` rules from `userChrome.css` don't apply; set the custom properties Firefox's shadow DOM reads instead.
- Scripts can't be loaded from `file://` URLs, which is why the loader serves the folder as `resource://firefox-ui/`.

## Uninstall

1. Delete the `chrome` and `user.js` links from your profile folder.
2. If you installed the scripts: `sudo rm /usr/lib/firefox/firefox-ui.cfg /usr/lib/firefox/defaults/pref/firefox-ui-autoconfig.js`
3. In `about:config`, reset `sidebar.verticalTabs` if you want horizontal tabs back.
