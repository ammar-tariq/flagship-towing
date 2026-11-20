(function () {
  const api = window.FlagshipAPI;
  const FormUI = window.FlagshipFormUI;
  if (!api || !FormUI || !api.requireAuth("signin.html")) return;

  const messageEl = document.getElementById("pageMessage");
  const modal = document.getElementById("successModal");
  const NAME_RE = /^[A-Za-z\s]+$/;

  document.getElementById("formFields").innerHTML =
    '<div class="two-inputs">' +
    FormUI.formGroupInput({ id: "first_name", label: "First Name", required: true }) +
    FormUI.formGroupInput({ id: "last_name", label: "Last Name", required: true }) +
    "</div>" +
    FormUI.formGroupInput({
      id: "email",
      label: "Email Address",
      type: "email",
      required: true,
      extraAttrs: 'autocomplete="email"',
    }) +
    FormUI.formGroupInput({
      id: "phone",
      label: "Phone Number",
      type: "tel",
      required: true,
      extraAttrs: 'autocomplete="tel"',
    }) +
    FormUI.formGroupInput({ id: "relation", label: "Relationship", required: true });

  document.getElementById("wrapSubmit").innerHTML = FormUI.btnArea(
    FormUI.submitButton({
      id: "submitAuthorizedUser",
      text: "Add Authorized User",
      htmlType: "submit",
    }),
    "end"
  );

  document.getElementById("wrapModalOk").innerHTML = FormUI.btnArea(
    FormUI.submitButton({ id: "modalOk", text: "Ok", htmlType: "button" }),
    "end"
  );

  function showMessage(text, type) {
    FormUI.showAuthMessage(messageEl, text, type);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openModal() {
    modal.hidden = false;
    modal.classList.add("is-open");
  }

  function validate() {
    const ids = ["first_name", "last_name", "email", "phone", "relation"];
    FormUI.clearFieldErrors(ids);
    let ok = true;

    const first = document.getElementById("first_name").value.trim();
    const last = document.getElementById("last_name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = api.digitsOnlyPhone(document.getElementById("phone").value);
    const relation = document.getElementById("relation").value.trim();

    if (!first || !NAME_RE.test(first)) {
      FormUI.setFieldError("first_name", "First name is required (letters only)");
      ok = false;
    }
    if (!last || !NAME_RE.test(last)) {
      FormUI.setFieldError("last_name", "Last name is required (letters only)");
      ok = false;
    }
    if (!api.isValidEmail(email)) {
      FormUI.setFieldError("email", "Enter a valid email");
      ok = false;
    }
    if (phone.length !== 10) {
      FormUI.setFieldError("phone", "Enter a valid 10-digit phone number");
      ok = false;
    }
    if (!relation) {
      FormUI.setFieldError("relation", "Relationship is required");
      ok = false;
    }
    return ok
      ? { first_name: first, last_name: last, email: email, phone: phone, relation: relation }
      : null;
  }

  document.getElementById("authorizedUserForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const payload = validate();
    if (!payload) return;

    const btn = document.getElementById("submitAuthorizedUser");
    btn.disabled = true;
    const prev = btn.textContent;
    btn.textContent = "Submitting…";

    try {
      await api.createFamily(payload);
      openModal();
    } catch (err) {
      showMessage(err.message || "Could not submit request.");
    } finally {
      btn.disabled = false;
      btn.textContent = prev || "Add Authorized User";
    }
  });

  document.getElementById("modalOk").addEventListener("click", function () {
    window.location.href = "user.html";
  });
})();
