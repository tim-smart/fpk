import * as F from "fp-ts/function";
import {
  ConfigMap,
  Container,
  ContainerPort,
  EnvFromSource,
  EnvVar,
  EnvVarSource,
  HTTPGetAction,
  Probe,
  ResourceRequirements,
  Secret,
  VolumeMount,
} from "kubernetes-types/core/v1";
import * as R from "ramda";
import { DeepPartial } from "./common";
import { maybeMergeResource } from "./resources";

export type TContainerTransform = (container: Container) => Container;

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
 * Appends a port to a container
 */
export const appendPort = (
  containerPort: number,
  name?: string,
  protocol?: string,
): TContainerTransform =>
  R.over(
    R.lensProp("ports"),
    F.flow(
      R.defaultTo([]),
      R.append(
        F.pipe(
          { containerPort } as ContainerPort,
          R.when(() => !!name, R.assoc("name", name!)),
          R.when(() => !!protocol, R.assoc("protocol", protocol!)),
        ),
      ),
    ),
  );

/**
 * Creates a container with the provided name, image and port.
 */
export const containerWithPort = (
  name: string,
  image: string,
  containerPort: number,
  toMerge?: DeepPartial<Container>,
): Container => appendPort(containerPort)(container(name, image, toMerge));

/**
 * Creates a container with the provided name, image and ports.
 */
export const containerWithPorts = (
  name: string,
  image: string,
  ports: { [name: string]: number },
  toMerge?: DeepPartial<Container>,
): Container =>
  R.reduce(
    (c, [name, port]) => appendPort(port, name)(c),
    container(name, image, toMerge),
    R.toPairs(ports),
  );

export interface IEnvObject {
  [key: string]: string | EnvVarSource;
}

/**
 * Returns a function that sets the environment variables on a container from a
 * object.
 */
export const concatEnv = (env: IEnvObject): TContainerTransform =>
  R.over(
    R.lensProp("env"),
    F.flow(R.defaultTo([]), (e: EnvVar[]) =>
      R.concat(
        e,
        F.pipe(
          env,
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
        ),
      ),
    ),
  );

/**
 * Returns a function thats set resource requests on a container.
 */
export const setResourceRequests = (
  requests: ResourceRequirements["requests"],
): TContainerTransform =>
  R.over(R.lensProp("resources"), R.mergeLeft({ requests }));

/**
 * Returns a function thats set resource limits on a container.
 */
export const setResourceLimits = (
  limits: ResourceRequirements["limits"],
): TContainerTransform =>
  R.over(R.lensProp("resources"), R.mergeLeft({ limits }));

/**
 * Returns a function that sets envFrom for a container
 */
export const appendEnvFrom = (envFrom: EnvFromSource): TContainerTransform =>
  R.over(R.lensProp("envFrom"), F.flow(R.defaultTo([]), R.append(envFrom)));

/**
 * Returns a function that sets envFrom for a container from a configMap
 */
export const appendEnvFromConfigMap = (
  configMap: ConfigMap,
): TContainerTransform =>
  R.over(
    R.lensProp("envFrom"),
    F.flow(
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
export const appendEnvFromSecret = (secret: Secret): TContainerTransform =>
  R.over(
    R.lensProp("envFrom"),
    F.flow(
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
  volumeName: string,
  mountPath: string,
  merge?: DeepPartial<VolumeMount>,
): TContainerTransform =>
  R.over(
    R.lensProp("volumeMounts"),
    F.flow(
      R.defaultTo([]),
      R.append(
        maybeMergeResource<VolumeMount>(
          {
            name: volumeName,
            mountPath,
          } as VolumeMount,
          merge,
        ),
      ),
    ),
  );

const createProbe = (
  container: Container,
  toMerge?: DeepPartial<Probe>,
): Probe =>
  F.pipe(
    {},
    R.when(
      () => !R.isEmpty(container.ports),
      R.assoc("httpGet", {
        port: container.ports![0].containerPort,
        path: "/",
      } as HTTPGetAction),
    ),
    (p) => maybeMergeResource<Probe>(p, toMerge),
  );

/**
 * Returns a function that sets the readinessProbe on a container.
 */
export const setReadinessProbe = (
  probe?: DeepPartial<Probe>,
): TContainerTransform => (c) =>
  R.assoc("readinessProbe", createProbe(c, probe), c);

/**
 * Returns a function that sets the livenessProbe on a container.
 */
export const setLivenessProbe = (
  probe?: DeepPartial<Probe>,
): TContainerTransform => (c) =>
  R.assoc("livenessProbe", createProbe(c, probe), c);

/**
 * Returns a function that sets the imagePullPolicy on a container.
 */
export const setImagePullPolicy = (policy: string): TContainerTransform =>
  R.assoc("imagePullPolicy", policy);

/**
 * Returns a function that sets the command on a container.
 */
export const setCommand = (command: string[]): TContainerTransform =>
  R.assoc("command", command);

/**
 * Returns a function that sets the args on a container.
 */
export const setArgs = (args: string[]): TContainerTransform =>
  R.assoc("args", args);
