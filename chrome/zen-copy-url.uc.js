// Copy-URL button: sits in the url bar next to the extensions button and,
// like it, only shows while you hover the url bar (see userChrome.css).
// Shows Firefox's own "Link copied" confirmation when clicked.
//
// Loaded into every browser window by autoconfig/firefox-ui.cfg.

(function () {
  if (document.getElementById("zen-copy-url-button")) {
    return;
  }

  const button = document.createXULElement("toolbarbutton");
  button.id = "zen-copy-url-button";
  button.className = "toolbarbutton-1";
  button.setAttribute("tooltiptext", "Copy URL");
  button.setAttribute("image", "chrome://global/skin/icons/edit-copy.svg");

  button.addEventListener("command", () => {
    const uri = gBrowser.selectedBrowser.currentURI;
    Cc["@mozilla.org/widget/clipboardhelper;1"]
      .getService(Ci.nsIClipboardHelper)
      .copyString(uri.displaySpec);
    ConfirmationHint.show(button, "confirmation-hint-link-copied");
  });

  // Inside #nav-bar so the url bar hover rules in userChrome.css cover it
  document.getElementById("nav-bar").append(button);
})();
