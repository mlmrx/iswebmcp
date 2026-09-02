export function closedObjectSchema(
  properties: Readonly<Record<string, unknown>>,
  required: readonly string[] = [],
): Readonly<Record<string, unknown>> {
  return {
    type: 'object',
    properties,
    ...(required.length ? { required: [...required] } : {}),
    additionalProperties: false,
  };
}

export const shortText = (description: string) => ({
  type: 'string',
  maxLength: 120,
  description,
});

export const stableId = (description: string) => ({
  type: 'string',
  pattern: '^[a-z0-9][a-z0-9_-]{1,63}$',
  description,
});
