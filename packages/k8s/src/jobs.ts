import * as R from "ramda";
import { Job } from "kubernetes-types/batch/v1";
import { maybeMergeResource, resource } from "./resources";
import { DeepPartial } from "./common";
import { Container } from "kubernetes-types/core/v1";
import { appendContainer, setRestartPolicy } from "./podTemplates";

/**
 * Creates a job resource
 */
export const job = (name: string, toMerge?: DeepPartial<Job>): Job =>
  maybeMergeResource<Job>(
    resource<Job>("batch/v1", "Job", name, {
      spec: {
        template: {
          metadata: {
            labels: {
              job: name,
            },
          },
        },
      },
    }),
    toMerge,
  );

/**
 * Creates a job with a single container. Has a couple options to help
 * make creating jobs easier.
 */
export const jobWithContainer = (
  container: Container,
  toMerge?: DeepPartial<Job>,
) =>
  R.pipe(
    (j: Job) => j,
    appendContainer(container),
    setRestartPolicy("OnFailure"),
    (j) => maybeMergeResource<Job>(j, toMerge),
  )(
    job(container.name, {
      spec: {
        parallelism: 1,
        completions: 1,
      },
    }),
  );
