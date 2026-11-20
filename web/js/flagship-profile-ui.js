/**
 * Profile page UI helpers — index/auth styling (no Tailwind / Lucide).
 */
(function (global) {
  const AVATAR_THEMES = 8;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getInitialDetails(name) {
    if (!name || !String(name).trim()) {
      return { initials: "?", theme: 0 };
    }
    const names = String(name).trim().split(/\s+/);
    const initials =
      names.length === 1
        ? (names[0][0] || "?").toUpperCase()
        : `${names[0][0] || ""}${names[names.length - 1][0] || ""}`.toUpperCase();
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return { initials, theme: Math.abs(hash) % AVATAR_THEMES };
  }

  function iconSvg(name) {
    const icons = {
      user: '<svg class="profile-pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      mail: '<svg class="profile-pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
      phone: '<svg class="profile-pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
      home: '<svg class="profile-pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    };
    return icons[name] || "";
  }

  function buttonHtml(opts) {
    const text = opts.text || "Button";
    const id = opts.id || "";
    const outlined = opts.outlined;
    const danger = opts.danger;
    const btnType = opts.htmlType || "button";
    const extraClass = opts.className || "";
    const cls = [
      "profile-btn",
      outlined ? "profile-btn--outline" : "",
      danger ? "profile-btn--danger" : "",
      extraClass,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      '<button type="' +
      escapeHtml(btnType) +
      '" id="' +
      escapeHtml(id) +
      '" class="' +
      cls +
      '">' +
      escapeHtml(text) +
      "</button>"
    );
  }

  function avatarHtml(name) {
    const d = getInitialDetails(name);
    return (
      '<div class="profile-avatar profile-avatar--c' +
      d.theme +
      '" aria-hidden="true">' +
      escapeHtml(d.initials) +
      "</div>"
    );
  }

  function profilePillHtml(icon, text) {
    return (
      '<div class="profile-pill">' +
      iconSvg(icon) +
      "<span>" +
      escapeHtml(text) +
      "</span></div>"
    );
  }

  function tabsHtml(tabs, activeValue) {
    return (
      '<div class="profile-tabs" role="tablist">' +
      tabs
        .map(function (tab) {
          const active = tab.value === activeValue;
          return (
            '<button type="button" class="profile-tab' +
            (active ? " is-active" : "") +
            '" role="tab" data-tab="' +
            escapeHtml(tab.value) +
            '" aria-selected="' +
            (active ? "true" : "false") +
            '">' +
            escapeHtml(tab.label) +
            "</button>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function badgeHtml(text, type) {
    const cls = type === "success" ? "is-success" : "is-danger";
    return (
      '<span class="profile-badge-pill ' +
      cls +
      '">' +
      escapeHtml(text) +
      "</span>"
    );
  }

  function tableHtml(columns, rows, options) {
    options = options || {};
    const loading = options.loading;
    const serial = options.serial !== false;

    let headers = serial ? [{ label: "S.No" }] : [];
    headers = headers.concat(columns);

    let body = "";
    if (loading) {
      body =
        '<tr><td colspan="' +
        headers.length +
        '" class="profile-table-loading">Loading…</td></tr>';
    } else if (!rows || !rows.length) {
      body =
        '<tr><td colspan="' +
        headers.length +
        '" class="profile-table-empty">No data available</td></tr>';
    } else {
      body = rows
        .map(function (row, index) {
          const cells = serial
            ? "<td>" + (index + 1) + "</td>"
            : "";
          const dataCells = columns
            .map(function (col) {
              const val = col.render
                ? col.render(row, index)
                : row[col.key] != null
                  ? row[col.key]
                  : "—";
              return "<td>" + val + "</td>";
            })
            .join("");
          return "<tr>" + cells + dataCells + "</tr>";
        })
        .join("");
    }

    const th = headers
      .map(function (h) {
        return "<th>" + escapeHtml(h.label) + "</th>";
      })
      .join("");

    return (
      '<div class="profile-table-wrap"><table class="profile-table"><thead><tr>' +
      th +
      "</tr></thead><tbody>" +
      body +
      "</tbody></table></div>"
    );
  }

  function deleteActionHtml(dataAttr) {
    return (
      '<button type="button" class="profile-btn profile-btn--danger flagship-delete-btn" ' +
      (dataAttr || "") +
      '>Delete</button>'
    );
  }

  function vesselPhotoActionHtml(dataAttr, hasPhoto) {
    return (
      '<button type="button" class="profile-btn flagship-vessel-photo-btn" ' +
      (dataAttr || "") +
      ">" +
      (hasPhoto ? "Update Photo" : "Add Photo") +
      "</button>"
    );
  }

  function showMessage(el, text, type) {
    if (!el) return;
    el.textContent = text;
    el.className =
      "auth-message auth-message--" + (type === "success" ? "success" : "error");
    el.hidden = false;
  }

  function hideMessage(el) {
    if (el) el.hidden = true;
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(Number(amount) || 0)
      .replace("$", "$ ");
  }

  function formatMembershipSourceLabel(source) {
    const s = String(source || "").toLowerCase();
    if (s === "app") return "App";
    if (s === "web") return "Web";
    if (s === "admin" || s === "offline") return "Admin";
    if (s === "stripe") return "App";
    return "—";
  }

  function formatPhonePlusOne(raw) {
    if (raw == null) return "—";
    const s = String(raw).trim();
    if (!s) return "—";
    const digits = s.replace(/\D/g, "");
    if (!digits) return s;
    let national = digits;
    if (national.length === 11 && national.startsWith("1")) {
      national = national.slice(1);
    }
    if (national.length === 10) return "+1" + national;
    if (s.startsWith("+")) return s;
    return "+1" + digits;
  }

  global.FlagshipProfileUI = {
    escapeHtml,
    buttonHtml,
    avatarHtml,
    profilePillHtml,
    tabsHtml,
    badgeHtml,
    tableHtml,
    deleteActionHtml,
    vesselPhotoActionHtml,
    showMessage,
    hideMessage,
    formatCurrency,
    formatMembershipSourceLabel,
    formatPhonePlusOne,
    getInitialDetails,
  };
})(typeof window !== "undefined" ? window : global);
