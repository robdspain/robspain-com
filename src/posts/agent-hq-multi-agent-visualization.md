---
layout: post.njk
title: "Agent HQ: Why I Built a Pixel-Art Dashboard for 22 AI Agents"
date: 2026-02-13
image: null
description: A real-time visualization system for managing multi-agent workflows across websites, school projects, and research - because dashboards shouldn't be boring.
tags:
  - ai
  - agents
  - automation
  - engineering
draft: true
---
*AI-assisted draft; reviewed and edited by Rob Spain, BCBA, IBA.*

If you visit [robspain.com/admin/agents/](https://robspain.com/admin/agents/), you'll find something unusual: a pixel-art office where 22 AI agents move between departments, gather at a coffee bar, and occasionally handoff tasks in a conference room.

This isn't a demo. It's my actual production system for managing multiple websites, school behavior projects, research synthesis, and content pipelines.

And yes, there's a coffee bar with animated steam effects. Because why not?

## The Problem: Agents Work Great Until They Don't

I run three main sites (robspain.com, behaviorschool.com, and KCUSD's behavior team site), manage ongoing research projects, and coordinate content across platforms. I've been using AI agents for months to handle everything from blog writing to repository maintenance to citation verification.

Here's what I learned: **agents are incredibly powerful and completely opaque**.

You send off a task, get a response, and have no idea:
- Which agent actually handled it
- Whether it got stuck waiting on something
- If multiple agents are stepping on each other
- What needs human attention versus what's running fine

I tried various agent frameworks. They're either too abstract (just API calls with no visibility) or too enterprise (designed for compliance teams, not solo operators running real projects).

So I built my own.

## The Solution: Visualize the Invisible

Agent HQ is a real-time dashboard built directly into robspain.com. Here's what you see:

**Four departments organized spatially:**
- **Leadership**: Neo (primary agent) + the Council (strategic oversight)
- **Content & Marketing**: Writer, SEO optimizer, Scout (research), Browser automation
- **Operations**: Analyst, Planner, Docs manager, BAE SIG coordinator, KCUSD project lead
- **Engineering**: 10 repository-specific agents (robspain-com, behaviorschool-com, study tools, etc.)

Each agent is a pixel-art character that moves around the office based on their actual status.

**Interactive features:**
- Click any agent to send direct instructions
- Agents animate between departments when tasks shift
- Idle agents gather at the coffee bar (yes, with steam effects)
- Active handoffs happen in the conference room
- Right sidebar shows blockers that need human attention

**Real-time data:**
The visualization pulls from `agent-activity.json` which tracks:
- Current agent status (idle, working, waiting, blocked)
- Active tasks and handoffs
- Blockers requiring human intervention
- Cross-department coordination

## Why Visualization Matters for Multi-Agent Systems

I'm a behavior analyst. I think in systems. And here's the thing about systems: **if you can't see them, you can't manage them**.

Traditional agent frameworks treat agents like background processes. You fire off a request, cross your fingers, and hope for the best. That works fine for simple tasks, but falls apart when you're coordinating 22 specialized agents across multiple projects.

Visualization changes everything:

**1. Pattern Recognition**
When I see the Writer agent constantly bouncing to the Browser agent, I know something's wrong with my research workflow. When Engineering agents cluster in the conference room, there's probably a cross-repository dependency I need to address.

**2. Bottleneck Identification**
The coffee bar isn't just cute (though it is). When half my Content team is idle while the SEO agent is slammed, I know I need to rethink task distribution.

**3. Human-Agent Handoffs**
The blocker panel shows exactly where agents hit walls. Not vague error logs - actionable items like "Citation needs DOI verification" or "Blog post ready for human review."

**4. Trust Through Transparency**
When I can see Neo coordinating with the Council, then delegating to Content while Engineering stays focused on their repos, I trust the system. When it was all invisible, every task felt like a gamble.

## The Tech Stack: Vanilla JS and Real-Time Canvas

I built this with intentionally simple tools:

**Frontend:**
- Vanilla JavaScript (no frameworks)
- HTML5 Canvas for rendering
- CSS for UI panels
- WebSocket connection for real-time updates

**Backend:**
- 11ty (static site generator)
- Netlify hosting
- Agent activity tracked in JSON
- OpenClaw for agent coordination

**Why no framework?** Two reasons:
1. Canvas rendering doesn't benefit from React/Vue overhead
2. I wanted full control over animation timing and state management

The entire visualization is about 800 lines of JavaScript. It loads fast, runs smooth, and does exactly what I need without a massive dependency tree.

## What I Learned Building This

**Agents need spatial organization**
Grouping agents by department isn't just visual polish. It mirrors how they actually work. Content agents collaborate differently than Engineering agents. Making that visible makes the system easier to reason about.

**Status beats logging**
I tried comprehensive logging first. Drowning in text files. The coffee bar tells me more at a glance than 100 lines of logs.

**Animation reveals workflow**
Watching an agent move from their desk to the conference room to another department shows handoff patterns you'd never notice in API calls.

**Blockers need prominence**
The right sidebar could show lots of metrics. Instead, it shows exactly one thing: what needs human attention. That's the only metric that actually matters.

## This Is Production, Not a Demo

Every agent in Agent HQ is real. They're the same agents that:
- Write and edit blog posts (like this one)
- Verify citations in research articles
- Deploy sites to Netlify
- Monitor KCUSD behavior data
- Coordinate cross-site content pipelines
- Manage 10+ GitHub repositories

The visualization isn't separate from the work. It's a window into the actual system running my entire digital operation.

When Neo delegates a blog post to Writer, you see it happen. When the KCUSD agent hits a blocker about student data privacy, it shows up immediately. When Engineering agents coordinate a cross-repo deployment, they literally meet in the conference room.

## What's Next

Agent HQ is in constant evolution. Current experiments:

- **Agent memory visualization**: Show what each agent remembers from past interactions
- **Task queue visibility**: See the backlog for each department
- **Performance metrics**: Track task completion time and handoff efficiency
- **Multi-user modes**: Let team members interact with specific agents

But the core principle stays the same: **make the invisible visible**.

## Why This Matters Beyond My Setup

I'm a solo operator with specific needs. But the underlying problem is universal: **as we add more AI agents to our workflows, we lose visibility into what's actually happening**.

You can't manage what you can't see. You can't optimize what you don't understand. And you can't trust what's completely opaque.

Agent HQ is my answer to that problem. Yours might look different. But if you're running multiple agents, you need some way to see the system as a whole.

Otherwise, you're not building a multi-agent system. You're just hoping a bunch of invisible robots don't crash into each other.

---

*Want to see Agent HQ in action? Visit [robspain.com/admin/agents/](https://robspain.com/admin/agents/). Questions about the architecture or implementation? [Find me on LinkedIn](https://www.linkedin.com/in/robspain/).*
