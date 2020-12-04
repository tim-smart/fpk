import { ServiceSpec, Service } from "kubernetes-types/core/v1";
import * as R from "ramda";
import { DeepPartial } from "./common";
import { maybeMergeResource, resource, IResource } from "./resources";
import { Deployment } from "kubernetes-types/apps/v1";
import { viewPodPorts, viewPodLabels } from "./podTemplates";

/**
 * Creates a service resource
 */
export const service = (
  name: string,
  selector: ServiceSpec["selector"],
  toMerge?: DeepPartial<Service>,
) =>
  maybeMergeResource<Service>(
    resource<Service>("v1", "Service", name, { spec: { selector } }),
    toMerge,
  );

export const appendServicePort = (
  name: string,
  targetPort: number,
  port: number = targetPort,
) =>
  R.over(
    R.lensPath(["spec", "ports"]),
    R.pipe(
      R.defaultTo([]),
      R.append({
        name,
        port,
        targetPort,
      }),
    ),
  );

export const serviceWithPorts = (
  name: string,
  selector: ServiceSpec["selector"],
  ports: { [name: string]: number },
  toMerge?: DeepPartial<Service>,
) =>
  R.reduce(
    (svc, [name, port]) => appendServicePort(name, port, port)(svc),
    service(name, selector, toMerge),
    R.toPairs(ports),
  );

export const serviceFromPod = <T extends IResource>(
  name: string,
  r: T,
  toMerge?: DeepPartial<Service>,
) => {
  const ports = viewPodPorts(r);
  const s = service(name, viewPodLabels(r), {
    spec: {
      ports: ports.map(({ name, containerPort, protocol }) =>
        R.reject(R.isNil, {
          name,
          targetPort: containerPort,
          port: containerPort,
          protocol,
        }),
      ),
    },
  });
  return maybeMergeResource<Service>(s, toMerge);
};
