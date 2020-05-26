import {
  Container,
  EnvVar,
  EnvVarSource,
  ResourceRequirements,
  EnvFromSource,
  VolumeMount,
  Probe,
  HTTPGetAction,
  ConfigMap,
  Secret,
} from "kubernetes-types/core/v1";
import * as R from "ramda";
import { DeepPartial, Transformer } from "./common";
import { maybeMergeResource } from "./resources";

/**
 * Creates a container with the provided name and image
 */
export const container = (
  name: string,
  image: string,
  toMerge?: DeepPartial<Container>,
): Container =>
  maybeMergeResource<Container>(
    {
      name,
      image,
    },
    toMerge,
  );

/**
 * Creates a container with the provided name, image and port.
 */
export const containerWithPort = (
  name: string,
  image: string,
  containerPort: number,
  toMerge?: DeepPartial<Container>,
): Container =>
  maybeMergeResource<Container>(
    {
      name,
      image,
      ports: [{ containerPort }],
    },
    toMerge,
  );

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
 * Returns a function that sets envFrom for a container from a configMap
 */
export const appendEnvFromConfigMap = (configMap: ConfigMap) =>
  R.over(
    R.lensProp("envFrom"),
    R.pipe(
      R.defaultTo([]),
      R.append({
        configMapRef: {
          name: configMap!.metadata!.name,
        },
      } as EnvFromSource),
    ),
  );

/**
 * Returns a function that sets envFrom for a container from a secret
 */
export const appendEnvFromSecret = (secret: Secret) =>
  R.over(
    R.lensProp("envFrom"),
    R.pipe(
      R.defaultTo([]),
      R.append({
        secretRef: {
          name: secret!.metadata!.name,
        },
      } as EnvFromSource),
    ),
  );

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

const createProbe = (container: Container, toMerge: DeepPartial<Probe> = {}) =>
  R.pipe(
    R.when<Probe, Probe>(
      () => !R.isEmpty(container.ports),
      R.set(R.lensPath(["httpGet"]), {
        port: container.ports![0].containerPort,
        path: "/",
      } as HTTPGetAction),
    ),
    R.mergeDeepLeft(toMerge) as (p: Probe) => Probe,
  )({});

/**
 * Returns a function that sets the readinessProbe on a container.
 */
export const setReadinessProbe = (probe?: DeepPartial<Probe>) => (
  container: Container,
) =>
  R.set(R.lensProp("readinessProbe"), createProbe(container, probe), container);

/**
 * Returns a function that sets the livenessProbe on a container.
 */
export const setLivenessProbe = (probe?: DeepPartial<Probe>) => (
  container: Container,
) =>
  R.set(R.lensProp("livenessProbe"), createProbe(container, probe), container);

/**
 * Returns a function that sets the imagePullPolicy on a container.
 */
export const setImagePullPolicy = (policy: string) =>
  R.assoc("imagePullPolicy", policy) as Transformer;

/**
 * Returns a function that sets the command on a container.
 */
export const setCommand = (command: string[]) =>
  R.assoc("command", command) as Transformer;

/**
 * Returns a function that sets the args on a container.
 */
export const setArgs = (args: string[]) => R.assoc("args", args) as Transformer;
