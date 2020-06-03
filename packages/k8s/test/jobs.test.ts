import * as K from "../src/index";
import { describe } from "mocha";
import { runCases } from "./helpers";
import { Job } from "kubernetes-types/batch/v1";

describe("job", () =>
  runCases([
    {
      it: "creates a basic job",
      in: {},
      fn: (_) =>
        K.job("fancyjob", {
          spec: { template: { spec: { containers: [] } } },
        }),
      diff: {
        apiVersion: "batch/v1",
        kind: "Job",
        metadata: {
          name: "fancyjob",
        },
        spec: {
          template: {
            metadata: {
              labels: {
                job: "fancyjob",
              },
            },
            spec: {
              containers: [],
            },
          },
        },
      } as Job,
    },
  ]));

describe("jobWithContainer", () =>
  runCases([
    {
      it: "creates a basic job",
      in: K.job("fancyjob"),
      fn: (_) =>
        K.jobWithContainer({
          name: "fancyjob",
          image: "fancyimage",
          env: { FOO: "bar" },
        }),
      diff: {
        spec: {
          parallelism: 1,
          completions: 1,
          template: {
            spec: {
              containers: [
                {
                  name: "fancyjob",
                  image: "fancyimage",
                  env: [{ name: "FOO", value: "bar" }],
                },
              ],
            },
          },
        },
      } as Job,
    },
  ]));
