// Hooks barrel export
export {
  useApiQuery,
  useApiMutation,
  useApiPut,
  useApiPatch,
  useApiDelete,
  usePaginatedQuery,
} from "./use-api";
export {
  createCrudHooks,
  useUpdateItem,
  useDeleteItem,
} from "./use-crud";
export {
  useOptimisticRolePermission,
  useOptimisticUserPermission,
  useOptimisticPermissionTree,
} from "./use-optimistic-permission";
export {
  usePermission,
  useAnyPermission,
  useAllPermissions,
  useFeaturePermissions,
  useModuleAccess,
  useSubmoduleAccess,
  useFeatureAccess,
} from "./use-permission";
export { usePermissions } from "./use-permissions";
export { useToast, type ToastVariant } from "./use-toast";
export {
  useUrlState,
  useUrlStateObject,
  useLocalStorageState,
  useLocalStorageSet,
  useLocalStorageMap,
  createStorageKey,
  clearStorageNamespace,
} from "./use-persisted-state";

