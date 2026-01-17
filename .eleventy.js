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

  // YouTube Shortcode
  eleventyConfig.addShortcode("youtube", function(id) {
    return `<div class="video-container">
      <iframe src="https://www.youtube.com/embed/${id}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="YouTube video player"></iframe>
    </div>`;
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    }
  };
};