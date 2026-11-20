/**
 * Google Places mailing-address autocomplete — one field, formatted address only.
 * Set window.flagshipAddressFieldConfig.input before loading to customize field id.
 */
(function (global) {
  var MAPS_KEY = "__GOOGLE_MAPS_KEY__";
  if (!MAPS_KEY || MAPS_KEY.indexOf("__GOOGLE_MAPS") === 0) {
    throw new Error(
      "Missing VITE_GOOGLE_MAPS_KEY. Copy membershipFlagship/.env.example to .env and rebuild/restart the membership portal.",
    );
  }
  var DEFAULT_CONFIG = {
    input: "mailing_address",
  };

  function getConfig() {
    var custom = global.flagshipAddressFieldConfig || {};
    return {
      input: custom.input || DEFAULT_CONFIG.input,
    };
  }

  function formattedAddressFromPlace(place) {
    if (!place || !place.formatted_address) return "";
    return String(place.formatted_address).replace(/, USA\s*$/i, "").trim();
  }

  function fillAddressFromPlace(place) {
    var cfg = getConfig();
    var el = document.getElementById(cfg.input);
    var value = formattedAddressFromPlace(place);
    if (el && value) el.value = value;
    if (typeof global.saveSignupDraft === "function") global.saveSignupDraft();
  }

  function bindAutocomplete() {
    var cfg = getConfig();
    var flag = "__flagshipPlacesInit_" + cfg.input;
    if (global[flag]) return;

    var addrInput = document.getElementById(cfg.input);
    if (!addrInput || typeof google === "undefined" || !google.maps || !google.maps.places) {
      return;
    }

    global[flag] = true;

    var addrAc = new google.maps.places.Autocomplete(addrInput, {
      componentRestrictions: { country: "us" },
      fields: ["formatted_address"],
    });

    addrAc.addListener("place_changed", function () {
      fillAddressFromPlace(addrAc.getPlace());
    });
  }

  function onMapsReady() {
    bindAutocomplete();
  }

  function ensureMapsApi() {
    if (typeof google !== "undefined" && google.maps && google.maps.places) {
      onMapsReady();
      return;
    }
    if (!document.getElementById("flagship-maps-script")) {
      global.initFlagshipAddressAutocomplete = onMapsReady;
      var script = document.createElement("script");
      script.id = "flagship-maps-script";
      script.async = true;
      script.defer = true;
      script.src =
        "https://maps.googleapis.com/maps/api/js?key=" +
        MAPS_KEY +
        "&libraries=places&callback=initFlagshipAddressAutocomplete";
      document.body.appendChild(script);
    }
  }

  global.flagshipFillAddressFromPlace = fillAddressFromPlace;
  global.FlagshipAddressAutocomplete = {
    init: ensureMapsApi,
    fillFromPlace: fillAddressFromPlace,
  };
})(window);
