import {
  HorizontalPodAutoscaler,
  HorizontalPodAutoscalerSpec,
} from "kubernetes-types/autoscaling/v2beta2";
import { DeepPartial } from "./common";
import { maybeMergeResource, resource } from "./resources";

export const hpa = (
  name: string,
  spec: HorizontalPodAutoscalerSpec,
  toMerge?: DeepPartial<HorizontalPodAutoscaler>,
): HorizontalPodAutoscaler =>
  maybeMergeResource<HorizontalPodAutoscaler>(
    resource<HorizontalPodAutoscaler>(
      "autoscaling/v2beta2",
      "HorizontalPodAutoscaler",
      name,
      { spec },
    ),
    toMerge,
  );
