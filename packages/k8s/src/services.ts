import { ServiceSpec, Service } from "kubernetes-types/core/v1";
import * as R from "ramda";
import { DeepPartial } from "./common";
import { maybeMergeResource, resource } from "./resources";

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
