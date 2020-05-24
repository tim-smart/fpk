import { PodTemplateSpec, Container } from "kubernetes-types/core/v1";
import * as R from "ramda";

export interface IPodTemplateTransformer {
  (spec: PodTemplateSpec): PodTemplateSpec;
}

/**
 * Returns a function that will run the given pod transformer over the supplied
 * resource. Useful for updating pod templates for various resource types.
 *
 * ```
 * const setEmptyContainers = overPodTemplate((pod) => ({...pod, spec: {containers: []}}));
 *
 * setEmptyContainers(deployment)
 * setEmptyContainers(daemonSet)
 * setEmptyContainers(cronjob)
 * ```
 */
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

/**
 * Returns a function that concats a list of containers to the given resource.
 *
 * ```
 * const containerPusher = concatContainers([{ image: "fancyimage" }]);
 *
 * containerPusher(deployment);
 * containerPusher(daemonSet);
 * ```
 */
export const concatContainers = (containers: Container[]) => <T>(object: T) =>
  overPodTemplate(
    R.over(
      R.lensPath(["spec", "containers"]),
      R.pipe(R.defaultTo([]), R.concat(R.__, containers)),
    ),
  )(object);

/**
 * Returns a function that appends the container to the given resource.
 *
 * ```
 * const containerPusher = appendContainer({ image: "fancyimage" });
 *
 * containerPusher(deployment);
 * containerPusher(daemonSet);
 * ```
 */
export const appendContainer = (container: Container) =>
  concatContainers([container]);
