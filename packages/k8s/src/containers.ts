import {
  Container,
  EnvVar,
  EnvVarSource,
  ResourceRequirements,
  EnvFromSource,
  VolumeMount,
} from "kubernetes-types/core/v1";
import * as R from "ramda";
import { DeepPartial } from "./common";

/**
 * Creates a container with the provided name and image
 */
export const container = (
  name: string,
  image: string,
  toMerge: DeepPartial<Container> = {},
): Container =>
  R.mergeDeepRight(
    {
      name,
      image,
    } as Container,
    toMerge,
  ) as Container;

/**
 * Creates a container with the provided name, image and port.
 */
export const containerWithPort = (
  name: string,
  image: string,
  containerPort: number,
  toMerge: DeepPartial<Container> = {},
): Container =>
  R.mergeDeepRight(
    {
      name,
      image,
      ports: [{ containerPort }],
    } as Container,
    toMerge,
  ) as Container;

export interface IEnvObject {
  [key: string]: string | EnvVarSource;
}

/**
 * Returns a function that sets the environment variables on a container from a
 * object.
 */
export const concatEnv = (env: IEnvObject) =>
  R.over(
    R.lensProp("env"),
    R.pipe(R.defaultTo([]), (e: EnvVar[]) =>
      R.concat(
        e,
        R.pipe(
          R.keys,
          R.map(
            (name): EnvVar => {
              const value = env[name];

              return typeof value === "string"
                ? {
                    name,
                    value,
                  }
                : {
                    name,
                    valueFrom: value,
                  };
            },
          ),
        )(env),
      ),
    ),
  ) as (c: Container) => Container;

/**
 * Returns a function thats set resource requests on a container.
 */
export const setResourceRequests = (
  requests: ResourceRequirements["requests"],
) =>
  R.over(
    R.lensProp("resources"),
    R.mergeLeft({
      requests,
    }),
  );

/**
 * Returns a function thats set resource limits on a container.
 */
export const setResourceLimits = (limits: ResourceRequirements["limits"]) =>
  R.over(
    R.lensProp("resources"),
    R.mergeLeft({
      limits,
    }),
  );

/**
 * Returns a function that sets envFrom for a container
 */
export const appendEnvFrom = (envFrom: EnvFromSource) =>
  R.over(R.lensProp("envFrom"), R.pipe(R.defaultTo([]), R.append(envFrom)));

/**
 * Returns a function that appends a volume mount to a container.
 */
export const appendVolumeMount = (
  name: string,
  mountPath: string,
  merge: DeepPartial<VolumeMount>,
) =>
  R.over(
    R.lensProp("volumeMounts"),
    R.pipe(
      R.defaultTo([]),
      R.append(
        R.mergeRight(
          {
            name,
            mountPath,
          } as VolumeMount,
          merge,
        ),
      ),
    ),
  );
