/**
 * @typedef {'string' | 'number' | 'boolean' | 'url' | 'email' | 'json' | 'enum'} EnvType
 */

/**
 * @typedef {object} EnvFieldOptions
 * @property {EnvType} type
 * @property {unknown} [default]
 * @property {boolean} [optional]
 * @property {string[]} [values] - Required when type is "enum"
 * @property {(value: unknown) => unknown} [transform]
 */

/**
 * Schema field: shorthand type string or full options object.
 * @typedef {EnvType | EnvFieldOptions} EnvField
 */

/**
 * @typedef {Record<string, EnvField>} EnvSchema
 */

export class EnvError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    const message =
      issues.length === 1
        ? `Invalid environment: ${issues[0]}`
        : `Invalid environment:\n${issues.map((i) => `  - ${i}`).join('\n')}`;
    super(message);
    this.name = 'EnvError';
    /** @type {string[]} */
    this.issues = issues;
  }
}
