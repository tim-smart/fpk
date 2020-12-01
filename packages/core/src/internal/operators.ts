import * as Rx from "rxjs";

export const bufferUntil = <T>(predicate: (value: T) => boolean) => (
  source$: Rx.Observable<T>,
) =>
  new Rx.Observable<T[]>((s) => {
    let buffer: Array<T> = [];

    const maybeEmit = () => {
      if (buffer.length) {
        emit();
      }
    };

    const emit = () => {
      s.next(buffer);
      buffer = [];
    };

    source$.subscribe(
      (v) => {
        if (predicate(v)) {
          maybeEmit();
          buffer = [v];
          emit();
        } else {
          buffer.push(v);
        }
      },
      (err) => s.error(err),
      () => {
        maybeEmit();
        s.complete();
      },
    );
  });
