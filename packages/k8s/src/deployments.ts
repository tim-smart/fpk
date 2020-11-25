import {
  Deployment,
  DeploymentStrategy,
  RollingUpdateDeployment,
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
  containerWithPorts,
} from "./containers";
import { Container } from "kubernetes-types/core/v1";
import { maybeMergeResource, resource } from "./resources";

/**
 * Create a deployment resource with the given name. The second argument is deep
 * merged into the deployment.
 */
export const deployment = (
  name: string,
  toMerge?: DeepPartial<Deployment>,
): Deployment =>
  maybeMergeResource<Deployment>(
    resource<Deployment>("apps/v1", "Deployment", name, {
      spec: {
        replicas: 1,
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

/**
 * Creates a deployment with a single container. Has a couple options to help
 * make creating deployments easier.
 */
export const deploymentWithContainer = (
  container: Container,
  toMerge?: DeepPartial<Deployment>,
) =>
  R.pipe(
    R.always(deployment(container.name)),
    appendContainer(container),
    (d: Deployment) => maybeMergeResource<Deployment>(d, toMerge),
  )();

/**
 * Returns a funciton that sets `spec.replicas` to the given number.
 */
export const setReplicas = (replicas: number) =>
  R.set(R.lensPath(["spec", "replicas"]), replicas);

/**
 * Returns a function that sets `spec.strategy` to the given strategy.
 */
export const setDeploymentStrategy = (strategy: DeploymentStrategy) =>
  R.set(R.lensPath(["spec", "strategy"]), strategy) as (
    deployment: Deployment,
  ) => Deployment;

/**
 * Returns a funciton that sets `spec.strategy` to type "Recreate".
 */
export const setDeploymentRecreate = () =>
  setDeploymentStrategy({
    type: "Recreate",
  });

/**
 * Returns a funciton that sets `spec.strategy` to type "RollingUpdate" with the
 * given options.
 */
export const setDeploymentRollingUpdate = (
  rollingUpdate: RollingUpdateDeployment,
) =>
  setDeploymentStrategy({
    type: "RollingUpdate",
    rollingUpdate,
  });

export const setRevisionHistory = (count: number) =>
  R.set(R.lensPath(["spec", "revisionHistoryLimit"]), count);
