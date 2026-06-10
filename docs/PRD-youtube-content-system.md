# Product Requirements Document (PRD)
## YouTube Content Generation & Distribution System for Behavior School

**Version:** 2.0 (Final)
**Author:** Claude Code
**Date:** January 19, 2026
**Status:** ✅ Ralphy Loop Complete - Ready for Implementation
**Changelog:**
- v1.1: Added Descript integration, content repurposing, YouTube Shorts, chapter markers, retention hooks, serverless architecture
- v1.2: Added loading states, offline handling, cost estimation, accessibility requirements, detailed error flows
- v1.3: Added testing strategy, example prompts, technical validation criteria, sample generated content
- v1.4: Added keyboard shortcuts, quick actions, mobile workflow, onboarding flow, help system
- v2.0: Final review, exit criteria validation, prioritized roadmap, implementation-ready specifications

---

## 1. Executive Summary

### 1.1 Vision
Create an AI-powered content generation system within the robspain.com admin panel that transforms ideas, research articles, and web links into complete YouTube video scripts, blog articles, social media posts, and high-converting thumbnails—with minimal manual intervention.

### 1.2 Problem Statement
Rob Spain needs to consistently produce high-quality YouTube content that:
- Shares Behavior School projects and updates
- Discusses current research from behavior analytic journals
- Covers field news and insights
- Converts viewers to Behavior School offerings
- Maintains a sustainable production workflow

**Current Pain Points:**
- Script writing is time-consuming
- Creating cohesive content across platforms (YouTube, blog, social) requires redundant effort
- Thumbnail creation requires design skills and tools
- No centralized system for content ideation to publication

### 1.3 Solution Overview
A unified admin panel workflow that:
1. Accepts content inputs (ideas, URLs, articles, research papers)
2. Generates 10-15 minute YouTube scripts with AI
3. Creates matching blog articles with embedded videos
4. Produces social media content for cross-promotion
5. Generates high-converting thumbnails with Rob's face
6. Publishes content to the website automatically

---

## 2. User Personas

### 2.1 Primary User: Rob Spain (Content Creator)
- **Role:** BCBA, Founder of Behavior School, Content Creator
- **Goals:**
  - Produce consistent, high-quality YouTube content
  - Drive traffic to Behavior School projects
  - Share valuable insights with the BCBA community
  - Minimize time spent on repetitive content tasks
- **Technical Comfort:** Moderate - comfortable with web tools, not a developer
- **Workflow Preferences:**
  - Uses Descript for video editing
  - Prefers visual interfaces over code
  - Values automation but wants editorial control

### 2.2 Secondary User: Audience (BCBAs, Behavior Analysts, Educators)
- **Goals:** Learn practical skills, stay updated on research, find resources
- **Content Preferences:** Actionable takeaways, research-backed insights, professional but approachable tone

---

## 3. Goals & Success Metrics

### 3.1 Primary Goals
| Goal | Description | Success Metric |
|------|-------------|----------------|
| Reduce script writing time | AI generates first draft | Script generation < 5 minutes |
| Increase content output | Streamlined workflow | 2-4 videos/month sustainable |
| Maximize content ROI | One input → multiple outputs | Each video = script + blog + 4 social posts + thumbnail |
| Drive conversions | Strategic CTAs in content | Track clicks to Behavior School |
| Maintain quality | Professional, accurate content | < 30 min editing per script |

### 3.2 Exit Criteria for Feature Completion
- [ ] Script generator produces coherent, on-brand 10-15 minute scripts
- [ ] Blog generator creates SEO-optimized articles with embedded videos
- [ ] Social media generator produces platform-specific content (Twitter, LinkedIn, Facebook, Instagram)
- [ ] Thumbnail generator creates click-worthy images with Rob's face
- [ ] Full workflow completable in < 1 hour (excluding video recording/editing)
- [ ] All generated content maintains Behavior School brand voice
- [ ] System handles research papers, news articles, and raw ideas as inputs

---

## 4. Feature Requirements

### 4.1 Feature: YouTube Script Generator

#### 4.1.1 Inputs
| Input Type | Description | Required |
|------------|-------------|----------|
| Content Idea | Brief description of video topic | Yes |
| Source URLs | Links to articles, research, news | No (1-5 URLs) |
| Source Text | Pasted article content or notes | No |
| Video Type | Dropdown: Research Review, Project Update, News Commentary, Tutorial, Insight/Opinion | Yes |
| Target Length | Dropdown: Short (5-7 min), Standard (10-15 min), Deep Dive (20+ min) | Yes |
| Primary CTA | Which Behavior School page/product to promote | Yes |
| Secondary CTA | Optional additional resource to mention | No |

#### 4.1.2 Script Output Structure
```
TITLE: [Compelling, SEO-friendly title]
HOOK: [0:00-0:30] - Pattern interrupt, curiosity gap, or bold statement
INTRO: [0:30-1:30] - Context, credibility, promise of value
CONTENT SECTIONS:
  - Section 1: [Topic] - Key points, examples, research citations
    [RETENTION HOOK: Open loop or preview of upcoming value]
  - Section 2: [Topic] - Key points, examples, research citations
    [RETENTION HOOK: Pattern interrupt or engagement prompt]
  - Section 3: [Topic] - Key points, examples, research citations
  (Sections vary by video length)
ACTIONABLE TAKEAWAY: [Specific thing viewer can do TODAY]
CTA: [Behavior School promotion with value proposition]
OUTRO: [Subscribe prompt, teaser for next video]
END SCREEN NOTES: [What videos to link, card placement suggestions]

---
METADATA:
- Suggested YouTube Title (60 chars max)
- Suggested YouTube Description (with timestamps)
- Suggested Tags (10-15)
- Thumbnail Text Suggestions (3 options, 3-5 words each)
- Chapter Markers (for YouTube chapters)
- YouTube Shorts Hook (15-second clip suggestion)
```

#### 4.1.2.1 Descript-Optimized Export
The script should be exportable in Descript-compatible format:
- Plain text with speaker labels
- Timestamp markers that align with Descript's timeline
- Copy-to-clipboard functionality for easy paste into Descript
- Optional: Scene/section markers for Descript's composition mode

#### 4.1.2.2 Retention Optimization
Scripts must include strategic retention elements:
- **Open Loops:** Tease upcoming content ("In a moment, I'll show you the one technique that changed everything...")
- **Pattern Interrupts:** Every 2-3 minutes, include a visual or tonal change prompt
- **Engagement Prompts:** Strategic "drop a comment if..." or "you might be thinking..." moments
- **Curiosity Gaps:** Withhold key information briefly to maintain attention

#### 4.1.3 AI Prompt Engineering
The script generator should use a multi-step prompting approach:

**Step 1: Research Synthesis**
- Fetch and parse provided URLs
- Extract key facts, statistics, quotes
- Identify the "so what" for BCBAs

**Step 2: Outline Generation**
- Create logical flow based on video type
- Ensure hook-content-CTA structure
- Balance education with entertainment

**Step 3: Script Writing**
- Conversational but professional tone
- Include speaker directions [pause], [show graphic], [B-roll suggestion]
- Write for spoken delivery (contractions, short sentences)
- Include timestamp markers

**Step 4: Metadata Generation**
- SEO-optimized titles and descriptions
- Platform-appropriate tags
- Thumbnail copy options

#### 4.1.4 Brand Voice Guidelines (embedded in prompts)
- **Tone:** Warm, expert, relatable, occasionally humorous
- **Perspective:** Fellow practitioner sharing insights, not lecturing
- **Language:** Accessible but not dumbed down; use field terminology appropriately
- **Values:** Evidence-based, practical, sustainable, anti-burnout
- **Avoid:** Jargon without explanation, fear-mongering, oversimplification

---

### 4.2 Feature: Blog Article Generator

#### 4.2.1 Trigger
Activated when YouTube URL is added to a completed script

#### 4.2.2 Inputs
| Input | Source |
|-------|--------|
| Script content | From script generator |
| YouTube URL | User input |
| YouTube video ID | Extracted from URL |
| Featured image | From thumbnail or AI-generated |

#### 4.2.3 Blog Output Structure
```markdown
---
layout: post.njk
title: [SEO-optimized title, can differ from YouTube]
date: [current date]
youtubeUrl: [provided URL]
image: [featured image path]
description: [155 char meta description]
tags: [relevant tags]
keywords: [SEO keywords]
draft: false
seo:
  metaTitle: [60 char title]
  metaDesc: [155 char description]
---

[Opening paragraph - hook the reader, mention the video]

{% youtube "[video-id]" %}

## Key Takeaways

[Bulleted summary of main points]

## [Section 1 Header]
[Expanded content from script, formatted for reading]

## [Section 2 Header]
[Expanded content from script, formatted for reading]

## [Section 3 Header]
[Expanded content from script, formatted for reading]

## Your Action Step

[The actionable takeaway, expanded with implementation tips]

## Resources

- [Link to Behavior School relevant page]
- [Links to research/sources mentioned]

---

*Want to dive deeper? Check out [relevant Behavior School resource] for [specific benefit].*
```

#### 4.2.4 Transformation Rules
- Convert spoken language to written (remove filler, restructure sentences)
- Expand abbreviations and add context readers might need
- Add internal links to relevant robspain.com content
- Add external links to sources mentioned
- Include Behavior School CTA naturally (max 2 mentions)
- Format for scanability (headers, bullets, short paragraphs)

---

### 4.3 Feature: Social Media Content Generator

#### 4.3.1 Trigger
Generated alongside blog article when YouTube URL is added

#### 4.3.2 Platform-Specific Outputs

**Twitter/X Post**
```
- Character limit: 280 (including link)
- Format: Hook + value proposition + link
- Include 2-3 relevant hashtags
- Generate 3 variations to choose from
```

**LinkedIn Post**
```
- Character limit: 3000 (optimal: 150-300)
- Format: Professional hook + insight + CTA + link
- Include 3-5 professional hashtags
- More formal tone, emphasize professional development
```

**Facebook Post**
```
- Character limit: 500 (optimal: 40-80)
- Format: Engaging question or statement + link
- Casual but professional tone
- No hashtags or minimal
```

**Instagram Caption**
```
- Character limit: 2200
- Format: Hook + story/insight + CTA + hashtags
- Include emoji strategically
- 20-30 hashtags (in comment or end of caption)
- Generate suggestion for carousel or image
```

#### 4.3.3 Output Format in CMS
```yaml
twitter:
  text: "[Tweet text]"
  hashtags: "#BCBA #BehaviorAnalysis"
  variations:
    - "[Alternative 1]"
    - "[Alternative 2]"
linkedin:
  text: "[LinkedIn post]"
  hashtags: "#BehaviorAnalysis #Education"
facebook:
  text: "[Facebook post]"
instagram:
  caption: "[Instagram caption]"
  hashtags: "[30 hashtags]"
  image_suggestion: "[Description of ideal image]"
```

---

### 4.4 Feature: Thumbnail Generator

#### 4.4.1 Design Requirements
- **Dimensions:** 1280 x 720 pixels (16:9 ratio)
- **File format:** PNG or JPG
- **File size:** < 2MB

#### 4.4.2 Thumbnail Template System

**Template Elements:**
1. **Background:**
   - Gradient or solid color from brand palette
   - Optional: Relevant stock image with overlay

2. **Rob's Face:**
   - Cutout of Rob with transparent background
   - Expression matching content tone (excited, thoughtful, concerned)
   - Position: Left, right, or center based on template

3. **Text:**
   - Primary text: 3-5 words, large, high contrast
   - Optional secondary text: Smaller supporting text
   - Font: Bold, sans-serif, readable at small sizes

4. **Visual Elements:**
   - Optional icons or emojis
   - Border or frame effects
   - Brand accent colors

#### 4.4.3 Inputs
| Input | Description |
|-------|-------------|
| Thumbnail text | From script metadata (3 options) |
| Expression type | Dropdown: Excited, Thoughtful, Surprised, Serious, Friendly |
| Color scheme | Dropdown: Brand Blue, Energy Orange, Trust Green, Alert Red, Custom |
| Template style | Dropdown: Face Left, Face Right, Face Center, Text Only |
| Rob's photo | Select from uploaded headshots |

#### 4.4.4 AI Image Generation
- Use AI to generate background elements or graphics
- Composite Rob's face cutout onto generated background
- Apply text with proper hierarchy and contrast
- Output 3 variations for A/B consideration

#### 4.4.5 Pre-uploaded Assets Required
- 5-10 cutout photos of Rob with various expressions
- Transparent PNG format
- High resolution (min 500px height)
- Consistent lighting and quality

---

### 4.5 Feature: Content Repurposing Engine

#### 4.5.1 YouTube Shorts Generation
Automatically generate 3-5 YouTube Shorts scripts from each main video:
- Extract the most engaging 60-second segments
- Reformat for vertical (9:16) viewing
- Add hook optimized for Shorts algorithm
- Include clear CTA to watch full video

**Shorts Output Format:**
```
SHORT #1: [Title]
HOOK (0-3s): [Immediate attention grabber]
CONTENT (3-50s): [Core value delivery]
CTA (50-60s): [Watch full video / Subscribe]
CAPTION: [Text overlay suggestions]
```

#### 4.5.2 Newsletter Content
Transform script into email newsletter format:
- Subject line options (3 variations)
- Preview text
- Condensed key insights (500 words max)
- Clear link to blog/video
- P.S. with Behavior School CTA

#### 4.5.3 Podcast Talking Points
If Rob starts a podcast, generate episode notes:
- Key discussion points
- Questions to explore
- Timestamps for show notes
- Guest research prompts (if applicable)

---

### 4.6 Feature: Content Calendar & Pipeline View

#### 4.6.1 Calendar View
Visual calendar showing:
- Scheduled publish dates
- Content status (color-coded: draft, scripted, recorded, published)
- Drag-and-drop rescheduling
- Weekly/monthly view toggle

#### 4.6.2 Pipeline/Kanban View
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│    IDEAS     │ │   SCRIPTED   │ │   RECORDED   │ │  PUBLISHED   │
├──────────────┤ ├──────────────┤ ├──────────────┤ ├──────────────┤
│ FCT Research │ │ Burnout Tips │ │ PBIS Update  │ │ Jan 15 Video │
│ BCBA Career  │ │              │ │              │ │ Jan 8 Video  │
│ New Tool     │ │              │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

#### 4.6.3 Quick Stats Dashboard
- Videos this month: X
- Average completion time: X days
- Content in pipeline: X ideas, X scripted, X recorded
- Next scheduled publish: [date]

---

### 4.7 Feature: Version History & Recovery

#### 4.7.1 Script Versioning
- Auto-save every 30 seconds during editing
- Store last 10 versions of each script
- Compare versions side-by-side
- One-click restore to previous version

#### 4.7.2 Regeneration History
- Track all AI regeneration attempts
- Store input parameters for each generation
- Allow "regenerate with same inputs" for consistency
- Note which version was ultimately used

#### 4.7.3 Git Integration (Automatic)
Since content is stored in markdown files:
- Every save creates a git commit (via Netlify CMS)
- Full history available through git log
- Recovery possible through git revert

---

### 4.8 Feature: Content Publishing Flow

#### 4.8.1 Content States
```
DRAFT → SCRIPT_COMPLETE → VIDEO_RECORDED → VIDEO_UPLOADED → PUBLISHED
```

| State | Description | User Action |
|-------|-------------|-------------|
| DRAFT | Initial idea/inputs saved | Add inputs, generate script |
| SCRIPT_COMPLETE | Script generated and approved | Record video in Descript |
| VIDEO_RECORDED | Video edited and exported | Upload to YouTube |
| VIDEO_UPLOADED | YouTube URL added | Generate blog + social |
| PUBLISHED | Blog live, social ready | Copy/paste to social platforms |

#### 4.5.2 Automation Triggers
- **Script Complete → Auto-generate:** Thumbnail options
- **YouTube URL Added → Auto-generate:** Blog article, social media content
- **Blog Published → Auto-update:** Homepage featured video (if marked featured)

#### 4.8.3 Homepage Integration
Display a list of the last 10 published videos on the homepage:

**Template Example:**
```njk
<!-- Homepage Video Section -->
<section class="recent-videos">
  <h2>Latest Videos</h2>
  <ul class="video-list">
    {% for video in collections.published_videos | reverse | limit: 10 %}
    <li class="video-item">
      <a href="{{ video.url }}">
        <img src="{{ video.data.thumbnail }}" alt="{{ video.data.title }}" loading="lazy">
        <div class="video-info">
          <h3>{{ video.data.title }}</h3>
          <time>{{ video.data.date | date: "%b %d, %Y" }}</time>
        </div>
      </a>
    </li>
    {% endfor %}
  </ul>
</section>
```

**Video List Item Display:**
- Thumbnail image (left side, ~120x68px)
- Title (clickable, links to blog post with embedded video)
- Publish date
- Hover effect for interactivity

---

## 5. Technical Architecture

### 5.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Admin Panel (/admin)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Script     │  │    Blog      │  │   Social     │      │
│  │  Generator   │  │  Generator   │  │  Generator   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│  ┌──────▼─────────────────▼─────────────────▼───────┐      │
│  │              AI Processing Layer                  │      │
│  │  (Gemini API / OpenAI API / Claude API)          │      │
│  └──────┬───────────────────────────────────────────┘      │
│         │                                                   │
│  ┌──────▼───────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Thumbnail   │  │    Web       │  │   Content    │      │
│  │  Generator   │  │   Fetcher    │  │    Store     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Eleventy Build                            │
│  src/posts/*.md  →  _site/posts/  (Blog articles)           │
│  src/youtube/*.md → Collection data (Video metadata)        │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Data Models

#### 5.2.1 YouTube Content Entry
```yaml
# src/youtube/[slug].md
---
layout: youtube-content.njk
title: "Video Title"
slug: "video-slug"
status: "published"  # draft, script_complete, video_uploaded, published
date: 2026-01-19
youtubeUrl: "https://youtube.com/watch?v=xxxxx"
youtubeId: "xxxxx"
videoType: "research_review"  # research_review, project_update, news, tutorial, insight
targetLength: "standard"  # short, standard, deep_dive

# Inputs (preserved for regeneration)
inputs:
  idea: "Original content idea"
  sourceUrls:
    - "https://example.com/article"
  sourceText: "Any pasted content"
  primaryCta: "transformation-program"
  secondaryCta: ""

# Generated Content
script:
  title: "Full YouTube title"
  hook: "Opening hook text..."
  intro: "Introduction text..."
  sections:
    - heading: "Section 1"
      content: "Section content..."
      timestamp: "2:30"
  actionableTakeaway: "What viewers should do..."
  cta: "CTA script..."
  outro: "Closing text..."

metadata:
  youtubeTitle: "SEO Title (60 chars)"
  youtubeDescription: "Full description with timestamps..."
  tags:
    - "BCBA"
    - "behavior analysis"
  thumbnailTextOptions:
    - "STOP Doing This!"
    - "Research Says..."
    - "Game Changer"

thumbnail:
  selectedText: "STOP Doing This!"
  selectedPhoto: "rob-excited.png"
  selectedTemplate: "face-left"
  generatedFile: "/public/images/thumbnails/video-slug.png"

# Social Media Content
social:
  twitter:
    text: "Tweet content..."
    hashtags: "#BCBA #BehaviorAnalysis"
  linkedin:
    text: "LinkedIn post..."
    hashtags: "#BehaviorAnalysis"
  facebook:
    text: "Facebook post..."
  instagram:
    caption: "Instagram caption..."
    hashtags: "..."

# Associated Blog Post
blogPost:
  generated: true
  path: "/posts/2026-01-19-video-slug.md"

# Tracking
featured: false
views: 0
publishedDate: 2026-01-19
---

[Full script content in markdown for reference/editing]
```

### 5.3 API Integrations

#### 5.3.1 AI Text Generation
- **Primary:** Google Gemini 2.0 Flash (already integrated in CMS)
- **Fallback:** OpenAI GPT-4 or Claude API
- **Usage:** Script generation, blog transformation, social content

#### 5.3.2 AI Image Generation
- **Primary Recommendation:** Replicate API with SDXL or Flux models
  - Pros: Pay-per-use, no subscription, good quality
  - Can composite images server-side
- **Alternative A:** DALL-E 3 (OpenAI) - High quality, good text rendering
- **Alternative B:** Ideogram API - Better text in images
- **Usage:** Thumbnail backgrounds, blog featured images

#### 5.3.3 Web Content Fetching
- Existing WebFetch functionality for URL content extraction
- **PDF Parsing:** Use pdf-parse library for research paper extraction
- **DOI Resolution:** Fetch metadata from CrossRef API for proper citations
- Rate limiting and caching for external requests

#### 5.3.4 YouTube Data API (Optional Enhancement)
- Auto-fetch video metadata after URL input
- Retrieve view counts for tracking
- Validate video IDs

### 5.4 Serverless Architecture (Critical)

Since this is a static Eleventy site hosted on Netlify, all AI operations must use Netlify Functions:

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Admin Panel)                      │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS POST
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Netlify Functions (/.netlify/functions/)        │
├─────────────────────────────────────────────────────────────┤
│  generate-script.js     → Gemini API → Returns script       │
│  generate-blog.js       → Gemini API → Returns blog MD      │
│  generate-social.js     → Gemini API → Returns social posts │
│  generate-thumbnail.js  → Replicate API → Returns image URL │
│  fetch-url-content.js   → Web fetch → Returns parsed content│
│  parse-pdf.js           → pdf-parse → Returns text          │
└─────────────────────────────────────────────────────────────┘
```

**Function Requirements:**
- Each function ≤ 10 second execution (Netlify limit)
- Store API keys in Netlify environment variables
- Return JSON responses for client consumption
- Handle CORS for admin panel requests

**Long-Running Operations:**
For operations that may exceed 10 seconds:
- Use Netlify Background Functions (up to 15 minutes)
- Implement polling: return job ID, client polls for status
- Or use streaming responses where supported

### 5.5 File Structure
```
src/
├── admin/
│   └── cms/
│       ├── index.html (Updated with YouTube content UI)
│       └── config.yml (New youtube_content collection)
├── youtube-content/
│   ├── youtube-content.json (Collection settings)
│   └── [video-slug].md (Individual content entries)
├── posts/
│   └── [auto-generated blog posts]
├── public/
│   └── images/
│       ├── thumbnails/
│       │   └── [generated thumbnails]
│       └── rob-headshots/
│           ├── rob-excited.png
│           ├── rob-thoughtful.png
│           └── ...
└── _includes/
    └── youtube-content.njk (Display template)
```

---

## 6. User Interface Design

### 6.1 Admin Panel Layout

#### 6.1.1 Navigation Update
```
Admin Sidebar:
├── Dashboard
├── Blog Posts
├── YouTube Content ← NEW
│   ├── All Videos
│   ├── Create New
│   └── Thumbnail Generator
├── Onboarding Scripts
└── Settings
```

#### 6.1.2 YouTube Content List View
```
┌─────────────────────────────────────────────────────────────┐
│ YouTube Content                              [+ New Video]   │
├─────────────────────────────────────────────────────────────┤
│ Filter: [All ▼] [Published ▼]          Search: [________]   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────┬────────────────────┬──────────┬─────────┬────────┐ │
│ │ IMG │ Title              │ Status   │ Date    │ Actions│ │
│ ├─────┼────────────────────┼──────────┼─────────┼────────┤ │
│ │ 🖼️  │ Why BCBAs Burn Out │ Published│ Jan 15  │ ✏️ 👁️  │ │
│ │ 🖼️  │ New Research on... │ Script   │ Jan 18  │ ✏️     │ │
│ │ ⬜  │ Project Update     │ Draft    │ Jan 19  │ ✏️ 🗑️  │ │
│ └─────┴────────────────────┴──────────┴─────────┴────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### 6.1.3 Create/Edit Video Flow

**Step 1: Input Collection**
```
┌─────────────────────────────────────────────────────────────┐
│ Create YouTube Content                                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Video Type: [Research Review ▼]                             │
│                                                              │
│ Content Idea: *                                              │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ Discuss the new JABA article on school-based FCT... │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                              │
│ Source URLs (one per line):                                  │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ https://jaba.org/article/12345                       │    │
│ │ https://news.behavioranalysis.org/...                │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                              │
│ Additional Notes/Content:                                    │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ Key findings to highlight:                           │    │
│ │ - 85% reduction in problem behavior                  │    │
│ │ - Implementation in general ed settings              │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                              │
│ Target Length: [Standard (10-15 min) ▼]                     │
│                                                              │
│ Primary CTA: [Transformation Program ▼]                     │
│ Secondary CTA: [None ▼]                                      │
│                                                              │
│              [Save Draft]  [Generate Script ▶]              │
└─────────────────────────────────────────────────────────────┘
```

**Step 2: Script Review/Edit**
```
┌─────────────────────────────────────────────────────────────┐
│ Script Generated ✓                    [Regenerate] [Edit]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ TITLE: Why This New Research Changes Everything             │
│ ─────────────────────────────────────────────────────────── │
│                                                              │
│ HOOK [0:00-0:30]                                            │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ "What if I told you that 20 years of conventional   │    │
│ │ wisdom about FCT in schools was wrong?"              │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                              │
│ INTRO [0:30-1:30]                                           │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ [Editable content...]                                │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                              │
│ [Additional sections...]                                     │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│ METADATA                                                     │
│ YouTube Title: Why This New Research Changes Everything...  │
│ Tags: BCBA, FCT, research, behavior analysis...             │
│                                                              │
│ Thumbnail Text Options:                                      │
│ ○ "Research BOMBSHELL"                                      │
│ ○ "They Were WRONG"                                         │
│ ○ "New FCT Study"                                           │
│                                                              │
│         [Back]  [Save Script]  [Generate Thumbnail ▶]       │
└─────────────────────────────────────────────────────────────┘
```

**Step 3: Thumbnail Generation**
```
┌─────────────────────────────────────────────────────────────┐
│ Generate Thumbnail                                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Select Rob's Photo:                                          │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                    │
│ │ 😮  │ │ 🤔  │ │ 😊  │ │ 😠  │ │ 🎉  │                    │
│ │[SEL]│ │     │ │     │ │     │ │     │                    │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                    │
│ Excited  Think   Friendly Serious  Happy                    │
│                                                              │
│ Thumbnail Text: [Research BOMBSHELL        ]                │
│                                                              │
│ Template Style: [Face Left with Text Right ▼]               │
│                                                              │
│ Color Scheme: [Energy Orange ▼]                             │
│                                                              │
│                    [Generate Previews]                       │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│ Preview Options:                                             │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐      │
│ │               │ │               │ │               │      │
│ │  [Thumbnail   │ │  [Thumbnail   │ │  [Thumbnail   │      │
│ │   Preview 1]  │ │   Preview 2]  │ │   Preview 3]  │      │
│ │               │ │               │ │               │      │
│ │   [Select]    │ │   [Select]    │ │   [Select]    │      │
│ └───────────────┘ └───────────────┘ └───────────────┘      │
│                                                              │
│              [Back]  [Skip]  [Save & Continue ▶]            │
└─────────────────────────────────────────────────────────────┘
```

**Step 4: Video Upload Status**
```
┌─────────────────────────────────────────────────────────────┐
│ Add YouTube Video                                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Status: Waiting for YouTube URL                              │
│                                                              │
│ 📋 Script: Complete ✓                                       │
│ 🖼️ Thumbnail: Generated ✓                                   │
│ 🎬 Video: Pending upload                                     │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│                                                              │
│ Paste YouTube URL after uploading:                          │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ https://youtube.com/watch?v=                         │    │
│ └──────────────────────────────────────────────────────┘    │
│                                                              │
│ □ Mark as Featured (show on homepage)                       │
│                                                              │
│        [Save for Later]  [Generate Blog & Social ▶]         │
└─────────────────────────────────────────────────────────────┘
```

**Step 5: Generated Content Review**
```
┌─────────────────────────────────────────────────────────────┐
│ Content Generated Successfully! 🎉                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📝 BLOG ARTICLE                              [Edit] [👁️]│ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Title: Why This New Research Changes Everything for...  │ │
│ │ Status: Draft (will publish on save)                    │ │
│ │ Path: /posts/2026-01-19-new-fct-research/              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🐦 TWITTER                                      [Copy]  │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ New research just dropped that changes how we think     │ │
│ │ about FCT in schools. Here's what you need to know 🧵   │ │
│ │                                                         │ │
│ │ #BCBA #BehaviorAnalysis #Research                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 💼 LINKEDIN                                     [Copy]  │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ A new study in JABA has significant implications for... │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📘 FACEBOOK                                     [Copy]  │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Have you seen the latest FCT research? It might change  │ │
│ │ how you approach behavior support in schools...         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📸 INSTAGRAM                                    [Copy]  │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 🔬 New research alert! ...                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│                    [Save All]  [Publish Blog ▶]             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. AI Prompting Strategy

### 7.1 Script Generation System Prompt

```
You are an expert YouTube scriptwriter for Rob Spain, a Board Certified Behavior Analyst (BCBA) who creates educational content for school-based behavior analysts.

BRAND VOICE:
- Warm, expert, relatable tone
- Fellow practitioner sharing insights (not lecturing)
- Evidence-based but practical
- Occasionally uses humor
- Anti-burnout, pro-sustainability messaging
- Accessible language, explains jargon when used

SCRIPT STRUCTURE:
1. HOOK (0:00-0:30): Start with a pattern interrupt, surprising fact, or bold claim
2. INTRO (0:30-1:30): Establish context, credibility, and promise value
3. CONTENT SECTIONS: 3-5 sections depending on length, each with clear takeaways
4. ACTIONABLE TAKEAWAY: One specific thing viewers can do TODAY
5. CTA: Natural mention of Behavior School resource (not salesy)
6. OUTRO: Subscribe prompt and next video teaser

FORMATTING:
- Use [PAUSE], [SHOW GRAPHIC], [B-ROLL: description] for production notes
- Write for SPOKEN delivery (contractions, short sentences, conversational)
- Include timestamp markers
- Mark emphasis with **bold** for words to stress

CONTENT REQUIREMENTS:
- Every claim should be supportable (cite sources when available)
- Include real-world examples BCBAs can relate to
- Address potential objections or questions viewers might have
- End sections with mini-summaries or transition hooks
```

### 7.2 Blog Transformation Prompt

```
Transform this YouTube video script into a blog article optimized for reading and SEO.

TRANSFORMATION RULES:
1. Convert spoken language to written (remove verbal tics, restructure for reading)
2. Expand content where beneficial for readers
3. Add headers for scanability
4. Include bullet points for key takeaways
5. Embed the YouTube video near the top
6. Add internal links to related robspain.com content
7. Add external links to sources mentioned
8. Include 1-2 natural mentions of Behavior School (not forced)
9. Format action items as a clear, boxed callout
10. Write meta description (155 chars) and title (60 chars) for SEO

TONE: Same as video but slightly more formal for reading
LENGTH: 1000-1500 words typically
```

### 7.3 Social Media Prompt

```
Create platform-specific social media posts to promote this YouTube video and blog article.

PLATFORM GUIDELINES:

TWITTER (280 chars):
- Hook + value + link
- 2-3 relevant hashtags
- Create 3 variations

LINKEDIN (150-300 chars optimal):
- Professional tone
- Insight-focused
- 3-5 professional hashtags
- Emphasize career/professional development angle

FACEBOOK (40-80 chars optimal):
- Engaging question or statement
- Casual but professional
- Minimal/no hashtags

INSTAGRAM (up to 2200 chars):
- Hook + story + CTA
- Strategic emoji use
- 20-30 hashtags at end
- Suggest image type (carousel, single, etc.)

All posts should:
- Drive to the blog article (which has embedded video)
- Create curiosity without clickbait
- Reflect Rob's authentic voice
- Provide standalone value even if people don't click
```

### 7.4 Thumbnail Text Prompt

```
Generate 5 thumbnail text options for this YouTube video.

REQUIREMENTS:
- 3-5 words maximum
- High emotional impact
- Creates curiosity gap
- Readable at small sizes
- Avoid clickbait that doesn't deliver

STYLES TO INCLUDE:
1. Question format
2. Bold statement
3. Number/statistic based
4. Emotional trigger
5. Contrarian/surprising

Context: Video title is "{title}" and main topic is "{topic}"
```

---

## 8. Edge Cases & Error Handling

### 8.1 URL Fetching Failures
- **Paywall content:** Prompt user to paste article text manually
- **404/unavailable:** Notify user, allow proceeding without that source
- **PDF files:** Parse text content, note "PDF source" in citations
- **Rate limited:** Queue request, notify user of delay

### 8.2 AI Generation Failures
- **API timeout:** Retry up to 3 times with exponential backoff
- **Content policy rejection:** Notify user, suggest rephrasing input
- **Quality threshold not met:** Allow regeneration with modified inputs
- **Token limit exceeded:** Split into multiple requests, combine results

### 8.3 YouTube URL Validation
- **Invalid URL format:** Show validation error with expected format
- **Private/deleted video:** Warn user but allow saving
- **Non-YouTube URL:** Reject with helpful error message
- **Shorts URL:** Detect and handle youtube.com/shorts/ format

### 8.4 Thumbnail Generation
- **Image generation failure:** Offer text-only template fallback
- **Face photo not uploaded:** Prompt to upload or use text-only
- **Text too long:** Truncate with ellipsis or suggest shorter version
- **API rate limit:** Queue thumbnail, generate when available

### 8.5 Loading States & Progress Indicators
Every async operation must show appropriate feedback:

| Operation | Loading State | Typical Duration |
|-----------|---------------|------------------|
| URL fetch | "Fetching article content..." with spinner | 2-5 seconds |
| Script generation | Progress bar with stages: "Analyzing sources... Outlining... Writing..." | 15-45 seconds |
| Blog generation | "Transforming script to blog format..." | 10-20 seconds |
| Social generation | "Creating platform-specific posts..." | 5-10 seconds |
| Thumbnail generation | "Generating background... Compositing image..." | 20-60 seconds |

**Progress Feedback Requirements:**
- Show estimated time remaining when possible
- Allow cancellation of long-running operations
- Persist partial results if user navigates away
- Send browser notification when complete (if tab not focused)

### 8.6 Offline Handling
- **Draft saving:** Store drafts in localStorage, sync when online
- **Queued operations:** Queue AI requests, process when connection restored
- **Offline indicator:** Show clear "Offline" badge in header
- **Graceful degradation:** Allow viewing/editing existing content offline

### 8.7 Error Message Guidelines
All error messages must:
1. **State what happened** in plain language
2. **Explain why** if relevant
3. **Provide actionable next steps**
4. **Offer alternative paths** when possible

**Example Error Messages:**
```
❌ Bad: "Error 429: Rate limited"
✅ Good: "We've hit the AI service limit. Your script will automatically
         generate in about 2 minutes. You can continue editing other
         content while you wait."

❌ Bad: "Failed to fetch URL"
✅ Good: "Couldn't access this article - it may require a subscription.
         You can paste the article text directly, or continue without
         this source."
```

---

## 9. Security & Privacy Considerations

### 9.1 API Key Management
- Store AI API keys in environment variables (Netlify dashboard)
- Never expose keys in client-side code
- Use server-side Netlify Functions for all AI calls
- Rotate keys quarterly or after any suspected exposure

### 9.2 Content Storage
- All generated content stored locally in markdown files
- No external database required
- Git-based version control for content history
- Sensitive drafts not indexed by search engines (noindex meta)

### 9.3 Image Storage
- Rob's headshot photos stored locally
- Generated thumbnails stored in public folder
- No cloud image storage required (unless opted into)
- Image filenames should not contain sensitive information

---

## 9A. Cost Estimation & Budgeting

### 9A.1 Per-Video Cost Breakdown
| Service | Operation | Est. Cost |
|---------|-----------|-----------|
| Gemini API | Script generation (~4K tokens out) | ~$0.02 |
| Gemini API | Blog transformation (~2K tokens out) | ~$0.01 |
| Gemini API | Social content (~1K tokens out) | ~$0.005 |
| Replicate | Thumbnail background (SDXL) | ~$0.01 |
| **Total per video** | | **~$0.05** |

### 9A.2 Monthly Cost Projection
| Videos/Month | AI Costs | Netlify (Pro) | Total |
|--------------|----------|---------------|-------|
| 4 videos | ~$0.20 | $19 | ~$19.20 |
| 8 videos | ~$0.40 | $19 | ~$19.40 |
| 12 videos | ~$0.60 | $19 | ~$19.60 |

*Note: Costs are estimates based on current API pricing. Actual costs may vary.*

### 9A.3 Cost Monitoring
- Track API usage in admin dashboard
- Set monthly budget alerts
- Show cost-per-video in content list
- Warn when approaching budget limits

---

## 9B. Accessibility Requirements

### 9B.1 Admin Panel Accessibility
- **WCAG 2.1 AA compliance** minimum
- All interactive elements keyboard accessible
- Focus indicators clearly visible
- Color contrast ratio ≥ 4.5:1 for text
- Screen reader compatible (ARIA labels)

### 9B.2 Generated Content Accessibility
- Blog posts include proper heading hierarchy
- All images have alt text (auto-generated, editable)
- YouTube embeds include captions reminder
- Social media images include image descriptions

### 9B.3 Specific Requirements
| Element | Requirement |
|---------|-------------|
| Buttons | Min 44x44px touch target |
| Forms | Labels associated with inputs |
| Errors | Announced to screen readers |
| Progress | ARIA live regions for status updates |
| Modals | Focus trapped, Escape to close |

---

## 10. Implementation Phases

### Phase 1: Core Script Generator (MVP)
- [ ] Add YouTube Content collection to CMS config
- [ ] Create input form UI in admin panel
- [ ] Implement script generation with AI
- [ ] Save generated scripts as markdown files
- [ ] Basic script editing interface

### Phase 2: Blog & Social Generation
- [ ] YouTube URL input and validation
- [ ] Blog article generation from script
- [ ] Social media content generation
- [ ] Copy-to-clipboard functionality
- [ ] Blog auto-publishing workflow

### Phase 3: Thumbnail Generator
- [ ] Upload and manage Rob's headshot photos
- [ ] Thumbnail template system
- [ ] AI background generation
- [ ] Image compositing (face + text + background)
- [ ] Multiple preview generation

### Phase 4: Polish & Automation
- [ ] Homepage featured video integration
- [ ] Content status tracking dashboard
- [ ] Batch regeneration capabilities
- [ ] Analytics integration (optional)
- [ ] Performance optimizations

---

## 11. Success Metrics & KPIs

### 11.1 Efficiency Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Script generation time | < 5 min | Time from input to draft |
| Total content creation time | < 1 hour | Idea to all content ready |
| Manual editing time | < 30 min | Time spent editing AI output |

### 11.2 Quality Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Script usability | > 80% usable | % of script used without major rewrites |
| Regeneration rate | < 20% | How often full regeneration needed |
| User satisfaction | > 4/5 | Rob's rating of generated content |

### 11.3 Output Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Videos produced | 2-4/month | Sustainable production rate |
| Blog articles | 1:1 with videos | Every video has companion article |
| Social posts | 4 per video | Full platform coverage |

---

## 12. Exit Criteria Checklist

The feature is considered complete when ALL of the following are verified:

### 12.1 Functional Requirements
- [ ] Script generator produces coherent 10-15 minute scripts from various inputs
- [ ] Scripts include all required sections (hook, intro, content, CTA, outro)
- [ ] Blog generator creates properly formatted markdown posts
- [ ] Blog posts include embedded YouTube videos
- [ ] Social media generator creates content for all 4 platforms (Twitter, LinkedIn, Facebook, Instagram)
- [ ] Thumbnail generator creates 1280x720 images
- [ ] Thumbnails successfully composite Rob's face with text
- [ ] Full workflow is completable through admin UI
- [ ] Content saves correctly to file system
- [ ] Generated blog posts build successfully with Eleventy

### 12.2 Quality Requirements
- [ ] Generated scripts maintain Behavior School brand voice
- [ ] Scripts are factually accurate when given source material
- [ ] Blog articles are SEO-optimized (meta tags, headers, keywords)
- [ ] Social posts are platform-appropriate (length, tone, hashtags)
- [ ] Thumbnails are visually appealing and readable at small sizes
- [ ] No broken links or missing images in generated content

### 12.3 Usability Requirements
- [ ] Rob can complete full workflow without developer assistance
- [ ] Error messages are clear and actionable
- [ ] UI is intuitive and matches existing admin panel style
- [ ] Copy-to-clipboard works for all social content
- [ ] Preview functionality works for all content types

### 12.4 Technical Requirements
- [ ] API calls handle errors gracefully
- [ ] No exposed API keys in client-side code
- [ ] Page load time acceptable (< 3 seconds)
- [ ] Works in latest Chrome, Firefox, Safari
- [ ] Mobile-responsive admin interface

---

## 13. Open Questions & Decisions Needed

### Answered (Iteration 1):

1. **AI Provider Priority:** ✅ Use Gemini (already integrated) as primary. Add fallback support for OpenAI if needed for specific features.

2. **Image Generation Service:** ✅ Recommend Replicate API with SDXL/Flux models for cost-effective, high-quality generation. Fallback to DALL-E 3 for text-heavy thumbnails.

3. **Thumbnail Approach:** ✅ Hybrid approach - AI generates background, server-side compositing adds Rob's face cutout and text overlay using Sharp.js in Netlify Functions.

4. **Blog Auto-publish:** ✅ Go to draft first. Rob should review before publishing to catch any AI errors.

### Answered (User Input):

5. **Social Scheduling:** ✅ Copy-paste for MVP
   - Future goal: Auto-post to social networks when logged in (like Ghost's integration)
   - Investigate: Twitter/X API, LinkedIn API, Meta Graph API for direct posting
   - Phase 5 feature: "Connect Social Accounts" with OAuth, one-click publish

6. **Homepage Integration:** ✅ List of last 10 videos
   - Display recent videos in a list format on homepage
   - Show thumbnail, title, date, and link to blog post

7. **Analytics:** Rely on YouTube Analytics for MVP
   - Consider YouTube Data API integration later to pull stats into dashboard

8. **Video Series Support:** Yes, add series metadata field
   - Auto-generate "Part X of Y" in titles

9. **Research Citation Format:** Simplified for YouTube, full APA for blog posts

---

## 14. Appendix

### A. Behavior School CTA Options
| CTA Identifier | URL | Use Case |
|----------------|-----|----------|
| transformation-program | behaviorschool.com/transformation-program | Burnout, systems leadership |
| study | behaviorschool.com/study | Exam prep, BCBA certification |
| supervision-tools | behaviorschool.com/supervision-tools | Supervision, mentoring |
| resources | behaviorschool.com/resources | General behavior resources |
| iep-goals | behaviorschool.com/iep-goals | IEP, goal writing |
| behavior-plans | behaviorschool.com/behavior-plans | BIP, behavior intervention |

### B. Video Type Definitions
| Type | Description | Typical Length | Example Topics |
|------|-------------|----------------|----------------|
| research_review | Analysis of published research | 12-15 min | JABA articles, meta-analyses |
| project_update | Behavior School feature/update | 8-12 min | New tools, course launches |
| news | Industry news commentary | 10-12 min | Policy changes, conferences |
| tutorial | How-to educational content | 10-15 min | Data collection, FBA process |
| insight | Opinion/perspective piece | 8-12 min | Career advice, field trends |

### C. Rob's Headshot Requirements
- Minimum 5 expressions: Excited/Surprised, Thoughtful, Friendly/Smiling, Serious/Concerned, Celebratory
- Transparent PNG background
- Minimum 500px height
- Consistent lighting across all photos
- Professional attire
- Head and shoulders framing

---

---

## 15. Testing Strategy

### 15.1 Unit Testing
| Component | Test Cases |
|-----------|------------|
| URL Parser | Valid YouTube URLs, Shorts URLs, invalid URLs, edge cases |
| Script Formatter | Timestamp generation, section splitting, metadata extraction |
| Blog Transformer | Markdown output, frontmatter validity, link generation |
| Social Formatter | Character limits, hashtag formatting, platform compliance |

### 15.2 Integration Testing
| Flow | Validation |
|------|------------|
| Input → Script | Given valid inputs, script contains all required sections |
| Script → Blog | Blog includes video embed, proper heading structure |
| Script → Social | All 4 platforms receive compliant content |
| Script → Thumbnail | Image generated at correct dimensions |

### 15.3 AI Output Quality Testing
Before launch, generate 10 test scripts with varied inputs and validate:

**Quality Checklist:**
- [ ] Hook is attention-grabbing and relevant
- [ ] Content sections flow logically
- [ ] Timestamps are realistic for content length
- [ ] CTA feels natural, not forced
- [ ] Brand voice is consistent
- [ ] No hallucinated facts or citations
- [ ] Actionable takeaway is specific and practical

### 15.4 User Acceptance Testing (UAT)
Rob should complete 3 full workflows before launch:
1. **Research Review video** - using JABA article URL
2. **Project Update video** - using only idea text
3. **News Commentary video** - using news article + opinion

**UAT Success Criteria:**
- Workflow completes without errors
- Script requires < 30 min editing
- Generated content feels "80% there"
- No need to regenerate more than once

---

## 16. Example Generated Content

### 16.1 Sample Input
```yaml
videoType: research_review
idea: "Discuss the new JABA study showing FCT can be effectively implemented by general education teachers with minimal training"
sourceUrls:
  - "https://onlinelibrary.wiley.com/doi/full/10.1002/jaba.123"
targetLength: standard
primaryCta: transformation-program
```

### 16.2 Sample Script Output (Abbreviated)
```
TITLE: General Ed Teachers CAN Do FCT (New Research Proves It)

HOOK [0:00-0:30]
"What if I told you that the intervention you've been reserving for
your most intensive cases... could be taught to a general ed teacher
in a single afternoon? [PAUSE] A new study just proved it's possible,
and it's going to change how you think about your role."

INTRO [0:30-2:00]
"Hey, I'm Rob Spain—I've been a school BCBA for over 20 years, and
I can't tell you how many times I've thought 'if only I could clone
myself.' Well, this research is the next best thing. Today we're
breaking down a game-changing study from the Journal of Applied
Behavior Analysis that shows FCT—Functional Communication Training—
can be effectively implemented by classroom teachers with just
brief training. By the end of this video, you'll know exactly how
to start piloting this in your district."

[RETENTION HOOK: "And stick around to the end, because I'm going to
share the one mistake that makes teacher-implemented FCT fail."]

SECTION 1: THE STUDY [2:00-5:00]
...

SECTION 2: WHY THIS MATTERS [5:00-8:00]
...

SECTION 3: HOW TO IMPLEMENT [8:00-11:00]
...

ACTIONABLE TAKEAWAY [11:00-12:00]
"Here's what I want you to do this week: Identify ONE teacher who's
already bought in to behavior support. Share this research with them.
Ask if they'd be willing to try FCT with one student, with your
coaching. That's it. One teacher, one student, one skill."

CTA [12:00-13:00]
"If you want to learn how to build systems where teachers can handle
more independently—so you can focus on the cases that truly need your
expertise—check out the Systems Leadership framework at Behavior School.
Link in the description."

OUTRO [13:00-14:00]
"If this was helpful, smash that subscribe button..."

---
METADATA:
youtubeTitle: "General Ed Teachers CAN Do FCT (New JABA Research)"
tags: [BCBA, FCT, functional communication training, JABA, research,
       school behavior, teacher training, behavior intervention]
chapters:
  - 0:00 Why this changes everything
  - 2:00 The study breakdown
  - 5:00 Why BCBAs should care
  - 8:00 Implementation guide
  - 11:00 Your action step
  - 12:00 Resources
thumbnailOptions:
  - "Teachers CAN Do This"
  - "FCT Game Changer"
  - "New Research!"
shortsHook: "A new study just proved that general ed teachers can
             implement FCT effectively. Here's what you need to know..."
```

### 16.3 Sample Blog Output (Abbreviated)
```markdown
---
layout: post.njk
title: "New Research: General Education Teachers Can Effectively Implement FCT"
date: 2026-01-19
youtubeUrl: "https://youtube.com/watch?v=xxxxx"
image: "/public/images/uploads/fct-research-2026.jpg"
description: "A groundbreaking JABA study shows FCT can be taught to classroom teachers in minimal time. Here's what school BCBAs need to know."
tags: ["research", "FCT", "BCBA"]
keywords: ["functional communication training", "teacher training", "JABA research"]
draft: true
---

What if the intervention you've been reserving for your most intensive cases could be taught to a general education teacher in a single afternoon?

{% youtube "xxxxx" %}

## Key Takeaways

- FCT can be effectively implemented by general ed teachers with brief training
- Teachers maintained high fidelity even without constant BCBA oversight
- This could dramatically expand your capacity for Tier 2 interventions

## The Research Breakdown

A new study published in the Journal of Applied Behavior Analysis examined...

[Content continues...]

## Your Action Step This Week

Identify one teacher who's already bought into behavior support. Share this research with them...

---

*Want to build systems where teachers handle more independently? Check out the [Systems Leadership framework at Behavior School](https://behaviorschool.com/transformation-program).*
```

---

## 17. Technical Validation Criteria

### 17.1 Script Quality Metrics
The AI output should be programmatically validated for:

| Metric | Threshold | Validation Method |
|--------|-----------|-------------------|
| Hook length | 30-60 seconds read time | Word count (75-150 words) |
| Section count | 3-5 sections | Parse section headers |
| Total length | Target ±20% | Word count by target |
| CTA presence | Required | Keyword detection |
| Timestamp format | Valid | Regex validation |
| Citation accuracy | If sources provided | Cross-reference with input |

### 17.2 Blog Quality Metrics
| Metric | Threshold | Validation |
|--------|-----------|------------|
| Word count | 800-1500 words | Count |
| Heading structure | H2s present, no skipped levels | Parse markdown |
| YouTube embed | Present and valid | Regex check |
| Meta description | 120-155 chars | Character count |
| Internal links | ≥1 to robspain.com | Link analysis |
| External links | ≥1 to sources (if provided) | Link analysis |

### 17.3 Social Quality Metrics
| Platform | Max Length | Required Elements |
|----------|------------|-------------------|
| Twitter | 260 chars (save 20 for link) | Hook + hashtags |
| LinkedIn | 3000 chars | Professional tone check |
| Facebook | 500 chars | Question or statement |
| Instagram | 2200 chars | Emoji presence, hashtag block |

---

---

## 18. User Experience Enhancements

### 18.1 Keyboard Shortcuts
Power users should be able to navigate efficiently:

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + N` | New video content |
| `Cmd/Ctrl + S` | Save current draft |
| `Cmd/Ctrl + Enter` | Generate (script/blog/social) |
| `Cmd/Ctrl + Shift + C` | Copy to clipboard (context-aware) |
| `Cmd/Ctrl + 1-5` | Jump to workflow step 1-5 |
| `Esc` | Close modal / Cancel operation |
| `?` | Show keyboard shortcuts help |

### 18.2 Quick Actions Menu
Accessible via `Cmd/Ctrl + K` or button click:

```
┌─────────────────────────────────────────┐
│ Quick Actions                     ⌘K    │
├─────────────────────────────────────────┤
│ 🆕 New Video Content                    │
│ 📋 Paste YouTube URL                    │
│ 🔄 Regenerate Current Section           │
│ 📤 Export Script to Descript            │
│ 📊 View Pipeline                        │
│ ⚙️ Settings                             │
└─────────────────────────────────────────┘
```

### 18.3 Mobile Workflow Support
While full editing is desktop-optimized, mobile should support:

**Mobile-Friendly Actions:**
- View content list and status
- Add new idea (quick capture)
- Paste YouTube URL
- Copy social media content
- Review and approve generated content

**Mobile UI Adaptations:**
- Single-column layout
- Bottom navigation bar
- Swipe gestures for navigation
- Touch-optimized buttons (min 44px)
- Collapsible sections

### 18.4 First-Time User Onboarding
New user flow:

```
Step 1: Welcome
"Welcome to the YouTube Content Generator! Let's create
your first video in under 5 minutes."
[Start Tour] [Skip]

Step 2: Input Basics
"Start with an idea. You can also add article links
for the AI to reference."
[Highlight: Input fields]

Step 3: Generate Script
"Click here to generate your script. The AI will
create a complete video outline."
[Highlight: Generate button]

Step 4: Review & Edit
"Review the generated script. Edit any section by
clicking on it."
[Highlight: Script sections]

Step 5: Complete Workflow
"After recording, paste your YouTube URL here to
generate blog posts and social content."
[Highlight: URL field]

✅ Tour Complete!
"You're ready to create. Need help? Press ? anytime."
```

### 18.5 Contextual Help System
- **Tooltips:** Hover help on all form fields
- **Help Panel:** Slide-out panel with contextual docs
- **Video Tutorials:** Embedded short tutorials for each feature
- **AI Suggestions:** "Did you know?" tips based on usage patterns

**Example Tooltip:**
```
ℹ️ Source URLs
Paste links to articles or research papers.
The AI will extract key information to include
in your script. Works best with:
• News articles
• Research abstracts
• Blog posts
PDF files will have text extracted automatically.
```

### 18.6 Feedback & Improvement Loop
After each generated script, prompt:

```
┌─────────────────────────────────────────┐
│ How was this script?                    │
│                                         │
│  👎  😐  👍  🎉                         │
│                                         │
│ What could be better? (optional)        │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│            [Submit] [Skip]              │
└─────────────────────────────────────────┘
```

Feedback is stored to improve prompts over time.

---

## 19. Onboarding Checklist for Rob

Before building, Rob should prepare:

### 19.1 Required Assets
- [ ] 5-10 headshot photos (various expressions) with transparent backgrounds
- [ ] Behavior School logo variations (for thumbnails)
- [ ] Brand color palette hex codes
- [ ] 3-5 example video ideas to test with

### 19.2 API Keys Needed
- [ ] Google Gemini API key (already have)
- [ ] Replicate API key (for image generation) - sign up at replicate.com
- [ ] (Optional) YouTube Data API key

### 19.3 Netlify Configuration
- [ ] Upgrade to Netlify Pro (if not already) for function timeout extensions
- [ ] Add environment variables for API keys
- [ ] Enable Netlify Functions

### 19.4 Content Preparation
- [ ] Define 3 "pilot" video topics for testing
- [ ] Bookmark 5 research articles for source testing
- [ ] Draft Behavior School CTA variations for different topics

---

---

## 20. Exit Criteria Validation (Ralphy Loop Final)

### 20.1 Original Exit Criteria - Status Check

| Criteria | Status | Evidence |
|----------|--------|----------|
| Script generator produces coherent 10-15 min scripts | ✅ Defined | Section 4.1 with structure, prompts, retention hooks |
| Scripts include all required sections (hook, intro, content, CTA, outro) | ✅ Defined | Section 4.1.2 with detailed output structure |
| Blog generator creates properly formatted markdown posts | ✅ Defined | Section 4.2 with complete output format |
| Blog posts include embedded YouTube videos | ✅ Defined | Section 4.2.3 shows {% youtube %} embed |
| Social media generator creates content for 4 platforms | ✅ Defined | Section 4.3 with platform-specific outputs |
| Thumbnail generator creates 1280x720 images | ✅ Defined | Section 4.4 with dimensions and approach |
| Thumbnails composite Rob's face with text | ✅ Defined | Section 4.4 with hybrid AI + Sharp.js approach |
| Full workflow completable through admin UI | ✅ Defined | Section 6 with complete UI mockups |
| Content saves correctly to file system | ✅ Defined | Section 5.2 with data model |
| Generated blog posts build with Eleventy | ✅ Defined | Section 4.2.3 with valid frontmatter |
| Scripts maintain Behavior School brand voice | ✅ Defined | Section 4.1.4 and 7.1 with voice guidelines |
| System handles research papers, news, ideas | ✅ Defined | Section 4.1.1 with input types, 5.3.3 PDF parsing |

### 20.2 Additional Criteria Added During Ralphy Loop

| Addition | Purpose | Section |
|----------|---------|---------|
| YouTube Shorts generation | Content repurposing | 4.5.1 |
| Retention hooks in scripts | Better YouTube performance | 4.1.2.2 |
| Chapter markers | YouTube SEO | 4.1.2 |
| Descript export format | Workflow integration | 4.1.2.1 |
| Content Calendar/Pipeline | Planning visibility | 4.6 |
| Version history | Recovery & iteration | 4.7 |
| Serverless architecture | Technical feasibility | 5.4 |
| Cost estimation | Budget planning | 9A |
| Accessibility requirements | Inclusive design | 9B |
| Loading states | UX polish | 8.5 |
| Offline handling | Reliability | 8.6 |
| Testing strategy | Quality assurance | 15 |
| Example content | Validation | 16 |
| Technical validation criteria | Automated QA | 17 |
| Keyboard shortcuts | Power user efficiency | 18.1 |
| Mobile support | Flexibility | 18.3 |
| Onboarding | First-time UX | 18.4 |

### 20.3 Implementation Priority Recommendation

**Phase 1 (MVP) - Core Script Generator**
1. Netlify Function: `generate-script.js`
2. CMS collection for YouTube content
3. Input form UI
4. Script output display and editing
5. Export to clipboard (for Descript)

**Phase 2 - Blog & Social Generation**
1. YouTube URL input and validation
2. Netlify Function: `generate-blog.js`
3. Netlify Function: `generate-social.js`
4. Auto-save blog to src/posts/
5. Copy-to-clipboard for social content

**Phase 3 - Thumbnail Generator**
1. Upload Rob's headshot photos
2. Netlify Function: `generate-thumbnail.js`
3. Image compositing with Sharp.js
4. Template selection UI
5. Preview and download

**Phase 4 - Polish & Extras**
1. Content calendar view
2. YouTube Shorts generation
3. Newsletter content generation
4. Keyboard shortcuts
5. Mobile optimization
6. Analytics dashboard

**Phase 5 - Social Auto-Publishing (Hybrid Approach)**
1. Twitter/X direct API integration (free tier)
2. Late API integration for LinkedIn, Facebook, Instagram
3. "Connect Account" UI in admin settings
4. One-click publish to all connected platforms
5. Post queue and status tracking with Convex
6. Scheduling for optimal posting times

---

## 20A. Phase 5: Social Auto-Publishing - Detailed Specification

### 20A.1 Architecture Overview

Phase 5 implements a **hybrid approach** to social media auto-publishing that maximizes free tier usage while maintaining reliability:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Social Publishing Architecture                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Admin Panel (Script Generator)                  │   │
│  │  [Generate Social Content] → [Preview] → [Publish to Platforms]   │   │
│  └──────────────────────────────┬───────────────────────────────────┘   │
│                                 │                                        │
│                                 ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Netlify Functions                               │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │  post-to-twitter.js ──────────────────────► Twitter/X API (Free)  │   │
│  │       │                                     1,500 posts/month     │   │
│  │       │                                                           │   │
│  │  post-to-social.js ───────────────────────► Late API (Free Tier)  │   │
│  │       │                                     10 posts/month        │   │
│  │       │                                     LinkedIn, FB, IG      │   │
│  │       │                                                           │   │
│  │  social-auth.js ──────────────────────────► OAuth Flows           │   │
│  │       │                                     Token Management      │   │
│  └───────┼──────────────────────────────────────────────────────────┘   │
│          │                                                               │
│          ▼                                                               │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                         Convex Database                            │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │  • OAuth tokens (encrypted)                                       │   │
│  │  • Post queue (scheduled posts)                                   │   │
│  │  • Post history (published posts)                                 │   │
│  │  • Usage tracking (API limits)                                    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 20A.2 Platform Integration Details

#### 20A.2.1 Twitter/X Direct Integration (Free Tier)

**API Access:**
- **Tier:** Free (no cost)
- **Limits:** 1,500 posts per month (app level)
- **Capabilities:** Post tweets with text, images, and video
- **Requirements:** Twitter Developer Account (free to create)

**Authentication Flow:**
```
User clicks "Connect Twitter" in Admin
        │
        ▼
┌─────────────────────────────────────┐
│     Twitter OAuth 2.0 Flow          │
├─────────────────────────────────────┤
│ 1. Redirect to Twitter auth page    │
│ 2. User authorizes app              │
│ 3. Twitter redirects with code      │
│ 4. Exchange code for tokens         │
│ 5. Store tokens in Convex           │
└─────────────────────────────────────┘
```

**Twitter API Configuration:**
```javascript
// Environment Variables Required
TWITTER_CLIENT_ID=your-client-id
TWITTER_CLIENT_SECRET=your-client-secret
TWITTER_CALLBACK_URL=https://robspain.com/.netlify/functions/twitter-callback

// OAuth 2.0 Scopes Required
scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access']
```

**Twitter Developer Portal Setup:**
1. Go to https://developer.x.com/
2. Create a new project and app
3. Enable OAuth 2.0 under "User authentication settings"
4. Set permissions to "Read and Write"
5. Add callback URL: `https://robspain.com/.netlify/functions/twitter-callback`
6. Generate and save Client ID and Client Secret
7. Add to Netlify environment variables

**Rate Limits & Usage Tracking:**
| Endpoint | Free Tier Limit | Reset Window |
|----------|-----------------|--------------|
| POST /tweets | 1,500/month | Monthly |
| Media upload | Included | Per tweet |
| User lookup | 100/month | Monthly |

#### 20A.2.2 Late API Integration (Free Tier)

**API Access:**
- **Tier:** Free
- **Limits:** 10 posts per month total
- **Platforms:** LinkedIn, Facebook, Instagram (and 10 others)
- **Requirements:** Late account + API key

**Why Late for LinkedIn/Facebook/Instagram:**
- LinkedIn API requires Partner Program membership (business verification)
- Meta (Facebook/Instagram) API requires business verification
- Late handles OAuth and API complexity for these platforms
- Single API call posts to multiple platforms

**Late API Configuration:**
```javascript
// Environment Variables Required
LATE_API_KEY=your-late-api-key

// Supported Platforms via Late
platforms: ['linkedin', 'facebook', 'instagram', 'tiktok', 'pinterest', 'youtube']
```

**Late Account Setup:**
1. Go to https://getlate.dev/
2. Sign up for free account (no credit card required)
3. Connect your social media accounts in Late dashboard
4. Generate API key from dashboard
5. Add to Netlify environment variables

**Late API Request Format:**
```javascript
// POST https://api.getlate.dev/v1/posts
{
  "text": "Your post content here...",
  "platforms": ["linkedin", "facebook", "instagram"],
  "mediaUrls": ["https://example.com/image.jpg"], // optional
  "scheduledAt": "2026-01-20T10:00:00Z" // optional, for scheduling
}
```

### 20A.3 Data Models (Convex)

#### 20A.3.1 Social Accounts Table
```typescript
// convex/schema.ts
export const socialAccounts = defineTable({
  platform: v.string(), // 'twitter', 'linkedin', 'facebook', 'instagram'
  provider: v.string(), // 'direct' (Twitter) or 'late' (others)
  accountId: v.string(), // Platform-specific user ID
  accountName: v.string(), // Display name (@username or name)
  accountImage: v.optional(v.string()), // Profile picture URL
  accessToken: v.string(), // Encrypted OAuth access token
  refreshToken: v.optional(v.string()), // Encrypted refresh token
  tokenExpiry: v.optional(v.number()), // Token expiration timestamp
  isConnected: v.boolean(),
  connectedAt: v.number(), // Timestamp
  lastUsedAt: v.optional(v.number()),
  metadata: v.optional(v.any()), // Platform-specific data
});
```

#### 20A.3.2 Post Queue Table
```typescript
// convex/schema.ts
export const postQueue = defineTable({
  contentId: v.string(), // Reference to youtube_content entry
  platform: v.string(), // 'twitter', 'linkedin', 'facebook', 'instagram'
  content: v.object({
    text: v.string(),
    hashtags: v.optional(v.string()),
    mediaUrls: v.optional(v.array(v.string())),
  }),
  status: v.string(), // 'pending', 'scheduled', 'publishing', 'published', 'failed'
  scheduledFor: v.optional(v.number()), // Timestamp for scheduled posts
  publishedAt: v.optional(v.number()),
  platformPostId: v.optional(v.string()), // ID returned by platform
  platformPostUrl: v.optional(v.string()), // URL to the published post
  error: v.optional(v.string()), // Error message if failed
  retryCount: v.number(), // Number of retry attempts
  createdAt: v.number(),
  updatedAt: v.number(),
});
```

#### 20A.3.3 Usage Tracking Table
```typescript
// convex/schema.ts
export const usageTracking = defineTable({
  platform: v.string(),
  provider: v.string(), // 'direct' or 'late'
  periodStart: v.number(), // Start of tracking period (month)
  periodEnd: v.number(), // End of tracking period
  postsUsed: v.number(),
  postsLimit: v.number(),
  lastUpdated: v.number(),
});
```

### 20A.4 Netlify Functions

#### 20A.4.1 Twitter OAuth Functions

**`twitter-auth.js` - Initiate OAuth Flow:**
```javascript
// src/netlify/functions/twitter-auth.js
const crypto = require('crypto');

exports.handler = async (event) => {
  const { TWITTER_CLIENT_ID, TWITTER_CALLBACK_URL } = process.env;

  // Generate PKCE code verifier and challenge
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  // Generate state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');

  // Store verifier and state in session (use Convex or encrypted cookie)
  // ... store codeVerifier and state ...

  const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', TWITTER_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', TWITTER_CALLBACK_URL);
  authUrl.searchParams.set('scope', 'tweet.read tweet.write users.read offline.access');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  return {
    statusCode: 302,
    headers: {
      Location: authUrl.toString(),
      'Set-Cookie': `twitter_auth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
    }
  };
};
```

**`twitter-callback.js` - Handle OAuth Callback:**
```javascript
// src/netlify/functions/twitter-callback.js
const { ConvexHttpClient } = require('convex/browser');

exports.handler = async (event) => {
  const { code, state } = event.queryStringParameters;
  const { TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET, TWITTER_CALLBACK_URL } = process.env;

  // Verify state matches stored state
  // ... verify state ...

  // Exchange code for tokens
  const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: TWITTER_CALLBACK_URL,
      code_verifier: storedCodeVerifier // Retrieved from session
    })
  });

  const tokens = await tokenResponse.json();

  // Get user info
  const userResponse = await fetch('https://api.twitter.com/2/users/me', {
    headers: { 'Authorization': `Bearer ${tokens.access_token}` }
  });
  const user = await userResponse.json();

  // Store in Convex (encrypted)
  const convex = new ConvexHttpClient(process.env.CONVEX_URL);
  await convex.mutation('socialAccounts:upsert', {
    platform: 'twitter',
    provider: 'direct',
    accountId: user.data.id,
    accountName: `@${user.data.username}`,
    accessToken: encrypt(tokens.access_token),
    refreshToken: encrypt(tokens.refresh_token),
    tokenExpiry: Date.now() + (tokens.expires_in * 1000),
    isConnected: true,
    connectedAt: Date.now()
  });

  // Redirect back to admin
  return {
    statusCode: 302,
    headers: {
      Location: '/admin/settings?twitter=connected'
    }
  };
};
```

**`post-to-twitter.js` - Post Tweet:**
```javascript
// src/netlify/functions/post-to-twitter.js
const { ConvexHttpClient } = require('convex/browser');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { text, mediaUrls, contentId } = JSON.parse(event.body);
  const convex = new ConvexHttpClient(process.env.CONVEX_URL);

  // Get stored credentials
  const account = await convex.query('socialAccounts:getByPlatform', {
    platform: 'twitter'
  });

  if (!account || !account.isConnected) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Twitter account not connected' })
    };
  }

  // Check token expiry, refresh if needed
  let accessToken = decrypt(account.accessToken);
  if (account.tokenExpiry && Date.now() > account.tokenExpiry - 60000) {
    accessToken = await refreshTwitterToken(account, convex);
  }

  // Check usage limits
  const usage = await convex.query('usageTracking:get', {
    platform: 'twitter',
    provider: 'direct'
  });

  if (usage && usage.postsUsed >= usage.postsLimit) {
    return {
      statusCode: 429,
      body: JSON.stringify({
        error: 'Monthly Twitter post limit reached (1,500)',
        resetDate: new Date(usage.periodEnd).toISOString()
      })
    };
  }

  try {
    // Upload media if provided
    let mediaIds = [];
    if (mediaUrls && mediaUrls.length > 0) {
      mediaIds = await uploadTwitterMedia(mediaUrls, accessToken);
    }

    // Post tweet
    const tweetPayload = { text };
    if (mediaIds.length > 0) {
      tweetPayload.media = { media_ids: mediaIds };
    }

    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tweetPayload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.detail || 'Failed to post tweet');
    }

    // Update usage tracking
    await convex.mutation('usageTracking:increment', {
      platform: 'twitter',
      provider: 'direct'
    });

    // Log to post queue
    await convex.mutation('postQueue:update', {
      contentId,
      platform: 'twitter',
      status: 'published',
      publishedAt: Date.now(),
      platformPostId: result.data.id,
      platformPostUrl: `https://twitter.com/i/status/${result.data.id}`
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        postId: result.data.id,
        postUrl: `https://twitter.com/i/status/${result.data.id}`
      })
    };

  } catch (error) {
    // Log failure
    await convex.mutation('postQueue:update', {
      contentId,
      platform: 'twitter',
      status: 'failed',
      error: error.message
    });

    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

#### 20A.4.2 Late API Functions

**`post-to-social.js` - Post via Late API:**
```javascript
// src/netlify/functions/post-to-social.js
const { ConvexHttpClient } = require('convex/browser');

const LATE_API_BASE = 'https://api.getlate.dev/v1';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const {
    platforms, // ['linkedin', 'facebook', 'instagram']
    content,   // { text, hashtags, mediaUrls }
    contentId,
    scheduledAt // optional ISO timestamp
  } = JSON.parse(event.body);

  const { LATE_API_KEY } = process.env;
  const convex = new ConvexHttpClient(process.env.CONVEX_URL);

  // Check usage limits
  const usage = await convex.query('usageTracking:get', {
    platform: 'late',
    provider: 'late'
  });

  const postsNeeded = platforms.length;
  if (usage && (usage.postsUsed + postsNeeded) > usage.postsLimit) {
    return {
      statusCode: 429,
      body: JSON.stringify({
        error: `Late API monthly limit reached. ${usage.postsLimit - usage.postsUsed} posts remaining.`,
        postsRemaining: usage.postsLimit - usage.postsUsed,
        resetDate: new Date(usage.periodEnd).toISOString()
      })
    };
  }

  try {
    // Build post text with hashtags
    let postText = content.text;
    if (content.hashtags) {
      postText += '\n\n' + content.hashtags;
    }

    // Make Late API request
    const latePayload = {
      text: postText,
      platforms: platforms,
    };

    if (content.mediaUrls && content.mediaUrls.length > 0) {
      latePayload.mediaUrls = content.mediaUrls;
    }

    if (scheduledAt) {
      latePayload.scheduledAt = scheduledAt;
    }

    const response = await fetch(`${LATE_API_BASE}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(latePayload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to post via Late');
    }

    // Update usage tracking
    await convex.mutation('usageTracking:incrementBy', {
      platform: 'late',
      provider: 'late',
      count: platforms.length
    });

    // Log each platform to post queue
    for (const platform of platforms) {
      await convex.mutation('postQueue:update', {
        contentId,
        platform,
        status: scheduledAt ? 'scheduled' : 'published',
        publishedAt: scheduledAt ? null : Date.now(),
        scheduledFor: scheduledAt ? new Date(scheduledAt).getTime() : null,
        platformPostId: result.id
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        postId: result.id,
        platforms: platforms,
        scheduled: !!scheduledAt
      })
    };

  } catch (error) {
    // Log failures
    for (const platform of platforms) {
      await convex.mutation('postQueue:update', {
        contentId,
        platform,
        status: 'failed',
        error: error.message
      });
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

### 20A.5 Admin UI Components

#### 20A.5.1 Settings Page - Connected Accounts

```html
<!-- src/admin/settings/index.html (relevant section) -->
<section class="settings-section" id="social-accounts">
  <div class="section-header">
    <h2><i class="fas fa-share-alt"></i> Connected Social Accounts</h2>
    <p class="section-description">
      Connect your social media accounts to enable one-click publishing.
    </p>
  </div>

  <div class="accounts-grid">
    <!-- Twitter/X - Direct API -->
    <div class="account-card" id="twitter-account">
      <div class="account-header">
        <i class="fab fa-x-twitter"></i>
        <span class="account-name">Twitter/X</span>
        <span class="badge badge-free">Free: 1,500/month</span>
      </div>
      <div class="account-status" id="twitter-status">
        <!-- Populated by JavaScript -->
        <span class="status-disconnected">
          <i class="fas fa-times-circle"></i> Not Connected
        </span>
      </div>
      <div class="account-actions">
        <button class="btn btn-primary" onclick="connectTwitter()">
          <i class="fab fa-x-twitter"></i> Connect Twitter
        </button>
      </div>
      <div class="account-usage" id="twitter-usage" style="display: none;">
        <div class="usage-bar">
          <div class="usage-fill" style="width: 0%"></div>
        </div>
        <span class="usage-text">0 / 1,500 posts this month</span>
      </div>
    </div>

    <!-- LinkedIn, Facebook, Instagram - Via Late -->
    <div class="account-card" id="late-accounts">
      <div class="account-header">
        <div class="platform-icons">
          <i class="fab fa-linkedin"></i>
          <i class="fab fa-facebook"></i>
          <i class="fab fa-instagram"></i>
        </div>
        <span class="account-name">LinkedIn, Facebook, Instagram</span>
        <span class="badge badge-free">Free: 10/month (via Late)</span>
      </div>
      <div class="account-status" id="late-status">
        <span class="status-disconnected">
          <i class="fas fa-times-circle"></i> Not Connected
        </span>
      </div>
      <div class="account-info">
        <p>These platforms are connected through <a href="https://getlate.dev" target="_blank">Late</a>,
           which handles the complex OAuth requirements.</p>
      </div>
      <div class="account-actions">
        <a href="https://getlate.dev/dashboard" target="_blank" class="btn btn-secondary">
          <i class="fas fa-external-link-alt"></i> Connect in Late Dashboard
        </a>
        <button class="btn btn-primary" onclick="verifyLateConnection()">
          <i class="fas fa-check"></i> Verify Connection
        </button>
      </div>
      <div class="account-usage" id="late-usage" style="display: none;">
        <div class="usage-bar">
          <div class="usage-fill" style="width: 0%"></div>
        </div>
        <span class="usage-text">0 / 10 posts this month</span>
      </div>
    </div>
  </div>

  <!-- API Keys Section -->
  <div class="api-keys-section">
    <h3>API Configuration</h3>
    <p class="hint">API keys are stored securely in Netlify environment variables.</p>

    <div class="api-key-status">
      <div class="key-item">
        <span class="key-name">Twitter API</span>
        <span class="key-status" id="twitter-key-status">
          <i class="fas fa-circle-notch fa-spin"></i> Checking...
        </span>
      </div>
      <div class="key-item">
        <span class="key-name">Late API</span>
        <span class="key-status" id="late-key-status">
          <i class="fas fa-circle-notch fa-spin"></i> Checking...
        </span>
      </div>
    </div>
  </div>
</section>
```

#### 20A.5.2 Script Generator - Publish Section

```html
<!-- Addition to src/admin/script-generator/index.html -->
<!-- Phase 5: Social Publishing Section -->
<div class="card phase-card" id="phase5-card">
  <div class="card-header">
    <h2><i class="fas fa-paper-plane"></i> Publish to Social Media</h2>
  </div>
  <div class="card-body">
    <div class="phase-header">
      <div class="phase-step">5</div>
      <div>
        <div class="phase-title">One-Click Publish</div>
        <div class="phase-desc">Publish generated content directly to your connected accounts</div>
      </div>
    </div>

    <!-- Connection Status -->
    <div class="connection-status-bar" id="connection-status">
      <div class="platform-status" data-platform="twitter">
        <i class="fab fa-x-twitter"></i>
        <span class="status-indicator"></span>
      </div>
      <div class="platform-status" data-platform="linkedin">
        <i class="fab fa-linkedin"></i>
        <span class="status-indicator"></span>
      </div>
      <div class="platform-status" data-platform="facebook">
        <i class="fab fa-facebook"></i>
        <span class="status-indicator"></span>
      </div>
      <div class="platform-status" data-platform="instagram">
        <i class="fab fa-instagram"></i>
        <span class="status-indicator"></span>
      </div>
    </div>

    <!-- Platform Selection -->
    <div class="platform-selection">
      <label class="platform-checkbox">
        <input type="checkbox" id="publish-twitter" checked>
        <span class="platform-label">
          <i class="fab fa-x-twitter"></i> Twitter/X
          <span class="char-preview" id="twitter-char-preview">0/280</span>
        </span>
      </label>
      <label class="platform-checkbox">
        <input type="checkbox" id="publish-linkedin" checked>
        <span class="platform-label">
          <i class="fab fa-linkedin"></i> LinkedIn
        </span>
      </label>
      <label class="platform-checkbox">
        <input type="checkbox" id="publish-facebook" checked>
        <span class="platform-label">
          <i class="fab fa-facebook"></i> Facebook
        </span>
      </label>
      <label class="platform-checkbox">
        <input type="checkbox" id="publish-instagram" checked>
        <span class="platform-label">
          <i class="fab fa-instagram"></i> Instagram
        </span>
      </label>
    </div>

    <!-- Scheduling Option -->
    <div class="schedule-option">
      <label class="toggle-label">
        <input type="checkbox" id="schedule-posts">
        <span>Schedule for later</span>
      </label>
      <div class="schedule-datetime" id="schedule-datetime" style="display: none;">
        <input type="datetime-local" id="schedule-time" />
        <span class="timezone-hint">Your local timezone</span>
      </div>
    </div>

    <!-- Usage Warnings -->
    <div class="usage-warnings" id="usage-warnings" style="display: none;">
      <div class="warning-item" id="twitter-warning" style="display: none;">
        <i class="fas fa-exclamation-triangle"></i>
        <span>Twitter: <strong id="twitter-remaining">0</strong> posts remaining this month</span>
      </div>
      <div class="warning-item" id="late-warning" style="display: none;">
        <i class="fas fa-exclamation-triangle"></i>
        <span>Late (LinkedIn/FB/IG): <strong id="late-remaining">0</strong> posts remaining this month</span>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="publish-actions">
      <button class="btn btn-secondary" onclick="previewAllPosts()">
        <i class="fas fa-eye"></i> Preview All
      </button>
      <button class="btn btn-primary" id="publish-all-btn" onclick="publishToAllPlatforms()">
        <i class="fas fa-paper-plane"></i> Publish Now
      </button>
    </div>

    <!-- Publish Status -->
    <div class="publish-status" id="publish-status" style="display: none;">
      <div class="status-item" data-platform="twitter">
        <i class="fab fa-x-twitter"></i>
        <span class="status-text">Pending</span>
        <a class="post-link" href="#" target="_blank" style="display: none;">View Post</a>
      </div>
      <div class="status-item" data-platform="linkedin">
        <i class="fab fa-linkedin"></i>
        <span class="status-text">Pending</span>
        <a class="post-link" href="#" target="_blank" style="display: none;">View Post</a>
      </div>
      <div class="status-item" data-platform="facebook">
        <i class="fab fa-facebook"></i>
        <span class="status-text">Pending</span>
        <a class="post-link" href="#" target="_blank" style="display: none;">View Post</a>
      </div>
      <div class="status-item" data-platform="instagram">
        <i class="fab fa-instagram"></i>
        <span class="status-text">Pending</span>
        <a class="post-link" href="#" target="_blank" style="display: none;">View Post</a>
      </div>
    </div>
  </div>
</div>
```

#### 20A.5.3 Publishing JavaScript Logic

```javascript
// Publishing functions for script-generator/index.html

// Check connection status on page load
async function checkSocialConnections() {
  try {
    const response = await fetch('/.netlify/functions/social-status');
    const status = await response.json();

    updateConnectionIndicators(status);
    updateUsageWarnings(status);
  } catch (error) {
    console.error('Failed to check social connections:', error);
  }
}

function updateConnectionIndicators(status) {
  const platforms = ['twitter', 'linkedin', 'facebook', 'instagram'];

  platforms.forEach(platform => {
    const indicator = document.querySelector(
      `.platform-status[data-platform="${platform}"] .status-indicator`
    );
    const checkbox = document.getElementById(`publish-${platform}`);

    if (status[platform]?.connected) {
      indicator.classList.add('connected');
      indicator.title = `Connected as ${status[platform].accountName}`;
    } else {
      indicator.classList.add('disconnected');
      indicator.title = 'Not connected';
      checkbox.disabled = true;
      checkbox.checked = false;
    }
  });
}

function updateUsageWarnings(status) {
  const warningsDiv = document.getElementById('usage-warnings');
  let showWarnings = false;

  // Twitter warning (show if <100 remaining)
  if (status.twitter?.connected && status.twitter.remaining < 100) {
    document.getElementById('twitter-remaining').textContent = status.twitter.remaining;
    document.getElementById('twitter-warning').style.display = 'flex';
    showWarnings = true;
  }

  // Late warning (show if <3 remaining)
  if (status.late?.remaining < 3) {
    document.getElementById('late-remaining').textContent = status.late.remaining;
    document.getElementById('late-warning').style.display = 'flex';
    showWarnings = true;
  }

  warningsDiv.style.display = showWarnings ? 'block' : 'none';
}

// Main publish function
async function publishToAllPlatforms() {
  if (!generatedSocial) {
    showAlert('Please generate social content first.', 'error');
    return;
  }

  const platforms = [];
  const twitterSelected = document.getElementById('publish-twitter').checked;
  const linkedinSelected = document.getElementById('publish-linkedin').checked;
  const facebookSelected = document.getElementById('publish-facebook').checked;
  const instagramSelected = document.getElementById('publish-instagram').checked;

  const scheduled = document.getElementById('schedule-posts').checked;
  const scheduleTime = scheduled ? document.getElementById('schedule-time').value : null;

  // Show publishing status
  document.getElementById('publish-status').style.display = 'block';
  document.getElementById('publish-all-btn').disabled = true;

  // Publish to Twitter (direct)
  if (twitterSelected) {
    await publishToTwitter(scheduleTime);
  }

  // Publish to LinkedIn, Facebook, Instagram (via Late)
  const latePlatforms = [];
  if (linkedinSelected) latePlatforms.push('linkedin');
  if (facebookSelected) latePlatforms.push('facebook');
  if (instagramSelected) latePlatforms.push('instagram');

  if (latePlatforms.length > 0) {
    await publishViaLate(latePlatforms, scheduleTime);
  }

  document.getElementById('publish-all-btn').disabled = false;
}

async function publishToTwitter(scheduleTime) {
  updatePublishStatus('twitter', 'publishing', 'Publishing...');

  try {
    const content = generatedSocial.twitter;
    const text = content.text + (content.hashtags ? '\n\n' + content.hashtags : '');

    const response = await fetch('/.netlify/functions/post-to-twitter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        contentId: currentContentId,
        scheduledAt: scheduleTime
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      updatePublishStatus('twitter', 'success', 'Published!', result.postUrl);
    } else {
      throw new Error(result.error || 'Failed to publish');
    }
  } catch (error) {
    updatePublishStatus('twitter', 'error', `Failed: ${error.message}`);
  }
}

async function publishViaLate(platforms, scheduleTime) {
  // Update all Late platforms to publishing state
  platforms.forEach(p => updatePublishStatus(p, 'publishing', 'Publishing...'));

  try {
    // Build platform-specific content
    const platformContent = {};
    platforms.forEach(platform => {
      const content = generatedSocial[platform];
      platformContent[platform] = {
        text: platform === 'instagram' ? content.caption : content.text,
        hashtags: content.hashtags
      };
    });

    const response = await fetch('/.netlify/functions/post-to-social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platforms,
        content: platformContent[platforms[0]], // Late uses same content for all
        contentId: currentContentId,
        scheduledAt: scheduleTime
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      platforms.forEach(p => {
        updatePublishStatus(p, 'success', result.scheduled ? 'Scheduled!' : 'Published!');
      });
    } else {
      throw new Error(result.error || 'Failed to publish');
    }
  } catch (error) {
    platforms.forEach(p => {
      updatePublishStatus(p, 'error', `Failed: ${error.message}`);
    });
  }
}

function updatePublishStatus(platform, status, text, postUrl = null) {
  const statusItem = document.querySelector(`.status-item[data-platform="${platform}"]`);
  const statusText = statusItem.querySelector('.status-text');
  const postLink = statusItem.querySelector('.post-link');

  statusItem.className = `status-item status-${status}`;
  statusText.textContent = text;

  if (postUrl) {
    postLink.href = postUrl;
    postLink.style.display = 'inline';
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  checkSocialConnections();

  // Toggle schedule datetime picker
  document.getElementById('schedule-posts').addEventListener('change', (e) => {
    document.getElementById('schedule-datetime').style.display =
      e.target.checked ? 'block' : 'none';
  });
});
```

### 20A.6 CSS Styles for Publishing UI

```css
/* Add to src/admin/script-generator/index.html <style> section */

/* Connection Status Bar */
.connection-status-bar {
  display: flex;
  gap: 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 20px;
}

.platform-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 1.25rem;
  color: #64748b;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
}

.status-indicator.connected {
  background: #10B981;
}

.status-indicator.disconnected {
  background: #ef4444;
}

/* Platform Selection */
.platform-selection {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.platform-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.platform-checkbox:hover {
  border-color: #10B981;
}

.platform-checkbox input:checked + .platform-label {
  color: #10B981;
}

.platform-checkbox input:disabled + .platform-label {
  opacity: 0.5;
  cursor: not-allowed;
}

.platform-checkbox input {
  width: 18px;
  height: 18px;
  accent-color: #10B981;
}

.platform-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.char-preview {
  font-size: 0.75rem;
  color: #94a3b8;
}

/* Schedule Option */
.schedule-option {
  margin-bottom: 20px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.schedule-datetime {
  margin-top: 12px;
  padding-left: 26px;
}

.schedule-datetime input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
}

.timezone-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-left: 8px;
}

/* Usage Warnings */
.usage-warnings {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
}

.warning-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #92400e;
  font-size: 0.875rem;
}

.warning-item i {
  color: #f59e0b;
}

/* Publish Actions */
.publish-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

/* Publish Status */
.publish-status {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #e2e8f0;
}

.status-item:last-child {
  border-bottom: none;
}

.status-item i {
  font-size: 1.25rem;
  width: 24px;
  color: #64748b;
}

.status-item.status-publishing .status-text {
  color: #3b82f6;
}

.status-item.status-success .status-text {
  color: #10B981;
}

.status-item.status-success i {
  color: #10B981;
}

.status-item.status-error .status-text {
  color: #ef4444;
}

.status-item.status-error i {
  color: #ef4444;
}

.post-link {
  margin-left: auto;
  color: #10B981;
  font-size: 0.875rem;
}
```

### 20A.7 Setup & Configuration Guide

#### 20A.7.1 Twitter/X Developer Setup

**Step-by-Step Instructions:**

1. **Create Twitter Developer Account**
   - Go to https://developer.x.com/
   - Sign in with your Twitter account
   - Apply for developer access (free tier)
   - Complete the application form

2. **Create a Project and App**
   - In the Developer Portal, create a new Project
   - Create an App within the project
   - Note down the App ID

3. **Configure Authentication**
   - Go to App Settings → User authentication settings
   - Enable OAuth 2.0
   - Set Type of App: "Web App"
   - Add Callback URL: `https://robspain.com/.netlify/functions/twitter-callback`
   - Add Website URL: `https://robspain.com`
   - Set Permissions: "Read and Write"

4. **Generate Credentials**
   - Go to Keys and Tokens
   - Generate Client ID and Client Secret
   - Save these securely

5. **Add to Netlify**
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Add:
     - `TWITTER_CLIENT_ID` = your client ID
     - `TWITTER_CLIENT_SECRET` = your client secret
     - `TWITTER_CALLBACK_URL` = `https://robspain.com/.netlify/functions/twitter-callback`

#### 20A.7.2 Late API Setup

**Step-by-Step Instructions:**

1. **Create Late Account**
   - Go to https://getlate.dev/
   - Sign up for free account
   - Verify your email

2. **Connect Social Accounts**
   - In Late Dashboard, click "Add Account"
   - Connect LinkedIn (requires LinkedIn login)
   - Connect Facebook Page (requires Facebook login + Page admin access)
   - Connect Instagram Business (requires Facebook login + Instagram Business account)

3. **Generate API Key**
   - Go to Late Dashboard → Settings → API
   - Generate new API key
   - Copy the key

4. **Add to Netlify**
   - Add environment variable:
     - `LATE_API_KEY` = your Late API key

#### 20A.7.3 Convex Setup

**Step-by-Step Instructions:**

1. **Create Convex Account**
   - Go to https://convex.dev/
   - Sign up for free account

2. **Create New Project**
   - Create project named "robspain-social"
   - Note the deployment URL

3. **Initialize in Project**
   ```bash
   cd /path/to/robspain.com
   npx convex init
   ```

4. **Add Schema**
   - Create `convex/schema.ts` with tables from Section 20A.3

5. **Deploy Functions**
   ```bash
   npx convex deploy
   ```

6. **Add to Netlify**
   - Add environment variable:
     - `CONVEX_URL` = your Convex deployment URL

### 20A.8 Cost Analysis

#### 20A.8.1 Ongoing Costs (Phase 5)

| Service | Tier | Cost | Limits |
|---------|------|------|--------|
| Twitter/X API | Free | $0/month | 1,500 posts/month |
| Late | Free | $0/month | 10 posts/month |
| Convex | Free | $0/month | 1M function calls/month |
| **Total** | | **$0/month** | |

#### 20A.8.2 Upgrade Paths (If Needed)

| Service | Paid Tier | Cost | Benefits |
|---------|-----------|------|----------|
| Twitter/X API | Basic | $200/month | 10K posts/month |
| Late | Pro | ~$20/month | 100+ posts/month |
| Convex | Pro | $25/month | Higher limits |

**Recommendation:** Start with free tiers. With 2-4 videos/month:
- Twitter: ~8-16 posts/month (well under 1,500)
- Late: ~6-12 posts/month (may need upgrade or selective posting)

**Late Optimization Strategy:**
If hitting Late's 10 post limit:
1. Prioritize LinkedIn (most professional reach)
2. Use manual posting for Facebook/Instagram
3. Consider upgrading to Late Pro ($20/month)

### 20A.9 Error Handling & Recovery

#### 20A.9.1 Common Error Scenarios

| Error | Cause | User Message | Recovery |
|-------|-------|--------------|----------|
| Rate limit (Twitter) | 1,500 posts exceeded | "Twitter monthly limit reached. Posts will queue for next month." | Queue post, notify when limit resets |
| Rate limit (Late) | 10 posts exceeded | "Late API limit reached. Copy content manually or upgrade plan." | Show copy buttons as fallback |
| Token expired | OAuth token expired | "Twitter connection expired. Please reconnect." | Redirect to re-auth |
| Network error | Connection failed | "Couldn't reach [platform]. Will retry automatically." | Retry 3x with backoff |
| Content rejected | Platform policy violation | "Post rejected by [platform]: [reason]. Please edit and try again." | Show edit interface |

#### 20A.9.2 Retry Logic

```javascript
async function publishWithRetry(publishFn, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await publishFn();
    } catch (error) {
      lastError = error;

      // Don't retry on certain errors
      if (error.message.includes('rate limit') ||
          error.message.includes('rejected')) {
        throw error;
      }

      // Exponential backoff
      if (attempt < maxRetries) {
        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  throw lastError;
}
```

### 20A.10 Security Considerations

#### 20A.10.1 Token Storage

- OAuth tokens stored in Convex with encryption
- Encryption key stored in Netlify environment variables
- Tokens never exposed to client-side code
- Automatic token refresh before expiry

#### 20A.10.2 API Key Protection

- All API keys in Netlify environment variables
- Never committed to git
- Functions validate requests before using keys
- Rate limiting on functions to prevent abuse

#### 20A.10.3 CSRF Protection

- State parameter in OAuth flows
- HTTPOnly cookies for auth state
- Origin validation on callbacks

### 20A.11 Comment Management & Engagement Hub

#### 20A.11.1 Overview

Enable Rob to view and respond to comments across all social platforms from a unified admin dashboard, maximizing engagement while minimizing context-switching.

**Capabilities by Platform:**

| Platform | Read Comments | Reply to Comments | API Tier Required | Cost |
|----------|---------------|-------------------|-------------------|------|
| **Twitter/X** | ❌ Free / ✅ Basic | ❌ Free / ✅ Basic | Basic tier | $100/month |
| **LinkedIn** | ✅ With Partner Access | ✅ With Partner Access | Community Management API | Free (requires business verification) |
| **Facebook** | ✅ Graph API | ✅ Graph API | Pages API | Free (requires Meta verification) |
| **Instagram** | ✅ Graph API | ✅ Graph API | Instagram Graph API | Free (requires Meta verification) |

**Important Limitation:** Late API does NOT support comment management—it's posting-only. For comments, we need direct platform integrations or an alternative unified API.

#### 20A.11.2 Recommended Approach: Hybrid Integration

Given the constraints, we recommend a **tiered hybrid approach**:

**Tier 1 - Free (Facebook + Instagram via Meta Graph API)**
- Full comment management for Facebook Page and Instagram Business
- Requires Meta Business verification (one-time setup)
- Direct API integration via Netlify Functions

**Tier 2 - Optional Paid (Twitter/X)**
- Upgrade to Twitter Basic ($100/month) for reply reading
- Or use manual monitoring via Twitter notifications

**Tier 3 - LinkedIn (If Partner Access Obtained)**
- Apply for Community Management API access
- If approved, integrate comment management
- Otherwise, use LinkedIn notifications

**Alternative: Unified API (Ayrshare)**
If budget allows, Ayrshare ($49-149/month) provides:
- Unified comment management across all platforms
- Comment retrieval, posting, and deletion
- Simpler single-API integration
- Built-in rate limiting and error handling

#### 20A.11.3 Architecture: Comment Management System

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Comment Management Architecture                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Admin Panel - Engagement Hub                    │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │   │
│  │  │ Facebook │ │Instagram │ │ Twitter  │ │ LinkedIn │            │   │
│  │  │    12    │ │    8     │ │    5     │ │    3     │ (comment   │   │
│  │  │ comments │ │ comments │ │ replies  │ │ comments │  counts)   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │   │
│  │                                                                    │   │
│  │  ┌────────────────────────────────────────────────────────────┐  │   │
│  │  │  Unified Inbox                                    [Filter ▼] │  │   │
│  │  ├────────────────────────────────────────────────────────────┤  │   │
│  │  │ 🔵 @sarah_bcba on Instagram • 2 min ago                    │  │   │
│  │  │ "This is exactly what I needed! How do you handle..."      │  │   │
│  │  │ [Reply] [Like] [Hide] [Mark Read]                          │  │   │
│  │  ├────────────────────────────────────────────────────────────┤  │   │
│  │  │ 🔵 John Smith on Facebook • 15 min ago                     │  │   │
│  │  │ "Great video! Quick question about the implementation..."  │  │   │
│  │  │ [Reply] [Like] [Hide] [Mark Read]                          │  │   │
│  │  ├────────────────────────────────────────────────────────────┤  │   │
│  │  │ ⚪ @behavior_pro on Twitter • 1 hour ago                   │  │   │
│  │  │ "Thanks for sharing this research! 🙌"                     │  │   │
│  │  │ [View on Twitter] (read-only without Basic tier)           │  │   │
│  │  └────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Netlify Functions                               │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │  fetch-fb-comments.js ────────────► Facebook Graph API            │   │
│  │  fetch-ig-comments.js ────────────► Instagram Graph API           │   │
│  │  fetch-twitter-replies.js ────────► Twitter API (Basic tier)      │   │
│  │  fetch-linkedin-comments.js ──────► LinkedIn API (if approved)    │   │
│  │  reply-to-comment.js ─────────────► Platform-specific reply       │   │
│  │  mark-comment-read.js ────────────► Update Convex status          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                         Convex Database                            │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │  • comments (cached comments from all platforms)                  │   │
│  │  • commentReplies (replies sent from dashboard)                   │   │
│  │  • commentStatus (read/unread, flagged, hidden)                   │   │
│  │  • syncStatus (last fetch time per platform)                      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 20A.11.4 Data Models for Comment Management

**Comments Table:**
```typescript
// convex/schema.ts - additions for comment management
export const comments = defineTable({
  // Source information
  platform: v.string(), // 'facebook', 'instagram', 'twitter', 'linkedin'
  platformCommentId: v.string(), // Platform's comment ID
  platformPostId: v.string(), // The post this comment is on
  contentId: v.optional(v.string()), // Reference to our youtube_content entry

  // Comment content
  authorName: v.string(),
  authorUsername: v.string(),
  authorProfileUrl: v.optional(v.string()),
  authorAvatarUrl: v.optional(v.string()),
  text: v.string(),
  mediaUrls: v.optional(v.array(v.string())), // If comment has images

  // Metadata
  createdAt: v.number(), // When comment was posted
  fetchedAt: v.number(), // When we fetched it

  // Engagement metrics
  likeCount: v.optional(v.number()),
  replyCount: v.optional(v.number()),

  // Our tracking
  status: v.string(), // 'unread', 'read', 'replied', 'hidden', 'flagged'
  sentiment: v.optional(v.string()), // 'positive', 'neutral', 'negative', 'question'
  isQuestion: v.boolean(),
  priority: v.string(), // 'high', 'normal', 'low'

  // Parent comment (for threaded replies)
  parentCommentId: v.optional(v.string()),
  isReply: v.boolean(),
})
.index("by_platform", ["platform"])
.index("by_status", ["status"])
.index("by_contentId", ["contentId"])
.index("by_createdAt", ["createdAt"]);

export const commentReplies = defineTable({
  commentId: v.id("comments"), // Reference to comment we're replying to
  platform: v.string(),
  platformReplyId: v.optional(v.string()), // ID returned after posting
  text: v.string(),
  status: v.string(), // 'pending', 'sent', 'failed'
  sentAt: v.optional(v.number()),
  error: v.optional(v.string()),
  createdAt: v.number(),
});

export const commentSyncStatus = defineTable({
  platform: v.string(),
  lastSyncAt: v.number(),
  lastSyncPostId: v.optional(v.string()),
  commentsCount: v.number(),
  unreadCount: v.number(),
  errorCount: v.number(),
  lastError: v.optional(v.string()),
});
```

#### 20A.11.5 Netlify Functions for Comment Management

**`fetch-fb-comments.js` - Fetch Facebook Page Comments:**
```javascript
// src/netlify/functions/fetch-fb-comments.js
const { ConvexHttpClient } = require('convex/browser');

exports.handler = async (event) => {
  const { FB_PAGE_ACCESS_TOKEN, FB_PAGE_ID, CONVEX_URL } = process.env;
  const convex = new ConvexHttpClient(CONVEX_URL);

  try {
    // Get recent posts from the page
    const postsResponse = await fetch(
      `https://graph.facebook.com/v22.0/${FB_PAGE_ID}/posts?` +
      `fields=id,message,created_time&limit=10&` +
      `access_token=${FB_PAGE_ACCESS_TOKEN}`
    );
    const posts = await postsResponse.json();

    const allComments = [];

    // For each post, fetch comments
    for (const post of posts.data || []) {
      const commentsResponse = await fetch(
        `https://graph.facebook.com/v22.0/${post.id}/comments?` +
        `fields=id,from,message,created_time,like_count,comment_count,parent&` +
        `limit=50&access_token=${FB_PAGE_ACCESS_TOKEN}`
      );
      const comments = await commentsResponse.json();

      for (const comment of comments.data || []) {
        allComments.push({
          platform: 'facebook',
          platformCommentId: comment.id,
          platformPostId: post.id,
          authorName: comment.from?.name || 'Unknown',
          authorUsername: comment.from?.id || '',
          text: comment.message,
          createdAt: new Date(comment.created_time).getTime(),
          fetchedAt: Date.now(),
          likeCount: comment.like_count || 0,
          replyCount: comment.comment_count || 0,
          isQuestion: detectQuestion(comment.message),
          isReply: !!comment.parent,
          parentCommentId: comment.parent?.id,
        });
      }
    }

    // Upsert comments to Convex
    for (const comment of allComments) {
      await convex.mutation('comments:upsert', comment);
    }

    // Update sync status
    await convex.mutation('commentSyncStatus:update', {
      platform: 'facebook',
      lastSyncAt: Date.now(),
      commentsCount: allComments.length,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        fetched: allComments.length,
        platform: 'facebook'
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

function detectQuestion(text) {
  if (!text) return false;
  return text.includes('?') ||
         /^(how|what|why|when|where|who|can|could|would|is|are|do|does)/i.test(text.trim());
}
```

**`reply-to-comment.js` - Reply to Comment:**
```javascript
// src/netlify/functions/reply-to-comment.js
const { ConvexHttpClient } = require('convex/browser');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { commentId, platform, platformCommentId, replyText } = JSON.parse(event.body);
  const convex = new ConvexHttpClient(process.env.CONVEX_URL);

  try {
    let result;

    switch (platform) {
      case 'facebook':
        result = await replyToFacebookComment(platformCommentId, replyText);
        break;
      case 'instagram':
        result = await replyToInstagramComment(platformCommentId, replyText);
        break;
      case 'twitter':
        result = await replyToTweet(platformCommentId, replyText);
        break;
      case 'linkedin':
        result = await replyToLinkedInComment(platformCommentId, replyText);
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    // Log reply to Convex
    await convex.mutation('commentReplies:create', {
      commentId,
      platform,
      platformReplyId: result.replyId,
      text: replyText,
      status: 'sent',
      sentAt: Date.now(),
      createdAt: Date.now(),
    });

    // Update comment status
    await convex.mutation('comments:updateStatus', {
      id: commentId,
      status: 'replied'
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, replyId: result.replyId })
    };

  } catch (error) {
    // Log failed reply
    await convex.mutation('commentReplies:create', {
      commentId,
      platform,
      text: replyText,
      status: 'failed',
      error: error.message,
      createdAt: Date.now(),
    });

    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function replyToFacebookComment(commentId, text) {
  const { FB_PAGE_ACCESS_TOKEN } = process.env;

  const response = await fetch(
    `https://graph.facebook.com/v22.0/${commentId}/comments`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        access_token: FB_PAGE_ACCESS_TOKEN
      })
    }
  );

  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || 'Facebook reply failed');
  return { replyId: result.id };
}

async function replyToInstagramComment(commentId, text) {
  const { IG_ACCESS_TOKEN } = process.env;

  const response = await fetch(
    `https://graph.facebook.com/v22.0/${commentId}/replies`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        access_token: IG_ACCESS_TOKEN
      })
    }
  );

  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || 'Instagram reply failed');
  return { replyId: result.id };
}

async function replyToTweet(tweetId, text) {
  // Requires Twitter Basic tier ($100/month)
  const { TWITTER_ACCESS_TOKEN } = process.env;

  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TWITTER_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: text,
      reply: { in_reply_to_tweet_id: tweetId }
    })
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.detail || 'Twitter reply failed');
  return { replyId: result.data.id };
}

async function replyToLinkedInComment(commentUrn, text) {
  // Requires LinkedIn Community Management API access
  const { LINKEDIN_ACCESS_TOKEN } = process.env;

  const response = await fetch(
    'https://api.linkedin.com/v2/socialActions/' + encodeURIComponent(commentUrn) + '/comments',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202501'
      },
      body: JSON.stringify({
        actor: process.env.LINKEDIN_ORGANIZATION_URN,
        message: { text }
      })
    }
  );

  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'LinkedIn reply failed');
  return { replyId: result.id };
}
```

#### 20A.11.6 Admin UI: Engagement Hub

**Main Engagement Dashboard:**
```html
<!-- src/admin/engagement/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Engagement Hub | Rob Spain Admin</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8fafc;
      min-height: 100vh;
    }

    .engagement-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
    }

    .sync-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: #10B981;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .sync-btn:hover { background: #059669; }
    .sync-btn.syncing i { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Platform Stats Bar */
    .platform-stats {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }

    .platform-stat {
      flex: 1;
      background: white;
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: all 0.2s;
      border: 2px solid transparent;
    }

    .platform-stat:hover { border-color: #10B981; }
    .platform-stat.active { border-color: #10B981; background: #f0fdf4; }
    .platform-stat.disabled { opacity: 0.5; cursor: not-allowed; }

    .platform-stat i {
      font-size: 1.5rem;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
    }

    .platform-stat.facebook i { color: #1877f2; background: #e7f3ff; }
    .platform-stat.instagram i { color: #e4405f; background: #fce7eb; }
    .platform-stat.twitter i { color: #1da1f2; background: #e8f5fd; }
    .platform-stat.linkedin i { color: #0a66c2; background: #e8f4fc; }

    .platform-info h3 {
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 500;
    }

    .platform-count {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
    }

    .unread-badge {
      background: #ef4444;
      color: white;
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 10px;
      margin-left: 8px;
    }

    /* Filter Bar */
    .filter-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 8px 16px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-btn:hover { border-color: #10B981; }
    .filter-btn.active { background: #10B981; color: white; border-color: #10B981; }

    /* Comments List */
    .comments-container {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 24px;
    }

    .comments-list {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .comment-item {
      padding: 16px 20px;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      transition: background 0.2s;
    }

    .comment-item:hover { background: #f8fafc; }
    .comment-item.selected { background: #f0fdf4; border-left: 3px solid #10B981; }
    .comment-item.unread { background: #fefce8; }

    .comment-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .comment-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: #64748b;
    }

    .comment-avatar img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .comment-meta {
      flex: 1;
    }

    .comment-author {
      font-weight: 600;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .platform-badge {
      font-size: 0.75rem;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .platform-badge.facebook { background: #e7f3ff; color: #1877f2; }
    .platform-badge.instagram { background: #fce7eb; color: #e4405f; }
    .platform-badge.twitter { background: #e8f5fd; color: #1da1f2; }
    .platform-badge.linkedin { background: #e8f4fc; color: #0a66c2; }

    .comment-time {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .comment-text {
      color: #475569;
      font-size: 0.9375rem;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .comment-indicators {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }

    .indicator {
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 4px;
      background: #f1f5f9;
      color: #64748b;
    }

    .indicator.question { background: #fef3c7; color: #92400e; }
    .indicator.replied { background: #dcfce7; color: #166534; }

    /* Reply Panel */
    .reply-panel {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      padding: 20px;
      position: sticky;
      top: 24px;
    }

    .reply-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f1f5f9;
    }

    .selected-comment {
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .selected-comment .full-text {
      color: #1e293b;
      line-height: 1.6;
    }

    .reply-textarea {
      width: 100%;
      min-height: 120px;
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.9375rem;
      resize: vertical;
      margin-bottom: 12px;
    }

    .reply-textarea:focus {
      outline: none;
      border-color: #10B981;
    }

    .quick-replies {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }

    .quick-reply {
      padding: 6px 12px;
      background: #f1f5f9;
      border: none;
      border-radius: 16px;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .quick-reply:hover { background: #e2e8f0; }

    .reply-actions {
      display: flex;
      gap: 12px;
    }

    .btn-reply {
      flex: 1;
      padding: 12px;
      background: #10B981;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-reply:hover { background: #059669; }
    .btn-reply:disabled { background: #94a3b8; cursor: not-allowed; }

    .btn-action {
      padding: 12px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
    }

    .btn-action:hover { background: #f8fafc; }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #94a3b8;
    }

    .empty-state i {
      font-size: 3rem;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .comments-container {
        grid-template-columns: 1fr;
      }

      .reply-panel {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        border-radius: 12px 12px 0 0;
        max-height: 50vh;
        overflow-y: auto;
        transform: translateY(100%);
        transition: transform 0.3s;
      }

      .reply-panel.visible {
        transform: translateY(0);
      }
    }

    @media (max-width: 640px) {
      .platform-stats {
        flex-wrap: wrap;
      }

      .platform-stat {
        flex: 1 1 45%;
      }
    }
  </style>
</head>
<body>
  <div class="engagement-container">
    <header class="page-header">
      <h1 class="page-title">
        <i class="fas fa-comments"></i> Engagement Hub
      </h1>
      <button class="sync-btn" onclick="syncAllComments()">
        <i class="fas fa-sync-alt"></i> Sync Comments
      </button>
    </header>

    <!-- Platform Stats -->
    <div class="platform-stats">
      <div class="platform-stat facebook active" onclick="filterByPlatform('all')">
        <i class="fab fa-facebook"></i>
        <div class="platform-info">
          <h3>Facebook</h3>
          <span class="platform-count" id="fb-count">0</span>
          <span class="unread-badge" id="fb-unread" style="display:none;">0</span>
        </div>
      </div>
      <div class="platform-stat instagram" onclick="filterByPlatform('instagram')">
        <i class="fab fa-instagram"></i>
        <div class="platform-info">
          <h3>Instagram</h3>
          <span class="platform-count" id="ig-count">0</span>
          <span class="unread-badge" id="ig-unread" style="display:none;">0</span>
        </div>
      </div>
      <div class="platform-stat twitter" onclick="filterByPlatform('twitter')">
        <i class="fab fa-twitter"></i>
        <div class="platform-info">
          <h3>Twitter/X</h3>
          <span class="platform-count" id="tw-count">0</span>
          <span class="unread-badge" id="tw-unread" style="display:none;">0</span>
        </div>
      </div>
      <div class="platform-stat linkedin" onclick="filterByPlatform('linkedin')">
        <i class="fab fa-linkedin"></i>
        <div class="platform-info">
          <h3>LinkedIn</h3>
          <span class="platform-count" id="li-count">0</span>
          <span class="unread-badge" id="li-unread" style="display:none;">0</span>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <button class="filter-btn active" data-filter="all">All</button>
      <button class="filter-btn" data-filter="unread">Unread</button>
      <button class="filter-btn" data-filter="questions">Questions</button>
      <button class="filter-btn" data-filter="replied">Replied</button>
      <button class="filter-btn" data-filter="flagged">Flagged</button>
    </div>

    <!-- Main Content -->
    <div class="comments-container">
      <div class="comments-list" id="comments-list">
        <!-- Comments populated by JavaScript -->
        <div class="empty-state" id="empty-state">
          <i class="fas fa-inbox"></i>
          <p>No comments yet. Click "Sync Comments" to fetch latest.</p>
        </div>
      </div>

      <div class="reply-panel" id="reply-panel">
        <div class="reply-panel-header">
          <h3>Reply to Comment</h3>
          <button class="btn-action" onclick="closeReplyPanel()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="selected-comment" id="selected-comment">
          <p class="full-text">Select a comment to reply...</p>
        </div>

        <div class="quick-replies">
          <button class="quick-reply" onclick="insertQuickReply('Thanks for watching!')">Thanks!</button>
          <button class="quick-reply" onclick="insertQuickReply('Great question! ')">Great question!</button>
          <button class="quick-reply" onclick="insertQuickReply('Check out the link in bio for more resources.')">Link in bio</button>
          <button class="quick-reply" onclick="insertQuickReply('I cover this in detail in another video - ')">See other video</button>
        </div>

        <textarea
          class="reply-textarea"
          id="reply-text"
          placeholder="Write your reply..."
        ></textarea>

        <div class="reply-actions">
          <button class="btn-action" onclick="markAsRead()" title="Mark as Read">
            <i class="fas fa-check"></i>
          </button>
          <button class="btn-action" onclick="flagComment()" title="Flag for Later">
            <i class="fas fa-flag"></i>
          </button>
          <button class="btn-action" onclick="hideComment()" title="Hide Comment">
            <i class="fas fa-eye-slash"></i>
          </button>
          <button class="btn-reply" id="send-reply-btn" onclick="sendReply()" disabled>
            <i class="fas fa-paper-plane"></i> Send Reply
          </button>
        </div>
      </div>
    </div>
  </div>

  <script>
    // State
    let comments = [];
    let selectedComment = null;
    let currentFilter = 'all';
    let currentPlatform = 'all';

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
      loadComments();
      setupFilterButtons();
    });

    async function loadComments() {
      try {
        const response = await fetch('/.netlify/functions/get-comments');
        const data = await response.json();
        comments = data.comments || [];
        updateCounts(data.counts);
        renderComments();
      } catch (error) {
        console.error('Failed to load comments:', error);
      }
    }

    async function syncAllComments() {
      const btn = document.querySelector('.sync-btn');
      btn.classList.add('syncing');
      btn.disabled = true;

      try {
        // Sync each platform
        await Promise.all([
          fetch('/.netlify/functions/fetch-fb-comments', { method: 'POST' }),
          fetch('/.netlify/functions/fetch-ig-comments', { method: 'POST' }),
          // Twitter and LinkedIn only if configured
        ]);

        await loadComments();
        showNotification('Comments synced successfully!');
      } catch (error) {
        showNotification('Sync failed: ' + error.message, 'error');
      } finally {
        btn.classList.remove('syncing');
        btn.disabled = false;
      }
    }

    function updateCounts(counts) {
      document.getElementById('fb-count').textContent = counts?.facebook?.total || 0;
      document.getElementById('ig-count').textContent = counts?.instagram?.total || 0;
      document.getElementById('tw-count').textContent = counts?.twitter?.total || 0;
      document.getElementById('li-count').textContent = counts?.linkedin?.total || 0;

      // Unread badges
      updateUnreadBadge('fb', counts?.facebook?.unread);
      updateUnreadBadge('ig', counts?.instagram?.unread);
      updateUnreadBadge('tw', counts?.twitter?.unread);
      updateUnreadBadge('li', counts?.linkedin?.unread);
    }

    function updateUnreadBadge(prefix, count) {
      const badge = document.getElementById(`${prefix}-unread`);
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline';
      } else {
        badge.style.display = 'none';
      }
    }

    function renderComments() {
      const list = document.getElementById('comments-list');
      const empty = document.getElementById('empty-state');

      // Filter comments
      let filtered = comments.filter(c => {
        if (currentPlatform !== 'all' && c.platform !== currentPlatform) return false;
        if (currentFilter === 'unread' && c.status !== 'unread') return false;
        if (currentFilter === 'questions' && !c.isQuestion) return false;
        if (currentFilter === 'replied' && c.status !== 'replied') return false;
        if (currentFilter === 'flagged' && c.status !== 'flagged') return false;
        return true;
      });

      if (filtered.length === 0) {
        empty.style.display = 'block';
        list.innerHTML = '';
        list.appendChild(empty);
        return;
      }

      empty.style.display = 'none';
      list.innerHTML = filtered.map(c => `
        <div class="comment-item ${c.status === 'unread' ? 'unread' : ''} ${selectedComment?._id === c._id ? 'selected' : ''}"
             onclick="selectComment('${c._id}')">
          <div class="comment-header">
            <div class="comment-avatar">
              ${c.authorAvatarUrl
                ? `<img src="${c.authorAvatarUrl}" alt="${c.authorName}">`
                : c.authorName.charAt(0).toUpperCase()}
            </div>
            <div class="comment-meta">
              <div class="comment-author">
                ${c.authorName}
                <span class="platform-badge ${c.platform}">${c.platform}</span>
              </div>
              <div class="comment-time">${formatTime(c.createdAt)}</div>
            </div>
          </div>
          <p class="comment-text">${escapeHtml(c.text)}</p>
          <div class="comment-indicators">
            ${c.isQuestion ? '<span class="indicator question">Question</span>' : ''}
            ${c.status === 'replied' ? '<span class="indicator replied">Replied</span>' : ''}
            ${c.likeCount > 0 ? `<span class="indicator">❤️ ${c.likeCount}</span>` : ''}
          </div>
        </div>
      `).join('');
    }

    function selectComment(id) {
      selectedComment = comments.find(c => c._id === id);
      renderComments();

      // Update reply panel
      document.getElementById('selected-comment').innerHTML = `
        <div class="comment-header">
          <strong>${selectedComment.authorName}</strong>
          <span class="platform-badge ${selectedComment.platform}">${selectedComment.platform}</span>
        </div>
        <p class="full-text">${escapeHtml(selectedComment.text)}</p>
      `;

      document.getElementById('send-reply-btn').disabled = false;
      document.getElementById('reply-text').focus();

      // Mark as read
      if (selectedComment.status === 'unread') {
        markAsRead();
      }
    }

    async function sendReply() {
      if (!selectedComment) return;

      const replyText = document.getElementById('reply-text').value.trim();
      if (!replyText) {
        showNotification('Please enter a reply', 'error');
        return;
      }

      const btn = document.getElementById('send-reply-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

      try {
        const response = await fetch('/.netlify/functions/reply-to-comment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            commentId: selectedComment._id,
            platform: selectedComment.platform,
            platformCommentId: selectedComment.platformCommentId,
            replyText
          })
        });

        const result = await response.json();

        if (response.ok) {
          showNotification('Reply sent!');
          document.getElementById('reply-text').value = '';
          selectedComment.status = 'replied';
          renderComments();
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        showNotification('Failed to send: ' + error.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Reply';
      }
    }

    function insertQuickReply(text) {
      const textarea = document.getElementById('reply-text');
      textarea.value += text;
      textarea.focus();
    }

    async function markAsRead() {
      if (!selectedComment) return;
      // Update via API
      selectedComment.status = 'read';
      renderComments();
    }

    async function flagComment() {
      if (!selectedComment) return;
      selectedComment.status = 'flagged';
      renderComments();
      showNotification('Comment flagged');
    }

    async function hideComment() {
      if (!selectedComment) return;
      selectedComment.status = 'hidden';
      renderComments();
      showNotification('Comment hidden');
    }

    function filterByPlatform(platform) {
      currentPlatform = platform;
      document.querySelectorAll('.platform-stat').forEach(el => {
        el.classList.toggle('active',
          platform === 'all' || el.classList.contains(platform));
      });
      renderComments();
    }

    function setupFilterButtons() {
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          currentFilter = btn.dataset.filter;
          renderComments();
        });
      });
    }

    function formatTime(timestamp) {
      const diff = Date.now() - timestamp;
      const minutes = Math.floor(diff / 60000);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function showNotification(message, type = 'success') {
      // Simple notification - could be enhanced
      alert(message);
    }

    function closeReplyPanel() {
      selectedComment = null;
      renderComments();
      document.getElementById('reply-text').value = '';
    }
  </script>
</body>
</html>
```

#### 20A.11.7 Setup Requirements for Comment Management

**Environment Variables Needed:**

```bash
# Facebook Page (for Facebook & Instagram comments)
FB_PAGE_ID=your-page-id
FB_PAGE_ACCESS_TOKEN=your-page-access-token
IG_BUSINESS_ACCOUNT_ID=your-instagram-business-id

# Twitter (requires Basic tier - $100/month)
TWITTER_ACCESS_TOKEN=your-twitter-bearer-token
TWITTER_BASIC_TIER=true  # Flag to enable read features

# LinkedIn (requires Community Management API approval)
LINKEDIN_ACCESS_TOKEN=your-linkedin-token
LINKEDIN_ORGANIZATION_URN=urn:li:organization:12345

# Convex
CONVEX_URL=your-convex-deployment-url
```

**Meta Business Verification Process:**

1. **Create Meta Business Account** at business.facebook.com
2. **Add Facebook Page** to your business account
3. **Connect Instagram** Business account to Facebook Page
4. **Create Meta App** at developers.facebook.com
5. **Request Permissions:**
   - `pages_read_engagement` (read comments)
   - `pages_manage_engagement` (reply to comments)
   - `instagram_basic`
   - `instagram_manage_comments`
6. **Complete App Review** (required for production access)
7. **Generate Page Access Token** with required permissions

**LinkedIn Community Management API:**

1. **Apply for access** at developer.linkedin.com/product-catalog/marketing/community-management-api
2. **Requirements:**
   - Incorporated business
   - Existing use case
   - Privacy policy
3. **If approved:**
   - Complete integration
   - Submit screencast video for Standard tier

#### 20A.11.8 Cost Summary for Comment Management

| Feature | Free Option | Paid Option |
|---------|-------------|-------------|
| **Facebook Comments** | ✅ Free (Meta verification required) | - |
| **Instagram Comments** | ✅ Free (Meta verification required) | - |
| **Twitter Comments** | ❌ Not available | $100/month (Basic tier) |
| **LinkedIn Comments** | ❌ Unless Partner approved | Partner program |
| **Unified API** | ❌ Not available | Ayrshare $49+/month |

**Recommended Approach:**
1. Start with Facebook + Instagram (free)
2. Monitor Twitter mentions manually (free via notifications)
3. Upgrade to Twitter Basic if engagement volume justifies cost
4. Apply for LinkedIn Partner Program (no cost to apply)

#### 20A.11.9 Limitations & Workarounds

**Twitter Without Basic Tier:**
- Cannot read replies programmatically
- **Workaround:** Display "View on Twitter" link that opens the tweet
- Enable Twitter notifications for mentions
- Consider using Twitter's mobile app for engagement

**LinkedIn Without Partner Access:**
- Cannot read or reply to comments via API
- **Workaround:** Display "View on LinkedIn" link
- Use LinkedIn's notification system
- Check comments manually via LinkedIn app

**Rate Limits:**
| Platform | Read Limit | Reply Limit |
|----------|------------|-------------|
| Facebook | 200 calls/hour | 200 calls/hour |
| Instagram | 200 calls/hour | 60 comments/hour |
| Twitter (Basic) | 10,000 reads/month | 1,500 posts/month |
| LinkedIn | Varies by endpoint | 100 calls/day |

**Caching Strategy:**
- Cache comments in Convex for 5 minutes
- Only fetch new comments on sync
- Store last sync timestamp per platform
- Display cached data immediately, update in background

### 20A.12 Future Enhancements

**Phase 5.1 - Advanced Features (Future)**
- Post analytics dashboard (views, likes, shares)
- Optimal posting time suggestions
- A/B testing for post variations
- Auto-hashtag suggestions based on content
- Sentiment analysis for comments
- AI-suggested replies based on comment content

**Phase 5.2 - Additional Platforms (Future)**
- TikTok integration (via Late)
- Pinterest integration (via Late)
- YouTube Community posts
- YouTube comment management
- Threads integration

**Phase 5.3 - Advanced Engagement (Future)**
- Automated acknowledgment replies
- Smart reply suggestions using AI
- Comment moderation rules (auto-hide spam)
- Engagement analytics and reporting
- Team collaboration (assign comments)

---

## 21. Quick Start Implementation Guide

### 21.1 Files to Create (Phase 1)

```
netlify/functions/
├── generate-script.js      # AI script generation
└── fetch-url-content.js    # URL content extraction

src/admin/cms/
├── config.yml              # Add youtube_content collection
└── index.html              # Add YouTube Content UI section

src/youtube-content/
├── youtube-content.json    # Collection settings (permalink: false initially)
└── .gitkeep

src/_data/
└── ctaOptions.json         # Behavior School CTA options
```

### 21.2 Environment Variables Needed

```
GEMINI_API_KEY=your-gemini-key
REPLICATE_API_KEY=your-replicate-key (Phase 3)
```

### 21.3 First Function to Build

```javascript
// netlify/functions/generate-script.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
  const { idea, sourceContent, videoType, targetLength, primaryCta } =
    JSON.parse(event.body);

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `[System prompt from Section 7.1]

  Video Type: ${videoType}
  Target Length: ${targetLength}
  Topic: ${idea}
  Source Material: ${sourceContent}
  CTA: Link to ${primaryCta}

  Generate a complete YouTube script following the structure provided.`;

  const result = await model.generateContent(prompt);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ script: result.response.text() })
  };
};
```

---

## 22. Summary of Features

### Core Features
- **Script Generator:** AI-powered YouTube scripts with hooks, retention elements, timestamps
- **Blog Generator:** Auto-convert scripts to SEO-optimized blog posts
- **Social Generator:** Platform-specific content for Twitter, LinkedIn, Facebook, Instagram
- **Thumbnail Generator:** AI backgrounds + Rob's face + text compositing

### Workflow Features
- **Content Pipeline:** Kanban view of idea → script → recorded → published
- **Content Calendar:** Visual planning and scheduling
- **Version History:** Track changes, restore previous versions

### Content Repurposing
- **YouTube Shorts:** Auto-generate 3-5 short scripts per video
- **Newsletter Content:** Email-ready summaries
- **Chapter Markers:** Auto-generated YouTube chapters

### Technical Features
- **Serverless Architecture:** Netlify Functions for all AI operations
- **Offline Support:** Draft saving, queued operations
- **Cost Tracking:** Per-video and monthly cost monitoring

### UX Features
- **Keyboard Shortcuts:** Power user navigation
- **Quick Actions Menu:** Cmd+K command palette
- **Mobile Support:** Idea capture and content review
- **Onboarding Tour:** First-time user guidance
- **Contextual Help:** Tooltips and help panel

---

*End of PRD v2.0 - Ralphy Loop Complete*

**Next Step:** Review this PRD with Rob, answer remaining open questions (Section 13), then begin Phase 1 implementation.
