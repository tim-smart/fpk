import * as R from "ramda";

export type DeepPartial<T> = T extends Function
  ? T
  : T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

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
