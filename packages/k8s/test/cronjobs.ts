import * as K from "../src/index";
import { describe } from "mocha";
import { runCases } from "./helpers";
import { CronJob } from "kubernetes-types/batch/v1beta1";

describe("cronJob", () =>
  runCases([
    {
      it: "creates a cron job",
      in: {},
      fn: (_) =>
        K.cronJob(
          "fancyjob",
          "* * * * *",
          K.jobWithContainer({
            name: "fancyjob",
            image: "fancyimage",
          }),
        ),
      diff: {
        apiVersion: "batch/v1beta1",
        kind: "CronJob",
        metadata: {
          name: "fancyjob",
        },
        spec: {
          schedule: "* * * * *",
          jobTemplate: {
            spec: {
              parallelism: 1,
              completions: 1,
              template: {
                metadata: {
                  labels: {
                    job: "fancyjob",
                  },
                },
                spec: {
                  containers: [
                    {
                      name: "fancyjob",
                      image: "fancyimage",
                    },
                  ],
                },
              },
            },
          },
        },
      } as CronJob,
    },
  ]));
