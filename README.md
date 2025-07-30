# Agent Loop Chat

A web application that implements an AI agent loop with tool use, inspired by the [Philz.dev blog post](https://philz.dev/posts/agent-loop). Users can chat with an AI agent that has access to tools, including the ability to populate an iframe with HTML content.

## Features

- **Agent Loop Implementation**: Based on the simple yet effective pattern from Philz.dev
- **User API Key Input**: Secure input for Anthropic API keys (stored locally)
- **Chat Interface**: Real-time conversation with the AI agent
- **Tool System**: Extensible tool system with iframe HTML population
- **Visual Output**: Side-by-side chat and iframe display

## Architecture

The application follows the core agent loop pattern:

```javascript
while (continueLoop) {
  // 1. Send message to LLM with tool definitions
  const response = await anthropic.messages.create({...});
  
  // 2. Display LLM response
  if (content) displayMessage(content);
  
  // 3. Execute any tool calls
  if (toolCalls.length > 0) {
    for (const toolCall of toolCalls) {
      const result = await executeTool(toolCall.name, toolCall.input);
      // Send tool results back to LLM
    }
    continueLoop = true; // Continue loop for tool response
  } else {
    continueLoop = false; // End conversation turn
  }
}
```

## Available Tools

### `populate_iframe`
Populates the iframe with HTML content for displaying visualizations, interactive content, or web pages.

**Parameters:**
- `html` (required): Complete HTML document to display
- `title` (optional): Title for the content

## File Structure

```
/app/
├── dist/
│   ├── index.html          # Main application HTML
│   └── app.js              # JavaScript application logic
├── src/                    # TypeScript source files (development)
│   ├── main.ts
│   ├── chat.ts
│   ├── anthropic.ts
│   ├── tools.ts
│   └── types.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Usage

1. **Start the Server**:
   ```bash
   cd dist
   python3 -m http.server 8080
   ```

2. **Open in Browser**:
   Navigate to `http://localhost:8080`

3. **Enter API Key**:
   - Get an Anthropic API key from https://console.anthropic.com/
   - Enter your key (starts with `sk-ant-`) and click "Save Key"
   - Key is stored locally in browser localStorage

4. **Start Chatting**:
   - Type messages in the chat input
   - Ask for HTML content, visualizations, or web pages
   - Watch the agent use tools to populate the iframe

## Example Prompts

- "Create a colorful HTML page with animations"
- "Make a chart showing sample data"
- "Build an interactive webpage with buttons"
- "Create a simple game in HTML/CSS/JavaScript"

## Implementation Notes

### Tool Execution
Tools are executed client-side in the browser. The `populate_iframe` tool:
1. Creates a Blob URL from the HTML content
2. Sets the iframe's `src` to the blob URL
3. Manages cleanup of previous blob URLs

### Security
- API keys are stored in browser localStorage
- Content in iframe runs in the same origin (consider sandboxing for production)
- Client-side API calls use `dangerouslyAllowBrowser: true`

### Error Handling
- API errors are displayed in the chat
- Tool execution errors are shown with visual indicators
- Input validation for API keys

## Development

For development with TypeScript:

```bash
npm install
npm run dev  # Note: May have Node.js version compatibility issues
```

The `dist/` folder contains a working vanilla JavaScript version that can be served immediately.

## Demo Mode

The current implementation includes a mock Anthropic API for demonstration purposes. To use with real Anthropic API:

1. Replace the `mockAnthropicCall` method with actual Anthropic SDK integration
2. Include the Anthropic SDK properly (browser-compatible build)
3. Handle streaming responses if needed

## Extending the Tool System

To add new tools:

1. Define the tool in the `tools` array with proper schema
2. Add execution logic in `executeTool()` function
3. Handle tool results appropriately

Example new tool:
```javascript
{
  name: 'fetch_data',
  description: 'Fetch data from an API',
  input_schema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL to fetch' }
    },
    required: ['url']
  }
}
```

## Inspiration

This project is based on the insights from ["The Unreasonable Effectiveness of an LLM Agent Loop with Tool Use"](https://philz.dev/posts/agent-loop) by Philz.dev, demonstrating how simple yet powerful agent loops can be with modern LLMs.
