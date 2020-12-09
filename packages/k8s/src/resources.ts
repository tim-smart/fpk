import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as R from "ramda";
import { ObjectMeta } from "kubernetes-types/meta/v1";
import { DeepPartial } from "./common";
import { CrossVersionObjectReference } from "kubernetes-types/autoscaling/v2beta2";

export interface IResource {
  apiVersion?: string;
  kind?: string;
  metadata?: ObjectMeta;
}

/**
 * Create a kubernetes resource with the given apiVersion, kind and name.
 */
export const resource = <T extends IResource>(
  apiVersion: T["apiVersion"],
  kind: T["kind"],
  name: string,
  extra: Partial<T> = {},
): T =>
  ({
    apiVersion,
    kind,
    metadata: {
      name,
    },
    ...extra,
  } as T);

/**
 * Deep merge resources if needed.
 */
export const maybeMergeResource = <T extends object>(
  input: T,
  toMerge?: DeepPartial<T>,
): T =>
  F.pipe(
    O.fromNullable(toMerge),
    O.fold(
      () => input,
      (tm) => R.mergeDeepRight(input, tm) as T,
    ),
  );

/**
 * Returns a function that adds a metadata label to a resource
 */
export const label = (key: string, value: string) =>
  R.over(
    R.lensPath(["metadata", "labels"]),
    R.pipe(R.defaultTo({}), R.set(R.lensProp(key), value)),
  );

/**
 * Returns a function that adds a metadata annotation to a resource
 */
export const annotate = (key: string, value: string) =>
  R.over(
    R.lensPath(["metadata", "annotations"]),
    R.pipe(R.defaultTo({}), R.set(R.lensProp(key), value)),
  );

/**
 * Returns a CrossVersionObjectReference for a resource
 */
export const objectRef = (
  resource: IResource,
): CrossVersionObjectReference => ({
  apiVersion: resource.apiVersion,
  kind: resource.kind!,
  name: resource.metadata!.name!,
});

/**
 * Returns a function that can be used to find matching resources.
 */
export const matches = <R extends IResource>(kind: string, name?: string) => (
  r: R,
): boolean => r.kind === kind && (name ? r.metadata?.name === name : true);

/**
 * Returns a function that finds a matching resource, then runs the transform
 * function over it.
 */
export const overResource = <R extends IResource>(
  kind: R["kind"],
  name?: string,
) => (fn: (resource: R) => R) => (obj: { [key: string]: any }) =>
  R.mapObjIndexed(R.when(matches(kind!, name), fn), obj);
