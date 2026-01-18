# PRD: High-Conversion "Systems Leader" Video Funnel

**Version:** 1.0  
**Status:** Draft / Ready for Production  
**Owner:** Rob Spain  
**Goal:** Convert "Overwhelmed Crisis Managers" into "Systematic Leaders" using the Kyle Roof High-Frequency Authority Method.

---

## 1. Product Overview
A 10-part series of high-fidelity, bite-sized videos (1-3 minutes each) embedded in a "Bento Box" dashboard on the homepage. This replaces the single 60-minute Masterclass with a low-friction, high-engagement sequence that builds trust through multiple micro-interactions.

### Key Objectives
*   **Authority Positioning:** Establish Rob as a university-validated systems expert.
*   **Binge-ability:** Use progress tracking to encourage watching the entire series.
*   **Lead Generation:** Gate the "Small Win" resources (Video 4) behind an email opt-in.
*   **Pre-selling:** Answer every major objection before the user reaches the "Book a Call" or "Join Program" stage.

---

## 2. UI/UX Requirements (The Dashboard)
The "Bento Box" UI should replace the current commented-out Masterclass section.

*   **Progress Tracking:** A visual bar showing `% Complete`.
*   **Video Grid:** 10 thumbnails. Initial state: Videos 1-3 are "Unlocked." Videos 4-10 are "Locked" (Greyed out) until Video 3 is watched or email is provided.
*   **Resource Drawer:** Under Video 4, a button to "Download the 10-Minute Staff Script."
*   **Interactive State:** When a video ends, the next thumbnail highlights, and the screen scrolls slightly to focus on it.

---

## 3. The 10-Part Video Chain: Scripts

### Video 1: The Reactivity Trap (The Pattern Interrupt)
**Job:** Stop the scroll. Empathize with the pain.
*   **Hook:** "If you’re a School BCBA and you feel like your entire day is just running from one fire to the next, I have something important to tell you: It’s not your fault, but it *is* your problem."
*   **Value:** "Most of us were trained to be clinical experts, not systems leaders. We’re taught to fix one student at a time. But in a school with 600 kids, that math never works."
*   **CTA:** "In the next 60 seconds, I’m going to show you why your clinical expertise is actually what’s keeping you stuck in the reactivity trap. Click the next video."

### Video 2: The Myth of Individual Support (The Enemy)
**Job:** Identify the common mistake everyone is making.
*   **Hook:** "We’ve been told that if we just write better FBAs and more detailed IEP goals, the behavior will stop. That is a myth."
*   **Value:** "Individual support is Tier 3. But if your Tier 1 and Tier 2 systems are broken, Tier 3 will always be overwhelmed. You can’t 'clinical' your way out of a 'system' problem."
*   **CTA:** "Watch the next video to see the scientific data that changed how I approach school behavior entirely."

### Video 3: University-Validated Shifts (The Authority)
**Job:** Use the "Professor" status to build massive trust.
*   **Hook:** "As a University Faculty member teaching Graduate ABA, I started looking at the data differently."
*   **Value:** "I realized that the most successful schools don't have the best BCBAs; they have the best *systems*. We moved from clinical interventions to systematic leadership, and the referrals dropped by 40% in one semester."
*   **CTA:** "I want to give you a piece of this system right now. In the next video, I'm giving you the exact 10-minute script I use to stop staff resistance."

### Video 4: The 10-Minute Staff Hack (The Reciprocity - OPT-IN GATED)
**Job:** Give a small win. Capture the email.
*   **Hook:** "The biggest hurdle we face isn't the kids—it's the staff. If they don't buy in, the plan fails."
*   **Value:** "This is my 'De-escalation Reset Script.' It’s 4 lines. It takes 10 minutes to teach. And it shifts the power back to the teacher so you don't get the call."
*   **CTA:** "Pop your email below to unlock this script and the rest of the 5-Pillar System videos."

### Video 5: The 5-Pillar System (The Map)
**Job:** Show that you have a proprietary, repeatable process.
*   **Hook:** "Here is the map. I call it the Behavior School Framework."
*   **Value:** "1. Audit the current chaos. 2. Design the Tier 1 safety net. 3. Train the staff (without boring them). 4. Implement with micro-coaching. 5. Data-driven refinement. This is how you stop being a fire-fighter."
*   **CTA:** "Now, how do you actually find the time to do all 5? Watch the next video."

### Video 6: Automation for BCBAs (The Mechanism)
**Job:** Show the "Behavior School" tools.
*   **Hook:** "You didn't get your M.Ed. to spend 4 hours a day on paperwork. Neither did I."
*   **Value:** "I built Behavior School tools to automate the busy work. IEP generators, supervision trackers—these aren't just apps; they are time-multipliers that let you focus on the systems that matter."
*   **CTA:** "Think you don't have time to build these systems? Let's talk about the 'No Time' Fallacy in the next clip."

### Video 7: The 'No Time' Fallacy (The Objection)
**Job:** Handle the "I'm too busy" objection.
*   **Hook:** "The most common thing I hear is: 'Rob, I love this, but I don't have time to build systems.'"
*   **Value:** "The truth is, you don't have time *not* to. Every hour you spend on a system today saves you 10 hours of crisis management next month. You’re not too busy; you’re just trapped in a loop."
*   **CTA:** "Let me show you a real-world example of what happens when you break that loop."

### Video 8: From Chaos to Confidence (The Proof)
**Job:** Case study / Social proof.
*   **Hook:** "Meet Sarah. She was a BCBA in a high-needs district, ready to quit in November."
*   **Value:** "We implemented the 5-Pillar System. By February, her 'fire-fighting' calls dropped from 15 a day to 2. She finally felt like the expert she was trained to be."
*   **CTA:** "You can have this same transformation. Here is how we do it together."

### Video 9: The 8-Week Transformation (The Offer)
**Job:** Full walkthrough of the paid program.
*   **Hook:** "I created the 8-Week Transformation Program to take you from overwhelmed to a Systems Leader, step-by-step."
*   **Value:** "You get the complete framework, weekly group coaching with me, and lifetime access to every tool I’ve built. It’s the clinical and systematic support I wish I had 20 years ago."
*   **CTA:** "One final question: Who do you want to be next semester?"

### Video 10: The Systems Leader vs. The Crisis Manager (The Final Push)
**Job:** Create a choice. High-level mindset shift.
*   **Hook:** "You have a choice. You can keep running toward the fires, or you can start building the safety net."
*   **Value:** "Schools run better when BCBAs lead. You have the skills. You just need the system. I’m here to give it to you."
*   **CTA:** "Click the button below to join the program or book a strategy audit. Let’s transform your school together."

---

## 4. Technical Implementation Notes
*   **Hosting:** Wistia or Vimeo (better for "Continue watching" features).
*   **Analytics:** Track "Drop-off rate" per video to refine scripts later.
*   **Mobile:** Ensure the Bento grid stacks vertically with large, easy-to-tap play buttons.
