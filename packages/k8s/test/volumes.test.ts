import * as R from "ramda";
import * as K from "../src/index";
import { describe } from "mocha";
import { runCases } from "./helpers";
import { Volume } from "kubernetes-types/core/v1";

describe("volumeFromSecret", () =>
  runCases([
    {
      it: "creates a volume from a secret",
      in: {},
      fn: R.always(K.volumeFromSecret("myvolume", K.secret("mysecret", {}))),
      diff: {
        name: "myvolume",
        secret: {
          secretName: "mysecret",
        },
      } as Volume,
    },
  ]));

describe("volumeFromConfigMap", () =>
  runCases([
    {
      it: "creates a volume from a configMap",
      in: {},
      fn: R.always(
        K.volumeFromConfigMap("myvolume", K.configMap("myconfigMap", {})),
      ),
      diff: {
        name: "myvolume",
        configMap: {
          name: "myconfigMap",
        },
      } as Volume,
    },
  ]));

describe("volumeFromPvc", () =>
  runCases([
    {
      it: "creates a volume from a pvc",
      in: {},
      fn: R.always(K.volumeFromPvc("myvolume", K.pvc("mypvc", "10Gi"))),
      diff: {
        name: "myvolume",
        persistentVolumeClaim: {
          claimName: "mypvc",
          readOnly: false,
        },
      } as Volume,
    },
  ]));

describe("volumeFromHostPath", () =>
  runCases([
    {
      it: "creates a volume from a hostPath",
      in: {},
      fn: R.always(K.volumeFromHostPath("myvolume", "/tmp")),
      diff: {
        name: "myvolume",
        hostPath: {
          path: "/tmp",
        },
      } as Volume,
    },
  ]));
