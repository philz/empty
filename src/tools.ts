import { Tool, ToolResult } from './types.js';

// Define available tools
export const tools: Tool[] = [
  {
    name: 'populate_iframe',
    description: 'Populate an iframe with HTML content. Use this to display web content, visualizations, or interactive elements to the user.',
    input_schema: {
      type: 'object',
      properties: {
        html: {
          type: 'string',
          description: 'The HTML content to display in the iframe'
        },
        title: {
          type: 'string',
          description: 'Optional title for the content being displayed'
        }
      },
      required: ['html']
    }
  }
];

// Tool execution handlers
export async function executeTool(toolName: string, input: any): Promise<ToolResult> {
  switch (toolName) {
    case 'populate_iframe':
      return executePopulateIframe(input);
    default:
      return {
        type: 'tool_result',
        tool_use_id: '',
        content: `Unknown tool: ${toolName}`,
        is_error: true
      };
  }
}

function executePopulateIframe(input: { html: string; title?: string }): ToolResult {
  try {
    const iframe = document.getElementById('agentOutput') as HTMLIFrameElement;
    if (!iframe) {
      throw new Error('Iframe element not found');
    }

    // Create a blob URL for the HTML content
    const blob = new Blob([input.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Set the iframe source
    iframe.src = url;
    
    // Clean up the previous blob URL if it exists
    const oldUrl = iframe.dataset.blobUrl;
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl);
    }
    iframe.dataset.blobUrl = url;

    const title = input.title ? ` (${input.title})` : '';
    return {
      type: 'tool_result',
      tool_use_id: '',
      content: `Successfully populated iframe with HTML content${title}. The content is now visible to the user.`
    };
  } catch (error) {
    return {
      type: 'tool_result',
      tool_use_id: '',
      content: `Error populating iframe: ${error instanceof Error ? error.message : String(error)}`,
      is_error: true
    };
  }
}
