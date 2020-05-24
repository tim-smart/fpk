import { PodTemplateSpec, Container } from "kubernetes-types/core/v1";
import * as R from "ramda";

export interface IPodTemplateTransformer {
  (spec: PodTemplateSpec): PodTemplateSpec;
}

export const overPodTemplate = (fn: IPodTemplateTransformer) => <T>(
  object: T,
) => {
  if ((object as any).kind === "Pod") {
    return fn(object) as T;
  } else if (R.hasPath(["spec", "jobTemplate", "spec", "template"], object)) {
    return R.over(
      R.lensPath(["spec", "jobTemplate", "spec", "template"]),
      fn,
      object,
    );
  } else if (R.hasPath(["spec", "template"], object)) {
    return R.over(R.lensPath(["spec", "template"]), fn, object);
  }

  return object;
};

export const concatPodContainers = (containers: Container[]) => <T>(
  object: T,
) =>
  overPodTemplate(
    R.over(
      R.lensPath(["spec", "containers"]),
      R.pipe(R.defaultTo([]), R.concat(R.__, containers)),
    ),
  )(object);
