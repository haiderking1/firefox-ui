// Zen-style new tab: Ctrl+T (and the sidebar's "New Tab" button) open the
// URL bar palette instead of a tab. Whatever you pick there opens in a new
// tab; Escape or clicking away cancels without leaving an empty tab behind.
// Also makes a single Escape close the floating url bar (Firefox needs two:
// one for the results, one for the bar).
//
// And like Zen at startup: instead of showing the last tab or a new tab
// page, the window sits on a hidden empty tab with the palette open until
// you pick something (a result, or a tab in the sidebar).
//
// Loaded into every browser window by autoconfig/firefox-ui.cfg.

(function () {
  if (window.zenNewTabSearch) {
    return;
  }

  let pending = false;
  let revealTimer = null;

  function reveal() {
    clearTimeout(revealTimer);
    gURLBar.removeAttribute("zen-palette-loading");
  }

  function openPalette() {
    pending = true;
    // Centered palette instead of the in-place one (see userChrome.css)
    gURLBar.setAttribute("zen-palette-centered", "");
    // Firefox shows the input before the results, so keep it all hidden
    // until the first results are drawn (see the controller listener
    // below), or 300ms at most
    gURLBar.setAttribute("zen-palette-loading", "");
    clearTimeout(revealTimer);
    revealTimer = setTimeout(reveal, 300);

    gURLBar.value = "";
    gURLBar.focus();
    // Empty query -> top sites, like Zen's empty palette
    gURLBar.startQuery({ allowAutofill: false });
  }

  function cancel() {
    if (!pending) {
      return;
    }
    close();
  }

  // Put the url bar back in the sidebar showing the page's address
  function close() {
    pending = false;
    gURLBar.removeAttribute("zen-palette-centered");
    gURLBar.view.close();
    gURLBar.handleRevert();
    gBrowser.selectedBrowser.focus();
  }

  // Registered after the results view, so this runs right after the view
  // has drawn the results. (Not onQueryFinished: with a real history the
  // whole query takes ~180ms, which left the input invisible that long.)
  gURLBar.controller.addListener({
    onQueryResults: reveal,
    onQueryFinished: reveal,
    onQueryCancelled: reveal,
  });

  // Firefox asks this where to load the picked result; "current" becomes a
  // new tab while the palette was opened by us. Switch-to-tab results and
  // explicit modifiers (Alt+Enter etc.) are left alone.
  const controller = gURLBar.controller;
  const whereToOpen = controller.whereToOpen.bind(controller);
  controller.whereToOpen = event => {
    let where = whereToOpen(event);
    if (gBrowser.selectedTab == emptyTab) {
      // Load into the empty tab, which then becomes a normal tab
      if (where == "tab") {
        where = "current";
      }
      emptyTab.removeAttribute("zen-empty-tab");
      emptyTab = null;
    } else if (pending && where == "current") {
      where = "tab";
    }
    pending = false;
    return where;
  };

  // focusout, not blur: focus is on the inner input and blur doesn't bubble
  gURLBar.addEventListener("focusout", () =>
    setTimeout(() => {
      gURLBar.removeAttribute("zen-palette-centered");
      cancel();
    }, 0)
  );

  window.addEventListener(
    "keydown",
    event => {
      if (event.key == "Escape" && gURLBar.focused && !event.isComposing) {
        event.preventDefault();
        event.stopPropagation();
        close();
        return;
      }
      // Ctrl+T (Cmd+T on macOS), not Ctrl+Shift+T (reopen closed tab)
      if (
        event.code == "KeyT" &&
        event.getModifierState("Accel") &&
        !event.shiftKey &&
        !event.altKey
      ) {
        // Runs before the <key> element; cancelling it stops the new tab
        event.preventDefault();
        event.stopPropagation();
        openPalette();
      }
    },
    true
  );

  const newTabButton = document.getElementById("vertical-tabs-newtab-button");
  if (newTabButton) {
    newTabButton.removeAttribute("command");
    newTabButton.addEventListener("command", openPalette);
  }

  // ---- Startup: empty tab + palette, like Zen ----

  let emptyTab = null;

  function isNewTabURL(url) {
    return (
      ["about:home", "about:newtab", "about:blank", "about:privatebrowsing"].includes(url) ||
      url == Services.prefs.getStringPref("browser.startup.homepage", "about:home")
    );
  }

  // A normal start passes the home page as a string; opening Firefox with a
  // link passes the links, and then the link should just show.
  function startedWithoutLinks() {
    const arg = window.arguments?.[0];
    return !arg || (typeof arg == "string" && isNewTabURL(arg));
  }

  // The page session restore will put in a tab; a restored tab still shows
  // about:blank until it loads, so currentURI can't tell
  function sessionURL(tab) {
    try {
      const state = JSON.parse(SessionStore.getTabState(tab));
      return state.entries?.[state.index - 1]?.url ?? tab.linkedBrowser.currentURI.spec;
    } catch (e) {
      return tab.linkedBrowser.currentURI.spec;
    }
  }

  async function startEmpty() {
    await SessionStore.promiseAllWindowsRestored;
    const previous = gBrowser.selectedTab;
    emptyTab = gBrowser.addTrustedTab("about:blank", { skipAnimation: true });
    emptyTab.setAttribute("zen-empty-tab", "");
    gBrowser.selectedTab = emptyTab;
    if (isNewTabURL(sessionURL(previous)) && !previous.pinned) {
      // The new tab page Firefox opened: not needed, the empty tab replaces it
      gBrowser.removeTab(previous, { skipSessionStore: true, animate: false });
    }
    // (A restored tab is left alone: it loads in the background, where it
    // can't autoplay. Unloading it while session restore is still restoring
    // it leaves it blank when you open it.)
    // Firefox closes the results of a window that isn't focused, and at
    // startup the window may not be yet, so wait for it. setTimeout: after
    // Firefox's own startup focus handling.
    if (document.hasFocus()) {
      setTimeout(openStartupPalette);
    } else {
      window.addEventListener("activate", () => setTimeout(openStartupPalette), { once: true });
    }
  }

  // Right at startup the top sites aren't loaded yet, so the empty query can
  // come back with nothing (and Firefox then closes the results). Ask again
  // until they're there, while the palette is still open and untouched.
  function openStartupPalette() {
    let tries = 0;
    const listener = {
      onQueryFinished(context) {
        const untouched = gURLBar.focused && !gURLBar.value && gBrowser.selectedTab == emptyTab;
        if (context.results.length || !untouched || ++tries > 10) {
          gURLBar.controller.removeListener(listener);
          return;
        }
        setTimeout(() => gURLBar.startQuery({ allowAutofill: false }), 300);
      },
    };
    gURLBar.controller.addListener(listener);
    openPalette();
  }

  // Leaving the empty tab without using it throws it away
  gBrowser.tabContainer.addEventListener("TabSelect", () => {
    if (emptyTab && gBrowser.selectedTab != emptyTab) {
      const tab = emptyTab;
      emptyTab = null;
      gBrowser.removeTab(tab, { skipSessionStore: true, animate: false });
    }
  });

  if (startedWithoutLinks()) {
    const onStartup = subject => {
      if (subject == window) {
        Services.obs.removeObserver(onStartup, "browser-delayed-startup-finished");
        startEmpty();
      }
    };
    Services.obs.addObserver(onStartup, "browser-delayed-startup-finished");
  }

  window.zenNewTabSearch = { openPalette, cancel };
})();
