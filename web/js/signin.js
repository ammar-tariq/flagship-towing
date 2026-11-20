(function () {
  const api = window.FlagshipAPI;
  const FormUI = window.FlagshipFormUI;
  if (!api || !FormUI) return;

  if (api.redirectIfLoggedIn()) return;

  function mountInputs() {
    document.getElementById("wrapLoginEmail").innerHTML = FormUI.formGroupInput({
      id: "loginEmail",
      label: "Email",
      type: "email",
      required: true,
      extraAttrs: 'autocomplete="email"',
    });
    document.getElementById("wrapLoginPassword").innerHTML = FormUI.formGroupInput({
      id: "loginPassword",
      label: "Password",
      type: "password",
      required: true,
      extraAttrs: 'autocomplete="current-password"',
    });
    document.getElementById("wrapLoginBtn").innerHTML = FormUI.btnArea(
      FormUI.submitButton({ id: "loginSubmit", text: "Login", htmlType: "submit" }),
      "end"
    );

    document.getElementById("wrapForgotEmail").innerHTML = FormUI.formGroupInput({
      id: "forgotEmail",
      label: "Email",
      type: "email",
      required: true,
      extraAttrs: 'autocomplete="email"',
    });
    document.getElementById("wrapForgotBtn").innerHTML = FormUI.btnArea(
      FormUI.submitButton({ id: "forgotSubmit", text: "Continue", htmlType: "submit" }),
      "end"
    );

    document.getElementById("wrapOtp").innerHTML = FormUI.formGroupInput({
      id: "otp",
      label: "Verification Code",
      type: "text",
      required: true,
      extraAttrs: 'inputmode="numeric" maxlength="8" autocomplete="one-time-code"',
    });
    document.getElementById("wrapVerifyBtn").innerHTML = FormUI.btnArea(
      FormUI.submitButton({ id: "verifySubmit", text: "Verify", htmlType: "submit" }),
      "end"
    );

    document.getElementById("wrapNewPassword").innerHTML = FormUI.formGroupInput({
      id: "newPassword",
      label: "Password",
      type: "password",
      required: true,
      extraAttrs: 'autocomplete="new-password"',
    });
    document.getElementById("wrapConfirmPassword").innerHTML = FormUI.formGroupInput({
      id: "confirmPassword",
      label: "Confirm Password",
      type: "password",
      required: true,
      extraAttrs: 'autocomplete="new-password"',
    });
    document.getElementById("wrapResetBtn").innerHTML = FormUI.btnArea(
      FormUI.submitButton({ id: "resetSubmit", text: "Submit", htmlType: "submit" }),
      "end"
    );
  }

  mountInputs();

  const messageEl = document.getElementById("authMessage");
  let resetEmail = "";
  let resendSeconds = 0;
  let resendInterval = null;

  (function applyCheckoutReturn() {
    var params = new URLSearchParams(window.location.search || "");
    var email = (params.get("email") || "").trim();
    var fromCheckout = params.get("from") === "checkout";
    var loginEmail = document.getElementById("loginEmail");
    if (email && loginEmail) {
      loginEmail.value = email;
    }
    if (fromCheckout) {
      FormUI.showAuthMessage(
        messageEl,
        "Payment received. Sign in with your email to open your member portal. Check your inbox for a welcome email if this is a new account.",
        "success"
      );
    }
    if ((email || fromCheckout) && window.history && window.history.replaceState) {
      window.history.replaceState({}, "", "signin.html");
    }
  })();

  function showView(name) {
    document.querySelectorAll(".flagship-auth-view").forEach(function (el) {
      var viewId = el.id.replace(/^view/, "");
      var viewName = viewId.charAt(0).toLowerCase() + viewId.slice(1);
      el.classList.toggle("is-active", viewName === name);
    });
    FormUI.hideAuthMessage(messageEl);
  }

  function startResendTimer(seconds) {
    resendSeconds = seconds;
    var btn = document.getElementById("resendOtp");
    var timerEl = document.getElementById("resendTimer");
    if (resendInterval) clearInterval(resendInterval);

    function tick() {
      if (resendSeconds <= 0) {
        if (btn) btn.disabled = false;
        if (timerEl) timerEl.textContent = "";
        clearInterval(resendInterval);
        return;
      }
      if (btn) btn.disabled = true;
      if (timerEl) timerEl.textContent = " (" + resendSeconds + "s)";
      resendSeconds -= 1;
    }

    tick();
    resendInterval = setInterval(tick, 1000);
  }

  document.getElementById("goForgot").addEventListener("click", function () {
    var loginEmail = document.getElementById("loginEmail");
    var forgotEmail = document.getElementById("forgotEmail");
    if (loginEmail && forgotEmail && loginEmail.value) forgotEmail.value = loginEmail.value.trim();
    showView("forgot");
  });
  document.getElementById("backFromForgot").addEventListener("click", function () {
    showView("login");
  });
  document.getElementById("backFromVerify").addEventListener("click", function () {
    showView("login");
  });
  document.getElementById("backFromReset").addEventListener("click", function () {
    showView("login");
  });

  document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    FormUI.clearFieldErrors(["loginEmail", "loginPassword"]);
    var email = document.getElementById("loginEmail").value.trim();
    var password = document.getElementById("loginPassword").value;
    var ok = true;
    if (!api.isValidEmail(email)) {
      FormUI.setFieldError("loginEmail", "Invalid email address");
      ok = false;
    }
    if (!password) {
      FormUI.setFieldError("loginPassword", "Password is required");
      ok = false;
    }
    if (!ok) return;

    FormUI.setButtonLoading("loginSubmit", true, "Login");
    try {
      var res = await api.login({ email: email, password: password });
      api.setSession(
        api.pickAccessToken(res),
        res.data,
        api.pickRefreshToken(res)
      );
      window.location.href = "user.html";
    } catch (err) {
      FormUI.showAuthMessage(messageEl, err.message || "Sign in failed.", "error");
    } finally {
      FormUI.setButtonLoading("loginSubmit", false, "Login");
    }
  });

  document.getElementById("forgotForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    FormUI.clearFieldErrors(["forgotEmail"]);
    var email = document.getElementById("forgotEmail").value.trim();
    if (!api.isValidEmail(email)) {
      FormUI.setFieldError("forgotEmail", "Invalid email address");
      return;
    }
    resetEmail = email;
    FormUI.setButtonLoading("forgotSubmit", true, "Continue");
    try {
      var res = await api.forgotPassword(email);
      FormUI.showAuthMessage(messageEl, res.message || "Verification code sent.", "success");
      document.getElementById("verifySubtitle").textContent =
        "Please enter the verification code sent to your email: " + email;
      showView("verify");
      startResendTimer(60);
    } catch (err) {
      FormUI.showAuthMessage(messageEl, err.message || "Could not send code.", "error");
    } finally {
      FormUI.setButtonLoading("forgotSubmit", false, "Continue");
    }
  });

  document.getElementById("verifyForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    FormUI.clearFieldErrors(["otp"]);
    var otp = document.getElementById("otp").value.trim();
    if (!otp || otp.length !== 6) {
      FormUI.setFieldError("otp", "Enter the 6-digit code");
      return;
    }
    if (!resetEmail) {
      FormUI.showAuthMessage(messageEl, "Start forgot password again.", "error");
      showView("forgot");
      return;
    }
    FormUI.setButtonLoading("verifySubmit", true, "Verify");
    try {
      await api.verifyOtp(resetEmail, otp);
      showView("reset");
      FormUI.hideAuthMessage(messageEl);
    } catch (err) {
      FormUI.showAuthMessage(messageEl, err.message || "Invalid code.", "error");
    } finally {
      FormUI.setButtonLoading("verifySubmit", false, "Verify");
    }
  });

  document.getElementById("resendOtp").addEventListener("click", async function () {
    if (!resetEmail || resendSeconds > 0) return;
    try {
      var res = await api.forgotPassword(resetEmail);
      FormUI.showAuthMessage(messageEl, res.message || "Code resent.", "success");
      startResendTimer(60);
    } catch (err) {
      FormUI.showAuthMessage(messageEl, err.message || "Could not resend.", "error");
    }
  });

  document.getElementById("resetForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    FormUI.clearFieldErrors(["newPassword", "confirmPassword"]);
    var password = document.getElementById("newPassword").value;
    var confirm = document.getElementById("confirmPassword").value;
    var ok = true;
    if (!password || password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      FormUI.setFieldError(
        "newPassword",
        "Password must be at least 8 characters with a letter and a number"
      );
      ok = false;
    }
    if (password !== confirm) {
      FormUI.setFieldError("confirmPassword", "Passwords do not match");
      ok = false;
    }
    if (!ok || !resetEmail) return;

    FormUI.setButtonLoading("resetSubmit", true, "Submit");
    try {
      await api.resetPassword(resetEmail, password);
      FormUI.showAuthMessage(messageEl, "Password reset successfully. Please sign in.", "success");
      showView("login");
      document.getElementById("loginEmail").value = resetEmail;
    } catch (err) {
      FormUI.showAuthMessage(messageEl, err.message || "Could not reset password.", "error");
    } finally {
      FormUI.setButtonLoading("resetSubmit", false, "Submit");
    }
  });
})();
