/**
 * Shared Flagship Towing site header, footer, and Spacecrafted nav scripts
 * for all membershipFlagship pages.
 */
(function (global) {
  var SITE_ORIGIN = "https://flagshiptowing.us";
  var LOGO_URL =
    "https://static.spacecrafted.com/f3a81e09e3c348aaa519f655fc613f4f/i/c677f51b921b42cc8caee4de7e4cb426/1/5feFb8zhrk/FTLogoLongNew.png";
  var PAGE_STYLE_IDS =
    "YjdkNjJlMDg3YWVmNGM2ZGE5NjBkMjI3MjRhYTE1YWEsYjBkMDIxZGM0NGFhNGI2Y2FlOTJkM2FiZTVjYWJkNWMsY2Y0NGVmYzBjYWE3NDdmNzg5N2Y2YTUzNGQ0NjllOGYsYWU1ZDFlZmE4NzQ0NGI4NTkwNTM5MTFmNzc4N2E5MWE=";
  var MEMBER_TOKEN_KEY = "flagship_access_token";

  var HEADER_HTML =
    '<div class="headerAndNavContainer fixedNav">' +
    '<div class="blockContainer blockWrap_bd0a1989e2294e4fb751b508296190cd ">' +
    '<div class="blockContent block_bd0a1989e2294e4fb751b508296190cd ">' +
    '<div class="blockText"><div class="blockInnerContent">' +
    '<ul class="unstyledList">' +
    '<li>GET A TOW NOW: <a href="tel:1-888-262-8869">1-888-BOAT-TOW</a></li>' +
    '<li id="flagshipBecomeMemberNav" class="flagship-guest-only"><a href="index.html" class="button" id="scrollToFormBtn">Become A Member »</a></li>' +
    "</ul></div></div></div></div>" +
    '<div class="headerAndNavContent"><div class="headerAndNavContentInner">' +
    '<div class="headerContainer"><header class="headerContent">' +
    '<h1 class="logo"><a href="' +
    SITE_ORIGIN +
    '/" itemprop="url"><img src="' +
    LOGO_URL +
    '" alt="Flagship Towing" title="Flagship Towing" itemprop="logo"></a></h1>' +
    "</header></div>" +
    '<div class="navContainer"><nav class="navContent">' +
    '<ul id="navTopLevel" data-mobile-nav-label="Menu" data-mobile-nav-style="dropdown" data-mobile-nav-reveal="fullscreen" data-mobile-nav-animation="slide" data-mobile-nav-trigger="icon" data-mobile-nav-icon-position="right" data-home-nav-collapse-min="1" data-subnav-collapse="true" itemscope="" itemtype="http://www.schema.org/SiteNavigationElement">' +
    '<li><span class="navLabel">About <span class="dropArrow">▾</span></span><ul class="subNav">' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/who-we-are" itemprop="url">Who We Are</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/careers" itemprop="url">Careers</a></li></ul></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/our-fleet" itemprop="url">Our Fleet</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/service-areas" itemprop="url">Service Areas</a></li>' +
    '<li><a href="index.html" itemprop="url">Memberships</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/services" itemprop="url">Services <span class="dropArrow">▾</span></a>' +
    '<ul class="subNav">' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/services#Towing-Marine-Assistance" itemprop="url">Towing &amp; Marine Assistance</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/services#Boat-Salvages" itemprop="url">Boat Salvages</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/services#Ungroundings" itemprop="url">Ungroundings</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/services#Emergency-Response" itemprop="url">Emergency Response</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/services#Commercial-Services" itemprop="url">Commercial Services</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/services/gallery" itemprop="url">Gallery</a></li></ul></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/locations-we-serve" itemprop="url">Locations We Serve <span class="dropArrow">▾</span></a>' +
    '<ul class="subNav">' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/locations-we-serve/boat-towing-lake-austin-tx" itemprop="url">Lake Austin, TX</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/locations-we-serve/boat-towing-lake-lbj-tx" itemprop="url">Lake LBJ, TX</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/locations-we-serve/boat-towing-lake-travis-tx" itemprop="url">Lake Travis, TX</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/locations-we-serve/boat-towing-tampa-bay-fl" itemprop="url">Tampa Bay, FL</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/locations-we-serve/boat-towing-galveston-tx" itemprop="url">Galveston, TX</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/locations-we-serve/boat-towing-lake-conroe-tx" itemprop="url">Lake Conroe, TX</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/locations-we-serve/boat-towing-clear-lake-tx" itemprop="url">Clear Lake, TX</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/locations-we-serve/boat-towing-lake-ray-hubbard-tx" itemprop="url">Lake Ray Hubbard, TX</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/locations-we-serve/boat-towing-fort-lauderdale-fl" itemprop="url">Fort Lauderdale, FL</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/locations-we-serve/boat-towing-miami-fl" itemprop="url">Miami, FL</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/locations-we-serve/st-augustine-fl" itemprop="url">St. Augustine, FL</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/locations-we-serve/boat-towing-daytona-beach-fl" itemprop="url">Daytona Beach, FL</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/locations-we-serve/boat-towing-ponce-inlet-fl" itemprop="url">Ponce Inlet, FL</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/locations-we-serve/boat-towing-fort-myers-fl" itemprop="url">Fort Myers, FL</a></li>' +
    "</ul></li>" +
    '<li><a href="' +
    SITE_ORIGIN +
    '/contact" itemprop="url">Contact</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/blog" itemprop="url">Blog</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/recent-news" itemprop="url">Recent News</a></li>' +
    "</ul></nav></div></div></div></div>";

  var FOOTER_HTML =
    '<div class="footerContainer">' +
    '<footer class="footerContent"><div class="footerInner">' +
    '<div class="blockContainer blockWrap_ffe952206b564c778cf4748cb434b8c4 ">' +
    '<div class="blockContent block_ffe952206b564c778cf4748cb434b8c4 "><div class="blockText">' +
    '<h2 class="contentTitle">CONTACT</h2><div class="blockInnerContent">' +
    '<ul class="unstyledList">' +
    "<li>7301 N Ranch Rd 620 155-333</li><li>Austin TX 78726</li>" +
    '<li><a href="mailto:dispatch@flagshiptowing.us">dispatch@flagshiptowing.us</a></li>' +
    '<li><a href="tel:1-888-262-8869">1-888-BOAT-TOW</a></li></ul>' +
    "<p>© 2021 Flagship Towing; All Rights Reserved</p></div></div></div></div>" +
    '<div class="blockContainer blockWrap_d20bf27bbec84e33954079a67a4204b1 ">' +
    '<div class="blockContent block_d20bf27bbec84e33954079a67a4204b1 "><div class="blockText">' +
    '<h2 class="contentTitle">QUICK LINKS</h2><div class="blockInnerContent">' +
    '<ul class="unstyledList">' +
    '<li><a href="index.html">Memberships</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/careers">Careers</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/contact">Contact</a></li>' +
    '<li><a href="' +
    SITE_ORIGIN +
    '/memberships#Terms-of-Service">Terms of Service</a></li>' +
    "</ul></div></div></div></div>" +
    '<div class="blockContainer socialIconsContainer blockWrap_cf0787d1e57d4c98a19d14c12d599c77 ">' +
    '<div class="blockContent block_cf0787d1e57d4c98a19d14c12d599c77 txa0">' +
    '<ul class="iconGroup socialIcons footerSocialIcons">' +
    '<li><a target="_blank" rel="noopener noreferrer" href="https://www.facebook.com/flagship.towing/?ref=settings" class="zocial facebook" aria-label="facebook"></a></li>' +
    '<li><a target="_blank" rel="noopener noreferrer" href="https://www.instagram.com/flagship_towing/?hl=en" class="zocial instagram" aria-label="instagram"></a></li>' +
    "</ul></div></div>" +
    '<div class="scCredit"><a href="https://gospacecraft.com" target="_blank" rel="nofollow">Created with <span>SpaceCraft</span></a></div>' +
    "</div></footer></div>";

  var NAV_TRIGGER_HTML =
    '<a id="navTrigger" href="#" style="display: none;" aria-label="Menu">' +
    '<span class="navIcon"><svg xmlns="http://www.w3.org/2000/svg" class="navIcon-svg--hamburger navIcon-svg--w1" viewBox="0 0 20 9">' +
    '<line class="line1" x1="0" y1="0" x2="20" y2="0"></line>' +
    '<line class="line2" x1="0" y1="4.5" x2="20" y2="4.5"></line>' +
    '<line class="line3" x1="0" y1="9" x2="20" y2="9"></line>' +
    "</svg></span></a>";

  var TYPEKIT_JS =
    "//use.typekit.net/ik/Fqx58I2CpGYwKgt0JePu5XLFRYGWDEKHgZ97aErXGd9feGqgfO_HJsJ1FQ93wRMhWhjDjQ6UZQMoZQFRwDbtjAByFQIoZRjuFAZRFRIDZRsce6MKYeZkjAonde80ZhNX-e8RjhNlSY48SaF8Zes8dAqKYWgkdayTdAB0daZyZWyXScBRdhoqZAoDZAsX-e80H6qJCBIbMg6YJMI7fbK8MsMgeMJ6MZMg_CW5UMj.js";

  function markTypekitActive() {
    var html = document.documentElement;
    html.classList.remove("wf-loading", "wf-inactive");
    html.classList.add(
      "wf-franklingothiccompresseddemi-n7-active",
      "wf-proximanovaextracondensedthin-n2-active",
      "wf-active"
    );
    if (global.jQuery) global.jQuery(global).trigger("fontsLoaded");
  }

  function ensureTypekit() {
    if (global.__flagshipTypekitEnsured) return;
    global.__flagshipTypekitEnsured = true;

    if (!document.getElementById("flagship-typekit-faces")) {
      var style = document.createElement("style");
      style.id = "flagship-typekit-faces";
      style.textContent =
        '@font-face{font-family:franklingothiccompresseddemi;src:url(https://use.typekit.net/af/5c3a8e/00000000000000007735d6ba/31/l?subset_id=1&fvd=n7&v=3) format("woff2"),url(https://use.typekit.net/af/5c3a8e/00000000000000007735d6ba/31/d?subset_id=1&fvd=n7&v=3) format("woff"),url(https://use.typekit.net/af/5c3a8e/00000000000000007735d6ba/31/a?subset_id=1&fvd=n7&v=3) format("opentype");font-weight:700;font-style:normal;font-stretch:normal;font-display:auto}' +
        '@font-face{font-family:proximanovaextracondensedthin;src:url(https://use.typekit.net/af/666eb7/00000000000000007735e60f/31/l?subset_id=1&fvd=n2&v=3) format("woff2"),url(https://use.typekit.net/af/666eb7/00000000000000007735e60f/31/d?subset_id=1&fvd=n2&v=3) format("woff"),url(https://use.typekit.net/af/666eb7/00000000000000007735e60f/31/a?subset_id=1&fvd=n2&v=3) format("opentype");font-weight:200;font-style:normal;font-stretch:normal;font-display:auto}';
      document.head.appendChild(style);
    }

    var html = document.documentElement;
    if (!html.classList.contains("wf-active")) {
      html.classList.add("wf-loading");
    }

    var inactiveTimer = setTimeout(function () {
      html.classList.remove("wf-loading");
      markTypekitActive();
    }, 3000);

    if (document.querySelector('script[src="' + TYPEKIT_JS + '"]')) {
      clearTimeout(inactiveTimer);
      markTypekitActive();
      return;
    }

    var tk = document.createElement("script");
    tk.src = TYPEKIT_JS;
    tk.type = "text/javascript";
    tk.async = true;
    tk.onload = tk.onreadystatechange = function () {
      var rs = this.readyState;
      if (rs && rs !== "complete" && rs !== "loaded") return;
      tk.onload = tk.onreadystatechange = null;
      clearTimeout(inactiveTimer);
      try {
        if (global.Typekit && global.Typekit.load) {
          global.Typekit.load({
            active: markTypekitActive,
            inactive: markTypekitActive,
          });
        } else {
          markTypekitActive();
        }
      } catch (e) {
        markTypekitActive();
      }
    };
    tk.onerror = function () {
      clearTimeout(inactiveTimer);
      markTypekitActive();
    };
    (document.head || document.documentElement).appendChild(tk);
  }

  function appendOnce(parent, tag, attrs) {
    if (attrs.id && document.getElementById(attrs.id)) return null;
    var el = document.createElement(tag);
    Object.keys(attrs).forEach(function (key) {
      if (key === "text") el.textContent = attrs.text;
      else el.setAttribute(key, attrs[key]);
    });
    parent.appendChild(el);
    return el;
  }

  function ensureHead() {
    if (document.getElementById("baseCSS")) return;
    var head = document.head;
    appendOnce(head, "link", {
      id: "baseCSS",
      rel: "stylesheet",
      type: "text/css",
      href: SITE_ORIGIN + "/css/base",
    });
    appendOnce(head, "link", {
      id: "pageCSS",
      rel: "stylesheet",
      type: "text/css",
      href: SITE_ORIGIN + "/css/page?styleIds=" + PAGE_STYLE_IDS,
    });
    appendOnce(head, "link", {
      id: "vendorCSS",
      rel: "stylesheet",
      type: "text/css",
      href: SITE_ORIGIN + "/css/vendor-print",
    });
    appendOnce(head, "link", {
      id: "customCSS",
      rel: "stylesheet",
      type: "text/css",
      href: SITE_ORIGIN + "/css/custom",
    });
    appendOnce(head, "script", {
      src: SITE_ORIGIN + "/modernizr.respond.min.js",
    });
  }

  function ensureHtmlClasses() {
    var html = document.documentElement;
    var required = [
      "js",
      "desktop",
      "fullBleed",
      "modern",
      "placeholder",
      "pointerevents",
      "no-touchevents",
      "requestanimationframe",
      "raf",
      "flexbox",
      "flexboxlegacy",
      "csstransforms",
      "csstransitions",
      "no-flexboxtweener",
      "no-touch",
      "stable-hover",
      "classlist",
    ];
    required.forEach(function (cls) {
      if (!html.classList.contains(cls)) html.classList.add(cls);
    });
  }

  function isMemberLoggedIn() {
    try {
      if (global.FlagshipAPI && typeof global.FlagshipAPI.isLoggedIn === "function") {
        return global.FlagshipAPI.isLoggedIn();
      }
      return !!(
        sessionStorage.getItem(MEMBER_TOKEN_KEY) ||
        localStorage.getItem(MEMBER_TOKEN_KEY) ||
        localStorage.getItem("flagship_refresh_token")
      );
    } catch (e) {
      return false;
    }
  }

  function applyMemberAuthChrome() {
    var loggedIn = isMemberLoggedIn();
    if (document.body) {
      document.body.classList.toggle("flagship-member-logged-in", loggedIn);
    }
    document.querySelectorAll(".flagship-guest-only").forEach(function (el) {
      el.hidden = loggedIn;
    });
  }

  function injectChrome() {
    if (document.querySelector(".headerAndNavContainer.fixedNav")) return;
    var headerHost = document.getElementById("flagship-site-header");
    var footerHost = document.getElementById("flagship-site-footer");
    if (headerHost) headerHost.outerHTML = HEADER_HTML;
    if (footerHost) footerHost.outerHTML = FOOTER_HTML;
    if (!document.getElementById("navTrigger")) {
      document.body.insertAdjacentHTML("beforeend", NAV_TRIGGER_HTML);
    }
    applyMemberAuthChrome();
  }

  function injectZocialStyles() {
    if (document.getElementById("flagship-zocial-styles")) return;
    var style = document.createElement("style");
    style.id = "flagship-zocial-styles";
    style.type = "text/css";
    style.textContent =
      '@media screen and (-webkit-min-device-pixel-ratio:0){@font-face{font-family:"zocial";src:url("' +
      SITE_ORIGIN +
      '/zocial.svg#zocial") format("svg");}}';
    document.head.appendChild(style);
  }

  function loadScript(src, callback) {
    var existing = document.querySelector('script[src="' + src + '"]');
    if (existing) {
      if (existing.getAttribute("data-loaded") === "true") {
        callback();
        return;
      }
      existing.addEventListener("load", callback, { once: true });
      return;
    }
    var script = document.createElement("script");
    script.src = src;
    script.onload = function () {
      script.setAttribute("data-loaded", "true");
      callback();
    };
    script.onerror = callback;
    document.body.appendChild(script);
  }

  function initFixedNav() {
    if (!global.jQuery) return;
    var $ = global.jQuery;
    (function (window, $, Modernizr) {
      var $body = $("body"),
        layout = $body.attr("data-sc-layout"),
        isBottomNav = layout === "j" || layout === "k",
        $fixedElem = $(".fixedNav"),
        $propElem = $fixedElem.next(),
        usingFixedNav = false,
        winWidth = $(window).width();
      if (isBottomNav) {
        $propElem = $(".footerContainer").length
          ? $(".footerContainer")
          : $(".primaryAndSecondaryContainer");
      }
      function setMargin() {
        var height = $fixedElem.outerHeight();
        var cssProp = isBottomNav ? "margin-bottom" : "margin-top";
        $propElem.css(cssProp, height);
        usingFixedNav = true;
      }
      function fixedNavProp() {
        if (window.scSuppressFixedNavHelper || $("html").hasClass("tuckContent")) {
          undoFixedNav();
        } else {
          setMargin();
        }
      }
      function undoFixedNav() {
        if (!isBottomNav) {
          $propElem.css({ marginTop: "" });
          usingFixedNav = false;
        } else {
          setMargin();
        }
      }
      function adaptFixedNav() {
        if ($(window).width() >= 768 || isBottomNav) {
          fixedNavProp();
        } else if (usingFixedNav) {
          undoFixedNav();
        }
      }
      if ($fixedElem.length) {
        if ($(".navContainer").length) {
          $body.on("mobileNavDestroyed", fixedNavProp);
          $body.on("mobileNavBuilt", undoFixedNav);
        } else {
          $body.on("enteredLargeScreenMode", fixedNavProp);
          $body.on("enteredSmallScreenMode", undoFixedNav);
        }
        $(function () {
          if (winWidth >= 768 || isBottomNav) fixedNavProp();
        });
        $(window)
          .on("resize", $.debounce ? $.debounce(100, adaptFixedNav) : adaptFixedNav)
          .on("fontsLoaded", adaptFixedNav);
        $body.on("cssUpdated updateFixedNav", adaptFixedNav);
      }
    })(global, $, global.Modernizr);
  }

  function bindScrollToForm() {
    var btn = document.getElementById("scrollToFormBtn");
    if (!btn) return;
    var onSignupPage = /index\.html$/.test(global.location.pathname) || /\/$/.test(global.location.pathname);
    if (!onSignupPage) return;
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var form = document.getElementById("multiStepForm");
      if (form) {
        form.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  function init(opts) {
    opts = opts || {};
    ensureHtmlClasses();
    ensureHead();
    ensureTypekit();
    injectChrome();

    loadScript("//code.jquery.com/jquery-1.12.4.min.js", function () {
      if (!global.jQuery) {
        loadScript(SITE_ORIGIN + "/jquery-1.12.4.min.js", afterJquery);
      } else {
        afterJquery();
      }
    });

    function afterJquery() {
      loadScript(SITE_ORIGIN + "/siteBundle.js", function () {
        loadScript(SITE_ORIGIN + "/js/body", function () {
          injectZocialStyles();
          initFixedNav();
          bindScrollToForm();
          applyMemberAuthChrome();
          if (typeof opts.onReady === "function") opts.onReady();
        });
      });
    }
  }

  global.FlagshipSiteChrome = {
    logoUrl: LOGO_URL,
    ensureHead: ensureHead,
    ensureTypekit: ensureTypekit,
    injectChrome: injectChrome,
    applyMemberAuthChrome: applyMemberAuthChrome,
    init: init,
  };
})(window);
