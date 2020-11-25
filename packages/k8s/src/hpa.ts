import {
  HorizontalPodAutoscaler,
  CrossVersionObjectReference,
} from "kubernetes-types/autoscaling/v2beta2";
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
