import {
  PodTemplateSpec,
  Container,
  Volume,
  VolumeMount,
} from "kubernetes-types/core/v1";
import * as R from "ramda";
import { DeepPartial } from "./common";
import { appendVolumeMount } from "./containers";

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
export const overPodTemplate = (
  fn: (pod: PodTemplateSpec) => PodTemplateSpec,
) => <T>(object: T) => {
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
export const concatContainers = (containers: Container[]) =>
  overPodTemplate(
    R.over(
      R.lensPath(["spec", "containers"]),
      R.pipe(R.defaultTo([]), R.concat(R.__, containers)),
    ),
  );

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

/**
 * Returns a function that runs the given containers transformer in a resource.
 */
export const overContainers = (fn: (containers: Container[]) => Container[]) =>
  overPodTemplate(
    R.over(R.lensPath(["spec", "containers"]), R.pipe(R.defaultTo([]), fn)),
  );

/**
 * Returns a function that finds a container by name, and runs the transformer
 * over it in a resource.
 */
export const overContainer = (
  name: string,
  fn: (container: Container) => Container,
) =>
  overPodTemplate(
    R.over(
      R.lensPath(["spec", "containers"]),
      R.pipe(
        R.defaultTo([]),
        R.map(R.when(R.pipe(R.prop("name"), R.equals(name)), fn)),
      ),
    ),
  );

/**
 * Returns a function that adds a volume to the pod template.
 */
export const appendVolume = (name: string, volume: DeepPartial<Volume>) =>
  overPodTemplate(
    R.over(
      R.lensPath(["spec", "volumes"]),
      R.pipe(
        R.defaultTo([]),
        R.append(R.mergeDeepRight({ name }, volume) as Volume),
      ),
    ),
  );

/**
 * Returns a function that adds a volume and mounts it to a container.
 */
export const appendVolumeAndMount = ({
  name,
  containerName,
  volume,
  mountPath,
  mount = {},
}: {
  name: string;
  containerName: string;
  volume: DeepPartial<Volume>;
  mountPath: string;
  mount?: DeepPartial<VolumeMount>;
}) =>
  R.pipe(
    appendVolume(name, volume),
    overContainer(containerName, appendVolumeMount(name, mountPath, mount)),
  );
