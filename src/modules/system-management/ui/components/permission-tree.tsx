"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { PermissionTreeModule, PermissionTreeSubmodule, PermissionTreeFeature, PermissionTreeOperation } from "../../domain/types";

interface PermissionTreeProps {
  modules: PermissionTreeModule[];
  selectedModules: Set<string>;
  selectedSubmodules: Set<string>;
  selectedFeatures: Set<string>;
  selectedOperations: Map<string, Set<string>>; // featureId -> Set<operationId>
  onModuleToggle: (moduleId: string, checked: boolean) => void;
  onSubmoduleToggle: (submoduleId: string, checked: boolean, moduleId: string) => void;
  onFeatureToggle: (featureId: string, checked: boolean, submoduleId: string, moduleId: string) => void;
  onOperationToggle: (featureId: string, operationId: string, checked: boolean, submoduleId: string, moduleId: string) => void;
  readOnly?: boolean;
}

export function PermissionTree({
  modules,
  selectedModules,
  selectedSubmodules,
  selectedFeatures,
  selectedOperations,
  onModuleToggle,
  onSubmoduleToggle,
  onFeatureToggle,
  onOperationToggle,
  readOnly = false,
}: PermissionTreeProps) {
  const [expandedModules, setExpandedModules] = React.useState<Set<string>>(new Set());
  const [expandedSubmodules, setExpandedSubmodules] = React.useState<Set<string>>(new Set());
  const [expandedFeatures, setExpandedFeatures] = React.useState<Set<string>>(new Set());

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const toggleSubmodule = (submoduleId: string) => {
    const newExpanded = new Set(expandedSubmodules);
    if (newExpanded.has(submoduleId)) {
      newExpanded.delete(submoduleId);
    } else {
      newExpanded.add(submoduleId);
    }
    setExpandedSubmodules(newExpanded);
  };

  const toggleFeature = (featureId: string) => {
    const newExpanded = new Set(expandedFeatures);
    if (newExpanded.has(featureId)) {
      newExpanded.delete(featureId);
    } else {
      newExpanded.add(featureId);
    }
    setExpandedFeatures(newExpanded);
  };

  const handleModuleToggle = (moduleId: string, checked: boolean) => {
    if (readOnly) return;
    onModuleToggle(moduleId, checked);
  };

  const handleSubmoduleToggle = (submoduleId: string, checked: boolean, moduleId: string) => {
    if (readOnly) return;
    onSubmoduleToggle(submoduleId, checked, moduleId);
  };

  const handleFeatureToggle = (featureId: string, checked: boolean, submoduleId: string, moduleId: string) => {
    if (readOnly) return;
    onFeatureToggle(featureId, checked, submoduleId, moduleId);
  };

  const handleOperationToggle = (featureId: string, operationId: string, checked: boolean, submoduleId: string, moduleId: string) => {
    if (readOnly) return;
    onOperationToggle(featureId, operationId, checked, submoduleId, moduleId);
  };

  const isModuleChecked = (module: PermissionTreeModule): boolean => {
    // Check if module is explicitly granted (not just inherited from children)
    if (module.isExplicit === true) return true;
    
    // Check if module has direct access (at this level, not from children)
    if (module.hasDirectAccess === true) return true;
    
    // Fallback: if module is in selectedModules set, show as checked
    if (selectedModules.has(module.id)) return true;
    
    // If module has access but not direct access, it means children have access
    // In this case, we want to show indeterminate, not checked
    return false;
  };

  const isModuleIndeterminate = (module: PermissionTreeModule): boolean => {
    // If module is explicitly selected or has direct access, not indeterminate
    if (module.isExplicit === true || module.hasDirectAccess === true || selectedModules.has(module.id)) return false;
    
    // Check if module has access from children (hasAccess but not direct access)
    if (module.hasAccess === true) {
      return true; // Show as indeterminate when children have access but module not directly granted
    }
    
    // Check if any submodule, feature, or operation is selected (but not all)
    const hasSomeSelected = module.submodules.some((submodule) => {
      if (submodule.hasAccess === true) return true;
      if (selectedSubmodules.has(submodule.id)) return true;
      return submodule.features.some((feature) => {
        if (feature.hasAccess === true) return true;
        if (selectedFeatures.has(feature.id)) return true;
        const featureOps = selectedOperations.get(feature.id);
        return featureOps && featureOps.size > 0;
      });
    });
    
    return hasSomeSelected;
  };

  const isSubmoduleChecked = (submodule: PermissionTreeSubmodule, moduleId: string): boolean => {
    // Check if submodule is explicitly granted (not just inherited from parent or children)
    if (submodule.isExplicit === true) return true;
    
    // If parent module is explicitly selected or has direct access, submodule is checked (inherited)
    if (selectedModules.has(moduleId)) return true;
    
    // Check if submodule has direct access (at this level, not from children)
    if (submodule.hasDirectAccess === true) return true;
    
    // Fallback: if submodule is in selectedSubmodules set, show as checked
    if (selectedSubmodules.has(submodule.id)) return true;
    
    // If submodule has access but not direct access, it might be from children
    // Return false and let isSubmoduleIndeterminate handle it
    return false;
  };

  const isSubmoduleIndeterminate = (submodule: PermissionTreeSubmodule, moduleId: string): boolean => {
    // If parent module is explicitly selected, not indeterminate (fully checked)
    if (selectedModules.has(moduleId)) return false;
    
    // If submodule is explicitly selected or has direct access, not indeterminate
    if (submodule.isExplicit === true || submodule.hasDirectAccess === true || selectedSubmodules.has(submodule.id)) return false;
    
    // Check if submodule has access from children (hasAccess but not direct access)
    if (submodule.hasAccess === true) {
      return true; // Show as indeterminate when children have access but submodule not directly granted
    }
    
    // Check if any feature or operation is selected
    return submodule.features.some((feature) => {
      if (feature.hasAccess === true) return true;
      if (selectedFeatures.has(feature.id)) return true;
      const featureOps = selectedOperations.get(feature.id);
      return featureOps && featureOps.size > 0;
    });
  };

  const isFeatureChecked = (feature: PermissionTreeFeature, submoduleId: string, moduleId: string): boolean => {
    // Check if feature is explicitly granted (not just inherited from parent or children)
    if (feature.isExplicit === true) return true;
    
    // If parent module or submodule is explicitly selected or has direct access, feature is checked (inherited)
    if (selectedModules.has(moduleId) || selectedSubmodules.has(submoduleId)) return true;
    
    // Check if feature has direct access (at this level, not from children)
    if (feature.hasDirectAccess === true) return true;
    
    // Fallback: if feature is in selectedFeatures set, show as checked
    if (selectedFeatures.has(feature.id)) return true;
    
    // If feature has access but not direct access, it might be from children
    // Return false and let isFeatureIndeterminate handle it
    return false;
  };

  const isFeatureIndeterminate = (feature: PermissionTreeFeature, submoduleId: string, moduleId: string): boolean => {
    // If parent module or submodule is explicitly selected, not indeterminate (fully checked)
    if (selectedModules.has(moduleId) || selectedSubmodules.has(submoduleId)) return false;
    
    // If feature is explicitly selected or has direct access, not indeterminate
    if (feature.isExplicit === true || feature.hasDirectAccess === true || selectedFeatures.has(feature.id)) return false;
    
    // Check if feature has access from children (hasAccess but not direct access)
    if (feature.hasAccess === true) {
      // Check if all operations have access - if so, show as checked, not indeterminate
      const allOpsHaveAccess = feature.operations.length > 0 && 
        feature.operations.every((op) => op.hasAccess === true);
      if (!allOpsHaveAccess) {
        return true; // Show as indeterminate when some children have access but not all
      }
    }
    
    // Check if any operation is selected but not all
    const featureOps = selectedOperations.get(feature.id);
    const hasSomeOps = featureOps && featureOps.size > 0;
    const allOpsSelected = feature.operations.length > 0 && featureOps && 
      feature.operations.every((op) => featureOps.has(op.id));
    return !!(hasSomeOps && !allOpsSelected);
  };

  const isOperationChecked = (
    operation: PermissionTreeOperation,
    featureId: string,
    submoduleId: string,
    moduleId: string,
  ): boolean => {
    // Primary check: use the operation's hasAccess property from the API
    // This is the source of truth from the backend
    if (operation.hasAccess === true) {
      return true;
    }
    
    // Fallback: If operation is in selectedOperations set (explicitly granted), show as checked
    // This is for cases where the API might not have updated yet
    const featureOps = selectedOperations.get(featureId);
    if (featureOps && featureOps.has(operation.id)) {
      return true;
    }
    
    return false;
  };

  return (
    <div className="space-y-1 border rounded-lg p-4 bg-card">
      {modules.map((module) => {
        const moduleChecked = isModuleChecked(module);
        const moduleIndeterminate = isModuleIndeterminate(module);
        const isExpanded = expandedModules.has(module.id);

        if (module.submodules.length === 0) {
          return (
            <div key={module.id} className="flex items-center space-x-2 py-2 px-2 rounded-md hover:bg-accent/50 transition-colors">
              <div className="w-5" />
              <Checkbox
                checked={moduleChecked}
                ref={(el) => {
                  if (el) {
                    el.indeterminate = moduleIndeterminate;
                  }
                }}
                onCheckedChange={(checked) => handleModuleToggle(module.id, checked === true)}
                disabled={readOnly}
                className="mr-2"
              />
              <label className="flex-1 font-semibold text-base cursor-pointer flex items-center gap-2">
                {module.icon && <span className="text-lg">{module.icon}</span>}
                <span>{module.name}</span>
                {module.description && (
                  <span className="text-xs text-muted-foreground font-normal">({module.description})</span>
                )}
              </label>
            </div>
          );
        }

        return (
          <Collapsible key={module.id} open={isExpanded} onOpenChange={() => toggleModule(module.id)}>
            <div className="flex items-center space-x-2 py-2 px-2 rounded-md hover:bg-accent/50 transition-colors">
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-center w-5 h-5 hover:bg-accent rounded transition-colors">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              <Checkbox
                checked={moduleChecked}
                ref={(el) => {
                  if (el) {
                    el.indeterminate = moduleIndeterminate;
                  }
                }}
                onCheckedChange={(checked) => handleModuleToggle(module.id, checked === true)}
                disabled={readOnly}
                className="mr-2"
              />
              <label
                className="flex-1 font-semibold text-base cursor-pointer flex items-center gap-2"
                onClick={() => toggleModule(module.id)}
              >
                {module.icon && <span className="text-lg">{module.icon}</span>}
                <span>{module.name}</span>
                {module.description && (
                  <span className="text-xs text-muted-foreground font-normal">({module.description})</span>
                )}
              </label>
            </div>
            <CollapsibleContent className="ml-8 space-y-1 mt-1">
              {module.submodules.map((submodule) => {
                const submoduleChecked = isSubmoduleChecked(submodule, module.id);
                const submoduleIndeterminate = isSubmoduleIndeterminate(submodule, module.id);
                const isSubExpanded = expandedSubmodules.has(submodule.id);

                if (submodule.features.length === 0) {
                  return (
                    <div key={submodule.id} className="flex items-center space-x-2 py-1.5 px-2 rounded-md hover:bg-accent/30 transition-colors">
                      <div className="w-5" />
                      <Checkbox
                        checked={submoduleChecked}
                        ref={(el) => {
                          if (el) {
                            el.indeterminate = submoduleIndeterminate;
                          }
                        }}
                        onCheckedChange={(checked) => handleSubmoduleToggle(submodule.id, checked === true, module.id)}
                        disabled={readOnly}
                        className="mr-2"
                      />
                      <label className="flex-1 font-medium text-sm cursor-pointer flex items-center gap-2">
                        {submodule.icon && <span>{submodule.icon}</span>}
                        <span>{submodule.name}</span>
                        {submodule.description && (
                          <span className="text-xs text-muted-foreground font-normal">({submodule.description})</span>
                        )}
                        {submodule.isExplicit && (
                          <span className="ml-auto text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                            Explicit
                          </span>
                        )}
                      </label>
                    </div>
                  );
                }

                return (
                  <Collapsible
                    key={submodule.id}
                    open={isSubExpanded}
                    onOpenChange={() => toggleSubmodule(submodule.id)}
                  >
                    <div className="flex items-center space-x-2 py-1.5 px-2 rounded-md hover:bg-accent/30 transition-colors">
                      <CollapsibleTrigger asChild>
                        <button className="flex items-center justify-center w-5 h-5 hover:bg-accent rounded transition-colors">
                          {isSubExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </CollapsibleTrigger>
                      <Checkbox
                        checked={submoduleChecked}
                        ref={(el) => {
                          if (el) {
                            el.indeterminate = submoduleIndeterminate;
                          }
                        }}
                        onCheckedChange={(checked) => handleSubmoduleToggle(submodule.id, checked === true, module.id)}
                        disabled={readOnly}
                        className="mr-2"
                      />
                      <label
                        className="flex-1 font-medium text-sm cursor-pointer flex items-center gap-2"
                        onClick={() => toggleSubmodule(submodule.id)}
                      >
                        {submodule.icon && <span>{submodule.icon}</span>}
                        <span>{submodule.name}</span>
                        {submodule.description && (
                          <span className="text-xs text-muted-foreground font-normal">({submodule.description})</span>
                        )}
                        {submodule.isExplicit && (
                          <span className="ml-auto text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                            Explicit
                          </span>
                        )}
                      </label>
                    </div>
                    <CollapsibleContent className="ml-8 space-y-1 mt-1">
                      {submodule.features.map((feature) => {
                        const featureChecked = isFeatureChecked(feature, submodule.id, module.id);
                        const featureIndeterminate = isFeatureIndeterminate(feature, submodule.id, module.id);
                        const isFeatExpanded = expandedFeatures.has(feature.id);

                        if (feature.operations.length === 0) {
                          return (
                            <div key={feature.id} className="flex items-center space-x-2 py-1 px-2 rounded-md hover:bg-accent/20 transition-colors">
                              <div className="w-5" />
                              <Checkbox
                                checked={featureChecked}
                                ref={(el) => {
                                  if (el) {
                                    el.indeterminate = featureIndeterminate;
                                  }
                                }}
                                onCheckedChange={(checked) => handleFeatureToggle(feature.id, checked === true, submodule.id, module.id)}
                                disabled={readOnly}
                                className="mr-2"
                              />
                              <label className="flex-1 text-sm cursor-pointer flex items-center gap-2">
                                {feature.icon && <span>{feature.icon}</span>}
                                <span>{feature.name}</span>
                                {feature.description && (
                                  <span className="text-xs text-muted-foreground font-normal">({feature.description})</span>
                                )}
                                {feature.isExplicit && (
                                  <span className="ml-auto text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                                    Explicit
                                  </span>
                                )}
                                {feature.isDenied && (
                                  <span className="ml-auto text-xs bg-red-500/10 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">
                                    Denied
                                  </span>
                                )}
                              </label>
                            </div>
                          );
                        }

                        // Feature with operations - render as collapsible
                        return (
                          <Collapsible
                            key={feature.id}
                            open={isFeatExpanded}
                            onOpenChange={() => toggleFeature(feature.id)}
                          >
                            <div className="flex items-center space-x-2 py-1 px-2 rounded-md hover:bg-accent/20 transition-colors">
                              <CollapsibleTrigger asChild>
                                <button className="flex items-center justify-center w-5 h-5 hover:bg-accent rounded transition-colors">
                                  {isFeatExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </button>
                              </CollapsibleTrigger>
                              <Checkbox
                                checked={featureChecked}
                                ref={(el) => {
                                  if (el) {
                                    el.indeterminate = featureIndeterminate;
                                  }
                                }}
                                onCheckedChange={(checked) => handleFeatureToggle(feature.id, checked === true, submodule.id, module.id)}
                                disabled={readOnly}
                                className="mr-2"
                              />
                              <label
                                className="flex-1 text-sm cursor-pointer flex items-center gap-2"
                                onClick={() => toggleFeature(feature.id)}
                              >
                                {feature.icon && <span>{feature.icon}</span>}
                                <span>{feature.name}</span>
                                {feature.description && (
                                  <span className="text-xs text-muted-foreground font-normal">({feature.description})</span>
                                )}
                                {feature.isExplicit && (
                                  <span className="ml-auto text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                                    Explicit
                                  </span>
                                )}
                                {feature.isDenied && (
                                  <span className="ml-auto text-xs bg-red-500/10 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">
                                    Denied
                                  </span>
                                )}
                              </label>
                            </div>
                            <CollapsibleContent className="ml-8 space-y-1 mt-1">
                              {feature.operations.map((operation) => {
                                const operationChecked = isOperationChecked(operation, feature.id, submodule.id, module.id);
                                return (
                                  <div
                                    key={operation.id}
                                    className="flex items-center space-x-2 py-0.5 px-2 rounded-md hover:bg-accent/10 transition-colors"
                                    onClick={(e) => {
                                      // Prevent event propagation to parent elements
                                      e.stopPropagation();
                                    }}
                                  >
                                    <div className="w-5" />
                                    <Checkbox
                                      checked={operationChecked}
                                      onCheckedChange={(checked) => {
                                        handleOperationToggle(feature.id, operation.id, checked === true, submodule.id, module.id);
                                      }}
                                      onClick={(e) => {
                                        // Prevent event propagation
                                        e.stopPropagation();
                                      }}
                                      disabled={readOnly}
                                      className="mr-2"
                                    />
                                    <label className="flex-1 text-xs cursor-pointer flex items-center gap-2">
                                      <span>{operation.name}</span>
                                      {operation.description && (
                                        <span className="text-xs text-muted-foreground font-normal">
                                          ({operation.description})
                                        </span>
                                      )}
                                      {operation.isDefault && (
                                        <span className="ml-auto text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                                          Default
                                        </span>
                                      )}
                                    </label>
                                  </div>
                                );
                              })}
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}

