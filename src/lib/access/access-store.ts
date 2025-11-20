import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  UserAccessInfo,
  ModuleAccessInfo,
  SubmoduleAccessInfo,
  FeatureAccessInfo,
} from "@/lib/auth/types";

interface AccessStore {
  access: UserAccessInfo | null;
  setAccess: (access: UserAccessInfo | null) => void;
  getModule: (moduleSlug: string) => ModuleAccessInfo | undefined;
  getSubmodule: (moduleSlug: string, submoduleSlug: string) => SubmoduleAccessInfo | undefined;
  getFeature: (
    moduleSlug: string,
    submoduleSlug: string,
    featureSlug: string
  ) => FeatureAccessInfo | undefined;
  hasModuleAccess: (moduleSlug: string) => boolean;
  hasSubmoduleAccess: (moduleSlug: string, submoduleSlug: string) => boolean;
  hasFeatureAccess: (
    moduleSlug: string,
    submoduleSlug: string,
    featureSlug: string
  ) => boolean;
  hasOperationAccess: (
    moduleSlug: string,
    submoduleSlug: string,
    featureSlug: string,
    operationSlug: string
  ) => boolean;
  getAccessibleModules: () => ModuleAccessInfo[];
  getAccessibleSubmodules: (moduleSlug: string) => SubmoduleAccessInfo[];
  getAccessibleFeatures: (
    moduleSlug: string,
    submoduleSlug: string
  ) => FeatureAccessInfo[];
}

export const useAccessStore = create<AccessStore>()(
  persist(
    (set, get) => ({
      access: null,

      setAccess: (access) => set({ access }),

      getModule: (moduleSlug) => {
        const { access } = get();
        return access?.modules.find((m) => m.slug === moduleSlug);
      },

      getSubmodule: (moduleSlug, submoduleSlug) => {
        const module = get().getModule(moduleSlug);
        return module?.submodules?.find((s) => s.slug === submoduleSlug);
      },

      getFeature: (moduleSlug, submoduleSlug, featureSlug) => {
        const submodule = get().getSubmodule(moduleSlug, submoduleSlug);
        return submodule?.features.find((f) => f.slug === featureSlug);
      },

      hasModuleAccess: (moduleSlug) => {
        const { access } = get();
        if (access?.hasAllAccess) return true;
        return access?.modules.some((m) => m.slug === moduleSlug) ?? false;
      },

      hasSubmoduleAccess: (moduleSlug, submoduleSlug) => {
        const { access } = get();
        if (access?.hasAllAccess) return true;
        const module = get().getModule(moduleSlug);
        return module?.submodules?.some((s) => s.slug === submoduleSlug) ?? false;
      },

      hasFeatureAccess: (moduleSlug, submoduleSlug, featureSlug) => {
        const { access } = get();
        if (access?.hasAllAccess) return true;
        const submodule = get().getSubmodule(moduleSlug, submoduleSlug);
        return submodule?.features.some((f) => f.slug === featureSlug) ?? false;
      },

      hasOperationAccess: (moduleSlug, submoduleSlug, featureSlug, operationSlug) => {
        const { access } = get();
        if (access?.hasAllAccess) return true;
        const feature = get().getFeature(moduleSlug, submoduleSlug, featureSlug);
        return feature?.operations.some((o) => o.slug === operationSlug) ?? false;
      },

      getAccessibleModules: () => {
        const { access } = get();
        return access?.modules ?? [];
      },

      getAccessibleSubmodules: (moduleSlug) => {
        const module = get().getModule(moduleSlug);
        return module?.submodules ?? [];
      },

      getAccessibleFeatures: (moduleSlug, submoduleSlug) => {
        const submodule = get().getSubmodule(moduleSlug, submoduleSlug);
        return submodule?.features ?? [];
      },
    }),
    {
      name: "access-storage",
      partialize: (state) => ({
        access: state.access,
      }),
    }
  )
);

