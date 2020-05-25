import { ServiceSpec, Service } from "kubernetes-types/core/v1";
import * as R from "ramda";
import { DeepPartial } from "./common";

/**
 * Creates a service resource
 */
export const service = (
  name: string,
  selector: ServiceSpec["selector"],
  toMerge: DeepPartial<Service> = {},
) =>
  R.mergeDeepRight(
    {
      apiVersion: "v1",
      kind: "Service",
      metadata: {
        name,
      },
      spec: {
        selector,
      },
    } as Service,
    toMerge,
  ) as Service;

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
  toMerge: DeepPartial<Service> = {},
) => R.pipe(appendServicePort(port, port))(service(name, selector, toMerge));
