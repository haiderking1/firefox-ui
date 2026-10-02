# firefox-ui

Zen/Arc-style layout for stock Firefox using `userChrome.css`: everything lives in a left sidebar (nav buttons, URL bar, pinned-tab tiles, tab list), the page sits in a rounded card, and the URL bar floats in the middle of the window while you type.

Built on Firefox's native vertical tabs (tested on Firefox 157).

## Install

```sh
./install.sh            # links chrome/ and user.js into your default profile
./install.sh <profile>  # or into a specific profile directory
```

Then restart Firefox. Because the files are symlinked, edit `chrome/userChrome.css` here and restart Firefox to see changes.

The behavior parts (Ctrl+T opens the search palette instead of a tab, the "+" menu with New Tab / New Split View) are JavaScript in `chrome/*.uc.js`. Firefox only runs those through an autoconfig loader in its install folder, set up once with:

```sh
sudo ./install-autoconfig.sh            # defaults to /usr/lib/firefox
```

## Customize

Colors, sidebar width and spacing are variables at the top of `chrome/userChrome.css`.

To use the Browser Toolbox (inspect the Firefox UI like a web page), enable `devtools.chrome.enabled` and `devtools.debugger.remote-enabled` in `about:config`, then press `Ctrl+Alt+Shift+I`.

## Uninstall

Delete the `chrome` and `user.js` symlinks from your profile folder, and in `about:config` reset `sidebar.verticalTabs` if you want horizontal tabs back.
