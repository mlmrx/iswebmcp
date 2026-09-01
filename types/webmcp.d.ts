interface WebMCPToolDefinition {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute: (
    input: Record<string, unknown>,
    options: { signal: AbortSignal },
  ) =>
    | string
    | number
    | boolean
    | object
    | null
    | Promise<string | number | boolean | object | null>;
}

interface WebMCPModelContext extends EventTarget {
  registerTool(
    tool: WebMCPToolDefinition,
    options?: { signal?: AbortSignal; exposedTo?: string[] },
  ): Promise<void>;
}

interface Document {
  readonly modelContext?: WebMCPModelContext;
}
