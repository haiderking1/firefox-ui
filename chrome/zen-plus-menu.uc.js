// The "+" in the sidebar's bottom-right corner: a small menu with
// "New Tab" (opens the URL bar palette, see zen-newtab.uc.js) and
// "New Split View". Positioned by #zen-plus-button in userChrome.css.
//
// Loaded into every browser window by autoconfig/firefox-ui.cfg.

(function () {
  if (document.getElementById("zen-plus-button")) {
    return;
  }

  const button = document.createXULElement("toolbarbutton");
  button.id = "zen-plus-button";
  button.className = "toolbarbutton-1";
  button.setAttribute("type", "menu");
  button.setAttribute("tooltiptext", "New…");
  button.setAttribute("image", "chrome://global/skin/icons/plus.svg");

  const popup = document.createXULElement("menupopup");
  popup.id = "zen-plus-popup";
  popup.setAttribute("position", "before_end");

  function addItem(id, label, icon, onCommand) {
    const item = document.createXULElement("menuitem");
    item.id = id;
    item.className = "menuitem-iconic";
    item.setAttribute("label", label);
    item.setAttribute("image", icon);
    item.addEventListener("command", onCommand);
    popup.append(item);
    return item;
  }

  addItem("zen-plus-new-tab", "New Tab", "chrome://global/skin/icons/plus.svg", () => {
    if (window.zenNewTabSearch) {
      window.zenNewTabSearch.openPalette();
    } else {
      BrowserCommands.openTab();
    }
  });

  const splitItem = addItem(
    "zen-plus-new-split",
    "New Split View",
    "chrome://browser/skin/split-view-right-16.svg",
    () => BrowserCommands.addTabSplitView()
  );

  // Same conditions BrowserCommands.addTabSplitView() checks
  popup.addEventListener("popupshowing", () => {
    const tab = gBrowser.selectedTab;
    splitItem.disabled = !tab || tab.hidden || tab.pinned || !!tab.splitview;
  });

  button.append(popup);
  document.getElementById("navigator-toolbox").append(button);
})();
