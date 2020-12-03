import * as Rx from "rxjs";
import * as RxOp from "rxjs/operators";
import { promises as fs } from "fs";
import glob from "glob-to-regexp";

export function files$(dir: string, ignore?: string): Rx.Observable<string> {
  const ignoreRegExp = ignore ? glob(ignore) : undefined;

  return Rx.from(fs.readdir(dir)).pipe(
    RxOp.flatMap((f) => f),
    RxOp.filter((f) => !f.startsWith(".")),
    RxOp.filter((f) => (ignoreRegExp ? !ignoreRegExp.test(f) : true)),
    RxOp.flatMap((file) =>
      fs
        .stat(`${dir}/${file}`)
        .then((sf) => ({ file, isDir: sf.isDirectory() })),
    ),
    RxOp.flatMap((f) =>
      f.isDir ? files$(`${dir}/${f.file}`, ignore) : Rx.of(`${dir}/${f.file}`),
    ),
  );
}
