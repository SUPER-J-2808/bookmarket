/** Same host as the page when served from Express; fallback for opening .html files directly */
function apiOrigin() {
  if (window.location.protocol === "file:") return "http://localhost:5000";
  return window.location.origin;
}
const API_BASE = `${apiOrigin()}/api`;

/** Delay between retry attempts (ms) */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch JSON with timeout + retry count. On failure after all attempts, throws Error with a clear message.
 * @param {string} url
 * @param {RequestInit} options
 * @param {{ retries?: number; timeoutMs?: number; onRetry?: (info: { attempt: number; max: number; reason: string }) => void }} opts
 */
async function fetchJsonWithRetry(url, options = {}, opts = {}) {
  const max = Math.max(1, opts.retries ?? 3);
  const timeoutMs = opts.timeoutMs ?? 12000;

  for (let attempt = 1; attempt <= max; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const started = performance.now();
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      const elapsed = Math.round(performance.now() - started);
      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text || "Invalid response" };
      }
      if (!res.ok) {
        const msg = data.message || `HTTP ${res.status}`;
        if (res.status >= 500 && attempt < max) {
          opts.onRetry?.({
            attempt,
            max,
            reason: `${msg} (${elapsed}ms)`
          });
          await delay(300 * attempt);
          continue;
        }
        const err = new Error(msg);
        err.isHttpError = true;
        throw err;
      }
      return data;
    } catch (e) {
      clearTimeout(timer);
      if (e.isHttpError) throw e;
      const elapsed = Math.round(performance.now() - started);
      const aborted = e.name === "AbortError";
      const reason = aborted
        ? `request timed out after ${timeoutMs}ms`
        : e.message || "network error";
      if (attempt < max) {
        opts.onRetry?.({ attempt, max, reason: `${reason} (${elapsed}ms)` });
        await delay(300 * attempt);
        continue;
      }
      throw new Error(`Failed after ${max} attempt(s): ${reason}`);
    }
  }
  throw new Error("Request failed");
}

/** Ensures user.id is a string so JWT + dashboard comparisons work reliably */
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

const getSession = () => {
  const raw = JSON.parse(localStorage.getItem("cbm_session") || "null");
  const normalized = normalizeSession(raw);
  if (normalized?.user?.id && JSON.stringify(normalized) !== JSON.stringify(raw)) {
    localStorage.setItem("cbm_session", JSON.stringify(normalized));
  }
  return normalized;
};

const setSession = (session) => {
  localStorage.setItem("cbm_session", JSON.stringify(normalizeSession(session)));
};
const clearSession = () => localStorage.removeItem("cbm_session");

const authHeaders = () => {
  const session = getSession();
  return session?.token ? { Authorization: `Bearer ${session.token}` } : {};
};

const showToast = (message, type = "info", durationMs) => {
  const el = document.getElementById("toast");
  if (!el) return alert(message);
  el.textContent = message;
  el.style.whiteSpace = "pre-line";
  const fallback = type === "error" ? 5500 : 2400;
  const ms = durationMs ?? fallback;
  el.className = `fixed right-4 top-4 z-[100] max-w-sm rounded-xl px-4 py-3 text-sm font-medium shadow-lg sm:max-w-md ${
    type === "error"
      ? "border border-red-200 bg-red-50 text-red-900"
      : "border border-teal-200 bg-teal-50 text-teal-900"
  }`;
  setTimeout(() => {
    el.className = "hidden";
    el.style.whiteSpace = "";
  }, ms);
};

function logout() {
  clearSession();
  window.location.href = "index.html";
}

async function loadBooks() {
  const q = document.getElementById("search")?.value?.trim() || "";
  const branch = document.getElementById("branch")?.value || "";
  const semester = document.getElementById("semester")?.value || "";
  const minPrice = document.getElementById("minPrice")?.value || "";
  const maxPrice = document.getElementById("maxPrice")?.value || "";
  const params = new URLSearchParams({ q, branch, semester, minPrice, maxPrice });

  const container = document.getElementById("bookContainer");
  if (!container) return;
  container.innerHTML = `<p class="col-span-full text-center text-sm text-zinc-500">Loading books…</p>`;
  let books;
  try {
    books = await fetchJsonWithRetry(`${API_BASE}/books?${params}`, {}, {
      retries: 3,
      timeoutMs: 12000,
      onRetry: ({ attempt, max, reason }) => {
        container.innerHTML = `<p class="col-span-full text-center text-sm text-amber-700">Retry ${attempt}/${max}: ${reason}</p>`;
      }
    });
  } catch (e) {
    container.innerHTML = `<div class="col-span-full rounded-2xl border border-red-100 bg-red-50 p-6 text-center"><p class="font-medium text-red-800">Couldn’t load books</p><p class="mt-1 text-sm text-red-700">${e.message}</p></div>`;
    showToast(e.message, "error");
    return;
  }

  if (!Array.isArray(books) || !books.length) {
    container.innerHTML = `<p class="col-span-full rounded-2xl border border-dashed border-zinc-200 bg-white py-12 text-center text-sm text-zinc-500">No books match your filters. Try clearing filters or search.</p>`;
    return;
  }

  container.innerHTML = books
    .map((book) => {
      const phone = book.sellerPhone || "";
      const message = encodeURIComponent(`Hi, I am interested in your book "${book.title}".`);
      const waLink = phone ? `https://wa.me/${phone}?text=${message}` : "#";
      return `
      <article class="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md">
        <img class="h-44 w-full object-cover" src="${book.image ? `${apiOrigin()}${book.image}` : "https://via.placeholder.com/400x250?text=Book"}" alt="">
        <div class="flex flex-1 flex-col p-4">
          <h3 class="font-semibold leading-snug text-zinc-900">${book.title}</h3>
          <p class="mt-2 text-lg font-semibold text-teal-700">₹${book.price}</p>
          <p class="mt-1 text-xs text-zinc-500">${book.branch} · Sem ${book.semester} · ${book.condition}</p>
          <p class="mt-2 line-clamp-2 flex-1 text-sm text-zinc-600">${book.description || "No description"}</p>
          <div class="mt-4 flex flex-wrap gap-2">
            <a class="inline-flex flex-1 min-w-[8rem] items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-center text-xs font-medium text-white hover:bg-emerald-700 ${!phone ? "pointer-events-none opacity-40" : ""}" href="${waLink}" target="_blank" rel="noopener">WhatsApp</a>
            <button type="button" class="inline-flex flex-1 min-w-[8rem] items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50" onclick="sendOrderRequest('${book._id}')">Request</button>
          </div>
        </div>
      </article>`;
    })
    .join("");
}

async function sendOrderRequest(bookId) {
  const session = getSession();
  if (!session?.token) return showToast("Please login first", "error");
  const message = prompt("Optional message for seller:", "I want to buy this book");
  try {
    await fetchJsonWithRetry(
      `${API_BASE}/orders`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ bookId, message: message || "" })
      },
      { retries: 2, timeoutMs: 12000 }
    );
    showToast("Order request sent");
  } catch (e) {
    showToast(e.message || "Could not send request", "error");
  }
}

async function createBook(event) {
  event.preventDefault();
  const formData = new FormData(document.getElementById("bookForm"));
  try {
    await fetchJsonWithRetry(
      `${API_BASE}/books`,
      {
        method: "POST",
        headers: { ...authHeaders() },
        body: formData
      },
      { retries: 2, timeoutMs: 20000 }
    );
    showToast("Book listed successfully");
  } catch (e) {
    showToast(e.message || "Book add failed", "error");
  }
  document.getElementById("bookForm").reset();
}

async function loadProfileAndOrders() {
  const session = getSession();
  const profileEl = document.getElementById("profileInfo");
  const orderEl = document.getElementById("orderList");
  if (!profileEl || !orderEl || !session?.token) return;

  let profileData;
  let orders;
  try {
    [profileData, orders] = await Promise.all([
      fetchJsonWithRetry(`${API_BASE}/users/me`, { headers: authHeaders() }, { retries: 2, timeoutMs: 12000 }),
      fetchJsonWithRetry(`${API_BASE}/orders/my`, { headers: authHeaders() }, { retries: 2, timeoutMs: 12000 })
    ]);
  } catch (e) {
    profileEl.innerHTML = `<p class="text-red-600">${e.message}</p>`;
    orderEl.innerHTML = `<li class="text-red-600">${e.message}</li>`;
    showToast(e.message, "error");
    return;
  }

  if (profileData?.user) {
    const r = profileData.rating || {};
    profileEl.innerHTML = `
      <div class="rounded-xl bg-zinc-50 px-3 py-2"><span class="text-xs text-zinc-500">Name</span><p class="font-medium text-zinc-900">${profileData.user.name}</p></div>
      <div class="rounded-xl bg-zinc-50 px-3 py-2"><span class="text-xs text-zinc-500">Email</span><p class="font-medium text-zinc-900 break-all">${profileData.user.email}</p></div>
      <div class="rounded-xl bg-zinc-50 px-3 py-2"><span class="text-xs text-zinc-500">Role</span><p class="font-medium text-zinc-900 capitalize">${profileData.user.role}</p></div>
      <div class="rounded-xl bg-zinc-50 px-3 py-2 sm:col-span-2"><span class="text-xs text-zinc-500">Your rating</span><p class="font-medium text-zinc-900">${(r.avgRating || 0).toFixed(1)} ★ <span class="font-normal text-zinc-500">(${r.totalRatings || 0} reviews)</span></p></div>
    `;
  }

  if (Array.isArray(orders)) {
    orderEl.innerHTML = orders.length
      ? orders
          .map(
            (o) => `<li class="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0">
          <div>
            <p class="font-medium text-zinc-900">${o.book?.title || "Book"}</p>
            <p class="text-xs text-zinc-500"><span class="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 capitalize">${o.status}</span></p>
          </div>
          ${String(session.user.id) === String(o.seller?._id) && o.status === "pending"
            ? `<span class="flex gap-2"><button type="button" class="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700" onclick="updateOrderStatus('${o._id}', 'accepted')">Accept</button>
               <button type="button" class="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50" onclick="updateOrderStatus('${o._id}', 'rejected')">Decline</button></span>`
            : ""}
        </li>`
          )
          .join("")
      : '<li class="py-4 text-sm text-zinc-500">No order requests yet.</li>';
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    await fetchJsonWithRetry(
      `${API_BASE}/orders/${orderId}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status })
      },
      { retries: 2, timeoutMs: 12000 }
    );
    showToast(`Order ${status}`);
    loadProfileAndOrders();
  } catch (e) {
    showToast(e.message || "Update failed", "error");
  }
}

async function rateSeller(event) {
  event.preventDefault();
  const body = {
    sellerId: document.getElementById("sellerId").value.trim(),
    stars: Number(document.getElementById("stars").value),
    review: document.getElementById("review").value.trim()
  };
  try {
    await fetchJsonWithRetry(
      `${API_BASE}/ratings`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body)
      },
      { retries: 2, timeoutMs: 12000 }
    );
    showToast("Rating submitted");
  } catch (e) {
    showToast(e.message || "Rating failed", "error");
  }
}

async function loadAdminDashboard() {
  const table = document.getElementById("adminData");
  if (!table) return;
  let data;
  try {
    data = await fetchJsonWithRetry(`${API_BASE}/admin/dashboard`, { headers: authHeaders() }, { retries: 2, timeoutMs: 15000 });
  } catch (e) {
    table.innerHTML = `<p class="text-red-600">${e.message || "Access denied"}</p>`;
    showToast(e.message, "error");
    return;
  }
  const requestRows = (data.requests || [])
    .map(
      (r) => `<tr class="hover:bg-zinc-50/80">
      <td class="px-4 py-3 font-medium text-zinc-900">${r.user?.name || "—"}</td>
      <td class="px-4 py-3 text-zinc-600">${r.method}</td>
      <td class="px-4 py-3"><span class="rounded-full bg-zinc-100 px-2 py-0.5 text-xs capitalize">${r.status}</span></td>
      <td class="px-4 py-3">
        ${r.status === "pending" ? `<button type="button" class="mr-2 rounded-lg bg-teal-600 px-2 py-1 text-xs font-medium text-white hover:bg-teal-700" onclick="adminDecision('${r._id}','approved')">Approve</button><button type="button" class="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50" onclick="adminDecision('${r._id}','rejected')">Reject</button>` : "—"}
      </td>
    </tr>`
    )
    .join("");
  table.innerHTML = `
    <p class="text-sm text-zinc-500">Overview</p>
    <div class="mt-2 flex flex-wrap gap-3 text-sm">
      <span class="rounded-full bg-zinc-100 px-3 py-1 font-medium text-zinc-800">${(data.users || []).length} users</span>
      <span class="rounded-full bg-zinc-100 px-3 py-1 font-medium text-zinc-800">${(data.books || []).length} books</span>
    </div>
    <h3 class="mt-6 text-sm font-semibold text-zinc-900">Seller verification queue</h3>
    <div class="mt-3 overflow-x-auto rounded-xl border border-zinc-200">
    <table class="w-full min-w-[32rem] text-left text-sm">
      <thead class="border-b border-zinc-200 bg-zinc-50"><tr><th class="px-4 py-3 font-medium text-zinc-700">User</th><th class="px-4 py-3 font-medium text-zinc-700">Method</th><th class="px-4 py-3 font-medium text-zinc-700">Status</th><th class="px-4 py-3 font-medium text-zinc-700">Action</th></tr></thead>
      <tbody class="divide-y divide-zinc-100">${requestRows || "<tr><td class='px-4 py-6 text-zinc-500' colspan='4'>No pending requests</td></tr>"}</tbody>
    </table>
    </div>
  `;
}

async function adminDecision(id, status) {
  try {
    await fetchJsonWithRetry(
      `${API_BASE}/admin/verification/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status })
      },
      { retries: 2, timeoutMs: 12000 }
    );
    showToast(`Request ${status}`);
    loadAdminDashboard();
  } catch (e) {
    showToast(e.message || "Action failed", "error");
  }
}

function enforceAuth() {
  const requiresAuth = document.body.dataset.auth === "true";
  if (!requiresAuth) return;
  if (!getSession()?.token) window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  enforceAuth();
  if (document.getElementById("bookContainer")) loadBooks();
  if (document.getElementById("profileInfo")) loadProfileAndOrders();
  if (document.getElementById("adminData")) loadAdminDashboard();
});
