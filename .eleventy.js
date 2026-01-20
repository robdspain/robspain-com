// YouTube Embed Plugin with Lite mode for better performance
const embedYouTube = require("eleventy-plugin-youtube-embed");

module.exports = function(eleventyConfig) {
  // Pass-through copies for static assets
  eleventyConfig.addPassthroughCopy("src/public");
  eleventyConfig.addPassthroughCopy("src/*.css");
  eleventyConfig.addPassthroughCopy("src/*.js");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/_headers");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/sitemap.xml");

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