import Anthropic from '@anthropic-ai/sdk';
import { ChatMessage, ToolCall, Tool } from './types.js';
import { tools } from './tools.js';

export class AnthropicClient {
  private client: Anthropic | null = null;
  private apiKey: string | null = null;

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new Anthropic({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  isConfigured(): boolean {
    return this.client !== null && this.apiKey !== null;
  }

  async sendMessage(messages: ChatMessage[]): Promise<{
    content: string;
    toolCalls: ToolCall[];
  }> {
    if (!this.client) {
      throw new Error('Anthropic client not configured. Please set your API key first.');
    }

    try {
      // Convert our ChatMessage format to Anthropic's expected format
      const anthropicMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: anthropicMessages as any,
        tools: tools,
        system: `You are a helpful AI assistant with access to tools. You can help users with various tasks and display content in an iframe when appropriate.

When using the populate_iframe tool:
- Create complete, valid HTML documents with proper DOCTYPE, html, head, and body tags
- Include CSS styling inline or in style tags for better presentation
- Make content responsive and visually appealing
- You can create interactive content with JavaScript if needed
- Consider the user's request and create appropriate visualizations, demos, or content

Be conversational and helpful. Explain what you're doing when you use tools.`
      });

      let content = '';
      const toolCalls: ToolCall[] = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          content += block.text;
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            type: 'tool_use',
            id: block.id,
            name: block.name,
            input: block.input
          });
        }
      }

      return { content, toolCalls };
    } catch (error) {
      console.error('Error calling Anthropic API:', error);
      throw new Error(`Failed to call Anthropic API: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
