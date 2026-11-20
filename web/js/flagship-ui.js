/**
 * Static HTML helpers mirroring adminFlagship components (Input, Button, Table, etc.)
 */
(function (global) {
  const AVATAR_COLORS = [
    "bg-red-100 text-red-800",
    "bg-yellow-100 text-yellow-800",
    "bg-green-100 text-green-800",
    "bg-blue-100 text-blue-800",
    "bg-purple-100 text-purple-800",
    "bg-pink-100 text-pink-800",
    "bg-orange-100 text-orange-800",
    "bg-lime-100 text-lime-800",
  ];

  function getInitialDetails(name) {
    if (!name) return { initials: "?", theme: AVATAR_COLORS[0] };
    const names = name.trim().split(" ");
    let initials =
      names.length === 1
        ? (names[0][0] || "?").toUpperCase()
        : `${names[0][0] || ""}${names[names.length - 1][0] || ""}`.toUpperCase();
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return { initials, theme: AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] };
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** admin Input */
  function inputHtml(opts) {
    const id = opts.id || "";
    const label = opts.label || "";
    const type = opts.type || "text";
    const required = opts.required;
    const error = opts.error || "";
    const icon = opts.icon || "";
    const extra = opts.extraAttrs || "";
    const isTextarea = type === "textarea";
    const req = required ? '<span class="text-red-500">*</span>' : "";

    const fieldInner = isTextarea
      ? `<textarea id="${escapeHtml(id)}" name="${escapeHtml(id)}" rows="${opts.rows || 4}" class="w-full bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm resize-none" placeholder="${escapeHtml(opts.placeholder || (label ? "Enter " + label : ""))}" ${extra}></textarea>`
      : `<input id="${escapeHtml(id)}" name="${escapeHtml(id)}" type="${escapeHtml(type === "password" ? "password" : type)}" class="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm" placeholder="${escapeHtml(opts.placeholder || (label ? "Enter " + label : ""))}" ${type === "password" ? 'data-password-toggle="true"' : ""} ${extra}/>
         ${type === "password" ? '<button type="button" class="ml-2 text-secondary cursor-pointer flagship-pw-toggle" tabindex="-1"><i data-lucide="eye" class="w-[18px] h-[18px]"></i></button>' : icon ? `<i data-lucide="${escapeHtml(icon)}" class="ml-2 text-secondary w-[18px] h-[18px]"></i>` : ""}`;

    return `
      <div class="w-full text-left flagship-input-wrap" data-field="${escapeHtml(id)}">
        ${label ? `<label class="text-sm font-medium text-secondary" for="${escapeHtml(id)}">${escapeHtml(label)} ${req}</label>` : ""}
        <div class="relative px-4 mt-2 bg-gray-100 ${isTextarea ? "py-2 rounded-2xl" : "py-3 flex items-center rounded-full"}">
          ${fieldInner}
        </div>
        <p class="text-red-500 mt-1 text-sm px-3 flagship-field-error" data-error-for="${escapeHtml(id)}" ${error ? "" : 'style="display:none"'}>${escapeHtml(error)}</p>
      </div>`;
  }

  /** admin Button */
  function buttonHtml(opts) {
    const text = opts.text || "Button";
    const type = opts.type || "primary";
    const outlined = opts.outlined;
    const size = opts.size || "";
    const rounded = opts.rounded !== false;
    const id = opts.id || "";
    const disabled = opts.disabled || opts.loading;
    const btnType = opts.htmlType || "button";

    const base =
      "h-[42px] cursor-pointer flex items-center justify-center px-10 py-2 border-2 transition-all duration-200 text-md font-medium";
    const classes = {
      primary: {
        filled: "bg-primary text-white border-primary",
        outlined: "bg-white text-primary border-primary",
      },
      secondary: {
        filled: "bg-secondary text-white border-secondary",
        outlined: "bg-white text-secondary border-secondary",
      },
      muted: {
        filled: "bg-gray-200 text-secondary border-gray-200",
        outlined: "bg-white text-secondary border-gray-200",
      },
      danger: {
        filled: "bg-red-500 text-white border-red-500",
        outlined: "bg-white text-red-500 border-red-500",
      },
    };
    const width = { sm: "w-[120px]", md: "w-[200px]", lg: "w-full", "": "w-auto" }[size] || "w-auto";
    const sel = classes[type] || classes.primary;
    const mode = outlined ? sel.outlined : sel.filled;

    const content = opts.loading
      ? '<svg class="animate-spin text-primary w-5 h-5" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>'
      : escapeHtml(text);

    return `<button type="${btnType}" id="${escapeHtml(id)}" class="${base} ${mode} ${width} ${rounded ? "rounded-full" : "rounded-md"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}" ${disabled ? "disabled" : ""}>${content}</button>`;
  }

  function setFieldError(inputId, msg) {
    const wrap = document.querySelector('[data-field="' + inputId + '"]');
    const err = document.querySelector('[data-error-for="' + inputId + '"]');
    if (err) {
      err.textContent = msg || "";
      err.style.display = msg ? "" : "none";
    }
    if (wrap) wrap.classList.toggle("ring-1", !!msg);
  }

  function clearFieldErrors(ids) {
    (ids || []).forEach(function (id) {
      setFieldError(id, "");
    });
  }

  /** admin Avatar */
  function avatarHtml(name, size) {
    size = size || "xxl";
    const sizes = { sm: 36, md: 48, lg: 64, xl: 80, xxl: 120 };
    const px = sizes[size] || 120;
    const d = getInitialDetails(name);
    return `<div class="rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-semibold overflow-hidden ${d.theme} text-lg" style="height:${px}px;width:${px}px">${escapeHtml(d.initials)}</div>`;
  }

  /** admin profile pill row */
  function profilePillHtml(icon, text) {
    return `<div class="flex items-center border border-gray-300 rounded-full px-4 py-2 text-sm text-black">
      <i data-lucide="${escapeHtml(icon)}" class="w-4 h-4 text-primary mr-3"></i>
      ${escapeHtml(text)}
    </div>`;
  }

  /** admin Table */
  function tableHtml(columns, rows, options) {
    options = options || {};
    const loading = options.loading;
    const serial = options.serial !== false;
    let headers = serial ? [{ label: "S.No" }] : [];
    headers = headers.concat(columns);

    let body = "";
    if (loading) {
      body = `<tr><td colspan="${headers.length}" class="p-6 text-center text-gray-500 text-sm border border-black">
        <div class="flex items-center justify-center"><svg class="animate-spin text-primary w-8 h-8" viewBox="0 0 50 50"><circle class="text-primary" cx="25" cy="25" r="20" stroke="currentColor" stroke-width="5" fill="none"/><circle cx="25" cy="25" r="20" stroke="currentColor" stroke-width="5" stroke-dasharray="90" stroke-dashoffset="60" fill="none" stroke-linecap="round"/></svg></div>
      </td></tr>`;
    } else if (!rows || !rows.length) {
      body = `<tr><td colspan="${headers.length}" class="p-6 text-center text-gray-500 text-sm border border-black">No data available</td></tr>`;
    } else {
      body = rows
        .map(function (row, index) {
          const cells = serial
            ? `<td class="px-4 py-5 text-sm text-left text-black border border-black align-middle font-medium">${index + 1}</td>`
            : "";
          const dataCells = columns
            .map(function (col) {
              const val = col.render ? col.render(row, index) : row[col.key] != null ? row[col.key] : "—";
              return `<td class="px-4 py-5 text-sm text-left text-black border border-black align-middle font-medium">${val}</td>`;
            })
            .join("");
          return `<tr class="transition-all hover:bg-gray-100">${cells}${dataCells}</tr>`;
        })
        .join("");
    }

    const th = headers
      .map(function (h) {
        return `<th class="px-3 py-4 text-sm text-left text-black font-bold uppercase border border-black">${escapeHtml(h.label)}</th>`;
      })
      .join("");

    return `<div class="w-full overflow-x-auto px-8"><table class="w-full min-w-[600px] border border-black border-collapse"><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  /** admin TableActions delete icon */
  function tableDeleteActionHtml(onClickAttr) {
    return `<div class="flex items-center gap-2">
      <button type="button" class="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer transition shadow-sm relative group bg-red-50 text-red-500 hover:bg-red-100 flagship-delete-btn" ${onClickAttr || ""} aria-label="delete">
        <span class="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 whitespace-nowrap">Delete</span>
        <i data-lucide="trash-2" class="w-[18px] h-[18px]"></i>
      </button>
    </div>`;
  }

  function formSectionHtml(title, inner) {
    return `<div class="bg-gray-50 rounded-2xl py-5 px-5 space-y-4">
      <h2 class="text-lg font-semibold text-secondary">${escapeHtml(title)}</h2>
      ${inner}
    </div>`;
  }

  /** native select styled like admin Input */
  function selectHtml(opts) {
    const id = opts.id || "";
    const label = opts.label || "";
    const required = opts.required;
    const options = opts.options || [];
    const req = required ? '<span class="text-red-500">*</span>' : "";
    const optsHtml = options
      .map(function (o) {
        const v = typeof o === "string" ? o : o.value;
        const t = typeof o === "string" ? o : o.label;
        return `<option value="${escapeHtml(v)}">${escapeHtml(t)}</option>`;
      })
      .join("");
    return `
      <div class="w-full text-left flagship-input-wrap" data-field="${escapeHtml(id)}">
        <label class="text-sm font-medium text-secondary" for="${escapeHtml(id)}">${escapeHtml(label)} ${req}</label>
        <div class="relative px-4 mt-2 bg-gray-100 py-3 flex items-center rounded-full">
          <select id="${escapeHtml(id)}" name="${escapeHtml(id)}" class="flex-1 bg-transparent outline-none text-gray-800 text-sm w-full cursor-pointer">${optsHtml}</select>
          <i data-lucide="chevron-down" class="ml-2 text-secondary w-[18px] h-[18px] pointer-events-none"></i>
        </div>
        <p class="text-red-500 mt-1 text-sm px-3 flagship-field-error" data-error-for="${escapeHtml(id)}" style="display:none"></p>
      </div>`;
  }

  function initPasswordToggles(root) {
    (root || document).querySelectorAll("[data-password-toggle]").forEach(function (input) {
      const btn = input.parentElement && input.parentElement.querySelector(".flagship-pw-toggle");
      if (!btn || btn.dataset.bound) return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", function () {
        const isPw = input.type === "password";
        input.type = isPw ? "text" : "password";
        const icon = btn.querySelector("[data-lucide]");
        if (icon) icon.setAttribute("data-lucide", isPw ? "eye-off" : "eye");
        if (global.lucide) global.lucide.createIcons();
      });
    });
  }

  function refreshIcons() {
    if (global.lucide) global.lucide.createIcons();
  }

  function showToastMessage(el, text, type) {
    if (!el) return;
    el.textContent = text;
    el.className =
      "mb-4 rounded-xl px-4 py-3 text-sm " +
      (type === "success"
        ? "bg-green-50 text-green-800 border border-green-200"
        : "bg-red-50 text-red-800 border border-red-200");
    el.hidden = false;
  }

  function hideToastMessage(el) {
    if (el) el.hidden = true;
  }

  global.FlagshipUI = {
    escapeHtml,
    inputHtml,
    buttonHtml,
    selectHtml,
    avatarHtml,
    profilePillHtml,
    tableHtml,
    tableDeleteActionHtml,
    formSectionHtml,
    setFieldError,
    clearFieldErrors,
    initPasswordToggles,
    refreshIcons,
    showToastMessage,
    hideToastMessage,
    getInitialDetails,
  };
})(typeof window !== "undefined" ? window : global);
