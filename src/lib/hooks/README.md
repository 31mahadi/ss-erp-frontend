# Reusable API Hooks

This directory contains reusable hooks for API interactions using React Query.

## Basic Hooks

### `useApiQuery<TData>`
Generic hook for GET requests.

```typescript
const { data, isLoading, error } = useApiQuery<User>("/users/123");
```

### `useApiMutation<TData, TVariables>`
Generic hook for POST requests.

```typescript
const createUser = useApiMutation<User, CreateUserDto>("/users", {
  invalidateQueries: ["/users"], // Invalidate list after creation
});

// Usage
createUser.mutate({ name: "John", email: "john@example.com" });
```

### `useApiPut<TData, TVariables>`
Generic hook for PUT requests.

### `useApiPatch<TData, TVariables>`
Generic hook for PATCH requests.

### `useApiDelete<TData>`
Generic hook for DELETE requests.

### `usePaginatedQuery<TData>`
Hook for paginated list queries.

```typescript
const { data, isLoading } = usePaginatedQuery<User>(
  "/users",
  { page: 1, limit: 10, search: "john" }
);
// data contains: { data: User[], meta: { page, limit, total, totalPages } }
```

## CRUD Hooks Factory

Create a complete set of CRUD hooks for a resource:

```typescript
const userHooks = createCrudHooks<User, CreateUserDto, UpdateUserDto>({
  baseEndpoint: "/users",
  listEndpoint: "/users", // optional, defaults to baseEndpoint
  itemQueryKey: "/users", // optional, for cache invalidation
  listQueryKey: "/users/list", // optional, for cache invalidation
});

// Usage
const { data: users } = userHooks.useList({ page: 1, limit: 10 });
const { data: user } = userHooks.useItem("123");
const createUser = userHooks.useCreate();
const updateUser = userHooks.useUpdate();
const deleteUser = userHooks.useDelete();
```

## Helper Hooks

### `useUpdateItem<TData, TVariables>`
Update a specific item by ID.

```typescript
const updateUser = useUpdateItem<User, UpdateUserDto>(
  (id) => `/users/${id}`,
  { invalidateQueries: ["/users"] }
);

updateUser.mutate({ id: "123", data: { name: "New Name" } });
```

### `useDeleteItem<TData>`
Delete a specific item by ID.

```typescript
const deleteUser = useDeleteItem<User>(
  (id) => `/users/${id}`,
  { invalidateQueries: ["/users"] }
);

deleteUser.mutate("123");
```

## Example: Complete Module

```typescript
// modules/users/hooks/use-users.ts
import { createCrudHooks } from "@/lib/hooks/use-crud";
import { API_ENDPOINTS } from "@/config/api";
import type { User, CreateUserDto, UpdateUserDto } from "../domain/types";

export const useUsers = createCrudHooks<User, CreateUserDto, UpdateUserDto>({
  baseEndpoint: API_ENDPOINTS.users.list,
});

// Usage in component
function UsersPage() {
  const { data, isLoading } = useUsers.useList({ page: 1, limit: 20 });
  const createUser = useUsers.useCreate();
  
  // ...
}
```

## Features

- ✅ Automatic cache invalidation
- ✅ Type-safe with TypeScript
- ✅ Error handling
- ✅ Loading states
- ✅ Retry logic (configured in API client)
- ✅ Token refresh on 401 errors
- ✅ Request/response logging

