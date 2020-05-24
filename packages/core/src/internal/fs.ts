import * as Rx from "rxjs";
import * as RxOp from "rxjs/operators";
import * as fs from "fs/promises";

export function files$(dir: string): Rx.Observable<string> {
  return Rx.from(fs.readdir(dir)).pipe(
    RxOp.flatMap((f) => f),
    RxOp.filter((f) => !f.startsWith(".")),
    RxOp.flatMap((file) =>
      Rx.from(fs.stat(`${dir}/${file}`)).pipe(
        RxOp.map((sf) => ({ file, isDir: sf.isDirectory() })),
      ),
    ),
    RxOp.flatMap((f) =>
      f.isDir ? files$(`${dir}/${f.file}`) : Rx.of(`${dir}/${f.file}`),
    ),
  );
}
