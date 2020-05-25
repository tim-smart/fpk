import { ServiceAccount } from "kubernetes-types/core/v1";
import { ClusterRole, ClusterRoleBinding } from "kubernetes-types/rbac/v1";
import { DeepPartial } from "./common";
import { maybeMergeResource, IResource, resource } from "./resources";

/**
 * Creates a ServiceAccount resource.
 */
export const serviceAccount = (
  name: string,
  toMerge?: DeepPartial<ServiceAccount>,
): ServiceAccount =>
  maybeMergeResource<ServiceAccount>(
    resource<ServiceAccount>("v1", "ServiceAccount", name),
    toMerge,
  );

/**
 * Creates an rbac resource.
 */
export const rbac = <T extends IResource>(
  kind: T["kind"],
  name: string,
  toMerge?: DeepPartial<T>,
): T =>
  maybeMergeResource(
    resource<T>("rbac.authorization.k8s.io/v1", kind, name),
    toMerge,
  );
