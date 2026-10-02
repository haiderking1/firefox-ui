// Copy the current page's URL, like Zen:
// - Ctrl+Shift+C copies the URL (instead of opening the DevTools inspector;
//   F12 / Ctrl+Shift+I still open DevTools)
// - Ctrl+Shift+Alt+C copies it as Markdown: [page title](url)
// - a copy button sits in the url bar next to the extensions button and,
//   like it, only shows while you hover the url bar (see userChrome.css)
// Tracking parameters are stripped first, the same way Firefox's
// "Copy Clean Link" does, and a toast confirms the copy.
//
// Loaded into every browser window by autoconfig/firefox-ui.cfg.

(function () {
  if (window.zenCopyUrl) {
    return;
  }

  const clipboard = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);
  const stripper = Cc["@mozilla.org/url-query-string-stripper;1"].getService(
    Ci.nsIURLQueryStringStripper
  );

  function currentURL() {
    const uri = gBrowser.selectedBrowser.currentURI;
    let spec = uri.displaySpec;
    try {
      // null when there was nothing to strip
      spec = stripper.stripForCopyOrShare(uri)?.displaySpec ?? spec;
    } catch (e) {}
    try {
      if (Services.prefs.getBoolPref("browser.urlbar.decodeURLsOnCopy", false) && !uri.schemeIs("data")) {
        spec = decodeURI(spec);
      }
    } catch (e) {}
    return spec;
  }

  // Zen's toast (ZenUIManager.showToast): a pill in a container pinned to
  // the window's top-right corner, spring-scaled in, faded and shrunk out,
  // and kept open while hovered. Styled by #zen-toast-container in
  // userChrome.css.
  const HTML = "http://www.w3.org/1999/xhtml";
  let container = null;
  let toast = null;
  let toastTimer = null;

  function hideToast() {
    const el = toast;
    toast = null;
    el.animate({ opacity: [1, 0], scale: [1, 0.5] }, { duration: 200, easing: "ease-out", fill: "forwards" })
      .finished.then(() => el.remove());
  }

  function startTimer() {
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 3000);
  }

  function showToast(text) {
    if (!container) {
      container = document.createElementNS(HTML, "div");
      container.id = "zen-toast-container";
      document.getElementById("browser").append(container);
    }
    const reused = !!toast;
    if (!toast) {
      toast = document.createElementNS(HTML, "div");
      toast.className = "zen-toast";
      toast.append(document.createElementNS(HTML, "span"));
      toast.addEventListener("mouseover", () => clearTimeout(toastTimer));
      toast.addEventListener("mouseout", startTimer);
      container.append(toast);
    }
    toast.firstChild.textContent = text;
    // Spring in from nothing, or a quick squeeze when it's already showing
    // (Zen: spring, bounce 0.2, 0.5s)
    toast.animate(
      { scale: reused ? [0.2, 1.04, 1] : [0, 1.06, 0.99, 1], offset: reused ? [0, 0.6, 1] : [0, 0.45, 0.75, 1] },
      { duration: reused ? 350 : 500, easing: "ease-out" }
    );
    startTimer();
  }

  function copyURL() {
    clipboard.copyString(currentURL());
    showToast("Copied current URL!");
  }

  function copyMarkdown() {
    const title = gBrowser.selectedTab.label.replace(/[[\]]/g, "\\$&");
    clipboard.copyString(`[${title}](${currentURL()})`);
    showToast("Copied current URL as Markdown!");
  }

  window.addEventListener(
    "keydown",
    event => {
      if (event.code == "KeyC" && event.getModifierState("Accel") && event.shiftKey) {
        // Runs before Firefox's <key> handlers (DevTools inspector)
        event.preventDefault();
        event.stopPropagation();
        if (event.altKey) {
          copyMarkdown();
        } else {
          copyURL();
        }
      }
    },
    true
  );

  const button = document.createXULElement("toolbarbutton");
  button.id = "zen-copy-url-button";
  button.className = "toolbarbutton-1";
  button.setAttribute("tooltiptext", "Copy URL (Ctrl+Shift+C)");
  button.setAttribute("image", "chrome://global/skin/icons/edit-copy.svg");
  button.addEventListener("command", copyURL);
  // Inside #nav-bar so the url bar hover rules in userChrome.css cover it
  document.getElementById("nav-bar").append(button);

  window.zenCopyUrl = { copyURL, copyMarkdown, showToast };
})();
