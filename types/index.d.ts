export type EnvType =
  | "string"
  | "number"
  | "boolean"
  | "url"
  | "email"
  | "json"
  | "enum";

export interface EnvFieldOptions {
  type: EnvType;
  default?: unknown;
  optional?: boolean;
  /** Required when type is "enum" */
  values?: string[];
  transform?: (value: unknown) => unknown;
}

export type EnvField = EnvType | EnvFieldOptions;

export type EnvSchema = Record<string, EnvField>;

export type InferEnvValue<F extends EnvField> = F extends "string"
  ? string
  : F extends "number"
    ? number
    : F extends "boolean"
      ? boolean
      : F extends "url"
        ? string
        : F extends "email"
          ? string
          : F extends "json"
            ? unknown
            : F extends "enum"
              ? string
              : F extends EnvFieldOptions
                ? F["optional"] extends true
                  ? InferEnvValue<F["type"]> | undefined
                  : "default" extends keyof F
                    ? InferEnvValue<F["type"]> | F["default"]
                    : InferEnvValue<F["type"]>
                : unknown;

export type InferEnv<S extends EnvSchema> = {
  [K in keyof S]: InferEnvValue<S[K]>;
};

export declare class EnvError extends Error {
  name: "EnvError";
  issues: string[];
  constructor(issues: string[]);
}

export interface EnvOptions {
  source?: Record<string, string | undefined>;
}

export function env<S extends EnvSchema>(
  schema: S,
  options?: EnvOptions,
): InferEnv<S>;

export function safeEnv<S extends EnvSchema>(
  schema: S,
  options?: EnvOptions,
):
  | { ok: true; data: InferEnv<S> }
  | { ok: false; error: EnvError };
