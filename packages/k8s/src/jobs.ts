import * as F from "fp-ts/function";
import { Job } from "kubernetes-types/batch/v1";
import { Container } from "kubernetes-types/core/v1";
import { DeepPartial } from "./common";
import { appendContainer, setRestartPolicy } from "./podTemplates";
import { maybeMergeResource, resource } from "./resources";

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
  name: string,
  container: Container,
  toMerge?: DeepPartial<Job>,
): Job =>
  F.pipe(
    job(name, {
      spec: {
        parallelism: 1,
        completions: 1,
      },
    }),
    appendContainer(container),
    setRestartPolicy("OnFailure"),
    (j) => maybeMergeResource<Job>(j, toMerge),
  );
