"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import * as React from "react";
import {
  useGrantRoleFeatureAccess,
  useGrantRoleModuleAccess,
  useGrantRoleSubmoduleAccess,
  useGrantRoleFeatureOperationAccess,
  useModules,
  useRoleFeatureAccess,
  useRoleModuleAccess,
  useRoleSubmoduleAccess,
  useRoleFeatureOperationAccess,
  useRoles,
  useSubmodules,
  useFeatures,
  useOperations,
  useRevokeRoleModuleAccess,
  useRevokeRoleSubmoduleAccess,
  useRevokeRoleFeatureAccess,
  useRevokeRoleFeatureOperationAccess,
  useFeatureOperations,
} from "../../hooks/use-system-management";

export function RoleAccessTab() {
  const { data: roles } = useRoles();
  const { data: modules } = useModules();
  const { data: submodules } = useSubmodules();
  const { data: features } = useFeatures();
  const { data: operations } = useOperations();
  const [selectedRoleId, setSelectedRoleId] = React.useState<string>("");

  const { data: moduleAccess } = useRoleModuleAccess(selectedRoleId);
  const { data: submoduleAccess } = useRoleSubmoduleAccess(selectedRoleId);
  const { data: featureAccess } = useRoleFeatureAccess(selectedRoleId);
  const { data: featureOperationAccess } = useRoleFeatureOperationAccess(selectedRoleId);

  const grantModuleAccess = useGrantRoleModuleAccess();
  const grantSubmoduleAccess = useGrantRoleSubmoduleAccess();
  const grantFeatureAccess = useGrantRoleFeatureAccess();
  const grantFeatureOperationAccess = useGrantRoleFeatureOperationAccess();
  const revokeModuleAccess = useRevokeRoleModuleAccess();
  const revokeSubmoduleAccess = useRevokeRoleSubmoduleAccess();
  const revokeFeatureAccess = useRevokeRoleFeatureAccess();
  const revokeFeatureOperationAccess = useRevokeRoleFeatureOperationAccess();

  if (!roles || roles.length === 0) {
    return <div>No roles available. Please create a role first.</div>;
  }

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const hasModuleAccess = (moduleId: string) =>
    moduleAccess?.some((a) => a.moduleId === moduleId) ?? false;
  const hasSubmoduleAccess = (submoduleId: string) =>
    submoduleAccess?.some((a) => a.submoduleId === submoduleId) ?? false;
  const hasFeatureAccess = (featureId: string) =>
    featureAccess?.some((a) => a.featureId === featureId) ?? false;
  const hasFeatureOperationAccess = (featureId: string, operationId: string) =>
    featureOperationAccess?.some((a) => a.featureId === featureId && a.operationId === operationId) ?? false;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Role Access Control</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Role</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select a role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedRoleId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Module Access - {selectedRole?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules?.map((module) => {
                    const hasAccess = hasModuleAccess(module.id);
                    return (
                      <TableRow key={module.id}>
                        <TableCell className="font-medium">{module.name}</TableCell>
                        <TableCell>{hasAccess ? "✓ Granted" : "✗ Not Granted"}</TableCell>
                        <TableCell>
                          {hasAccess ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => revokeModuleAccess.mutate({ roleId: selectedRoleId, moduleId: module.id })}
                            >
                              Revoke
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => grantModuleAccess.mutate({ roleId: selectedRoleId, moduleId: module.id })}
                            >
                              Grant
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Submodule Access - {selectedRole?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Submodule</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submodules?.map((submodule) => {
                    const hasAccess = hasSubmoduleAccess(submodule.id);
                    return (
                      <TableRow key={submodule.id}>
                        <TableCell className="font-medium">{submodule.name}</TableCell>
                        <TableCell>{modules?.find((m) => m.id === submodule.moduleId)?.name || "-"}</TableCell>
                        <TableCell>{hasAccess ? "✓ Granted" : "✗ Not Granted"}</TableCell>
                        <TableCell>
                          {hasAccess ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                revokeSubmoduleAccess.mutate({ roleId: selectedRoleId, submoduleId: submodule.id })
                              }
                            >
                              Revoke
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() =>
                                grantSubmoduleAccess.mutate({ roleId: selectedRoleId, submoduleId: submodule.id })
                              }
                            >
                              Grant
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feature Access - {selectedRole?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    <TableHead>Submodule</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {features?.map((feature) => {
                    const hasAccess = hasFeatureAccess(feature.id);
                    return (
                      <TableRow key={feature.id}>
                        <TableCell className="font-medium">{feature.name}</TableCell>
                        <TableCell>{submodules?.find((s) => s.id === feature.submoduleId)?.name || "-"}</TableCell>
                        <TableCell>{hasAccess ? "✓ Granted" : "✗ Not Granted"}</TableCell>
                        <TableCell>
                          {hasAccess ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => revokeFeatureAccess.mutate({ roleId: selectedRoleId, featureId: feature.id })}
                            >
                              Revoke
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => grantFeatureAccess.mutate({ roleId: selectedRoleId, featureId: feature.id })}
                            >
                              Grant
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feature Operation Access (Level 4) - {selectedRole?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {features?.map((feature) => {
                  const featureOps = feature.featureOperations || [];
                  if (featureOps.length === 0) return null;

                  return (
                    <div key={feature.id} className="border rounded-lg p-4">
                      <div className="font-semibold mb-2">
                        {feature.name} ({submodules?.find((s) => s.id === feature.submoduleId)?.name || "Unknown Submodule"})
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Operation</TableHead>
                            <TableHead>Access</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {featureOps.map((fo) => {
                            const operation = operations?.find((op) => op.id === fo.operationId);
                            if (!operation) return null;
                            const hasAccess = hasFeatureOperationAccess(feature.id, operation.id);
                            return (
                              <TableRow key={fo.id}>
                                <TableCell className="font-medium">
                                  {operation.name} ({operation.slug})
                                </TableCell>
                                <TableCell>{hasAccess ? "✓ Granted" : "✗ Not Granted"}</TableCell>
                                <TableCell>
                                  {hasAccess ? (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() =>
                                        revokeFeatureOperationAccess.mutate({
                                          roleId: selectedRoleId,
                                          featureId: feature.id,
                                          operationId: operation.id,
                                        })
                                      }
                                    >
                                      Revoke
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        grantFeatureOperationAccess.mutate({
                                          roleId: selectedRoleId,
                                          featureId: feature.id,
                                          operationId: operation.id,
                                        })
                                      }
                                    >
                                      Grant
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })}
                {features?.every((f) => !f.featureOperations || f.featureOperations.length === 0) && (
                  <p className="text-muted-foreground text-center py-4">
                    No feature operations available. Please assign operations to features first.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

