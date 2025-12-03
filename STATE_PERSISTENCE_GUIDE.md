# State Persistence Guide

This guide explains how to implement state persistence across page refreshes in the SS ERP frontend.

## Overview

We use a **hybrid approach** for state persistence:

1. **URL Query Parameters** - For navigation/routing state (tabs, selected items, etc.)
   - ✅ Shareable URLs
   - ✅ Browser back/forward works
   - ✅ Bookmarkable
   - ✅ SEO-friendly

2. **localStorage** - For UI preferences (expanded states, filters, etc.)
   - ✅ Persists across refreshes
   - ✅ User-specific preferences
   - ✅ No URL pollution

## When to Use What

### Use URL State (`useUrlState`) for:
- ✅ Active tabs/sections
- ✅ Selected items (user ID, role ID, etc.)
- ✅ Current page/view
- ✅ Any state that should be shareable via URL

### Use localStorage (`useLocalStorageState`) for:
- ✅ Expanded/collapsed states
- ✅ Filter preferences
- ✅ UI preferences (theme, layout, etc.)
- ✅ Scroll positions (optional)
- ✅ Form drafts (use sessionStorage instead)

## Usage Examples

### 1. Tab Selection (URL State)

```tsx
import { useUrlState } from "@/lib/hooks";

function MyPage() {
  // Tab persists in URL: /page?tab=users
  const [activeTab, setActiveTab] = useUrlState<"users" | "roles">("tab", "users");
  
  return (
    <div>
      <button onClick={() => setActiveTab("users")}>Users</button>
      <button onClick={() => setActiveTab("roles")}>Roles</button>
    </div>
  );
}
```

### 2. Selected Item (URL State)

```tsx
function UserManagement() {
  // Selected user persists in URL: /users?userId=123
  const [selectedUserId, setSelectedUserId] = useUrlState<string>("userId", null);
  
  return (
    <div>
      {selectedUserId ? (
        <UserDetails userId={selectedUserId} />
      ) : (
        <UserList onSelect={setSelectedUserId} />
      )}
    </div>
  );
}
```

### 3. Expanded States (localStorage)

```tsx
import { useLocalStorageSet, createStorageKey } from "@/lib/hooks";

function TreeComponent() {
  // Expanded items persist across refresh
  const [expandedItems, setExpandedItems] = useLocalStorageSet<string>(
    createStorageKey("my-feature", "expanded-items")
  );
  
  const toggle = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  return (
    <div>
      {items.map(item => (
        <div>
          <button onClick={() => toggle(item.id)}>
            {expandedItems.has(item.id) ? "▼" : "▶"}
          </button>
          {expandedItems.has(item.id) && <ItemDetails item={item} />}
        </div>
      ))}
    </div>
  );
}
```

### 4. Multiple URL States

```tsx
import { useUrlStateObject } from "@/lib/hooks";

function ComplexPage() {
  // Multiple states in URL: /page?tab=users&userId=123&roleId=456
  const [state, setState] = useUrlStateObject({
    tab: "users",
    userId: null,
    roleId: null,
  });
  
  return (
    <div>
      <button onClick={() => setState({ tab: "users" })}>Users</button>
      <button onClick={() => setState({ userId: "123" })}>Select User</button>
    </div>
  );
}
```

### 5. Custom Storage Key (Namespaced)

```tsx
import { createStorageKey } from "@/lib/hooks";

// Always use createStorageKey to prevent conflicts
const key = createStorageKey("system-management", "structure", "expanded");
// Result: "ss-erp:system-management:structure:expanded"

const [expanded, setExpanded] = useLocalStorageSet<string>(key);
```

## Implementation Checklist

When adding state persistence to a new feature:

- [ ] Identify navigation state → Use `useUrlState`
- [ ] Identify UI preferences → Use `useLocalStorageState` or `useLocalStorageSet`
- [ ] Use `createStorageKey()` for localStorage keys
- [ ] Test that state persists after refresh
- [ ] Test that URL state is shareable
- [ ] Test that localStorage state is user-specific (if needed)

## Current Implementations

### System Management
- ✅ Tab selection (`tab` query param)
- ✅ Selected user (`userId` query param)
- ✅ Selected role (`roleId` query param)
- ✅ Structure tree expanded states (localStorage)
- ✅ Permission tree expanded states (localStorage, per user/role)

### Sidebar
- ✅ Expanded navigation items (localStorage)

## Best Practices

1. **Always namespace localStorage keys** using `createStorageKey()`
2. **Use URL for shareable state**, localStorage for preferences
3. **Clear localStorage on logout** (optional, but recommended)
4. **Handle SSR** - localStorage hooks handle this automatically
5. **Test edge cases** - empty state, invalid URLs, etc.

## Migration Guide

To migrate existing state to persisted state:

### Before:
```tsx
const [tab, setTab] = useState("users");
const [expanded, setExpanded] = useState(new Set());
```

### After:
```tsx
const [tab, setTab] = useUrlState("tab", "users");
const [expanded, setExpanded] = useLocalStorageSet(
  createStorageKey("feature", "expanded")
);
```

That's it! The API is almost identical, just swap the hooks.

