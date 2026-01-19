module.exports = function(eleventyConfig) {
  // Pass-through copies for static assets
  // This tells 11ty to simply copy these files to the output folder
  eleventyConfig.addPassthroughCopy("src/public");
  eleventyConfig.addPassthroughCopy("src/*.css");
  eleventyConfig.addPassthroughCopy("src/*.js");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/_headers");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/sitemap.xml");

  // Custom Markdown Settings
  let markdownIt = require("markdown-it")({
    html: true,
    breaks: true,
    linkify: true
  });

  // Auto-embed YouTube logic
  const originalRender = markdownIt.renderer.rules.text || function(tokens, idx, options, env, self) {
    return tokens[idx].content;
  };

  markdownIt.renderer.rules.text = function(tokens, idx, options, env, self) {
    const content = tokens[idx].content.trim();
    const youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})$/;
    const match = content.match(youtubeRegex);

    if (match && match[1]) {
      return `<div class="video-container">
        <iframe src="https://www.youtube.com/embed/${match[1]}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="YouTube video player"></iframe>
      </div>`;
    }
    return originalRender(tokens, idx, options, env, self);
  };

  eleventyConfig.setLibrary("md", markdownIt);

  // YouTube Shortcode (existing)
  eleventyConfig.addShortcode("youtube", function(id) {
    return `<div class="video-container">
      <iframe src="https://www.youtube.com/embed/${id}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="YouTube video player"></iframe>
    </div>`;
  });

  // Published Video Scripts Collection
  eleventyConfig.addCollection("published_scripts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/video-funnel-scripts/*.md")
      .filter(item => item.data.published === true)
      .sort((a, b) => a.data.step - b.data.step);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    }
  };
};