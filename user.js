// Prefs required by chrome/userChrome.css. Firefox re-applies these on every start.

// Load chrome/userChrome.css at all
user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);

// Native vertical tabs in the sidebar, always visible
user_pref("sidebar.revamp", true);
user_pref("sidebar.verticalTabs", true);
user_pref("sidebar.visibility", "always-show");

// Shorter address in the url bar ("youtube.com/..." instead of "https://www.youtube.com/...")
user_pref("browser.urlbar.trimHttps", true);
user_pref("browser.urlbar.trimWww", true);

// Keep the downloads button in the sidebar's bottom-left corner
user_pref("browser.download.autohideButton", false);
