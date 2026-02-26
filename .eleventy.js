// YouTube Embed Plugin with Lite mode for better performance
const embedYouTube = require("eleventy-plugin-youtube-embed");
const Image = require("@11ty/eleventy-img");
const path = require("path");

// Async image optimization function
async function imageShortcode(src, alt, sizes = "100vw", widths = [400, 800, 1200]) {
  // Handle empty/null images
  if (!src) return "";

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
    // If image processing fails, return original img tag
    console.warn(`Image processing failed for ${src}: ${e.message}`);
    return `<img src="${src}" alt="${alt || ''}" loading="lazy">`;
  }

  let imageAttributes = {
    alt: alt || "",
    sizes,
    loading: "lazy",
    decoding: "async"
  };

  return Image.generateHTML(metadata, imageAttributes);
}

module.exports = function(eleventyConfig) {
  // Pass-through copies for static assets
  // Use object form so src/public/* lands at site root (not /public/*)
  eleventyConfig.addPassthroughCopy({ "src/public": "." });
  eleventyConfig.addPassthroughCopy("src/*.css");
  eleventyConfig.addPassthroughCopy("src/*.js");
  eleventyConfig.addPassthroughCopy("src/favicon.png");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/_headers");
  eleventyConfig.addPassthroughCopy("src/_redirects");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/sitemap.xml");

  // Image optimization shortcode - converts to WebP with responsive sizes
  eleventyConfig.addNunjucksAsyncShortcode("image", imageShortcode);
  eleventyConfig.addLiquidShortcode("image", imageShortcode);
  eleventyConfig.addJavaScriptFunction("image", imageShortcode);

  // YouTube Embed Plugin - Lite mode for faster page loads
  // Lazy-loads iframe only when user clicks, uses youtube-nocookie.com for privacy
  eleventyConfig.addPlugin(embedYouTube, {
    lite: {
      css: { enabled: true },
      js: { enabled: true }
    },
    modestBranding: true,
    recommendSelfOnly: true
  });

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
  eleventyConfig.addCollection("published_scripts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/video-funnel-scripts/*.md")
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

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    }
  };
};