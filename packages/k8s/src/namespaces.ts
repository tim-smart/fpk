import { resolveContents } from "@fpk/core";
import { TContents } from "@fpk/core/dist/internal/config";
import { Namespace } from "kubernetes-types/core/v1";
import * as R from "ramda";
import { DeepPartial } from "./common";
import { maybeMergeResource, resource } from "./resources";

/**
 * A list of non namespaced resource kinds.
 */
export const nonNamespacedResources = [
  "ComponentStatus",
  "Namespace",
  "Node",
  "PersistentVolume",
  "MutatingWebhookConfiguration",
  "ValidatingWebhookConfiguration",
  "CustomResourceDefinition",
  "APIService",
  "TokenReview",
  "SelfSubjectAccessReview",
  "SelfSubjectRulesReview",
  "SubjectAccessReview",
  "ClusterIssuer",
  "CertificateSigningRequest",
  "NodeMetrics",
  "StorageState",
  "StorageVersionMigration",
  "RuntimeClass",
  "PodSecurityPolicy",
  "ClusterRoleBinding",
  "ClusterRole",
  "PriorityClass",
  "CSIDriver",
  "CSINode",
  "StorageClass",
  "VolumeAttachment",
];

/**
 * Create a namespace resource with the given name.
 *
 * The second argument is merged into the return value.
 */
export const namespace = (
  name: string,
  toMerge?: DeepPartial<Namespace>,
): Namespace =>
  maybeMergeResource<Namespace>(
    resource<Namespace>("v1", "Namespace", name),
    toMerge,
  );

/**
 * Set `metadata.namespace` for the resource. Ignores the following resource
 * kinds,  defined in `nonNamespacedResources`.
 *
 */
export const setNamespace = (namespace: string) =>
  R.when(
    R.pipe(
      R.view(R.lensProp("kind")),
      (kind) => !R.includes(kind, nonNamespacedResources),
    ),
    R.set(R.lensPath(["metadata", "namespace"]), namespace),
  ) as <T>(resource: T) => T;

/**
 * Returns a function that add's a `00-namespace` resource to the object, then
 * adds a matching `metadata.namespace` to each item in the object.
 */
export const withNamespace = (
  name: string,
  filename = "00-namespace",
  toMerge?: Namespace,
) => <T>(object: TContents<T>): Promise<T> =>
  resolveContents({}, object).then(
    R.pipe(
      R.mapObjIndexed(setNamespace(name)) as (i: T) => T,
      R.set(R.lensProp(filename), namespace(name, toMerge)),
    ),
  );
