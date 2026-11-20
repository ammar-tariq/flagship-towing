/** ZeeMaps public coverage map (service-area circles). */
export const COVERAGE_MAP_URL =
  'https://www.zeemaps.com/pub?group=3730082' as const;

/** Compact home-card embed: chrome off. Home preview now uses Google Maps; this stays for the HTML wrapper. */
export const COVERAGE_MAP_PREVIEW_URL =
  `${COVERAGE_MAP_URL}&controls=0&zoomcontrols=0&scrollwheel=0&interactive=0&legend=0&search=0` as const;

export const coverageWebViewProps = {
  geolocationEnabled: true,
  javaScriptEnabled: true,
  domStorageEnabled: true,
  sharedCookiesEnabled: true,
  thirdPartyCookiesEnabled: true,
  originWhitelist: ['*'],
  allowsInlineMediaPlayback: true,
  mixedContentMode: 'always' as const,
};

/**
 * ZeeMaps draws the coverage circles and does not plot the device location.
 * Hook Google Maps as it loads, then drop a pin from the coordinates we already have.
 */
export const coverageLocationHook = `
(function () {
  if (window.__flagshipHooked) return;
  window.__flagshipHooked = true;

  function place() {
    var map = window.__flagshipMap;
    var user = window.__flagshipUser;
    if (!map || !user || !window.google || !google.maps) return;
    var pos = new google.maps.LatLng(user.lat, user.lng);
    if (!window.__flagshipMarker) {
      window.__flagshipMarker = new google.maps.Marker({
        position: pos,
        map: map,
        title: 'Your location',
        zIndex: 999999
      });
    } else {
      window.__flagshipMarker.setMap(map);
      window.__flagshipMarker.setPosition(pos);
    }
    var key = user.lat.toFixed(3) + ',' + user.lng.toFixed(3);
    if (window.__flagshipFramed === key) return;
    var bounds = map.getBounds();
    if (!bounds) {
      google.maps.event.addListenerOnce(map, 'idle', place);
      return;
    }
    window.__flagshipFramed = key;
    if (!bounds.contains(pos)) {
      bounds.extend(pos);
      map.fitBounds(bounds, 48);
    }
  }

  window.__flagshipShowUser = function (lat, lng) {
    if (!isFinite(lat) || !isFinite(lng)) return;
    window.__flagshipUser = {lat: lat, lng: lng};
    place();
  };

  function wrap() {
    if (!window.google || !google.maps || !google.maps.Map || google.maps.Map.__flagship) {
      return false;
    }
    var Original = google.maps.Map;
    function Wrapped(el, opts) {
      var map = new Original(el, opts);
      window.__flagshipMap = map;
      google.maps.event.addListenerOnce(map, 'idle', place);
      return map;
    }
    Wrapped.prototype = Original.prototype;
    Wrapped.__flagship = true;
    google.maps.Map = Wrapped;
    return true;
  }

  var timer = setInterval(function () {
    if (wrap()) clearInterval(timer);
  }, 40);
  setTimeout(function () { clearInterval(timer); }, 20000);
})();
true;
`;

export const showCoverageUserScript = (latitude: number, longitude: number) =>
  `window.__flagshipShowUser&&window.__flagshipShowUser(${latitude},${longitude});true;`;
