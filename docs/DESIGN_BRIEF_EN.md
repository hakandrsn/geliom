# Geliom — Design Study Brief (EN)

> This document is the foundation for a design study of the Geliom mobile app.
> It summarizes what the app is, every screen, the current visual language, and
> the points that matter most for design.

## 1. What Is the App?

**Geliom** is a mobile social app for **real-time status and mood sharing** within
closed friend/family groups. It is not a messaging app; there is no chat. It answers
a single question: *"What are the people close to me doing right now, and how do
they feel?"*

A user joins a group (family, friends, or coworkers) and picks their status
("Available", "Working", "On the road"...) and mood (emoji-based: happy, tired,
stressed...) with a single tap. The update is pushed **instantly over WebSocket**
to every group member's screen — no pull-to-refresh. Optimistic UI is used
throughout: the interface updates the moment the user taps, without waiting for
the server. The app is built to feel light, fast, and intimate.

- **Platform:** iOS + Android (React Native / Expo, Expo Router)
- **Languages:** Turkish and English (i18n in place)
- **Audience:** Small groups of people who know each other well (family, close friends, teams)
- **Revenue model:** Freemium — subscription/premium via Adapty (paywall screen exists; users have an `isPremium` field)

## 2. Core Concepts (Data Model)

- **User:** Signs in with Firebase Auth (Google / Apple Sign-In). Profile holds
  `displayName`, a searchable `customId`, an avatar photo, and premium state.
- **Group:** Has a name, description, **invite code** (shared to let people join),
  an owner, a member limit (`max_members`), and a type (`family` / `friends` /
  `work`). Joining works two ways: directly with an invite code, or by sending a
  **join request** that an admin approves (PENDING / APPROVED / REJECTED).
- **Membership:** ADMIN / MEMBER roles. Members can be given a per-group
  **nickname**. Group ownership can be transferred.
- **Status:** Per-group free text + optional emoji. Each group has preset status
  options; **custom statuses can be added** and reordered.
- **Mood:** Per-group emoji + text pairs (e.g. 😊 "Happy"). Also customizable and
  reorderable.
- **Notifications:** OneSignal push notifications, with a per-group **mute** setting.

## 3. Screen Map

### Entry Flow
1. **Splash** — launch screen
2. **Onboarding** — an animated, self-playing demo scenario: a fake "Family Group"
   is created, members (You, Ayşe, Can) appear, statuses update live, and a
   notification animation drops in. An interactive story that demonstrates the
   value proposition.
3. **Login** — sign in with Google or Apple

### Main Structure — Drawer Navigation
4. **Home / Dashboard** (the heart of the app):
   - Top bar with group name + group type + member count; invite-share and menu
     buttons on the right (44px circular icon buttons)
   - **"My card"** (CurrentUserHeader) — my avatar, current status and mood
   - **StatusSelector and MoodSelector** — quick-pick components; tapping updates
     optimistically
   - Below, the **member card list** (MemberCard): 50px circular avatar with a
     **mood emoji badge** on its corner, name (nickname if set, real name beneath),
     and status text. A **glow animation** plays on the card when a status updates,
     and the emoji plays a **spring scale animation** when the mood changes
     (Reanimated).
   - If no group is selected, an **EmptyStateView** welcome screen; if the group is
     empty, an empty state that encourages inviting people
5. **Drawer content** — group list / group switching (custom drawer component)
6. **Settings** — theme (light/dark), notification settings, etc.
7. **Search User** — find users by customId
8. **Help & Support**
9. **Showroom** — component gallery (developer screen)

### Group Management Screens
10. **Create Group** — create a group (name, type, etc.)
11. **Join Group** — join with an invite code
12. **Group Management** — group settings (rename, mute, invite code)
13. **Manage Members** — member list and management
14. **Edit Member** — set a nickname for a member, etc.
15. **Join Requests** — approve/reject pending join requests (admin)
16. **Reorder Status & Mood** — add, delete, and drag-to-reorder status/mood options
17. **Bottom sheet flows** — Transfer Ownership, Group Name, Nickname, add
    Status/Mood (@gorhom/bottom-sheet)

### Monetization
18. **Paywall** — Adapty-based subscription screen

## 4. Current Visual Language

- **Color palette — "Social Harmony":** Primary **Indigo 600 (#4F46E5)**, secondary
  **Rose 600 (#E11D48)**, tertiary **Violet 500 (#8B5CF6)**; Indigo→Violet linear
  gradients. Neutrals are entirely on the **Slate** scale. Full **light + dark
  theme** support (dark: Slate 950 background with brightened brand tones like
  Indigo 400). Semantic colors: Emerald (success), Amber (warning), Red (error),
  Blue (info).
- **Typography:** **Comfortaa** font family (Light→Bold) — rounded letterforms
  aiming for a warm, friendly feel. Besides h1–h6 and body variants, there are
  **app-specific variants**: `status`, `nickname`, `groupName`.
- **Shape language:** 16px corner-radius cards, fully round avatars and icon
  buttons, thin 1px strokes, blur backgrounds (expo-blur), overlay layers.
- **Motion:** Micro-animations with Reanimated (glow, spring scale, fade/slide),
  Lottie animations, haptic feedback (expo-haptics).
- **Component library:** GeliomButton (active/passive/loading states), Typography,
  BaseLayout, Popover, AvatarSelector, NetworkToast (offline warning), bottom sheets.

The theme architecture is token-based (the `ThemeColors` interface in
`theme/colors.ts`); a new palette drops straight into this structure.

## 5. Design-Critical Points

- The most important screen is the **Dashboard**: it must show the group's "live
  pulse" at a glance. The feeling of real time — the moment a member's status
  changes — should be visually celebrated.
- **Picking a status or mood** is the most frequent action — it must be one-handed,
  one or two taps, and delightful.
- Emotional expression is central: **emoji are first-class visual elements**
  (avatar badges, mood picker).
- Context differs by group type (family / friends / work) — an opportunity for
  tonal variation in the design.
- Empty states matter: new user, user with no groups, single-member group — all
  should encourage inviting others.
- Light and dark themes must be designed to equal quality.
- The premium/paywall design is part of the revenue model.
