import { Secret } from "kubernetes-types/core/v1";
import { DeepPartial } from "./common";
import * as R from "ramda";

export const secret = (
  name: string,
  data: { [name: string]: string },
  toMerge: DeepPartial<Secret> = {},
): Secret =>
  R.mergeDeepRight(
    {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name,
      },
      data: R.map((v) => Buffer.from(v).toString("base64"), data) as {
        [name: string]: string;
      },
    },
    toMerge,
  ) as Secret;
