import {
  DaemonSet,
  DaemonSetUpdateStrategy,
  RollingUpdateDaemonSet,
} from "kubernetes-types/apps/v1";
import * as R from "ramda";
import { appendContainer } from "./podTemplates";
import { DeepPartial } from "./common";
import {
  containerWithPort,
  container,
  IEnvObject,
  concatEnv,
  setResourceRequests,
  setResourceLimits,
} from "./containers";
import { Container, ResourceRequirements } from "kubernetes-types/core/v1";
import { maybeMergeResource, resource } from "./resources";

/**
 * Create a deployment resource with the given name. The second argument is deep
 * merged into the deployment.
 */
export const daemonSet = (
  name: string,
  toMerge?: DeepPartial<DaemonSet>,
): DaemonSet =>
  maybeMergeResource<DaemonSet>(
    resource<DaemonSet>("apps/v1", "DaemonSet", name, {
      spec: {
        selector: {
          matchLabels: {
            app: name,
          },
        },
        template: {
          metadata: {
            labels: {
              app: name,
            },
          },
          spec: {
            containers: [],
          },
        },
      },
    }),
    toMerge,
  );

export interface IDaemonsetWithContainerOpts {
  name: string;
  image: string;
  containerPort?: number;
  env?: IEnvObject;
  container?: DeepPartial<Container>;

  resourceRequests?: ResourceRequirements["requests"];
  resourceLimits?: ResourceRequirements["limits"];
}

/**
 * Creates a daemonset with a single container. Has a couple options to help
 * make creating daemonsets easier.
 */
export const daemonSetWithContainer = (
  {
    name,
    image,
    containerPort,
    container: containerToMerge,
    env,
    resourceLimits,
    resourceRequests,
  }: IDaemonsetWithContainerOpts,
  toMerge: DeepPartial<DaemonSet> = {},
) =>
  R.pipe(
    appendContainer(
      R.pipe(
        R.when(() => !!env, concatEnv(env!)),
        R.when(() => !!resourceRequests, setResourceRequests(resourceRequests)),
        R.when(() => !!resourceLimits, setResourceLimits(resourceLimits)),
      )(
        containerPort
          ? containerWithPort(name, image, containerPort, containerToMerge)
          : container(name, image, containerToMerge),
      ),
    ) as (d: DaemonSet) => DaemonSet,
    R.mergeDeepLeft(toMerge) as (d: DaemonSet) => DaemonSet,
  )(daemonSet(name));

/**
 * Returns a function that sets `spec.updateStrategy` to the given strategy.
 */
export const setDaemonSetUpdateStrategy = (strategy: DaemonSetUpdateStrategy) =>
  R.set(R.lensPath(["spec", "updateStrategy"]), strategy) as (
    d: DaemonSet,
  ) => DaemonSet;

/**
 * Returns a funciton that sets `spec.updateStrategy` to type "Recreate".
 */
export const setDaemonSetOnDelete = () =>
  setDaemonSetUpdateStrategy({
    type: "OnDelete",
  });

/**
 * Returns a funciton that sets `spec.updateStrategy` to type "RollingUpdate" with the
 * given options.
 */
export const setDaemonSetRollingUpdate = (
  rollingUpdate: RollingUpdateDaemonSet,
) =>
  setDaemonSetUpdateStrategy({
    type: "RollingUpdate",
    rollingUpdate,
  });
