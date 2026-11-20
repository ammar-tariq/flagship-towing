(function () {
  const api = window.FlagshipAPI;
  const FormUI = window.FlagshipFormUI;
  if (!api || !FormUI || !api.requireAuth("signin.html")) return;

  const ADV_SOURCE_CAPTAIN_REFERRAL = "Captain Referral";
  let packages = [];
  const messageEl = document.getElementById("pageMessage");

  function showMessage(text, type) {
    FormUI.showAuthMessage(messageEl, text, type);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function mountForm() {
    document.getElementById("sectionMembership").innerHTML = FormUI.formSectionHtml(
      "Membership plan",
      '<div id="packagesLoading">Loading plans…</div><div id="packagesContainer"></div>'
    );

    document.getElementById("sectionOwner").innerHTML = FormUI.formSectionHtml(
      "Vessel owner information",
      '<div class="two-inputs">' +
        FormUI.formGroupInput({ id: "first_name", label: "First Name", required: true }) +
        FormUI.formGroupInput({ id: "last_name", label: "Last Name", required: true }) +
        "</div>" +
        '<div class="form-group address flagship-form-field" data-field="mailing_address">' +
        '<label for="mailing_address">Mailing Address <span class="required">*</span></label>' +
        '<p class="boat-info-help address-search-hint">Address suggestions are limited to the <strong>United States</strong>. If yours is not in the list, type the full mailing address yourself—nothing has to be chosen from the dropdown.</p>' +
        '<input type="text" id="mailing_address" name="mailing_address" required autocomplete="street-address" placeholder="Mailing Address" />' +
        '<span class="field-error" data-error-for="mailing_address" aria-live="polite"></span>' +
        "</div>" +
        '<div class="two-inputs">' +
        FormUI.formGroupInput({
          id: "primary_phone",
          label: "Primary Phone Number",
          required: true,
          type: "tel",
          extraAttrs: 'inputmode="numeric" maxlength="10" placeholder="10-digit phone"',
        }) +
        FormUI.formGroupInput({
          id: "secondary_phone",
          label: "Secondary Phone Number",
          type: "tel",
          extraAttrs: 'inputmode="numeric" maxlength="10" placeholder="10-digit phone"',
        }) +
        "</div>" +
        FormUI.formGroupInput({
          id: "email",
          label: "Email Address",
          type: "email",
          required: true,
          extraAttrs: 'autocomplete="email"',
        })
    );

    if (window.FlagshipAddressAutocomplete) {
      window.FlagshipAddressAutocomplete.init();
    }

    document.getElementById("sectionVessel").innerHTML = FormUI.formSectionHtml(
      "Vessel information",
      '<div class="two-inputs">' +
        FormUI.formGroupInput({ id: "make", label: "Manufacturer", required: true }) +
        FormUI.formGroupInput({ id: "boat_model", label: "Model", required: true }) +
        "</div>" +
        '<div class="two-inputs">' +
        FormUI.formGroupInput({
          id: "year",
          label: "Year",
          required: true,
          extraAttrs: 'maxlength="4" inputmode="numeric"',
        }) +
        FormUI.formGroupInput({
          id: "registration",
          label: "Registration",
          required: true,
          extraAttrs: 'maxlength="15"',
        }) +
        "</div>" +
        '<div class="two-inputs">' +
        FormUI.formGroupInput({ id: "hin_number", label: "HIN" }) +
        FormUI.formGroupSelect({
          id: "length",
          label: "Length",
          required: true,
          options: [{ value: "", label: "Select length" }].concat(
            Array.from({ length: 50 }, function (_, i) {
              const feet = String(i + 1);
              return { value: feet, label: feet + " ft" };
            })
          ),
        }) +
        "</div>" +
        '<div class="two-inputs">' +
        FormUI.formGroupInput({ id: "hull_color", label: "Color", required: true }) +
        '<div id="wrapBoatingLocation"></div>' +
        "</div>" +
        '<div id="wrapAdvName"></div>' +
        '<div id="wrapCaptainName" style="display:none"></div>' +
        '<div class="form-group flagship-form-field" data-field="vessel_photo">' +
        '<label for="vessel_photo">Vessel photo</label>' +
        '<p class="boat-info-help">Optional. Add a photo of your vessel now, or update it later from your account.</p>' +
        '<input type="file" id="vessel_photo" name="vessel_photo" accept="image/*" />' +
        '<div id="vesselPhotoPreview" style="display:none;margin-top:10px"></div>' +
        "</div>"
    );

    document.getElementById("wrapBoatingLocation").innerHTML = FormUI.formGroupSelect({
      id: "primary_boating_location",
      label: "Main boating location",
      required: true,
      options: [{ value: "", label: "Select main boating location" }],
    });

    document.getElementById("wrapAdvName").innerHTML = FormUI.formGroupSelect({
      id: "advName",
      label: "Where did you hear about us?",
      required: true,
      options: [
        { value: "", label: "Please select" },
        "Social Media",
        "Captain Referral",
        "Friend/Family",
        "Marina Sign",
        "Renew Membership",
        "Dispatcher",
      ],
    });

    document.getElementById("wrapCaptainName").innerHTML = FormUI.formGroupInput({
      id: "captainName",
      label: "Captain name",
      required: true,
    });

    document.getElementById("wrapSubmit").innerHTML = FormUI.btnArea(
      FormUI.secondaryButton({ id: "cancelVessel", text: "Cancel" }) +
        FormUI.submitButton({
          id: "submitVessel",
          text: "Continue to payment",
          htmlType: "submit",
        })
    );

    document.getElementById("cancelVessel").addEventListener("click", function () {
      window.location.href = "user.html";
    });

    document.getElementById("advName").addEventListener("change", syncCaptainField);

    function bindDigits(id, max) {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", function () {
        const next = el.value.replace(/\D/g, "").slice(0, max);
        if (next !== el.value) el.value = next;
      });
    }
    bindDigits("primary_phone", 10);
    bindDigits("secondary_phone", 10);
    bindDigits("year", 4);

    const registrationInput = document.getElementById("registration");
    if (registrationInput) {
      registrationInput.addEventListener("input", function () {
        const next = registrationInput.value.toUpperCase().slice(0, 15);
        if (next !== registrationInput.value) registrationInput.value = next;
      });
    }
    const hinInput = document.getElementById("hin_number");
    if (hinInput) {
      hinInput.addEventListener("input", function () {
        const next = hinInput.value.toUpperCase().replace(/\s/g, "");
        if (next !== hinInput.value) hinInput.value = next;
      });
    }

    const photoInput = document.getElementById("vessel_photo");
    if (photoInput) {
      photoInput.addEventListener("change", function () {
        const preview = document.getElementById("vesselPhotoPreview");
        const file = photoInput.files && photoInput.files[0];
        if (!preview) return;
        if (!file) {
          preview.style.display = "none";
          preview.innerHTML = "";
          return;
        }
        const url = URL.createObjectURL(file);
        preview.style.display = "";
        preview.innerHTML =
          '<img src="' +
          url +
          '" alt="Vessel preview" style="max-width:220px;max-height:160px;border-radius:12px;object-fit:cover;border:1px solid #ddd" />';
      });
    }
  }

  mountForm();

  function syncCaptainField() {
    const adv = document.getElementById("advName");
    const wrap = document.getElementById("wrapCaptainName");
    if (!adv || !wrap) return;
    if ((adv.value || "").trim() === ADV_SOURCE_CAPTAIN_REFERRAL) {
      wrap.style.display = "";
    } else {
      wrap.style.display = "none";
      const inp = document.getElementById("captainName");
      if (inp) inp.value = "";
    }
  }

  function prefillOwner() {
    const user = api.getUser();
    if (!user) return;
    const set = function (id, val) {
      const el = document.getElementById(id);
      if (el && val != null && val !== "" && !el.value) el.value = val;
    };
    set("first_name", user.first_name);
    set("last_name", user.last_name);
    set("email", user.email);
    set("primary_phone", user.primary_phone || user.phone);
  }

  function renderPackages() {
    const container = document.getElementById("packagesContainer");
    const loading = document.getElementById("packagesLoading");
    if (loading) loading.remove();
    if (!container) return;
    container.innerHTML = "";
    packages.forEach(function (m, index) {
      const priceId = m.priceId ? String(m.priceId) : "";
      const div = document.createElement("div");
      div.className = "membership";
      div.innerHTML =
        '<label>' +
        '<input type="radio" name="package" class="package-radio" value="' +
        FormUI.escapeHtml(priceId) +
        '" data-index="' +
        index +
        '"' +
        (priceId ? "" : " disabled") +
        " />" +
        "<span><b>" +
        FormUI.escapeHtml(m.name) +
        "</b> — $" +
        m.price.toFixed(2) +
        "</span></label>" +
        (m.description
          ? '<p>' + FormUI.escapeHtml(m.description) + "</p>"
          : "");
      container.appendChild(div);
    });
  }

  async function loadBoatingLocations() {
    const sel = document.getElementById("primary_boating_location");
    if (!sel) return;
    try {
      const res = await api.getBoatingLocations();
      if (!res.success || !Array.isArray(res.data)) return;
      res.data.forEach(function (loc) {
        const opt = document.createElement("option");
        opt.value = String(loc);
        opt.textContent = String(loc);
        sel.appendChild(opt);
      });
    } catch (e) {
      /* ignore */
    }
  }

  async function loadPackages() {
    try {
      const json = await api.getPackages();
      if (json.success && Array.isArray(json.data)) {
        packages = json.data.map(function (item) {
          return {
            priceId: item.prices && item.prices[0] ? item.prices[0].id : null,
            name: item.name,
            description: item.description || "",
            price:
              item.prices && item.prices[0] ? item.prices[0].unit_amount / 100 : 0,
          };
        });
      }
      renderPackages();
    } catch (err) {
      showMessage(err.message || "Could not load membership plans.");
    }
  }

  function getSelectedPriceId() {
    const checked = document.querySelector(".package-radio:checked");
    return checked ? (checked.value || "").trim() : "";
  }

  function validateForm() {
    const required = [
      "first_name",
      "last_name",
      "mailing_address",
      "primary_phone",
      "email",
      "make",
      "boat_model",
      "year",
      "length",
      "registration",
      "hull_color",
      "primary_boating_location",
      "advName",
    ];
    FormUI.clearFieldErrors(required.concat(["captainName"]));
    let ok = true;
    required.forEach(function (id) {
      const el = document.getElementById(id);
      if (!el || !String(el.value || "").trim()) {
        FormUI.setFieldError(id, "This field is required");
        ok = false;
      }
    });
    if (!getSelectedPriceId()) {
      showMessage("Please select a membership plan.");
      ok = false;
    }
    const email = document.getElementById("email").value.trim();
    if (!api.isValidEmail(email)) {
      FormUI.setFieldError("email", "Please enter a valid email address");
      ok = false;
    }
    const phone = api.digitsOnlyPhone(document.getElementById("primary_phone").value);
    if (phone.length !== 10) {
      FormUI.setFieldError("primary_phone", "Enter a valid phone number");
      ok = false;
    }
    const secondary = api.digitsOnlyPhone(document.getElementById("secondary_phone").value);
    if (document.getElementById("secondary_phone").value.trim() && secondary.length !== 10) {
      FormUI.setFieldError("secondary_phone", "Enter a valid phone number");
      ok = false;
    }
    const year = document.getElementById("year").value.trim();
    if (!/^\d{4}$/.test(year)) {
      FormUI.setFieldError("year", "Year must be 4 digits");
      ok = false;
    }
    const lengthFeet = Number(document.getElementById("length").value);
    if (!Number.isInteger(lengthFeet) || lengthFeet < 1 || lengthFeet > 50) {
      FormUI.setFieldError("length", "Length must be from 1 to 50 ft");
      ok = false;
    }
    const adv = document.getElementById("advName").value.trim();
    if (adv === ADV_SOURCE_CAPTAIN_REFERRAL && !document.getElementById("captainName").value.trim()) {
      FormUI.setFieldError("captainName", "Captain name is required");
      ok = false;
    }
    return ok;
  }

  function buildPayload() {
    const yearNum = parseInt(document.getElementById("year").value.trim(), 10);
    const lenNum = Number(document.getElementById("length").value);
    const registration = document
      .getElementById("registration")
      .value.trim()
      .toUpperCase()
      .slice(0, 15);
    const hin = document.getElementById("hin_number").value.trim().toUpperCase().replace(/\s/g, "");
    const advName = document.getElementById("advName").value.trim();
    const sec = api.digitsOnlyPhone(document.getElementById("secondary_phone").value);
    const mailingAddress = document.getElementById("mailing_address").value.trim();

    const body = {
      first_name: document.getElementById("first_name").value.trim(),
      last_name: document.getElementById("last_name").value.trim(),
      mailing_address: mailingAddress,
      primary_phone: api.digitsOnlyPhone(document.getElementById("primary_phone").value),
      email: document.getElementById("email").value.trim(),
      make: document.getElementById("make").value.trim(),
      boat_model: document.getElementById("boat_model").value.trim(),
      registration: registration,
      length:
        Number.isInteger(lenNum) && lenNum >= 1 && lenNum <= 50 ? lenNum : undefined,
      hull_color: document.getElementById("hull_color").value.trim(),
      primary_boating_location: document.getElementById("primary_boating_location").value,
      advName: advName,
      adv_name: advName,
      images: [],
    };
    if (sec) body.secondary_phone = sec;
    if (Number.isFinite(yearNum) && String(document.getElementById("year").value).trim().length === 4) {
      body.year = yearNum;
    }
    if (hin) body.hin_number = hin;
    if (advName === ADV_SOURCE_CAPTAIN_REFERRAL) {
      const captain = document.getElementById("captainName").value.trim();
      body.captainName = captain;
      body.captain_name = captain;
    }
    return body;
  }

  document.getElementById("addVesselForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!validateForm()) return;

    const priceId = getSelectedPriceId();
    const body = buildPayload();
    body.source = "web";
    const btn = document.getElementById("submitVessel");
    btn.disabled = true;
    btn.textContent = "Uploading…";

    try {
      const photoInput = document.getElementById("vessel_photo");
      const file = photoInput && photoInput.files && photoInput.files[0];
      if (file) {
        const uploaded = await api.uploadImage(file);
        const path = uploaded && uploaded.data && uploaded.data.path;
        if (path) {
          body.images = [path];
        }
      }
      btn.textContent = "Redirecting…";
      const res = await api.createVessel(priceId, body);
      const url = res.data;
      if (url && typeof url === "string") {
        if (!api.isAllowedCheckoutUrl(url)) {
          showMessage("Payment redirect blocked: unexpected checkout host.");
          return;
        }
        window.location.assign(url);
        return;
      }
      showMessage(res.message || "No checkout link returned.");
    } catch (err) {
      showMessage(err.message || "Could not create vessel.");
    } finally {
      btn.disabled = false;
      btn.textContent = "Continue to payment";
    }
  });

  prefillOwner();
  loadBoatingLocations();
  loadPackages();
  syncCaptainField();

  api
    .getProfile()
    .then(function (res) {
      const user = res.data || res;
      if (user) {
        api.setSession(api.getToken(), user, api.getRefreshToken());
        prefillOwner();
      }
    })
    .catch(function () {});
})();
