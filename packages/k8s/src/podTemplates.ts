import * as F from "fp-ts/function";
import * as O from "fp-ts/Option";
import {
  Container,
  ContainerPort,
  PodTemplateSpec,
  Volume,
  VolumeMount,
} from "kubernetes-types/core/v1";
import { ObjectMeta } from "kubernetes-types/meta/v1";
import * as R from "ramda";
import { DeepPartial } from "./common";
import { appendVolumeMount } from "./containers";
import { IResource } from "./resources";

type TResourceTransformer = <T>(resource: T) => T;
type TResourceViewer<T> = (resource: IResource) => T;

const podTemplateLens = <T>(object: T): O.Option<R.Lens> => {
  if ((object as any).kind === "Pod") {
    return O.some(R.lensPath([]));
  } else if (R.hasPath(["spec", "jobTemplate", "spec", "template"], object)) {
    return O.some(R.lensPath(["spec", "jobTemplate", "spec", "template"]));
  } else if (R.hasPath(["spec", "template"], object)) {
    return O.some(R.lensPath(["spec", "template"]));
  }

  return O.none;
};

/**
 * Returns the pod template for a resource if it exists.
 */
export const viewPodTemplate = <T extends IResource>(object: T) =>
  F.pipe(
    podTemplateLens(object),
    O.map((lens) => R.view(lens, object) as PodTemplateSpec),
  );

/**
 * Returns the property at the specified path for the given resource pod
 * template.
 */
export const viewPodPath = <R = unknown>(
  path: string[],
): TResourceViewer<O.Option<NonNullable<R>>> =>
  F.flow(
    viewPodTemplate,
    O.mapNullable((pod) => R.path(path, pod)),
  );

/**
 * Returns the metadata labels for the given resource pod
 * template.
 */
export const viewPodLabels: TResourceViewer<
  NonNullable<ObjectMeta["labels"]>
> = F.flow(
  viewPodPath(["metadata", "labels"]),
  O.getOrElse<NonNullable<ObjectMeta["labels"]>>(() => ({})),
);

/**
 * Returns the metadata annotations for the given resource pod
 * template.
 */
export const viewPodAnnotations: TResourceViewer<
  NonNullable<ObjectMeta["annotations"]>
> = F.flow(
  viewPodPath(["metadata", "annotations"]),
  O.getOrElse<NonNullable<ObjectMeta["annotations"]>>(() => ({})),
);

/**
 * Returns the containers for the given resource pod template.
 */
export const viewPodContainers: TResourceViewer<Container[]> = F.flow(
  viewPodPath(["spec", "containers"]),
  O.getOrElse<Container[]>(() => []),
);

/**
 * Returns the aggregated ports for the given resource pod template.
 */
export const viewPodPorts: TResourceViewer<ContainerPort[]> = F.flow(
  viewPodContainers,
  R.reduce((ports, c) => [...ports, ...(c.ports || [])], [] as ContainerPort[]),
);

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
): TResourceTransformer => (object) =>
  F.pipe(
    podTemplateLens(object),
    O.fold(
      () => object,
      (lens) => R.over(lens, fn, object),
    ),
  );

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
  overContainers(R.concat(R.__, containers));

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
 * Returns a function that concats a list of init containers to the given resource.
 *
 * ```
 * const containerPusher = concatInitContainers([{ image: "fancyimage" }]);
 *
 * containerPusher(deployment);
 * containerPusher(daemonSet);
 * ```
 */
export const concatInitContainers = (containers: Container[]) =>
  overInitContainers(R.concat(R.__, containers));

/**
 * Returns a function that appends the init container to the given resource.
 *
 * ```
 * const containerPusher = appendInitContainer({ image: "fancyimage" });
 *
 * containerPusher(deployment);
 * containerPusher(daemonSet);
 * ```
 */
export const appendInitContainer = (container: Container) =>
  concatInitContainers([container]);

/**
 * Return a function that runs the transform function over the given path.
 */
export const overPodTemplatePath = <R>(path: string[]) => (
  fn: (input: R) => R,
) => overPodTemplate(R.over(R.lensPath(path), fn));

/**
 * Returns a function that runs the given containers transformer in a resource.
 */
export const overContainers = (fn: (containers: Container[]) => Container[]) =>
  overPodTemplatePath<Container[]>(["spec", "containers"])(
    R.pipe(R.defaultTo([]), fn),
  );

/**
 * Returns a function that finds a container by name, and runs the transformer
 * over it in a resource.
 */
export const overContainer = (name: string) => (
  fn: (container: Container) => Container,
): TResourceTransformer =>
  overContainers(R.map(R.when(R.propEq("name", name), fn)));

/**
 * Returns a function that finds the first container, and runs the transformer
 * over it in a resource.
 */
export const overFirstContainer = (fn: (container: Container) => Container) =>
  overContainers(R.over(R.lensIndex(0), fn));

/**
 * Returns a function that runs the given init containers transformer in a
 * resource.
 */
export const overInitContainers = (
  fn: (containers: Container[]) => Container[],
) =>
  overPodTemplatePath<Container[]>(["spec", "initContainers"])(
    R.pipe(R.defaultTo([]), fn),
  );

/**
 * Returns a function that finds an init container by name, and runs the
 * transformer over it in a resource.
 */
export const overInitContainer = (name: string) => (
  fn: (container: Container) => Container,
) => overInitContainers(R.map(R.when(R.propEq("name", name), fn)));

/**
 * Returns a function that finds the first init container, and runs the
 * transformer over it in a resource.
 */
export const overFirstInitContainer = (
  fn: (container: Container) => Container,
) => overInitContainers(R.over(R.lensIndex(0), fn));

/**
 * Returns a function that adds a volume to the pod template.
 */
export const appendVolume = (volume: Volume) =>
  overPodTemplatePath<Volume[]>(["spec", "volumes"])(
    R.pipe(R.defaultTo([]), R.append(volume)),
  );

export type TContainerSelector = (
  fn: (c: Container) => Container,
) => <R>(resource: R) => R;

/**
 * Returns a function that adds a volume and mounts it to a container.
 */
export const appendVolumeAndMount = ({
  overContainer = overFirstContainer,
  volume,
  mountPath,
  mount = {},
}: {
  overContainer?: TContainerSelector;
  volume: Volume;
  mountPath: string;
  mount?: DeepPartial<VolumeMount>;
}): TResourceTransformer =>
  R.pipe(
    appendVolume(volume),
    overContainer(appendVolumeMount(volume.name, mountPath, mount)),
  );

/**
 * Returns a function that sets the restart policy for the resource
 */
export const setRestartPolicy = (policy: string) =>
  overPodTemplate(R.assocPath(["spec", "restartPolicy"], policy));
