(function () {
  function setupPlayer(container) {
    const video = container.querySelector("video");
    if (!video) return;

    const hlsUrl = container.dataset.hlsUrl;
    const mp4Url = container.dataset.mp4Url;

    if (container._r2Hls) {
      container._r2Hls.destroy();
      container._r2Hls = null;
    }

    if (hlsUrl) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = hlsUrl;
      } else if (window.Hls) {
        const hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: false
        });

        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        container._r2Hls = hls;

        hls.on(window.Hls.Events.ERROR, function (_, data) {
          if (data?.fatal && mp4Url) {
            hls.destroy();
            video.src = mp4Url;
          }
        });
      } else if (mp4Url) {
        video.src = mp4Url;
      }
    } else if (mp4Url) {
      video.src = mp4Url;
    }
  }

  window.r2PlayerReload = setupPlayer;

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-r2-player]").forEach(setupPlayer);
  });
})();
