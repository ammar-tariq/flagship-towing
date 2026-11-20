/**
 * Index-style form helpers for auth / membership pages (no Tailwind).
 */
(function (global) {
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formGroupInput(opts) {
    const id = opts.id || "";
    const label = opts.label || "";
    const type = opts.type || "text";
    const required = opts.required;
    const extra = opts.extraAttrs || "";
    const req = required ? '<span class="required">*</span>' : "";

    return (
      '<div class="form-group flagship-form-field" data-field="' +
      escapeHtml(id) +
      '">' +
      '<label for="' +
      escapeHtml(id) +
      '">' +
      escapeHtml(label) +
      " " +
      req +
      "</label>" +
      '<input id="' +
      escapeHtml(id) +
      '" name="' +
      escapeHtml(id) +
      '" type="' +
      escapeHtml(type) +
      '" ' +
      (required ? "required " : "") +
      extra +
      " />" +
      '<span class="field-error" data-error-for="' +
      escapeHtml(id) +
      '" aria-live="polite"></span>' +
      "</div>"
    );
  }

  function submitButton(opts) {
    const id = opts.id || "";
    const text = opts.text || "Submit";
    const btnType = opts.htmlType || "submit";
    return (
      '<button type="' +
      escapeHtml(btnType) +
      '" id="' +
      escapeHtml(id) +
      '">' +
      escapeHtml(text) +
      "</button>"
    );
  }

  function btnArea(buttonsHtml, align) {
    const cls = align === "end" ? "btn-area btn-area--end" : "btn-area";
    return '<div class="' + cls + '">' + buttonsHtml + "</div>";
  }

  function setFieldError(inputId, msg) {
    const err = document.querySelector('[data-error-for="' + inputId + '"]');
    const input = document.getElementById(inputId);
    if (err) {
      err.textContent = msg || "";
      err.classList.toggle("is-visible", !!msg);
    }
    if (input) input.classList.toggle("input-error", !!msg);
  }

  function clearFieldErrors(ids) {
    (ids || []).forEach(function (id) {
      setFieldError(id, "");
    });
  }

  function showAuthMessage(el, text, type) {
    if (!el) return;
    el.textContent = text;
    el.className = "auth-message auth-message--" + (type === "success" ? "success" : "error");
    el.hidden = false;
  }

  function hideAuthMessage(el) {
    if (!el) return;
    el.hidden = true;
  }

  function formGroupSelect(opts) {
    const id = opts.id || "";
    const label = opts.label || "";
    const required = opts.required;
    const options = opts.options || [];
    const extra = opts.extraAttrs || "";
    const req = required ? '<span class="required">*</span>' : "";
    const optsHtml = options
      .map(function (o) {
        const v = typeof o === "string" ? o : o.value;
        const t = typeof o === "string" ? o : o.label;
        return (
          '<option value="' +
          escapeHtml(v) +
          '">' +
          escapeHtml(t) +
          "</option>"
        );
      })
      .join("");

    return (
      '<div class="form-group flagship-form-field" data-field="' +
      escapeHtml(id) +
      '">' +
      '<label for="' +
      escapeHtml(id) +
      '">' +
      escapeHtml(label) +
      " " +
      req +
      "</label>" +
      '<select id="' +
      escapeHtml(id) +
      '" name="' +
      escapeHtml(id) +
      '" ' +
      (required ? "required " : "") +
      extra +
      ">" +
      optsHtml +
      "</select>" +
      '<span class="field-error" data-error-for="' +
      escapeHtml(id) +
      '" aria-live="polite"></span>' +
      "</div>"
    );
  }

  function formSectionHtml(title, inner) {
    return (
      '<div class="form-section">' +
      "<h3>" +
      escapeHtml(title) +
      "</h3>" +
      inner +
      "</div>"
    );
  }

  function secondaryButton(opts) {
    const id = opts.id || "";
    const text = opts.text || "Cancel";
    const btnType = opts.htmlType || "button";
    return (
      '<button type="' +
      escapeHtml(btnType) +
      '" id="' +
      escapeHtml(id) +
      '" class="btn-secondary">' +
      escapeHtml(text) +
      "</button>"
    );
  }

  function setButtonLoading(id, loading, label) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
      btn.dataset.originalText = btn.textContent;
      btn.textContent = "Please wait…";
    } else {
      btn.textContent = label || btn.dataset.originalText || btn.textContent;
    }
  }

  global.FlagshipFormUI = {
    escapeHtml: escapeHtml,
    formGroupInput: formGroupInput,
    formGroupSelect: formGroupSelect,
    formSectionHtml: formSectionHtml,
    submitButton: submitButton,
    secondaryButton: secondaryButton,
    btnArea: btnArea,
    setFieldError: setFieldError,
    clearFieldErrors: clearFieldErrors,
    showAuthMessage: showAuthMessage,
    hideAuthMessage: hideAuthMessage,
    setButtonLoading: setButtonLoading,
  };
})(window);
