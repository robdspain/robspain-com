(function () {
  const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB
  const allowedTypes = ["video/mp4", "video/quicktime", "video/webm"];

  function sanitizeFileName(name) {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9._-]/g, "");
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

  async function postJson(url, data) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Request failed");
    }
    return response.json();
  }

  function setupUploader(container) {
    const dropzone = container.querySelector("[data-r2-dropzone]");
    const input = container.querySelector("[data-r2-input]");
    const progressWrap = container.querySelector("[data-r2-progress]");
    const filenameEl = container.querySelector("[data-r2-filename]");
    const percentEl = container.querySelector("[data-r2-percent]");
    const bar = container.querySelector("[data-r2-bar]");
    const statusEl = container.querySelector("[data-r2-status]");

    if (!dropzone || !input) return;

    dropzone.addEventListener("click", () => input.click());

    dropzone.addEventListener("dragover", (event) => {
      event.preventDefault();
      dropzone.classList.add("is-dragover");
    });

    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("is-dragover");
    });

    dropzone.addEventListener("drop", (event) => {
      event.preventDefault();
      dropzone.classList.remove("is-dragover");
      if (event.dataTransfer?.files?.length) {
        input.files = event.dataTransfer.files;
        handleFile(input.files[0]);
      }
    });

    input.addEventListener("change", () => {
      if (input.files?.length) {
        handleFile(input.files[0]);
      }
    });

    async function handleFile(file) {
      if (!file) return;
      if (!allowedTypes.includes(file.type)) {
        alert("Unsupported file type. Please upload mp4, mov, or webm.");
        return;
      }

      const safeName = sanitizeFileName(file.name || "video");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const key = `videos/${timestamp}-${safeName}`;

      progressWrap.hidden = false;
      filenameEl.textContent = `${file.name} (${formatBytes(file.size)})`;
      percentEl.textContent = "0%";
      bar.value = 0;
      statusEl.textContent = "Starting multipart upload...";

      let uploadId;
      try {
        const init = await postJson("/api/r2/multipart/init", {
          key,
          contentType: file.type
        });
        uploadId = init.uploadId;

        const totalParts = Math.ceil(file.size / CHUNK_SIZE);
        const parts = [];
        let uploadedBytes = 0;

        for (let partNumber = 1; partNumber <= totalParts; partNumber += 1) {
          const start = (partNumber - 1) * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);

          statusEl.textContent = `Uploading part ${partNumber} of ${totalParts}...`;

          const signed = await postJson("/api/r2/multipart/part", {
            key,
            uploadId,
            partNumber
          });

          const uploadResponse = await fetch(signed.url, {
            method: "PUT",
            body: chunk
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed on part ${partNumber}`);
          }

          const etag = uploadResponse.headers.get("etag");
          parts.push({ partNumber, etag });

          uploadedBytes += chunk.size;
          const percent = Math.floor((uploadedBytes / file.size) * 100);
          bar.value = percent;
          percentEl.textContent = `${percent}%`;
        }

        statusEl.textContent = "Finalizing upload...";
        await postJson("/api/r2/multipart/complete", {
          key,
          uploadId,
          parts
        });

        bar.value = 100;
        percentEl.textContent = "100%";
        statusEl.textContent = "Upload complete.";

        container.dispatchEvent(
          new CustomEvent("r2:upload:complete", { detail: { key } })
        );
      } catch (error) {
        statusEl.textContent = `Upload failed: ${error.message}`;
        if (uploadId) {
          try {
            await postJson("/api/r2/multipart/abort", { key, uploadId });
          } catch (abortError) {
            console.warn("Failed to abort multipart upload", abortError);
          }
        }
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-r2-upload]").forEach(setupUploader);
  });
})();
