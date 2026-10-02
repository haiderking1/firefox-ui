// Zen-style new tab: Ctrl+T (and the sidebar's "New Tab" button) open the
// URL bar palette instead of a tab. Whatever you pick there opens in a new
// tab; Escape or clicking away cancels without leaving an empty tab behind.
// Also makes a single Escape close the floating url bar (Firefox needs two:
// one for the results, one for the bar).
//
// Loaded into every browser window by autoconfig/firefox-ui.cfg.

(function () {
  if (window.zenNewTabSearch) {
    return;
  }

  let pending = false;

  function openPalette() {
    pending = true;
    // Centered palette instead of the in-place one (see userChrome.css)
    gURLBar.setAttribute("zen-palette-centered", "");
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

  // Firefox asks this where to load the picked result; "current" becomes a
  // new tab while the palette was opened by us. Switch-to-tab results and
  // explicit modifiers (Alt+Enter etc.) are left alone.
  const controller = gURLBar.controller;
  const whereToOpen = controller.whereToOpen.bind(controller);
  controller.whereToOpen = event => {
    let where = whereToOpen(event);
    if (pending && where == "current") {
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

  window.zenNewTabSearch = { openPalette, cancel };
})();
