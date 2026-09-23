(() => {
  const API = window.AIMT_API_BASE || "/api";
  const token = localStorage.getItem("aimt_auth_token");
  const user = JSON.parse(localStorage.getItem("aimt_auth_user") || "null");
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

  const call = async (path, options = {}) => {
    const response = await fetch(API + path, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({ message: "Network error" }));
    if (response.status === 401 || response.status === 403) {
      localStorage.clear();
      location.href = "index.html";
      return data;
    }
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  };

  document.querySelector("#identity").textContent = `${user.name} · ${admin ? "Administrator" : "Student"}`;
  document.querySelector("#logout").onclick = () => {
    localStorage.clear();
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

  const table = (items, isAdmin) => `
    <table>
      <thead><tr><th>Ticket</th><th>Title</th>${isAdmin ? "<th>Student</th>" : ""}<th>Priority</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead>
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
    } catch {
      return [];
    }
  }

  document.querySelector("#notifications").onclick = async () => {
    const list = await notifications();
    app.insertAdjacentHTML("afterbegin", `<details open><summary>Notifications</summary>${list.map(item => `<p>${esc(item.title)} — ${esc(item.message)}</p>`).join("") || "No notifications"}</details>`);
    call("/notifications/read-all", { method: "PATCH" });
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
    app.innerHTML = `<h1>Student dashboard</h1><section class="cards">${statusCards(counts)}</section>
      <section class="panel"><h2>Submit a complaint</h2><form id="new">
        <div class="row"><input name="title" required placeholder="Complaint title"><select name="category"><option>Other</option><option>Infrastructure</option><option>Academics</option><option>Hostel</option><option>IT/Technical</option></select><select name="priority"><option>Medium</option><option>Low</option><option>High</option><option>Critical</option></select></div>
        <input name="department" value="${esc(user.department)}" placeholder="Department"><p><textarea required name="description" placeholder="Describe the issue"></textarea></p>
        <button>Submit complaint</button></form></section><h2>Your complaints</h2>${table(list, false)}`;
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
      <div class="row"><input id="search" placeholder="Search ticket, title, student, email"><button id="pending">Pending approvals</button><button id="reload">Refresh</button></div>
      <h2>Complaint management</h2>${table(all.data, true)}`;
    document.querySelector("#search").onchange = async event => {
      const data = await call(`/complaints/admin/all?search=${encodeURIComponent(event.target.value)}`);
      app.querySelector("table").outerHTML = table(data.data, true);
      bindAdmin();
    };
    document.querySelector("#pending").onclick = async () => {
      const data = await call("/complaints/admin/all?pending=true");
      app.querySelector("table").outerHTML = table(data.data, true);
      bindAdmin();
    };
    document.querySelector("#reload").onclick = adminPanel;
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
      app.insertAdjacentHTML("afterbegin", `<details open><summary>${esc(complaint.ticketId)} — ${esc(complaint.title)}</summary>
        <p>${esc(complaint.description)}</p><p><b>Status:</b> ${esc(complaint.status)} · <b>AI summary:</b> ${esc(complaint.aiAnalysis?.summary)}</p>
        <p><b>Admin response:</b> ${esc(complaint.adminResponse || "None")}</p><h3>Comments</h3><ul>${comments(complaint)}</ul>
        ${isAdmin ? `<textarea id="comment-${id}" placeholder="Add an internal/public comment"></textarea><button data-comment="${id}">Add comment</button>
          <textarea id="response-${id}" placeholder="Send a response to the student"></textarea><button data-response="${id}">Send response</button>
          ${["Under Review", "Assigned", "In Progress"].includes(complaint.status) ? `<button data-advance="${id}">Advance workflow</button>` : ""}` : ""}
        <p><b>History:</b> ${(complaint.statusHistory || []).map(item => `${esc(item.status)} — ${esc(item.note)} (${new Date(item.changedAt).toLocaleString()})`).join(" → ")}</p></details>`);
      document.querySelector(`[data-comment="${id}"]`)?.addEventListener("click", async () => {
        const text = document.querySelector(`#comment-${id}`).value.trim();
        if (!text) return;
        await call(`/complaints/admin/${id}/comments`, { method: "POST", body: JSON.stringify({ text }) });
        toast("Comment added");
        await adminPanel();
      });
      document.querySelector(`[data-response="${id}"]`)?.addEventListener("click", async () => {
        const adminResponse = document.querySelector(`#response-${id}`).value.trim();
        if (!adminResponse) return;
        await call(`/complaints/admin/${id}/response`, { method: "PATCH", body: JSON.stringify({ adminResponse }) });
        toast("Response sent");
        await adminPanel();
      });
      document.querySelector(`[data-advance="${id}"]`)?.addEventListener("click", async () => {
        const next = { "Under Review": "Assigned", Assigned: "In Progress", "In Progress": "Resolved" }[complaint.status];
        await call(`/complaints/admin/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: next }) });
        toast(`Moved to ${next}`);
        await adminPanel();
      });
    } catch (error) {
      toast(error.message);
    }
  }

  notifications();
  if (admin) {
    adminPanel();
    setInterval(() => { if (!document.hidden) adminPanel(); }, 15000);
  } else {
    student();
  }
})();
