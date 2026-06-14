export type Success<T> = {
  success: true;
  value: T;
};

export type Failure<E> = {
  success: false;
  error: E;
};

export type Result<T, E = Error> = Success<T> | Failure<E>;

export const Ok = <T = void>(value?: T): Success<T> => ({
  success: true,
  value: value as T,
});

export const Err = <E>(error: E): Failure<E> => ({
  success: false,
  error,
});