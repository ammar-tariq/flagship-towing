/**
 * Redirect authenticated members away from guest-only pages (signup, sign-in).
 * Include in <head> after flagship-api.js for an early redirect.
 */
(function () {
  var api = window.FlagshipAPI;
  if (api && api.redirectIfLoggedIn()) return;
})();
