(function () {
  const api = window.FlagshipAPI;
  const UI = window.FlagshipProfileUI;
  if (!api || !UI || !api.requireAuth("signin.html")) return;

  const TABS = [
    { label: "Incident Logs", value: "incident_logs" },
    { label: "Membership Logs", value: "membership_logs" },
    { label: "Authorized Users", value: "authorized_users" },
    { label: "Vessels", value: "vessels" },
  ];

  let selectedTab = TABS[0].value;
  const tabDataCache = {};

  const messageEl = document.getElementById("pageMessage");
  const loadingEl = document.getElementById("profileLoading");
  const contentEl = document.getElementById("profileContent");
  const avatarEl = document.getElementById("userAvatar");
  const pillsEl = document.getElementById("profilePills");
  const tabsEl = document.getElementById("profileTabs");
  const sectionTitleEl = document.getElementById("profileSectionTitle");
  const tableWrap = document.getElementById("vesselsTableWrap");
  const statusEl = document.getElementById("userStatus");
  const addVesselWrap = document.getElementById("addVesselLink");
  const authorizedLinkWrap = document.getElementById("authorizedUserLink");
  const pendingBadge = document.getElementById("pendingBadge");

  addVesselWrap.innerHTML = UI.buttonHtml({
    text: "Add Vessel",
    outlined: true,
    htmlType: "button",
  });
  addVesselWrap.querySelector("button").addEventListener("click", function () {
    window.location.href = "add-vessel.html";
  });

  authorizedLinkWrap.innerHTML = UI.buttonHtml({
    text: "New Authorized User Request",
    outlined: true,
    htmlType: "button",
  });
  authorizedLinkWrap.querySelector("button").addEventListener("click", function () {
    window.location.href = "add-authorized-user.html";
  });

  function showMessage(text, type) {
    UI.showMessage(messageEl, text, type);
    setTimeout(function () {
      UI.hideMessage(messageEl);
    }, 5000);
  }

  function formatDate(iso) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return m + "/" + day + "/" + d.getFullYear();
    } catch (e) {
      return "—";
    }
  }

  function vesselTitle(v) {
    const make = v.make || "";
    const reg = v.registration || "";
    const parts = [make, reg].filter(Boolean);
    return parts.length ? parts.join(" · ") : "—";
  }

  function membershipTableRows(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    const active = data.active_subscriptions || [];
    const inactive = data.inactive_subscriptions || [];
    const merged = active.concat(inactive);
    merged.sort(function (a, b) {
      const ta = new Date(a.created_at || a.current_period_end || 0).getTime();
      const tb = new Date(b.created_at || b.current_period_end || 0).getTime();
      return tb - ta;
    });
    return merged;
  }

  const COLUMN_DEFS = {
    incident_logs: [
      {
        label: "Service ID",
        render: function (row) {
          return UI.escapeHtml(row.service_id || "—");
        },
      },
      {
        label: "Service",
        render: function (row) {
          const title = row.service && row.service.title ? row.service.title : "—";
          return UI.escapeHtml(title);
        },
      },
      {
        label: "Date",
        render: function (row) {
          return UI.escapeHtml(formatDate(row.date || row.createdAt));
        },
      },
    ],
    membership_logs: [
      {
        label: "Plan",
        render: function (row) {
          return UI.escapeHtml(row.name || "—");
        },
      },
      {
        label: "Source",
        render: function (row) {
          return UI.escapeHtml(UI.formatMembershipSourceLabel(row.source));
        },
      },
      {
        label: "Vessel",
        render: function (row) {
          const v = row.vessel;
          if (!v) return "—";
          const parts = [v.registration, v.make].filter(Boolean);
          return UI.escapeHtml(parts.length ? parts.join(" · ") : "—");
        },
      },
      {
        label: "Amount",
        render: function (row) {
          const n = Number(row.amount);
          if (!Number.isFinite(n) || n <= 0) return "—";
          return UI.escapeHtml(UI.formatCurrency(n));
        },
      },
      {
        label: "Status",
        render: function (row) {
          const s = String(row.status || "").toLowerCase();
          const ok = s === "active";
          return UI.badgeHtml(ok ? "Active" : row.status || "Inactive", ok ? "success" : "danger");
        },
      },
      {
        label: "Period start",
        render: function (row) {
          return UI.escapeHtml(formatDate(row.current_period_start || row.created_at));
        },
      },
      {
        label: "Period end",
        render: function (row) {
          return UI.escapeHtml(formatDate(row.current_period_end));
        },
      },
    ],
    authorized_users: [
      {
        label: "First Name",
        render: function (row) {
          return UI.escapeHtml(row.first_name || "—");
        },
      },
      {
        label: "Last Name",
        render: function (row) {
          return UI.escapeHtml(row.last_name || "—");
        },
      },
      {
        label: "Email",
        render: function (row) {
          return UI.escapeHtml(row.email || "—");
        },
      },
      {
        label: "Phone",
        render: function (row) {
          return UI.escapeHtml(UI.formatPhonePlusOne(row.phone));
        },
      },
      {
        label: "Relationship",
        render: function (row) {
          return UI.escapeHtml(row.relation || "—");
        },
      },
      {
        label: "Registration Date",
        render: function (row) {
          return UI.escapeHtml(formatDate(row.createdAt));
        },
      },
    ],
    vessels: [
      {
        label: "Photo",
        render: function (row) {
          const src = api.resolveMediaUrl(row.images && row.images[0]);
          if (!src) return "—";
          return (
            '<img src="' +
            UI.escapeHtml(src) +
            '" alt="Vessel" style="width:56px;height:40px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb" />'
          );
        },
      },
      {
        label: "Vessel Name",
        render: function (row) {
          return UI.escapeHtml(vesselTitle(row));
        },
      },
      {
        label: "Primary boating location",
        render: function (row) {
          return UI.escapeHtml(row.primary_boating_location || "—");
        },
      },
      {
        label: "Registration",
        render: function (row) {
          return UI.escapeHtml(row.registration || "—");
        },
      },
      {
        label: "Created Date",
        render: function (row) {
          return UI.escapeHtml(formatDate(row.createdAt));
        },
      },
      {
        label: "Action",
        render: function (row) {
          const id = row._id || row.id;
          const hasPhoto = Boolean(row.images && row.images[0]);
          return (
            '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            UI.vesselPhotoActionHtml(
              'data-vessel-id="' + UI.escapeHtml(id) + '"',
              hasPhoto
            ) +
            UI.deleteActionHtml('data-vessel-id="' + UI.escapeHtml(id) + '"') +
            "</div>"
          );
        },
      },
    ],
  };

  function renderProfile(user) {
    const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
    avatarEl.innerHTML = UI.avatarHtml(name);
    pillsEl.innerHTML =
      UI.profilePillHtml("user", name || "—") +
      UI.profilePillHtml("mail", user.email || "—") +
      UI.profilePillHtml("phone", user.phone || user.primary_phone || "—") +
      (user.mailing_address
        ? UI.profilePillHtml("home", user.mailing_address)
        : "");

    if (statusEl) {
      const active = user.active !== false;
      statusEl.textContent = active ? "Active" : "Inactive";
      statusEl.className =
        "profile-status-value " + (active ? "is-active" : "is-inactive");
    }
  }

  function updatePendingBadge(pendingCount) {
    if (!pendingBadge) return;
    if (pendingCount > 0) {
      pendingBadge.textContent = String(pendingCount);
      pendingBadge.hidden = false;
    } else {
      pendingBadge.hidden = true;
    }
  }

  async function loadPendingBadge() {
    try {
      const res = await api.getFamily();
      const list = res.data || [];
      const pendingCount = list.filter(function (item) {
        return String(item.status || "").toLowerCase() === "pending";
      }).length;
      updatePendingBadge(pendingCount);
    } catch (err) {
      if (err.status === 401) {
        api.clearSession();
        window.location.href = "signin.html";
      }
    }
  }

  function bindVesselDeleteHandlers() {
    if (selectedTab !== "vessels") return;
    tableWrap.querySelectorAll(".flagship-delete-btn").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        const id = btn.getAttribute("data-vessel-id");
        const row = btn.closest("tr");
        const label = row ? row.cells[1]?.textContent : "vessel";
        if (!id || !window.confirm('Delete vessel "' + label + '"? This cannot be undone.')) return;
        try {
          await api.deleteVessel(id);
          showMessage("Vessel deleted.", "success");
          delete tabDataCache.vessels;
          loadTabData("vessels");
        } catch (err) {
          showMessage(err.message || "Could not delete vessel.");
        }
      });
    });

    tableWrap.querySelectorAll(".flagship-vessel-photo-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const id = btn.getAttribute("data-vessel-id");
        if (!id) return;
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.style.display = "none";
        document.body.appendChild(input);
        input.addEventListener("change", async function () {
          const file = input.files && input.files[0];
          document.body.removeChild(input);
          if (!file) return;
          const prev = btn.textContent;
          btn.disabled = true;
          btn.textContent = "Uploading…";
          try {
            const uploaded = await api.uploadImage(file);
            const path = uploaded && uploaded.data && uploaded.data.path;
            if (!path) throw new Error("Upload succeeded but no image path was returned.");
            await api.updateVessel(id, { images: [path] });
            showMessage("Vessel photo saved.", "success");
            delete tabDataCache.vessels;
            loadTabData("vessels");
          } catch (err) {
            showMessage(err.message || "Could not save vessel photo.");
            btn.disabled = false;
            btn.textContent = prev;
          }
        });
        input.click();
      });
    });
  }

  function renderTabs() {
    tabsEl.innerHTML = UI.tabsHtml(TABS, selectedTab);
    tabsEl.querySelectorAll(".profile-tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const tab = btn.getAttribute("data-tab");
        if (tab && tab !== selectedTab) {
          selectedTab = tab;
          renderTabs();
          loadTabData(selectedTab);
        }
      });
    });
  }

  function updateSectionTitle() {
    const tab = TABS.find(function (t) {
      return t.value === selectedTab;
    });
    if (sectionTitleEl && tab) {
      sectionTitleEl.textContent = tab.label;
    }
  }

  async function loadTabData(tab) {
    updateSectionTitle();
    const columns = COLUMN_DEFS[tab] || [];
    tableWrap.innerHTML = UI.tableHtml(columns, [], { loading: true });

    try {
      let rows = tabDataCache[tab];
      if (rows == null) {
        if (tab === "incident_logs") {
          const res = await api.getIncidents();
          rows = res.data || [];
        } else if (tab === "membership_logs") {
          const res = await api.getPaymentLogs();
          rows = membershipTableRows(res.data);
        } else if (tab === "authorized_users") {
          const res = await api.getFamily({ status: "approved" });
          rows = res.data || [];
        } else if (tab === "vessels") {
          const res = await api.getVessels();
          rows = res.data || [];
        } else {
          rows = [];
        }
        tabDataCache[tab] = rows;
      }

      tableWrap.innerHTML = UI.tableHtml(columns, rows, { loading: false });
      bindVesselDeleteHandlers();
    } catch (err) {
      if (err.status === 401) {
        api.clearSession();
        window.location.href = "signin.html";
        return;
      }
      tableWrap.innerHTML = UI.tableHtml(columns, [], { loading: false });
      showMessage(err.message || "Could not load data.");
    }
  }

  function hideLoading() {
    if (loadingEl) loadingEl.hidden = true;
    if (contentEl) contentEl.hidden = false;
  }

  async function init() {
    renderTabs();
    const params = new URLSearchParams(window.location.search || "");
    const payment = params.get("payment");
    try {
      let user = api.getUser();
      if (user) renderProfile(user);
      const res = await api.getProfile();
      user = res.data || res;
      api.setSession(api.getToken(), user, api.getRefreshToken());
      renderProfile(user);
      hideLoading();
      await Promise.all([loadTabData(selectedTab), loadPendingBadge()]);
      if (payment === "success") {
        showMessage("Payment received. Your membership status is up to date.", "success");
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, "", "user.html");
        }
      } else if (payment === "cancelled") {
        showMessage("Checkout was cancelled. No membership was activated.", "danger");
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, "", "user.html");
        }
      }
    } catch (err) {
      if (err.status === 401) {
        api.clearSession();
        window.location.href = "signin.html";
        return;
      }
      hideLoading();
      showMessage(err.message || "Could not load profile.");
      await Promise.all([loadTabData(selectedTab), loadPendingBadge()]);
    }
  }

  document.getElementById("signOutBtn").addEventListener("click", async function () {
    await api.logout();
    window.location.href = "signin.html";
  });

  init();
})();
