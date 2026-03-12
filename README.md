# Sociality


🔗 **Live Demo:** [social-media-app-sociality-v1.vercel.app](https://social-media-app-sociality-v1.vercel.app)

---

## Features

- 🔐 **Auth** — Register, login, persistent session with JWT
- 📰 **Feed** — Infinite scroll timeline from followed users
- 📸 **Posts** — Create with image upload, view detail, delete own posts
- ❤️ **Likes** — Like/unlike with optimistic UI, view who liked a post
- 💬 **Comments** — Add and delete comments with optimistic updates
- 🔖 **Saves** — Bookmark posts, view saved collection
- 👥 **Follow** — Follow/unfollow users, view followers/following lists
- 🔍 **Search** — Debounced user search with follow action inline
- 👤 **Profile** — Public profiles, edit own profile + avatar
- 🎨 **Animations** — Smooth entrance animations and transitions throughout

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui |
| Global State | Redux Toolkit |
| Server State | TanStack Query (React Query) |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod |
| HTTP Client | Axios |
| Date Formatting | Day.js |
| Notifications | Sonner |

---

## Architecture

```
src/
├── app/              # Next.js App Router pages
│   ├── (auth)/       # Login, Register
│   └── (main)/       # Feed, Profile, Post Detail, Me
├── components/       # Reusable UI components
│   ├── layout/       # Navbar, BottomMenu
│   ├── post/         # PostCard, PostDetail, PostGrid, CreatePostModal
│   ├── profile/      # ProfileHeader, ProfileTabs, EditProfileModal
│   ├── comments/     # CommentSection, CommentItem, CommentComposer
│   └── modals/       # LikedByModal, FollowListModal, SearchModal
├── hooks/            # TanStack Query hooks (useFeed, usePosts, useMe...)
├── lib/
│   ├── api/          # API functions per resource
│   └── axios.ts      # Axios instance with auth interceptor
└── store/            # Redux store (auth slice)
```

---

## Local Setup

```bash
# 1. Clone the repo

# 2. Install dependencies
npm install


# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Key Implementation Details

**Optimistic UI** — Like, save, follow, and comment actions update the UI instantly before the API responds. On error, changes are rolled back automatically using TanStack Query's `onMutate`/`onError`/`onSettled` pattern.

**State Management** — Auth state (user, token) lives in Redux for global access. All server data (posts, profiles, feed) is managed by TanStack Query with automatic caching and invalidation.

**Smooth Framer-Motion** — The animations in this project are built with Framer Motion throughout, creating a cohesive, app-like feel:

---

## Backend

This project consumes a custom REST API built separately.  
Backend repo: [be-social-media-api](https://github.com/yourusername/be-social-media-api)  
API Base URL: `https://be-social-media-api-production.up.railway.app`