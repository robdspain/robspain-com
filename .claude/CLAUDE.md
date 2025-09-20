# Claude Code Instructions for RobSpain.com

You are editing robspain.com. Apply the "Behavior School Linking Policy":

## GOALS
- Strengthen E-E-A-T by showing Rob as founder of Behavior School.
- Pass authority via limited, contextual, dofollow links to behaviorschool.com.
- Never spam. Prioritize user value and topical relevance.

## LINKING RULES
- Max 3 links per page. Prefer 1–2.
- First relevant mention only per section.
- Vary anchor text; avoid exact-match repetition.
- Prefer deep links over homepage when topical:
  / (home), /about, /resources, /study, /supervision-tools, /iep-goals, /behavior-plans
- Natural, descriptive anchors (no "click here").

## WHERE TO LINK
- Home hero/intros: "founder of Behavior School"
- About/Projects: short venture card for Behavior School
- Blog posts: 1 contextual deep link if post touches BCBA prep, PBIS, supervision, behavior plans, IOA, FA/FBA, ACT, data collection
- Contact/Footer: one subtle link to Behavior School resources

## SCHEMA
- Add Person schema (Rob) with founder → Organization (Behavior School).
- Use sameAs to reference behaviorschool.com and study.behaviorschool.com.

## QUALITY GUARDS
- Don't add links to unrelated topics.
- Don't repeat the same anchor text twice on a page.
- Keep pages readable; no keyword stuffing.

## CONFIGURATION FILE
Detailed linking rules, anchor text variations, and deep link routing are available in:
`/Users/robspain/robspain.com/.claude/behavior-school-linking-config.json`

This JSON file contains:
- Topic-specific anchor text patterns
- Deep link routing rules
- Page-specific configurations
- Schema markup specifications

Reference this file when implementing links to ensure consistency and variety in anchor text selection.

---

## AI Linking Strategy for Behavior School

### Homepage/About Page Linking
Whenever you mention Behavior School, link the phrase "Behavior School" to https://behaviorschool.com. On the About page, add a section called "Projects" with a short description and link to Behavior School.

**Example:**
```html
Rob founded <a href="https://behaviorschool.com">Behavior School</a> in 2020 to support school-based BCBAs.
```

### Blog Post Linking Rules
If a blog post mentions BCBA exam prep, supervision, or PBIS, insert 1 contextual link to the most relevant Behavior School page. Use descriptive anchor text like "BCBA practice exams at Behavior School" or "PBIS tools from Behavior School." **Limit to 2 links per post maximum.**

**Deep Linking Strategy:**
- BCBA exam prep mentions → https://behaviorschool.com/study
- Supervision topics → https://behaviorschool.com/supervision-tools
- PBIS discussions → https://behaviorschool.com/resources
- General behavior analysis → https://behaviorschool.com/resources

**Example anchor texts:**
- "BCBA practice exams at Behavior School"
- "supervision tracking tools from Behavior School"
- "PBIS implementation resources at Behavior School"
- "behavior intervention templates from Behavior School"

### Footer/Contact Page
Add a line in the footer: "For school-based BCBA resources, visit Behavior School."

**Example:**
```html
<p>For school-based BCBA resources, visit <a href="https://behaviorschool.com">Behavior School</a>.</p>
```

### Link Quality Guidelines
- **Rule of 3**: Maximum 2-3 contextual links per page to avoid spam
- **Natural anchors**: Use descriptive phrases, never "click here" or "Behavior School" alone
- **Deep linking**: Link to specific relevant pages, not just the homepage
- **Topical relevance**: Only add links where they naturally fit the content context

### Advanced Linking Rules
- **Do not add links more than 3 times per page** - strict maximum enforcement
- **Do not link every instance of "Behavior School"** - only first mention per section
- **Always vary anchor text slightly** - prevents keyword stuffing and over-optimization
- **Always ensure links are dofollow (default)** - unless on paid/sponsored content

**Anchor Text Variation Examples:**
- First mention: "Behavior School platform"
- Second mention: "school-based behavior analysis resources"
- Third mention: "BCBA training tools"

**Section-Based Linking:**
- Hero section: First "Behavior School" mention gets linked
- About section: First "Behavior School" mention gets linked
- Services section: First relevant mention gets linked
- Subsequent mentions in same section: No links

### Schema Markup
Maintain the existing founder relationship in schema markup:
```json
"founder": {
    "@type": "Person",
    "name": "Rob Spain",
    "url": "https://robspain.com",
    "jobTitle": "Board Certified Behavior Analyst"
}
```