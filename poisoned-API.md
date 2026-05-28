Architecture Design Document: Frontend State Remediation LayerProject: Sociality AppAuthor/Lead Engineer: Terminal Session Logs (kodec)Status: Implemented & Production-Ready1. The Core Engineering ChallengeThe backend API for this application contains critical regressions regarding user-state statefulness on social interaction endpoints. Specifically, the database relations fail to correctly compute or map session scopes on specific GET requests.Poisoned Endpoint MatrixEndpointExpected BehaviorActual Bug BehaviorImpactGET /api/posts/:idReturns authentic user relation statesAlways returns likedByMe: false and savedByMe: falseBreaks interactive visual toggles on single post views.GET /api/feedReturns an array of feed items with bookmark statusOmits the savedByMe property entirelyFeed view cannot identify user saves.GET /api/posts/:id/likesMaps social graph edges for followersAlways returns isFollowedByMe: falseFollow interactions are visually wiped on interaction list load.Architectural PhilosophyRather than waiting for a backend remediation cycle or patching the data upstream, we implemented a Frontend State Remediation Layer. The core principle is simple: We treat the frontend as the Single Source of Truth (SSoT) for visual interaction state, utilizing the backend strictly as an asynchronous persistence layer rather than an immediate state arbiter.2. The 5-Layer State ArchitectureTo handle server latency, state caching, data persistence, and protection against buggy backend responses, we constructed a decoupled five-layer data pipeline:[ User Interaction (UI) ]
         │
         ▼
 ┌───────────────┐
 │ Layer 1: Redux│ <─── Memory-based Client Truth (Bypasses API Lies)
 └───────┬───────┘
         │ (Automatic Sync via Middleware/Subscription)
         ▼
 ┌───────────────┐
 │ Layer 2: Local│ <─── Survives Page Refreshes & Browser Sessions
 └───────────────┘
         ▲
         │ (Background Hydration Process on App Boot)
 ┌───────┴───────┐
 │ Layer 3: API  │ <─── Parallel Promise Engine Loop (Exhausts Paginated Ids)
 └───────────────┘
         │
         ▼
 ┌───────────────┐
 │ Layer 4 & 5:  │ <─── Synchronous Client Cache Staging (onMutate)
 │ TanStack Cache│       & Multi-Endpoint Fallback Rollbacks (onError)
 └───────────────┘
3. Deep-Dive Implementation DetailsLayer 1 & 2: Redux Slices & LocalStorage MirroringBecause TanStack Query's cache is natively bound to incoming API responses, caching a buggy backend response would overwrite correct client configurations. We extracted the visual interaction tracking (likes and saves) into a pure Redux in-memory layer that handles updates synchronously.TypeScript// store/slices/likesSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const likesSlice = createSlice({
  name: "likes",
  initialState: { likedPostIds: [] as number[] },
  reducers: {
    hydrateLikes: (state, action: PayloadAction<number[]>) => {
      state.likedPostIds = action.payload;
    },
    addLike: (state, action: PayloadAction<number>) => {
      if (!state.likedPostIds.includes(action.payload)) {
        state.likedPostIds.push(action.payload);
      }
    },
    removeLike: (state, action: PayloadAction<number>) => {
      state.likedPostIds = state.likedPostIds.filter(id => id !== action.payload);
    },
  }
});
To prevent state wipe on browser reload, the initialization lifecycle hooks into a local subscription model within the store configuration:TypeScript// store/index.ts
const preloadedState = {
  likes: { likedPostIds: JSON.parse(localStorage.getItem("likedPostIds") ?? "[]") },
  saves: { savedPostIds: JSON.parse(localStorage.getItem("savedPostIds") ?? "[]") },
};

export const store = configureStore({
  reducer: { likes: likesSlice.reducer, saves: savesSlice.reducer },
  preloadedState
});

store.subscribe(() => {
  const { likes, saves } = store.getState();
  localStorage.setItem("likedPostIds", JSON.stringify(likes.likedPostIds));
  localStorage.setItem("savedPostIds", JSON.stringify(saves.savedPostIds));
});
The Defensive UI Integration StrategyComponents do not consume the raw API flag directly. Instead, they run an logical OR operation against the Redux array matrix, falling back to the server data only if the ID isn't tracked in-memory.TypeScriptconst isLiked = likedPostIds.includes(post.id) || (post.likedByMe ?? false);
const isSaved = savedPostIds.includes(post.id) || (post.savedByMe ?? false);
Layer 3: Parallel Exhaustive API Hydration EngineTo bypass local storage stale data cycles across multiple physical machines or user agents, an automated background synchronization mechanism handles sync logic within (main)/layout.tsx instantly following user authentication.A standard query would only fetch page one, which leaves deep interactions untracked. To resolve this, we designed a looping pagination execution block that evaluates page totals sequentially until the server's record pool is exhausted:TypeScriptconst fetchAllIds = async (
  fetchFn: (page: number, limit: number) => Promise<any>, 
  key: string
): Promise<number[]> => {
  let page = 1;
  let allIds: number[] = [];
  
  while (true) {
    const res = await fetchFn(page, 50);
    // Defensive normalization checks for cross-endpoint property schemas
    const items = res.data.data.posts ?? res.data.data.items ?? [];
    allIds.push(...items.map((p: any) => p.id));
    
    if (page >= res.data.data.pagination.totalPages) break;
    page++;
  }
  return allIds;
};
This sequence leverages a parallel execution pattern (Promise.all) to avoid blocking thread bottlenecks, decreasing loading intervals from ~600ms down to the duration of the longest singular run (~300ms).TypeScript// Triggered on core app layout mount
const [likedIds, savedIds] = await Promise.all([
  fetchAllIds(getMyLikes, "likes"),
  fetchAllIds(getMySaved, "saves"),
]);

dispatch(hydrateLikes(likedIds));
dispatch(hydrateSaves(savedIds));
Layer 4 & 5: Production-Grade Optimistic UI LifecycleThe synchronization between user layout adjustments and background API actions is governed strictly by the lifecycle hooks available inside TanStack Query.TypeScript// hooks/useLike.ts
export const useLike = (postId: number) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: () => postsApi.toggleLike(postId),
    
    onMutate: async (isCurrentlyLiked: boolean) => {
      // 1. Terminate out-of-band query cycles to protect mutating state cache
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      await queryClient.cancelQueries({ queryKey: ["posts", postId] });

      // 2. Capture cache state snapshots for error fallback
      const previousFeed = queryClient.getQueryData(["feed"]);
      const previousPost = queryClient.getQueryData(["posts", postId]);

      // 3. Update Redux SSoT synchronously
      if (isCurrentlyLiked) dispatch(removeLike(postId));
      else dispatch(addLike(postId));

      // 4. Manually step through and normalize paginated cache records
      queryClient.setQueryData(["feed"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: (page.items ?? page.posts ?? page.data).map((post: any) =>
              post.id === postId ? {
                ...post,
                likedByMe: !isCurrentlyLiked,
                likeCount: isCurrentlyLiked ? post.likeCount - 1 : post.likeCount + 1
              } : post
            )
          }))
        };
      });

      // 5. Package snapshot payload to forward context downstream
      return { previousFeed, previousPost };
    },

    onError: (err, isCurrentlyLiked, context) => {
      // Roll back structural changes across Redux arrays and cache objects
      if (isCurrentlyLiked) dispatch(addLike(postId));
      else dispatch(removeLike(postId));
      
      if (context) {
        queryClient.setQueryData(["feed"], context.previousFeed);
        queryClient.setQueryData(["posts", postId], context.previousPost);
      }
    },

    onSettled: () => {
      // Refetch parent list arrays selectively
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["explore"] });
      
      /* CRITICAL ARCHITECTURAL DECISION:
         We NEVER call invalidateQueries for ["posts", postId]. 
         Doing so fires GET /api/posts/:id, which returns likedByMe: false.
         This broken server data would overwrite our validated client state. */
    }
  });
};
Why initialDataUpdatedAt: 0 is RequiredOn detail components (PostDetail), the layout uses property injection from parents into TanStack's initialData parameter. Under standard configurations, TanStack treats this assignment as fresh data and drops optimistic mutation requests.TypeScriptuseQuery({
  queryKey: ["posts", postId],
  queryFn: () => postsApi.getPost(postId),
  initialData: post,
  initialDataUpdatedAt: 0, // Forces TanStack to consider structural inputs instantly stale
});
By mapping initialDataUpdatedAt to 0 (Epoch timestamp), the cache engine views the dataset as old data, accepting client mutations instantly while running the fetching function transparently behind the UI.4. Cross-Cutting Engineering DecisionsStructural Response Key NormalizationDue to schematic inconsistencies across the backend domain (GET /api/feed returning .items, GET /api/saved returning .posts, and legacy endpoints using .data), we built a fall-through data accessor helper.TypeScript// Structural Normalization Wrapper
const targetArray = page.items ?? page.posts ?? page.data;
This avoids scattered if/else checks across presentation components by handling structural routing inside the data access and transformation layer.System Decoupling via Custom Event BusTo maintain strict modular boundaries between contextual interface boundaries—specifically closing sticky interface components (BottomMenu) when secondary modal configurations open (EditProfileModal)—we replaced layered prop drilling models with an active native Event Loop dispatch bus.TypeScript// Decoupled Event Dispatchers
window.dispatchEvent(new Event("modal:open"));
window.dispatchEvent(new Event("modal:close"));

// Event Subscriber Pattern inside BottomMenu component
useEffect(() => {
  const hideMenu = () => setVisible(false);
  window.addEventListener("modal:open", hideMenu);
  return () => window.removeEventListener("modal:open", hideMenu);
}, []);
This isolates the component context entirely, removing unnecessary dependencies on complex, multi-provider React Context structures.Performance-Driven Visual Rendering: Canvas vs. Framer MotionFor processing active graphic rendering loops (such as the generative particle components in the application's layout), standard layout element rendering methods like Framer Motion were rejected to prevent DOM overload.Framer Motion Limitations: Creating separate elements for over 60 active nodes requires individual geometric DOM tracking and forces persistent React recalculation triggers, which can cause drop-frames on lower-tier mobile systems.HTML5 Canvas Implementation: By leveraging a single <canvas> canvas node managed via a localized requestAnimationFrame loop, animation processes execute directly on the GPU canvas without causing layout shifts or framework interruptions.5. Architectural Verification: Interaction Lifecycle Flow[ User Interaction: Hit ❤️ Toggle ]
               │
               ▼
┌────────────────────────────────────────────────────────┐
│ 1. Trigger Synchronous onMutate Block                   │
│    ├─ Stop ongoing polling via cancelQueries()         │
│    ├─ Extract deep state structural backup snapshots    │
│    └─ Push payload changes directly into Redux state    │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│ 2. Execute Local Cache Normalization                   │
│    └─ Inject modifications directly into cache keys     │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ▼
         [ Renders Immediate UI Updates ] (0ms Delay)
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│ 3. Dispatch Async Network Pipeline Task                │
│    └─ POST /api/posts/:id/like                         │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ├─── [ HTTP Response: 200 OK ]
                       │      └─ Invalidate only list keys (feed/explore)
                       │
                       └─── [ HTTP Response: 500 Error ]
                              ├─ Roll back Redux array matrix values
                              └─ Reinstate captured cache snapshots