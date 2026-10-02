// Zen-style sidebar collapse: the sidebar button toggles "compact mode"
// (sidebar hidden, slides out when you hover the window's left edge) instead
// of Firefox's icon-only sidebar, which this layout doesn't support.
// The look is in userChrome.css under :root[zen-compact].
//
// Loaded into every browser window by autoconfig/firefox-ui.cfg.

(function () {
  if (window.zenCompact) {
    return;
  }

  const PREF = "firefox-ui.compact";
  const ADDED_PREF = "firefox-ui.sidebarButtonAdded";
  const root = document.documentElement;

  // Put the sidebar button in the toolbar once; if you remove it later it
  // stays removed.
  if (!Services.prefs.getBoolPref(ADDED_PREF, false)) {
    if (!CustomizableUI.getPlacementOfWidget("sidebar-button")) {
      CustomizableUI.addWidgetToArea("sidebar-button", CustomizableUI.AREA_NAVBAR, 0);
    }
    Services.prefs.setBoolPref(ADDED_PREF, true);
  }

  function apply() {
    root.toggleAttribute("zen-compact", Services.prefs.getBoolPref(PREF, false));
  }

  function toggle() {
    Services.prefs.setBoolPref(PREF, !Services.prefs.getBoolPref(PREF, false));
  }

  // Applies to every open window when the pref flips
  Services.prefs.addObserver(PREF, apply);
  window.addEventListener("unload", () => Services.prefs.removeObserver(PREF, apply));
  apply();

  // Stop the button's own handler (Firefox's collapse) before it runs
  window.addEventListener(
    "command",
    event => {
      if (event.target.id == "sidebar-button") {
        event.stopPropagation();
        toggle();
      }
    },
    true
  );

  // Same for Firefox's Ctrl+Alt+Z "collapse sidebar" shortcut
  window.addEventListener(
    "keydown",
    event => {
      if (event.code == "KeyZ" && event.ctrlKey && event.altKey && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        toggle();
      }
    },
    true
  );

  // This layout needs Firefox's sidebar launcher expanded (the icon-only
  // collapsed launcher doesn't fit it), so keep it that way. Firefox restores
  // a collapsed state from a previous session, and its state object only
  // exists once startup has finished.
  function keepExpanded() {
    const state = window.SidebarController?._state;
    if (state && !state.launcherExpanded) {
      state.launcherExpanded = true;
    }
  }

  const onStartup = subject => {
    if (subject == window) {
      Services.obs.removeObserver(onStartup, "browser-delayed-startup-finished");
      keepExpanded();
      new MutationObserver(keepExpanded).observe(document.getElementById("sidebar-container"), {
        attributeFilter: ["sidebar-launcher-expanded"],
      });
    }
  };
  if (window.gBrowserInit?.delayedStartupFinished) {
    onStartup(window);
  } else {
    Services.obs.addObserver(onStartup, "browser-delayed-startup-finished");
  }

  // A menu opened from the sidebar (right-click on a tab, the toolbar, ...)
  // takes the hover away from it, which would slide the sidebar shut under
  // the menu. Keep it out while such a menu is open ([zen-sidebar-menu-open]
  // in userChrome.css).
  const sidebarMenus = new Set();
  const inSidebar = node =>
    !!node?.closest?.("#sidebar-container, #navigator-toolbox");
  window.addEventListener("popupshowing", event => {
    const popup = event.target;
    if (popup.localName == "menupopup" && (inSidebar(popup.triggerNode) || inSidebar(popup.anchorNode))) {
      sidebarMenus.add(popup);
      root.toggleAttribute("zen-sidebar-menu-open", true);
    }
  });
  window.addEventListener("popuphidden", event => {
    if (sidebarMenus.delete(event.target) && !sidebarMenus.size) {
      root.removeAttribute("zen-sidebar-menu-open");
    }
  });

  window.zenCompact = { toggle };
})();
