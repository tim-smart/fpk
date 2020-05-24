import {
  Deployment,
  DeploymentStrategy,
  RollingUpdateDeployment,
} from "kubernetes-types/apps/v1";
import * as R from "ramda";
import { concatPodContainers, overPodTemplate } from "./podTemplates";

export const deployment = (
  name: string,
  toMerge: Deployment = {},
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

export const setDeploymentStrategy = (strategy: DeploymentStrategy) => (
  deployment: Deployment,
) => R.set(R.lensPath(["spec", "strategy"]), strategy, deployment);

export const setDeploymentRollingUpdate = (
  rollingUpdate: RollingUpdateDeployment,
) => (deployment: Deployment) =>
  setDeploymentStrategy({
    type: "RollingUpdate",
    rollingUpdate,
  })(deployment);
