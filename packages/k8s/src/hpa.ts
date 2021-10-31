import { flow } from "fp-ts/lib/function";
import {
  CrossVersionObjectReference,
  HorizontalPodAutoscaler,
  MetricSpec,
  MetricTarget,
} from "kubernetes-types/autoscaling/v2beta2";
import * as R from "ramda";
import { DeepPartial } from "./common";
import { maybeMergeResource, resource } from "./resources";

export const hpa = (
  name: string,
  targetRef: CrossVersionObjectReference,
  toMerge?: DeepPartial<HorizontalPodAutoscaler>,
): HorizontalPodAutoscaler =>
  maybeMergeResource<HorizontalPodAutoscaler>(
    resource<HorizontalPodAutoscaler>(
      "autoscaling/v2beta2",
      "HorizontalPodAutoscaler",
      name,
      { spec: { scaleTargetRef: targetRef, maxReplicas: 1 } },
    ),
    toMerge,
  );

interface IReplicaRangeCompatable {
  spec?: {
    minReplicas?: number;
    maxReplicas?: number;
  };
}

export const setReplicaRange =
  (min: number, max: number) =>
  <T extends IReplicaRangeCompatable>(input: T) =>
    R.over(
      R.lensProp("spec"),
      flow(R.assoc("minReplicas", min), R.assoc("maxReplicas", max)),
      input,
    );

interface IAddAutoscalerMetricsCompatable {
  spec: {
    metrics: MetricSpec[];
  };
}

export const addAutoscalerMetric =
  (metric: MetricSpec) =>
  <T extends DeepPartial<IAddAutoscalerMetricsCompatable>>(resource: T): T =>
    R.over(
      R.lensProp("spec"),
      flow(
        R.defaultTo<any>({ metrics: [] }),
        R.over(
          R.lensProp<
            IAddAutoscalerMetricsCompatable["spec"],
            keyof IAddAutoscalerMetricsCompatable["spec"]
          >("metrics"),
          flow(R.defaultTo([]), R.append(metric)),
        ),
      ),
      resource,
    );

export const addAutoscalerCPUTarget = (target: MetricTarget) =>
  addAutoscalerMetric({
    type: "Resource",
    resource: {
      name: "cpu",
      target,
    },
  });

export const addTargetCPUUtilization = (averageUtilization: number) =>
  addAutoscalerCPUTarget({
    type: "Utilization",
    averageUtilization,
  });
