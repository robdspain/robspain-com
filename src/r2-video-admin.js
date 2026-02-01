(function () {
  async function fetchList() {
    const response = await fetch("/api/r2/list");
    if (!response.ok) {
      throw new Error("Failed to fetch list");
    }
    return response.json();
  }

  async function deleteObject(key) {
    const response = await fetch("/api/r2/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key })
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Delete failed");
    }
    return response.json();
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString();
  }

  function formatBytes(bytes) {
    if (!bytes && bytes !== 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let idx = 0;
    let value = bytes;
    while (value >= 1024 && idx < units.length - 1) {
      value /= 1024;
      idx += 1;
    }
    return `${value.toFixed(1)} ${units[idx]}`;
  }

  function renderList(container, items) {
    container.innerHTML = "";

    if (!items.length) {
      container.innerHTML = "<p class=\"r2-empty\">No videos uploaded yet.</p>";
      return;
    }

    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "r2-list__row";

      const meta = document.createElement("div");
      meta.className = "r2-list__meta";
      meta.innerHTML = `
        <strong>${item.key}</strong>
        <span>${formatBytes(item.size)} • ${formatDate(item.lastModified)}</span>
      `;

      const actions = document.createElement("div");
      actions.className = "r2-list__actions";

      if (item.url) {
        const link = document.createElement("a");
        link.href = item.url;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = "Open";
        link.className = "r2-button r2-button--ghost";
        actions.appendChild(link);
      }

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.textContent = "Copy Key";
      copyButton.className = "r2-button r2-button--ghost";
      copyButton.addEventListener("click", async () => {
        await navigator.clipboard.writeText(item.key);
        copyButton.textContent = "Copied";
        setTimeout(() => {
          copyButton.textContent = "Copy Key";
        }, 1500);
      });
      actions.appendChild(copyButton);

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";
      deleteButton.className = "r2-button r2-button--danger";
      deleteButton.addEventListener("click", async () => {
        if (!confirm(`Delete ${item.key}?`)) return;
        deleteButton.disabled = true;
        deleteButton.textContent = "Deleting...";
        try {
          await deleteObject(item.key);
          row.remove();
        } catch (error) {
          alert(`Delete failed: ${error.message}`);
          deleteButton.disabled = false;
          deleteButton.textContent = "Delete";
        }
      });
      actions.appendChild(deleteButton);

      row.appendChild(meta);
      row.appendChild(actions);
      container.appendChild(row);
    });
  }

  async function refreshList(container) {
    container.innerHTML = "<p class=\"r2-loading\">Loading videos...</p>";
    try {
      const data = await fetchList();
      renderList(container, data.items || []);
    } catch (error) {
      container.innerHTML = `<p class=\"r2-error\">${error.message}</p>`;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const listContainer = document.querySelector("[data-r2-list]");
    if (listContainer) {
      refreshList(listContainer);
    }

    const refreshButton = document.querySelector("[data-r2-refresh]");
    if (refreshButton && listContainer) {
      refreshButton.addEventListener("click", () => refreshList(listContainer));
    }

    document.querySelectorAll("[data-r2-upload]").forEach((uploader) => {
      uploader.addEventListener("r2:upload:complete", () => {
        if (listContainer) {
          refreshList(listContainer);
        }
      });
    });

    const previewForm = document.querySelector("[data-r2-preview-form]");
    if (previewForm) {
      previewForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const hlsInput = previewForm.querySelector("[name=hls_url]");
        const mp4Input = previewForm.querySelector("[name=mp4_url]");
        const player = document.querySelector("[data-r2-player]");
        if (!player) return;

        player.dataset.hlsUrl = hlsInput?.value || "";
        player.dataset.mp4Url = mp4Input?.value || "";
        const video = player.querySelector("video");
        if (video) {
          video.removeAttribute("src");
          video.load();
        }
        if (window.r2PlayerReload) {
          window.r2PlayerReload(player);
        }
      });
    }
  });
})();
