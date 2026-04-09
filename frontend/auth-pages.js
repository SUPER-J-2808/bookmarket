/**
 * Minimal login + register only — plain fetch, same session format as app.js
 */
function authApiBase() {
  if (window.location.protocol === "file:") return "http://localhost:5000/api";
  return `${window.location.origin}/api`;
}

function normalizeSession(payload) {
  if (!payload || typeof payload !== "object" || !payload.token) return payload;
  const u = payload.user || {};
  const id = u.id != null ? String(u.id) : u._id != null ? String(u._id) : null;
  if (!id) return payload;
  return {
    token: payload.token,
    user: {
      id,
      name: u.name,
      email: u.email,
      role: u.role,
      sellerVerified: Boolean(u.sellerVerified)
    }
  };
}

function saveSession(data) {
  localStorage.setItem("cbm_session", JSON.stringify(normalizeSession(data)));
}

function showAuthToast(message, isError) {
  const el = document.getElementById("toast");
  if (!el) {
    alert(message);
    return;
  }
  el.textContent = message;
  el.className =
    "fixed right-4 top-4 z-[100] max-w-sm rounded-xl border px-4 py-3 text-sm font-medium shadow-lg " +
    (isError
      ? "border-red-200 bg-red-50 text-red-900"
      : "border-teal-200 bg-teal-50 text-teal-900");
  setTimeout(() => {
    el.className = "hidden";
  }, isError ? 5000 : 2500);
}

async function authPost(path, body) {
  const url = authApiBase() + path;
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch {
    throw new Error(
      "Cannot connect. Run the server (cd backend → npm start), then open http://localhost:5000/"
    );
  }
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || "Bad response from server" };
  }
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

async function registerUser(event) {
  event.preventDefault();
  const btn = document.getElementById("registerBtn");
  const errBox = document.getElementById("registerError");
  if (errBox) {
    errBox.classList.add("hidden");
    errBox.textContent = "";
  }
  const prev = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Please wait…";
  try {
    const data = await authPost("/auth/register", {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value,
      phoneNumber: ""
    });
    saveSession(data);
    showAuthToast("Account created", false);
    window.location.href = "dashboard.html";
  } catch (e) {
    const msg = e.message || "Registration failed";
    showAuthToast(msg, true);
    if (errBox) {
      errBox.classList.remove("hidden");
      errBox.textContent = msg;
    }
  } finally {
    btn.disabled = false;
    btn.textContent = prev;
  }
}

async function loginUser(event) {
  event.preventDefault();
  const btn = document.getElementById("loginBtn");
  const errBox = document.getElementById("loginError");
  if (errBox) {
    errBox.classList.add("hidden");
    errBox.textContent = "";
  }
  const prev = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Please wait…";
  try {
    const data = await authPost("/auth/login", {
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value
    });
    saveSession(data);
    showAuthToast("Logged in", false);
    window.location.href = "dashboard.html";
  } catch (e) {
    const msg = e.message || "Login failed";
    showAuthToast(msg, true);
    if (errBox) {
      errBox.classList.remove("hidden");
      errBox.textContent = msg;
    }
  } finally {
    btn.disabled = false;
    btn.textContent = prev;
  }
}
