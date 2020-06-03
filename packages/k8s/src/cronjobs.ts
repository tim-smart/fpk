import { Job } from "kubernetes-types/batch/v1";
import { CronJob } from "kubernetes-types/batch/v1beta1";
import { maybeMergeResource, resource } from "./resources";
import { DeepPartial } from "./common";
import {
  IEnvObject,
  concatEnv,
  setResourceRequests,
  setResourceLimits,
  containerWithPort,
  container,
} from "./containers";
import { Container, ResourceRequirements } from "kubernetes-types/core/v1";

/**
 * Create a cron job from a job
 */
export const cronJob = (
  name: string,
  schedule: string,
  job: Job,
  toMerge?: DeepPartial<CronJob>,
) =>
  maybeMergeResource<CronJob>(
    resource<CronJob>("batch/v1beta1", "CronJob", name, {
      spec: {
        schedule,
        jobTemplate: { spec: job.spec || { template: {} } },
      },
    }),
    toMerge,
  );
