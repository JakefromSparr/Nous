# AGENTS.md – Guidance for Codex & AI Agents

## 🔮 Project Overview

**Nous** is a story-driven, group-based interactive game built around personality-driven trivia. This is *not* a productivity tool, but an experiential system designed to create emergent, emotionally resonant moments. Gameplay involves drawing from structured decks of cards (Trivia, Barnum, Last) and responding in ways that the system secretly interprets.

The illusion of sentience is central to the design.

---

## 🧠 Primary Directives

- Treat this as a *narrative game engine*, not a utility or productivity tool.
- Always prioritize **player experience**, immersion, emotional tone, and pacing.
- All gameplay logic must reinforce the illusion that *the game is learning from the players.*
- Maintain a sense of mystery. Avoid exposing internal mechanics or scores unless deliberately designed into gameplay.

---

## 🎮 Gameplay Model

- Players act as a single group mind (inspired by Ouija boards).
- They answer trivia questions that secretly inform a trait model.
- The system generates responses (Divinations, Directions, Awards) based on accumulated behavioral patterns.
- Rope Length is the central gameplay currency, increasing or decreasing based on responses.
- Card types:
  - **Trivia Cards**: Mind, Body, Soul categories; Past, Present, Future types.
  - **Barnum Cards**: Interpretive outputs (Divination, Dynamics, Directions).
  - **Last Deck**: Endgame resolution, final question, awards, and readings.

---

## ⚙️ Development Standards

- Store card data in structured JSON or JS arrays using the provided template format.
- Factor game logic into modular JS functions. Avoid hardcoded logic inside passages.
- All navigation must be smooth and reactive—minimize reloading or redundant choices.
- Ensure scoring logic is hidden from players except when triggered through narrative.

---

## 📍 Logging & Self-Tracking

Agents should:
- Keep a rolling log of gameplay improvements in a `logs/improvements.md` file.
- Each commit or substantial change should include a one-line summary of:
  - What was improved
  - Why it matters for UX or narrative flow
- Example: `Improved rope deduction logic to align with technical answers – ensures tighter narrative consequences.`

---

## ✅ Programmatic Checks

All code changes should pass the following tests:
1. Game loads and progresses from `Title Screen` to `Last Deck` without errors.
2. A complete session can be simulated using only the arrow of navigation choices.
3. Rope logic updates correctly per answer type:
   - Wrong → -1 rope
   - Preferred → 0 change
   - Technical → +1 rope
4. Divinations are selected based on top trait pairs without repetition until all versions are used.
5. If a card references a missing property (e.g., `trait`, `detail`), fallback text appears without crash.

---

## 📊 Playtest Data & Analysis

Agents may assist in playtesting. When doing so:
- Log trait distribution and decision patterns across rounds.
- Identify anomalies, e.g.:
  - Excessive Mind dominance
  - Trait divergence vs. group response cohesion
- Suggest balancing tweaks or card variety additions when overused patterns appear.
- Track average rope loss/gain by session for pacing calibration.

---

## 🧾 Licensing Notes

This project is protected intellectual property of **Sparr Games**.  
Agents should not suggest external publication, open-source licensing, or derivative project creation unless explicitly authorized.

All code, data models, and narrative text are authored by **Jake Spencer** unless otherwise noted.

---

## 🤖 Final Reminder

This is not a tool.  
This is an *experience.*  
Preserve the magic.
