import { Namespace } from "kubernetes-types/core/v1";
import * as R from "ramda";
import { DeepPartial } from "./common";
import { resolveContents } from "@fpk/core";
import { maybeMergeResource, resource } from "./resources";
import { TContents } from "@fpk/core/dist/internal/config";

const nonNamespacedResources = [
  "ComponentStatus",
  "Namespace",
  "Node",
  "PersistentVolume",
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
 * types:
 *
 * * ComponentStatus
 * * Namespace
 * * Node
 * * PersistentVolume
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
export const withNamespace = (name: string, toMerge?: Namespace) => <T>(
  object: TContents<T>,
): Promise<T> =>
  resolveContents({}, object).then(
    R.pipe(
      R.mapObjIndexed(setNamespace(name)) as (i: T) => T,
      R.set(R.lensProp("00-namespace"), namespace(name, toMerge)),
    ),
  );
