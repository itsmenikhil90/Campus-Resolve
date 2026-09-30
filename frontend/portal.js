(() => {
  const API = window.CAMPUS_RESOLVE_API_BASE;
  const token = localStorage.getItem("campus_resolve_auth_token") || localStorage.getItem("aicomply_auth_token") || localStorage.getItem("aimt_auth_token");
  const storedUser = localStorage.getItem("campus_resolve_auth_user") || localStorage.getItem("aicomply_auth_user") || localStorage.getItem("aimt_auth_user");
  let user;
  try {
    user = JSON.parse(storedUser || "null");
  } catch (error) {
    console.error("Could not read the stored account:", error);
    user = null;
  }
  if (token) localStorage.setItem("campus_resolve_auth_token", token);
  if (storedUser) localStorage.setItem("campus_resolve_auth_user", storedUser);
  ["aicomply_auth_token", "aimt_auth_token"].forEach(key => localStorage.removeItem(key));
  ["aicomply_auth_user", "aimt_auth_user"].forEach(key => localStorage.removeItem(key));
  const app = document.querySelector("#app");
  const admin = user?.role === "admin";

  if (!token || !user) {
    location.href = "index.html";
    return;
  }

  const esc = value => String(value || "").replace(/[&<>"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;"
  }[character]));

  const toast = message => {
    const notice = document.querySelector("#notice");
    notice.textContent = message;
    notice.hidden = false;
    setTimeout(() => { notice.hidden = true; }, 3000);
  };

  const responsesLink = document.querySelector("#responsesLink");
  if (!admin) {
    responsesLink.hidden = false;
    responsesLink.onclick = async () => {
      try {
        await student();
        await notifications();
        document.querySelector("#responses")?.scrollIntoView({ behavior: "smooth" });
      } catch (error) {
        toast(error.message);
      }
    };
  }

  const showDashboardError = error => {
    console.error("Dashboard load error:", error);
    app.innerHTML = "";
    const heading = document.createElement("h1");
    heading.textContent = "Dashboard unavailable";
    const message = document.createElement("p");
    message.textContent = error.message || "Could not load your dashboard. Please try again.";
    app.append(heading, message);
  };

  const call = async (path, options = {}) => {
    const response = await fetch(API + path, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({ message: `Request failed (HTTP ${response.status})` }));
    if (response.status === 401) {
      ["campus_resolve_auth_token", "aicomply_auth_token", "aimt_auth_token"].forEach(key => localStorage.removeItem(key));
      ["campus_resolve_auth_user", "aicomply_auth_user", "aimt_auth_user"].forEach(key => localStorage.removeItem(key));
      location.href = "index.html";
      return data;
    }
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  };

  document.querySelector("#identity").textContent = `${user.name} · ${admin ? "Administrator" : "User"}`;
  document.querySelector("#logout").onclick = () => {
    ["campus_resolve_auth_token", "aicomply_auth_token", "aimt_auth_token"].forEach(key => localStorage.removeItem(key));
    ["campus_resolve_auth_user", "aicomply_auth_user", "aimt_auth_user"].forEach(key => localStorage.removeItem(key));
    location.href = "index.html";
  };

  const statusCards = stats => Object.entries({
    Total: stats.total,
    "Pending Approval": stats.pendingApproval,
    "Under Review": stats.underReview,
    Assigned: stats.assigned,
    "In Progress": stats.inProgress,
    Resolved: stats.resolved,
    Rejected: stats.rejected
  }).map(([label, value]) => `<div class="card"><small>${label}</small><b>${value}</b></div>`).join("");

  const comments = complaint => (complaint.comments || []).map(comment =>
    `<li><b>${esc(comment.author?.name || "Administrator")}</b> · ${new Date(comment.createdAt).toLocaleString()}<br>${esc(comment.text)}</li>`
  ).join("") || "<li>No comments yet.</li>";

  const responses = complaint => {
    const items = complaint.responses?.length
      ? complaint.responses
      : complaint.adminResponse
        ? [{ text: complaint.adminResponse, createdAt: complaint.updatedAt, author: null }]
        : [];
    return items.map(response =>
      `<article class="response-item"><b>${esc(response.author?.name || "Administrator")}</b><small>${new Date(response.createdAt).toLocaleString()}</small><p>${esc(response.text)}</p></article>`
    ).join("");
  };

  const table = (items, isAdmin) => `
    <table>
      <thead><tr><th>Ticket</th><th>Title</th>${isAdmin ? "<th>User</th>" : ""}<th>Priority</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead>
      <tbody>${items.map(complaint => `
        <tr>
          <td>${esc(complaint.ticketId || complaint._id)}</td>
          <td>${esc(complaint.title)}</td>
          ${isAdmin ? `<td>${esc(complaint.student?.name)}<br><small>${esc(complaint.student?.studentId)}</small></td>` : ""}
          <td>${esc(complaint.priority)}</td>
          <td><span class="badge ${complaint.status.replaceAll(" ", "")}">${esc(complaint.status)}</span></td>
          <td>${new Date(complaint.updatedAt).toLocaleDateString()}</td>
          <td class="actions">
            <button data-detail="${complaint._id}">View</button>
            ${isAdmin && complaint.approvalStatus === "pending" ? `<button data-approve="${complaint._id}">Approve</button><button data-reject="${complaint._id}">Reject</button>` : ""}
            ${isAdmin && ["Under Review", "Assigned", "In Progress"].includes(complaint.status) ? `<button data-resolve="${complaint._id}">Mark solved</button>` : ""}
          </td>
        </tr>`).join("") || `<tr><td colspan="${isAdmin ? 7 : 6}">No complaints yet.</td></tr>`}</tbody>
    </table>`;

  async function notifications() {
    try {
      const data = await call("/notifications");
      document.querySelector("#unread").textContent = data.data.unreadCount ? `(${data.data.unreadCount})` : "";
      return data.data.notifications;
    } catch (error) {
      console.error("Could not load notifications:", error);
      toast(`Notifications unavailable: ${error.message}`);
      return [];
    }
  }

  document.querySelector("#notifications").onclick = async () => {
    const list = await notifications();
    app.insertAdjacentHTML("afterbegin", `<details open><summary>Notifications</summary>${list.map(item => `<p>${esc(item.title)} — ${esc(item.message)}</p>`).join("") || "No notifications"}</details>`);
    call("/notifications/read-all", { method: "PATCH" }).catch(error => toast(error.message));
  };

  async function student() {
    const data = await call("/complaints/my");
    const list = data.data;
    const counts = {
      total: list.length,
      pendingApproval: list.filter(item => item.status === "Pending Approval").length,
      underReview: list.filter(item => item.status === "Under Review").length,
      assigned: list.filter(item => item.status === "Assigned").length,
      inProgress: list.filter(item => item.status === "In Progress").length,
      resolved: list.filter(item => item.status === "Resolved").length,
      rejected: list.filter(item => item.status === "Rejected").length
    };
    const responseItems = list.filter(item => item.responses?.length || item.adminResponse);
    app.innerHTML = `<h1>My dashboard</h1><section class="cards">${statusCards(counts)}</section>
      <section class="panel"><h2>Submit a complaint</h2><form id="new">
        <div class="row"><input name="title" required placeholder="Complaint title"><select name="category"><option>Other</option><option>Infrastructure</option><option>Academics</option><option>Hostel</option><option>IT/Technical</option></select><select name="priority"><option>Medium</option><option>Low</option><option>High</option><option>Critical</option></select></div>
        <input name="department" value="${esc(user.department)}" placeholder="Department"><p><textarea required name="description" placeholder="Describe the issue"></textarea></p>
        <label>Attachments (up to 3 JPEG, PNG, WebP, or PDF files, 5 MB each)<input name="attachments" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" multiple></label>
        <button>Submit complaint</button></form></section><h2>Your complaints</h2>${table(list, false)}`;
    app.insertAdjacentHTML("beforeend", `<section class="panel" id="responses"><h2>Responses</h2>${responseItems.length
      ? responseItems.map(item => `<article class="response-entry"><h3>${esc(item.ticketId || item._id)} · ${esc(item.title)}</h3>${responses(item)}</article>`).join("")
      : "<p>Responses from administrators will appear here.</p>"}</section><section class="panel" id="complaintDetail" hidden></section>`);
    document.querySelector("#new").onsubmit = async event => {
      event.preventDefault();
      const form = new FormData(event.target);
      try {
        const response = await fetch(`${API}/complaints`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        toast(`Complaint ${result.data.ticketId} submitted for admin approval`);
        await student();
      } catch (error) {
        toast(error.message);
      }
    };
    bindDetails(false);
  }

  async function adminPanel() {
    const [stats, all] = await Promise.all([call("/complaints/admin/stats"), call("/complaints/admin/all")]);
    app.innerHTML = `<h1>Admin dashboard</h1><section class="cards">${statusCards(stats.data.stats)}</section>
      <div class="row"><input id="search" placeholder="Search ticket, title, user, email"><button id="pending">Pending approvals</button><button id="reload">Refresh</button></div>
      <h2>Complaint management</h2>${table(all.data, true)}<section class="panel" id="complaintDetail" hidden></section>`;
    document.querySelector("#search").onchange = async event => {
      try {
        const data = await call(`/complaints/admin/all?search=${encodeURIComponent(event.target.value)}`);
        app.querySelector("table").outerHTML = table(data.data, true);
        bindAdmin();
      } catch (error) {
        toast(error.message);
      }
    };
    document.querySelector("#pending").onclick = async () => {
      try {
        const data = await call("/complaints/admin/all?pending=true");
        app.querySelector("table").outerHTML = table(data.data, true);
        bindAdmin();
      } catch (error) {
        toast(error.message);
      }
    };
    document.querySelector("#reload").onclick = () => adminPanel().catch(showDashboardError);
    bindAdmin();
  }

  function bindAdmin() {
    document.querySelectorAll("[data-approve]").forEach(button => button.onclick = async () => {
      try { await call(`/complaints/admin/${button.dataset.approve}/approve`, { method: "PATCH" }); toast("Complaint approved"); await adminPanel(); } catch (error) { toast(error.message); }
    });
    document.querySelectorAll("[data-reject]").forEach(button => button.onclick = async () => {
      const reason = prompt("Rejection reason:");
      if (!reason?.trim()) return;
      try { await call(`/complaints/admin/${button.dataset.reject}/reject`, { method: "PATCH", body: JSON.stringify({ rejectionReason: reason }) }); toast("Complaint rejected"); await adminPanel(); } catch (error) { toast(error.message); }
    });
    document.querySelectorAll("[data-resolve]").forEach(button => button.onclick = async () => {
      const note = prompt("Resolution note:");
      if (!note?.trim()) return;
      try { await call(`/complaints/admin/${button.dataset.resolve}/status`, { method: "PATCH", body: JSON.stringify({ status: "Resolved", note }) }); toast("Complaint marked solved"); await adminPanel(); } catch (error) { toast(error.message); }
    });
    bindDetails(true);
  }

  function bindDetails(isAdmin) {
    document.querySelectorAll("[data-detail]").forEach(button => button.onclick = () => detail(button.dataset.detail, isAdmin));
  }

  async function detail(id, isAdmin) {
    try {
      const complaint = (await call(`/complaints/${id}`)).data;
      const detailPanel = document.querySelector("#complaintDetail");
      if (!detailPanel) return;
      const attachments = (complaint.images || []).map((_, index) =>
        `<button type="button" data-download="${index}" data-complaint="${esc(id)}">Download attachment ${index + 1}</button>`
      ).join(" ");
      detailPanel.hidden = false;
      detailPanel.innerHTML = `<details open><summary>${esc(complaint.ticketId)} — ${esc(complaint.title)}</summary>
        <p>${esc(complaint.description)}</p><p><b>Status:</b> ${esc(complaint.status)} · <b>AI summary:</b> ${esc(complaint.aiAnalysis?.summary)}</p>
        ${attachments ? `<p><b>Attachments:</b> ${attachments}</p>` : ""}
        <h3>Responses</h3>${responses(complaint) || "<p>No response has been sent yet.</p>"}<h3>Comments</h3><ul>${comments(complaint)}</ul>
        ${isAdmin ? `<textarea id="comment-${id}" placeholder="Add an internal/public comment"></textarea><button data-comment="${id}">Add comment</button>
          <textarea id="response-${id}" placeholder="Send a response to the user"></textarea><button data-response="${id}">Send response</button>
          ${["Under Review", "Assigned", "In Progress"].includes(complaint.status) ? `<button data-advance="${id}">Advance workflow</button>` : ""}` : ""}
        <p><b>History:</b> ${(complaint.statusHistory || []).map(item => `${esc(item.status)} — ${esc(item.note)} (${new Date(item.changedAt).toLocaleString()})`).join(" → ")}</p></details>`;
      document.querySelectorAll(`[data-complaint="${id}"][data-download]`).forEach(button => {
        button.addEventListener("click", async () => {
          try {
            const response = await fetch(`${API}/complaints/${encodeURIComponent(id)}/attachments/${button.dataset.download}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Could not download attachment");
            const url = URL.createObjectURL(await response.blob());
            const link = document.createElement("a");
            link.href = url;
            link.download = `attachment-${Number(button.dataset.download) + 1}`;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          } catch (error) {
            toast(error.message);
          }
        });
      });
      document.querySelector(`[data-comment="${id}"]`)?.addEventListener("click", async () => {
        try {
          const text = document.querySelector(`#comment-${id}`).value.trim();
          if (!text) return;
          await call(`/complaints/admin/${id}/comments`, { method: "POST", body: JSON.stringify({ text }) });
          toast("Comment added");
          await adminPanel();
          await detail(id, true);
        } catch (error) {
          toast(error.message);
        }
      });
      document.querySelector(`[data-response="${id}"]`)?.addEventListener("click", async () => {
        try {
          const adminResponse = document.querySelector(`#response-${id}`).value.trim();
          if (!adminResponse) return;
          await call(`/complaints/admin/${id}/response`, { method: "PATCH", body: JSON.stringify({ adminResponse }) });
          toast("Response sent to the user");
          await adminPanel();
          await detail(id, true);
        } catch (error) {
          toast(error.message);
        }
      });
      document.querySelector(`[data-advance="${id}"]`)?.addEventListener("click", async () => {
        try {
          const next = { "Under Review": "Assigned", Assigned: "In Progress", "In Progress": "Resolved" }[complaint.status];
          await call(`/complaints/admin/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: next }) });
          toast(`Moved to ${next}`);
          await adminPanel();
          await detail(id, true);
        } catch (error) {
          toast(error.message);
        }
      });
    } catch (error) {
      toast(error.message);
    }
  }

  notifications();
  if (admin) {
    adminPanel().catch(showDashboardError);
  } else {
    student().catch(showDashboardError);
  }
})();
