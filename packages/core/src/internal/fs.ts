import * as Rx from "rxjs";
import * as RxOp from "rxjs/operators";
import { promises as fs } from "fs";

const glob = require("glob-to-regexp");

export function files$(dir: string, ignore?: string): Rx.Observable<string> {
  const ignoreRegExp = ignore ? glob(ignore) : undefined;

  return Rx.from(fs.readdir(dir, { withFileTypes: true })).pipe(
    RxOp.flatMap((f) => f),
    RxOp.filter((f) => !f.name.startsWith(".")),
    RxOp.filter((f) => (ignoreRegExp ? !ignoreRegExp.test(f.name) : true)),
    RxOp.flatMap((f) =>
      f.isDirectory()
        ? files$(`${dir}/${f.name}`, ignore)
        : Rx.of(`${dir}/${f.name}`),
    ),
  );
}
