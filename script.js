// script.js
document.addEventListener("DOMContentLoaded", () => {
  console.log("script.js loaded");

  // --- DROPDOWN TOGGLE ---
  const headImg2 = document.querySelector(".headimg2");
  const dropdown = document.querySelector(".dropdown-menu");

  if (headImg2 && dropdown) {
    headImg2.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("show");
    });

    document.addEventListener("click", function (event) {
      if (!dropdown.contains(event.target) && !headImg2.contains(event.target)) {
        dropdown.classList.remove("show");
      }
    });
  }

  // --- API BASE (UPDATED FOR RENDER DEPLOYMENT) ---
  const apiBase = "https://venus-backend-main.onrender.com";

  // --- Validation Helpers ---
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validateFields(fields) {
    for (const { value, name, type } of fields) {
      if (!value || !value.toString().trim()) {
        alert(`${name} is required`);
        return false;
      }
      if (type === "email" && !isValidEmail(value)) {
        alert("❌ Please enter a valid email address");
        return false;
      }
      if (type === "password" && value.length < 6) {
        alert("❌ Password must be at least 6 characters long");
        return false;
      }
    }
    return true;
  }

  // --- LOGIN ---
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = document.querySelector(".inp.email")?.value || "";
      const password = document.querySelector(".inp.password")?.value || "";

      if (
        !validateFields([
          { value: email, name: "Email", type: "email" },
          { value: password, name: "Password", type: "password" },
        ])
      )
        return;

      try {
        const res = await fetch(`${apiBase}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("token", data.token);
          alert("✅ Login successful");
          window.location.href = "main.html";
        } else {
          alert("❌ " + (data.error || "Login failed"));
        }
      } catch (err) {
        console.error("login error:", err);
        alert("❌ Error connecting to server");
      }
    });
  }

  // --- SIGNUP ---
  const signupBtn = document.getElementById("signupBtn");
  if (signupBtn) {
    signupBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = document.querySelector(".inp.email")?.value || "";
      const password = document.querySelector(".inp.password")?.value || "";

      if (
        !validateFields([
          { value: email, name: "Email", type: "email" },
          { value: password, name: "Password", type: "password" },
        ])
      )
        return;

      try {
        const res = await fetch(`${apiBase}/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok) {
          alert("✅ Registration successful");
          window.location.href = "login.html";
        } else {
          alert("❌ " + (data.error || "Registration failed"));
        }
      } catch (err) {
        console.error("signup error:", err);
        alert("❌ Error connecting to server");
      }
    });
  }

  // --- REQUEST RESET ---
  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = document.querySelector(".inp.email")?.value || "";

      if (!validateFields([{ value: email, name: "Email", type: "email" }])) return;

      try {
        const res = await fetch(`${apiBase}/request-reset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("resetEmail", email);
          alert("✅ OTP sent to email");
          window.location.href = "recovery.html";
        } else {
          alert("❌ " + (data.error || "Reset failed"));
        }
      } catch (err) {
        console.error("request-reset error:", err);
        alert("❌ Error connecting to server");
      }
    });
  }

  // --- VERIFY RESET ---
  const verifyBtn = document.getElementById("verifyBtn");
  if (verifyBtn) {
    verifyBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const otp = document.querySelector(".inp.otp")?.value || "";
      const newPassword = document.querySelector(".inp.newPassword")?.value || "";
      const email = localStorage.getItem("resetEmail");

      if (
        !validateFields([
          { value: otp, name: "OTP", type: "text" },
          { value: newPassword, name: "New Password", type: "password" },
        ])
      )
        return;

      try {
        const res = await fetch(`${apiBase}/verify-reset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp, newPassword }),
        });
        const data = await res.json();
        if (res.ok) {
          alert("✅ Password reset successful");
          localStorage.removeItem("resetEmail");
          window.location.href = "login.html";
        } else {
          alert("❌ " + (data.error || "Reset failed"));
        }
      } catch (err) {
        console.error("verify-reset error:", err);
        alert("❌ Error connecting to server");
      }
    });
  }
});
