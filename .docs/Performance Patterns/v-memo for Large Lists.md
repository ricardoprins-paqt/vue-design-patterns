# v-memo for Large List Rendering

`v-memo` is only useful when three things are true simultaneously: the list is large, the rows are complex enough that diffing them is expensive, and most rows don't change between renders.

## When to Use

- Selectable lists where selecting an item would otherwise diff every row
- Lists with hundreds+ rows AND significant template complexity per row
- When a global state change (select all, filter) causes unnecessary diffing

## Example

```vue
<div
  v-for="item in largeList"
  :key="item.id"
  v-memo="[item.id === selectedId, item.updatedAt]"
>
  <!-- Complex row with many bindings -->
  <Avatar :src="item.avatar" />
  <div class="details">
    <h3>{{ item.name }}</h3>
    <p>{{ item.description }}</p>
    <StatusBadge :status="item.status" />
    <TagList :tags="item.tags" />
  </div>
  <SelectionIndicator :selected="item.id === selectedId" />
</div>
```

Vue will only re-render a row when either `item.id === selectedId` or `item.updatedAt` changes. Selecting a different item only re-renders two rows — the previously selected and the newly selected — instead of diffing all 10,000.

## Notes

**Important caveat**: `v-memo` adds its own overhead — Vue has to compare the memo array values on every render cycle. For short lists or simple rows this overhead can actually make things slower. Measure before reaching for it.

**Rule of thumb**: consider `v-memo` when your list has more than a few hundred rows AND each row has significant template complexity. For simple lists it's premature optimization.
