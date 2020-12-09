import * as F from "fp-ts/function";
import {
  Deployment,
  DeploymentStrategy,
  RollingUpdateDeployment,
} from "kubernetes-types/apps/v1";
import { Container } from "kubernetes-types/core/v1";
import * as R from "ramda";
import { DeepPartial } from "./common";
import { appendContainer } from "./podTemplates";
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
  name: string,
  container: Container,
  toMerge?: DeepPartial<Deployment>,
): Deployment =>
  F.pipe(deployment(name), appendContainer(container), (d) =>
    maybeMergeResource<Deployment>(d, toMerge),
  );

export type TDeploymentTransform = (d: Deployment) => Deployment;

/**
 * Returns a funciton that sets `spec.replicas` to the given number.
 */
export const setReplicas = (replicas: number): TDeploymentTransform =>
  R.set(R.lensPath(["spec", "replicas"]), replicas);

/**
 * Returns a function that sets `spec.strategy` to the given strategy.
 */
export const setDeploymentStrategy = (
  strategy: DeploymentStrategy,
): TDeploymentTransform => R.set(R.lensPath(["spec", "strategy"]), strategy);

/**
 * Returns a funciton that sets `spec.strategy` to type "Recreate".
 */
export const setDeploymentRecreate = (): TDeploymentTransform =>
  setDeploymentStrategy({
    type: "Recreate",
  });

/**
 * Returns a funciton that sets `spec.strategy` to type "RollingUpdate" with the
 * given options.
 */
export const setDeploymentRollingUpdate = (
  rollingUpdate: RollingUpdateDeployment,
): TDeploymentTransform =>
  setDeploymentStrategy({
    type: "RollingUpdate",
    rollingUpdate,
  });

/**
 * Returns a functions that sets the deployment revisionHistoryLimit to the
 * specified count.
 */
export const setRevisionHistory = (count: number): TDeploymentTransform =>
  R.set(R.lensPath(["spec", "revisionHistoryLimit"]), count);
