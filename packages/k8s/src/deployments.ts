import {
  Deployment,
  DeploymentStrategy,
  RollingUpdateDeployment,
} from "kubernetes-types/apps/v1";
import * as R from "ramda";
import { concatContainers, overPodTemplate } from "./podTemplates";
import { DeepPartial } from "./common";

/**
 * Create a deployment resource with the given name. The second argument is deep
 * merged into the deployment.
 */
export const deployment = (
  name: string,
  toMerge: DeepPartial<Deployment> = {},
): Deployment => {
  const config: Deployment = {
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: {
      name,
      labels: {
        app: name,
      },
    },
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
  };

  return R.mergeDeepRight<any, any>(config, toMerge);
};

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
