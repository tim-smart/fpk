import * as F from "fp-ts/function";
import {
  RollingUpdateStatefulSetStrategy,
  StatefulSet,
  StatefulSetUpdateStrategy,
} from "kubernetes-types/apps/v1";
import { Container } from "kubernetes-types/core/v1";
import * as R from "ramda";
import { DeepPartial } from "./common";
import { appendContainer } from "./podTemplates";
import { maybeMergeResource, resource } from "./resources";

/**
 * Create a stateful set resource with the given name. The second argument is
 * deep merged into the stateful set.
 */
export const statefulSet = (
  name: string,
  serviceName: string,
  toMerge?: DeepPartial<StatefulSet>,
): StatefulSet =>
  maybeMergeResource<StatefulSet>(
    resource<StatefulSet>("apps/v1", "StatefulSet", name, {
      spec: {
        replicas: 1,
        serviceName,
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
    }),
    toMerge,
  );

/**
 * Creates a stateful set with a single container.
 */
export const statefulSetWithContainer = (
  name: string,
  serviceName: string,
  container: Container,
  toMerge?: DeepPartial<StatefulSet>,
): StatefulSet =>
  F.pipe(statefulSet(name, serviceName), appendContainer(container), (ss) =>
    maybeMergeResource<StatefulSet>(ss, toMerge),
  );

export type TStatefulSetTransform = (d: StatefulSet) => StatefulSet;

/**
 * Returns a function that sets `spec.strategy` to the given strategy.
 */
export const setStatefulSetUpdateStrategy = (
  strategy: StatefulSetUpdateStrategy,
): TStatefulSetTransform =>
  R.set(R.lensPath(["spec", "updateStrategy"]), strategy);

/**
 * Returns a funciton that sets `spec.strategy` to type "OnDelete".
 */
export const setStatefulSetOnDelete = (): TStatefulSetTransform =>
  setStatefulSetUpdateStrategy({
    type: "OnDelete",
  });

/**
 * Returns a funciton that sets `spec.strategy` to type "RollingUpdate".
 */
export const setStatefulSetRollingUpdate = (
  rollingUpdate: RollingUpdateStatefulSetStrategy,
): TStatefulSetTransform =>
  setStatefulSetUpdateStrategy({
    type: "RollingUpdate",
    rollingUpdate,
  });
