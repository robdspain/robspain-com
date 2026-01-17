# Product Requirements Document (PRD): Ghost to Netlify + Decap CMS Migration

## 1. Executive Summary
**Objective:** Migrate the existing blog from a hosted Ghost instance to a self-hosted, static architecture on Netlify using Decap CMS.
**Goal:** Achieve feature parity with Ghost's editing and publishing workflows while maintaining the "Zen," high-performance, and cost-effective nature of a static site.
**Target Audience:** The site owner (Rob Spain) who needs an easy-to-use admin dashboard for writing posts without touching code.

## 2. Technical Architecture

To replicate Ghost's functionality (dynamic lists of posts, pagination, tagging) on a static site, we cannot use raw HTML files alone. We must introduce a lightweight **Static Site Generator (SSG)**.

*   **SSG:** **Eleventy (11ty)**.
    *   *Why:* It is highly performant, allows us to keep the existing HTML structure almost exactly as is, and builds super fast. It handles the logic of "taking a folder of text files and turning them into a blog list."
*   **CMS:** **Decap CMS** (formerly Netlify CMS).
    *   *Why:* Open-source, Git-based, adds a `/admin` dashboard that looks and feels like a professional blogging platform.
*   **Hosting:** **Netlify**.
*   **Database:** **Git** (Content lives in the repo as Markdown files, not in a hidden database).

## 3. Ghost Feature Parity Analysis

We will implement the following features to match Ghost's core capabilities:

### 3.1 Content Editing (The "Write" Experience)
| Ghost Feature | New System Implementation | Status |
| :--- | :--- | :--- |
| **Admin Dashboard** | Decap CMS accessible at `robspain.com/admin` | ✅ To Build |
| **Rich Text Editor** | Decap CMS Rich Text widget (Bold, Italic, Headers, Links) | ✅ To Build |
| **Image Uploads** | Drag-and-drop media library (stored in `/public/images/uploads`) | ✅ To Build |
| **Post Metadata** | Fields for Title, Publish Date, Featured Image, Excerpt | ✅ To Build |
| **Slugs/URLs** | Custom URL field (e.g., `/blog/my-post-title`) | ✅ To Build |
| **Drafts/Scheduled** | "Draft" vs "Published" toggle. (Scheduling requires Netlify Identity + Build Hooks) | ⚠️ Drafts: Yes / Scheduling: Complex |

### 3.2 Organization & Taxonomy
| Ghost Feature | New System Implementation | Status |
| :--- | :--- | :--- |
| **Tags** | Multi-select "Tags" field in editor. 11ty generates `/tag/[tagname]` pages. | ✅ To Build |
| **Authors** | Author field (defaulting to Rob Spain). | ✅ To Build |
| **Featured Posts** | "Featured" boolean toggle to pin posts to the top. | ✅ To Build |

### 3.3 SEO & Social
| Ghost Feature | New System Implementation | Status |
| :--- | :--- | :--- |
| **Meta Title/Desc** | Explicit SEO fields in Decap CMS. | ✅ To Build |
| **Open Graph (Social)** | Auto-generated meta tags using the Featured Image. | ✅ To Build |
| **Sitemap.xml** | 11ty plugin to auto-generate sitemap on build. | ✅ To Build |
| **RSS Feed** | 11ty plugin to generate `feed.xml`. | ✅ To Build |

### 3.4 Memberships & Email (The Gap)
*Ghost allows native paid subscriptions and newsletters. Static sites do not do this natively.*
*   **Current State:** Project uses Mailgun dependency.
*   **Proposed Solution:**
    *   **Newsletters:** Continue using external providers (ConvertKit, MailerLite, or existing Mailgun setup) embedded via forms.
    *   **Gated Content:** Netlify Identity can gate content, but for this MVP, we will focus on **public content migration**.

## 4. Implementation Plan

### Phase 1: Foundation (The Engine)
1.  **Install 11ty:** Set up the build engine to process the site.
2.  **Convert HTML to Templates:** Move `index.html`, `blog.html`, etc., into 11ty layouts (`.njk` or `.html`).
3.  **Configure Admin:** Create `admin/index.html` and `admin/config.yml` to define the content model.

### Phase 2: Content Migration
1.  **Content Modelling:** Define the "Blog Post" schema (Title, Body, Date, Image, Tags).
2.  **Import:** Convert Ghost JSON export (provided by user) into individual Markdown (`.md`) files in `src/posts/`.

### Phase 3: Frontend Integration
1.  **Blog Index:** Wire up `blog.html` to loop through the Markdown files and display them.
2.  **Post Layout:** Create a `post.html` template for individual articles.
3.  **Pagination:** Ensure the blog list handles multiple pages if there are many posts.

## 5. User Workflow (How you will use it)
1.  Go to `robspain.com/admin`.
2.  Login with Netlify Identity.
3.  Click **"New Blog Post"**.
4.  Write content, upload a cover image.
5.  Set status to **"Published"**.
6.  Click **"Save"**.
7.  *Behind the scenes:* Netlify detects the change, rebuilds the site, and publishes it live in ~30 seconds.

## 6. Requirements from User
*   [ ] **Upload Ghost Export:** User needs to provide the `.json` file.
*   [ ] **Approve 11ty:** Confirm willingness to move from "raw HTML" to "11ty SSG" (It keeps the same files, just adds a build command).

---
**Prepared by:** Gemini CLI
**Date:** January 17, 2026
