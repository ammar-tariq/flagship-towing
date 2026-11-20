/**
 * On mobile browsers, try to open the Flagship Towing app when viewing
 * membership pages. If the app is not installed, the user stays on the web page.
 */
(function (global) {
  var APP_SCHEME = "flagshiptowing";
  var ANDROID_PACKAGE = "com.genesysglobal.flagship";
  var SESSION_KEY = "flagship_app_open_attempted";

  var PAGE_PATHS = {
    "index.html": "become-a-member",
    "signin.html": "signin",
    "user.html": "memberships",
    "add-vessel.html": "add-vessel",
    "add-authorized-user.html": "memberships",
  };

  function isMobileDevice() {
    var ua = navigator.userAgent || "";
    return /Android|iPhone|iPad|iPod/i.test(ua);
  }

  function isIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
  }

  function isAndroid() {
    return /Android/i.test(navigator.userAgent || "");
  }

  function getPagePath() {
    var name = (global.location.pathname || "").split("/").pop() || "index.html";
    if (name === "" || name.indexOf(".html") === -1) name = "index.html";
    return PAGE_PATHS[name] || "memberships";
  }

  function buildAndroidIntent(appPath, fallbackUrl) {
    return (
      "intent://" +
      appPath +
      "#Intent;scheme=" +
      APP_SCHEME +
      ";package=" +
      ANDROID_PACKAGE +
      ";S.browser_fallback_url=" +
      encodeURIComponent(fallbackUrl) +
      ";end"
    );
  }

  function tryOpenApp(appPath) {
    if (!isMobileDevice()) return false;
    try {
      if (sessionStorage.getItem(SESSION_KEY) === appPath) return false;
      sessionStorage.setItem(SESSION_KEY, appPath);
    } catch (e) {
      /* private mode — still try once */
    }

    var fallback = global.location.href;
    var schemeUrl = APP_SCHEME + "://" + appPath;

    if (isAndroid()) {
      global.location.href = buildAndroidIntent(appPath, fallback);
      return true;
    }

    if (isIOS()) {
      global.location.href = schemeUrl;
      return true;
    }

    global.location.href = schemeUrl;
    return true;
  }

  function init(opts) {
    opts = opts || {};
    if (opts.force !== true && !isMobileDevice()) return;

    var appPath = opts.path || getPagePath();
    var delay = typeof opts.delayMs === "number" ? opts.delayMs : 600;

    setTimeout(function () {
      tryOpenApp(appPath);
    }, delay);
  }

  global.FlagshipAppOpen = {
    init: init,
    tryOpenApp: tryOpenApp,
    getPagePath: getPagePath,
  };
})(window);
