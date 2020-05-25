import * as R from "ramda";
import { ObjectMeta } from "kubernetes-types/meta/v1";
import { DeepPartial } from "./common";

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
): T => R.ifElse(R.isNil, R.always(input), R.mergeDeepRight(input))(toMerge);

export const label = (key: string, value: string) =>
  R.over(
    R.lensPath(["metadata", "labels"]),
    R.pipe(R.defaultTo({}), R.set(R.lensProp(key), value)),
  );

export const annotate = (key: string, value: string) =>
  R.over(
    R.lensPath(["metadata", "annotations"]),
    R.pipe(R.defaultTo({}), R.set(R.lensProp(key), value)),
  );
