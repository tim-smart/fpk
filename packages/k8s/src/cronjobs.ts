import { CronJob, Job } from "kubernetes-types/batch/v1";
import { DeepPartial } from "./common";
import { maybeMergeResource, resource } from "./resources";

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
    resource<CronJob>("batch/v1", "CronJob", name, {
      spec: {
        schedule,
        jobTemplate: { spec: job.spec || { template: {} } },
      },
    }),
    toMerge,
  );
