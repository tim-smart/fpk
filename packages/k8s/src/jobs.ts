import * as R from "ramda";
import { Job } from "kubernetes-types/batch/v1";
import { maybeMergeResource, resource } from "./resources";
import { DeepPartial } from "./common";
import {
  IEnvObject,
  concatEnv,
  setResourceRequests,
  setResourceLimits,
  container,
} from "./containers";
import { Container, ResourceRequirements } from "kubernetes-types/core/v1";
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

export interface IJobWithContainerOpts {
  name: string;
  parallelism?: number;
  completions?: number;
  image: string;
  env?: IEnvObject;
  container?: DeepPartial<Container>;

  resourceRequests?: ResourceRequirements["requests"];
  resourceLimits?: ResourceRequirements["limits"];
}

/**
 * Creates a job with a single container. Has a couple options to help
 * make creating jobs easier.
 */
export const jobWithContainer = (
  {
    name,
    image,
    parallelism = 1,
    completions = 1,
    container: containerToMerge,
    env,
    resourceLimits,
    resourceRequests,
  }: IJobWithContainerOpts,
  toMerge?: DeepPartial<Job>,
) =>
  R.pipe(
    (j: Job) => j,
    appendContainer(
      R.pipe(
        R.always(container(name, image, containerToMerge)),
        R.when(() => !!env, concatEnv(env!)),
        R.when(() => !!resourceRequests, setResourceRequests(resourceRequests)),
        R.when(() => !!resourceLimits, setResourceLimits(resourceLimits)),
      )(),
    ),
    setRestartPolicy("OnFailure"),
    (j) => maybeMergeResource<Job>(j, toMerge),
  )(
    job(name, {
      spec: {
        parallelism,
        completions,
      },
    }),
  );
