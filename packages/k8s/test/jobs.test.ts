import * as F from "fp-ts/function";
import * as K from "../src/index";
import * as R from "ramda";
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
      in: K.job("myjob"),
      fn: (_) =>
        K.jobWithContainer(
          "myjob",
          F.pipe(
            K.container("fancyjob", "fancyimage"),
            K.concatEnv({ FOO: "bar" }),
          ),
        ),
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
              restartPolicy: "OnFailure",
            },
          },
        },
      } as Job,
    },
  ]));
