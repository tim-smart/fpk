import * as Rx from "rxjs";
import * as RxOp from "rxjs/operators";
import * as fs from "fs";

const glob = require("glob-to-regexp");

export function files$(dir: string, ignore?: string): Rx.Observable<string> {
  const ignoreRegExp = ignore ? glob(ignore) : undefined;

  return Rx.from(fs.readdirSync(dir)).pipe(
    RxOp.filter((f) => !f.startsWith(".")),
    RxOp.filter((f) => (ignoreRegExp ? !ignoreRegExp.test(f) : true)),
    RxOp.map((file) => {
      const stats = fs.statSync(`${dir}/${file}`);
      return { file, isDir: stats.isDirectory() };
    }),
    RxOp.flatMap((f) =>
      f.isDir ? files$(`${dir}/${f.file}`, ignore) : Rx.of(`${dir}/${f.file}`),
    ),
  );
}
