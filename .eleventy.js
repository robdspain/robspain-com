// YouTube Embed Plugin with Lite mode for better performance
const embedYouTube = require("eleventy-plugin-youtube-embed");
const path = require("path");
const fs = require("fs");
const matter = require("gray-matter");

const DEFAULT_BLOG_IMAGE = "/public/images/blog-default.png";
let Image;

function escapeAttribute(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Async image optimization function
async function imageShortcode(src, alt, sizes = "100vw", widths = [400, 800, 1200]) {
  // Handle empty/null images
  if (!src) src = DEFAULT_BLOG_IMAGE;

  if (src.endsWith(".svg") || process.env.SKIP_IMAGE_OPTIMIZATION === "true") {
    return `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}" loading="lazy" decoding="async">`;
  }

  Image ||= require("@11ty/eleventy-img");

  // Resolve the image path
  let inputPath = src;
  if (src.startsWith("/")) {
    inputPath = path.join("src", src);
  }

  let metadata;
  try {
    metadata = await Image(inputPath, {
      widths: widths,
      formats: ["webp", "jpeg"],
      outputDir: "./_site/img/",
      urlPath: "/img/",
      filenameFormat: function (id, src, width, format) {
        const name = path.basename(src, path.extname(src));
        return `${name}-${width}w.${format}`;
      }
    });
  } catch (e) {
    // Keep builds resilient when CMS content references a missing upload.
    console.warn(`Image processing failed for ${src}: ${e.message}`);
    return `<img src="${DEFAULT_BLOG_IMAGE}" alt="${escapeAttribute(alt)}" loading="lazy" decoding="async">`;
  }

  let imageAttributes = {
    alt: alt || "",
    sizes,
    loading: "lazy",
    decoding: "async"
  };

  return Image.generateHTML(metadata, imageAttributes);
}

function plainImageShortcode(src, alt) {
  if (!src) src = DEFAULT_BLOG_IMAGE;
  return `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}" loading="lazy" decoding="async">`;
}

module.exports = function(eleventyConfig) {
  // Ignore video scripts - these are for CMS editing only, never published
  eleventyConfig.ignores.add("src/video-funnel-scripts/**");
  // Ignore the archived duplicate homepage so crawlers only see the canonical home page.
  eleventyConfig.ignores.add("src/index 2.html");

  // Pass-through copies for static assets
  eleventyConfig.addPassthroughCopy("src/public");
  eleventyConfig.addPassthroughCopy({ "src/public/family-command.webmanifest": "family-command.webmanifest" });
  eleventyConfig.addPassthroughCopy({ "src/public/family-command-sw.js": "family-command-sw.js" });
  eleventyConfig.addPassthroughCopy("src/*.css");
  eleventyConfig.addPassthroughCopy("src/*.js");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/_headers");
  eleventyConfig.addPassthroughCopy("src/_redirects");
  eleventyConfig.addPassthroughCopy("src/robots.txt");

  // Image optimization shortcode - converts to WebP with responsive sizes
  if (process.env.SKIP_IMAGE_OPTIMIZATION === "true") {
    eleventyConfig.addNunjucksShortcode("image", plainImageShortcode);
    eleventyConfig.addLiquidShortcode("image", plainImageShortcode);
    eleventyConfig.addJavaScriptFunction("image", plainImageShortcode);
  } else {
    eleventyConfig.addNunjucksAsyncShortcode("image", imageShortcode);
    eleventyConfig.addLiquidShortcode("image", imageShortcode);
    eleventyConfig.addJavaScriptFunction("image", imageShortcode);
  }

  // YouTube Embed Plugin - Lite mode for faster page loads
  // Lazy-loads iframe only when user clicks, uses youtube-nocookie.com for privacy
  if (process.env.SKIP_YOUTUBE_EMBED_PLUGIN !== "true") {
    eleventyConfig.addPlugin(embedYouTube, {
      lite: {
        css: { enabled: true },
        js: { enabled: true }
      },
      modestBranding: true,
      recommendSelfOnly: true
    });
  }

  // Reading Time Filter
  eleventyConfig.addFilter("readingTime", function(content) {
    if (!content) return "1 min read";
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length;
    const minutes = Math.ceil(words / 200);
    return minutes + " min read";
  });

  // RSS Date Filter (RFC 2822 format)
  eleventyConfig.addFilter("rssDate", function(date) {
    if (!date) return "";
    return new Date(date).toUTCString();
  });

  // Friendly Date Filter
  eleventyConfig.addFilter("friendlyDate", function(date) {
    if (!date) return "";
    const d = new Date(date);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  });

  eleventyConfig.addFilter("absoluteUrl", function(url) {
    if (!url) return "https://robspain.com";
    if (/^https?:\/\//.test(url)) return url;
    return `https://robspain.com${url.startsWith("/") ? "" : "/"}${url}`;
  });

  eleventyConfig.addFilter("postImage", function(image) {
    return image || DEFAULT_BLOG_IMAGE;
  });

  eleventyConfig.addFilter("imageMime", function(image) {
    const src = image || DEFAULT_BLOG_IMAGE;
    if (src.endsWith(".svg")) return "image/svg+xml";
    if (src.endsWith(".webp")) return "image/webp";
    if (src.endsWith(".png")) return "image/png";
    return "image/jpeg";
  });

  eleventyConfig.addFilter("json", function(value) {
    return JSON.stringify(value);
  });

  // Custom Markdown Settings
  let markdownIt = require("markdown-it")({
    html: true,
    breaks: true,
    linkify: true
  });
  eleventyConfig.setLibrary("md", markdownIt);

  // YouTube Shortcode (for Tiptap editor compatibility)
  // The shortcode {% youtube "ID" %} still works for the CMS
  eleventyConfig.addShortcode("youtube", function(id) {
    // Use lite-youtube-embed format for consistency
    return `<lite-youtube videoid="${id}" style="background-image: url('https://i.ytimg.com/vi/${id}/hqdefault.jpg');">
      <a href="https://youtube.com/watch?v=${id}" class="lty-playbtn" title="Play Video">
        <span class="lyt-visually-hidden">Play Video</span>
      </a>
    </lite-youtube>`;
  });

  // Published Video Scripts Collection
  eleventyConfig.addCollection("published_scripts", function() {
    const scriptsDir = path.join(__dirname, "src", "video-funnel-scripts");
    if (!fs.existsSync(scriptsDir)) return [];

    return fs.readdirSync(scriptsDir)
      .filter(file => file.endsWith(".md"))
      .map(file => {
        const filePath = path.join(scriptsDir, file);
        const parsed = matter(fs.readFileSync(filePath, "utf8"));
        return {
          inputPath: filePath,
          data: parsed.data,
          templateContent: markdownIt.render(parsed.content)
        };
      })
      .filter(item => item.data.published === true)
      .sort((a, b) => a.data.step - b.data.step);
  });

  // Published Blog Posts Collection (excludes drafts)
  eleventyConfig.addCollection("posts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/posts/*.md")
      .filter(item => item.data.draft !== true)
      .sort((a, b) => b.date - a.date);
  });

  // All Blog Posts including drafts (for admin preview)
  eleventyConfig.addCollection("allPosts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/posts/*.md")
      .sort((a, b) => b.date - a.date);
  });

  // Published YouTube Content Collection (status = "published")
  eleventyConfig.addCollection("youtube_videos", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/youtube-content/*.md")
      .filter(item => item.data.status === "published")
      .sort((a, b) => new Date(b.data.date) - new Date(a.data.date))
      .slice(0, 10); // Latest 10 videos
  });

  // All YouTube Content (for admin)
  eleventyConfig.addCollection("all_youtube", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/youtube-content/*.md")
      .sort((a, b) => new Date(b.data.date) - new Date(a.data.date));
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    }
  };
};
