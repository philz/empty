export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ToolCall {
  type: 'tool_use';
  id: string;
  name: string;
  input: any;
}

export interface ToolResult {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | Array<{
    type: 'text';
    text: string;
  } | {
    type: 'tool_use';
    id: string;
    name: string;
    input: any;
  } | {
    type: 'tool_result';
    tool_use_id: string;
    content: string;
    is_error?: boolean;
  }>;
}

export interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}
