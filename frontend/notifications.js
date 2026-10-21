(() => {
  const API = window.CAMPUS_RESOLVE_API_BASE;
  const tokenKeys = ["campus_resolve_auth_token", "aicomply_auth_token", "aimt_auth_token"];
  const token = tokenKeys.map(key => localStorage.getItem(key)).find(Boolean);
  const list = document.querySelector("#notificationList");
  const unread = document.querySelector("#unread");
  const notice = document.querySelector("#notice");
  const markAll = document.querySelector("#markAllNotificationsRead");

  if (!token) {
    location.href = "index.html";
    return;
  }

  const showError = message => {
    notice.textContent = message;
    notice.hidden = false;
  };

  const request = async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      tokenKeys.forEach(key => localStorage.removeItem(key));
      ["campus_resolve_auth_user", "aicomply_auth_user", "aimt_auth_user"].forEach(key => localStorage.removeItem(key));
      location.href = "index.html";
      throw new Error("Your session has expired. Please sign in again.");
    }
    if (!response.ok) throw new Error(data.message || "Could not update notifications.");
    return data;
  };

  const render = notifications => {
    list.replaceChildren();
    if (!notifications.length) {
      const empty = document.createElement("p");
      empty.className = "notification-empty";
      empty.textContent = "You're all caught up. New complaint updates will appear here.";
      list.append(empty);
      return;
    }

    for (const item of notifications) {
      const article = document.createElement("article");
      article.className = `notification-item${item.isRead ? "" : " unread"}`;

      const heading = document.createElement("div");
      const title = document.createElement("b");
      title.textContent = item.title;
      const timestamp = document.createElement("time");
      timestamp.dateTime = item.createdAt;
      timestamp.textContent = new Date(item.createdAt).toLocaleString();
      heading.append(title, timestamp);

      const message = document.createElement("p");
      message.textContent = item.message;
      article.append(heading, message);

      if (item.complaint) {
        const complaint = document.createElement("small");
        complaint.textContent = [item.complaint.ticketId, item.complaint.title].filter(Boolean).join(" · ");
        article.append(complaint);
      }

      const readButton = document.createElement("button");
      readButton.type = "button";
      readButton.dataset.markNotification = item._id;
      readButton.textContent = item.isRead ? "Read" : "Mark as read";
      readButton.disabled = item.isRead;
      article.append(readButton);
      list.append(article);
    }
  };

  const load = async () => {
    const data = await request("/notifications");
    const { notifications, unreadCount } = data.data;
    unread.textContent = unreadCount ? `(${unreadCount} unread)` : "";
    render(notifications);
  };

  list.addEventListener("click", async event => {
    const button = event.target.closest("[data-mark-notification]");
    if (!button || button.disabled) return;
    button.disabled = true;
    try {
      await request(`/notifications/${encodeURIComponent(button.dataset.markNotification)}/read`, { method: "PATCH" });
      await load();
    } catch (error) {
      button.disabled = false;
      showError(error.message);
    }
  });

  markAll.addEventListener("click", async () => {
    markAll.disabled = true;
    try {
      await request("/notifications/read-all", { method: "PATCH" });
      await load();
    } catch (error) {
      showError(error.message);
    } finally {
      markAll.disabled = false;
    }
  });

  document.querySelector("#logout").addEventListener("click", () => {
    tokenKeys.forEach(key => localStorage.removeItem(key));
    ["campus_resolve_auth_user", "aicomply_auth_user", "aimt_auth_user"].forEach(key => localStorage.removeItem(key));
    location.href = "index.html";
  });

  load().catch(error => {
    list.textContent = "";
    showError(error.message);
  });
})();
