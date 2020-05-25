import * as K from "../src/index";
import { describe } from "mocha";
import { runCases } from "./helpers";

describe("label", () =>
  runCases([
    {
      it: "adds to metadata.labels",
      in: K.deployment("myapp"),
      fn: K.label("mylabel", "value"),
      diff: {
        metadata: {
          labels: {
            mylabel: "value",
          },
        },
      },
    },
  ]));

describe("annotate", () =>
  runCases([
    {
      it: "adds to metadata.annotations",
      in: K.deployment("myapp"),
      fn: K.annotate("myannotation", "value"),
      diff: {
        metadata: {
          annotations: {
            myannotation: "value",
          },
        },
      },
    },
  ]));
