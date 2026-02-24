# Hidden Components

Finding components that are already implicitly there in your code, just not extracted yet. The signal is when a chunk of your template is clearly about one specific thing, especially when it has its own local state or logic.

## When to Use

- When a section of your template has a clear, obvious name
- When a template section has its own local state (like `isFollowing`)
- When the parent template is getting long and hard to scan

## Example

**Before** — components hiding in plain sight:

```vue
<template>
  <div class="page">
    <!-- user profile section -->
    <div class="profile">
      <img :src="user.avatar" />
      <h2>{{ user.name }}</h2>
      <p>{{ user.bio }}</p>
      <button @click="isFollowing = !isFollowing">
        {{ isFollowing ? 'Unfollow' : 'Follow' }}
      </button>
    </div>

    <!-- posts section -->
    <div class="posts">
      <div v-for="post in posts" :key="post.id">
        <h3>{{ post.title }}</h3>
        <p>{{ post.body }}</p>
      </div>
    </div>
  </div>
</template>
```

**After** — extracted into clear components:

```vue
<template>
  <div class="page">
    <UserProfile :user="user" />
    <PostList :posts="posts" />
  </div>
</template>
```

The profile even has its own local state (`isFollowing`). Extracting them gives each piece a clear responsibility and makes the parent template read like a high-level description of the page.

## Notes

**Heuristic** (from Michael Thiessen): if you can give a section of your template a clear, obvious name, there's probably a component hiding there.

**Important nuance**: don't extract if the section is entirely driven by dynamic conditions from the parent. If the markup only exists when some parent-controlled flag is true and it has no identity of its own, it might not really be a separate component — just a template fragment.

See also: [[When Not to Split]] for the other side of this coin.
