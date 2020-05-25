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

export const appendServicePort = (targetPort: number, port: number) =>
  R.over(
    R.lensPath(["spec", "ports"]),
    R.pipe(
      R.defaultTo([]),
      R.append({
        port,
        targetPort,
      }),
    ),
  );

export const serviceWithPort = (
  name: string,
  selector: ServiceSpec["selector"],
  port: number,
  toMerge?: DeepPartial<Service>,
) => R.pipe(appendServicePort(port, port))(service(name, selector, toMerge));
