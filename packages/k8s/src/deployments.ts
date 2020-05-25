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
} from "./containers";
import { Container, ResourceRequirements } from "kubernetes-types/core/v1";

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

export interface IDeploymentWithContainerOpts {
  name: string;
  replicas?: number;
  image: string;
  containerPort?: number;
  env?: IEnvObject;
  container?: DeepPartial<Container>;

  resourceRequests?: ResourceRequirements["requests"];
  resourceLimits?: ResourceRequirements["limits"];
}

/**
 * Creates a deployment with a single container. Has a couple options to help
 * make creating deployments easier.
 */
export const deploymentWithContainer = (
  {
    name,
    replicas = 1,
    image,
    containerPort,
    container: containerToMerge,
    env,
    resourceLimits,
    resourceRequests,
  }: IDeploymentWithContainerOpts,
  toMerge: DeepPartial<Deployment> = {},
) =>
  R.pipe(
    setReplicas(replicas),
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
    ),
    R.mergeDeepLeft(toMerge) as (d: Deployment) => Deployment,
  )(deployment(name));

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
