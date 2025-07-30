// Agent Loop Chat Application
class AgentLoopChat {
  constructor() {
    this.anthropic = null;
    this.apiKey = null;
    this.messages = [];
    this.chatMessages = [];
    this.isProcessing = false;
    
    this.initializeUI();
    this.loadSavedApiKey();
  }

  initializeUI() {
    // API Key handling
    const apiKeyInput = document.getElementById('apiKey');
    const saveKeyButton = document.getElementById('saveKey');
    
    saveKeyButton.addEventListener('click', () => {
      this.saveApiKey(apiKeyInput.value);
    });

    apiKeyInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.saveApiKey(apiKeyInput.value);
      }
    });

    // Chat handling
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendMessage');

    sendButton.addEventListener('click', () => {
      this.sendMessage(chatInput.value);
    });

    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage(chatInput.value);
      }
    });
  }

  loadSavedApiKey() {
    const saved = localStorage.getItem('anthropic_api_key');
    if (saved) {
      this.setApiKey(saved);
      const apiKeyInput = document.getElementById('apiKey');
      apiKeyInput.value = '••••••••••••••••';
    }
  }

  saveApiKey(key) {
    if (!key.trim()) {
      alert('Please enter a valid API key');
      return;
    }

    if (!key.startsWith('sk-ant-')) {
      alert('Please enter a valid Anthropic API key (should start with sk-ant-)');
      return;
    }

    localStorage.setItem('anthropic_api_key', key);
    this.setApiKey(key);
    
    const apiKeyInput = document.getElementById('apiKey');
    apiKeyInput.value = '••••••••••••••••';
    
    this.showNotification('API key saved successfully!', 'success');
  }

  setApiKey(key) {
    this.apiKey = key;
    // For demo purposes, we'll simulate the anthropic client
    // In a real implementation, you'd use the actual Anthropic SDK
    this.anthropic = {
      messages: {
        create: this.mockAnthropicCall.bind(this)
      }
    };
    this.updateUIState();
  }

  // Mock Anthropic API call for demonstration
  async mockAnthropicCall(params) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock response based on the message content
    const lastMessage = params.messages[params.messages.length - 1];
    let responseText = '';
    let shouldUseIframeTool = false;
    
    if (typeof lastMessage.content === 'string') {
      const content = lastMessage.content.toLowerCase();
      
      if (content.includes('html') || content.includes('webpage') || content.includes('chart') || content.includes('graph') || content.includes('visualization')) {
        responseText = "I'll create some HTML content for you to display in the iframe.";
        shouldUseIframeTool = true;
      } else if (content.includes('hello') || content.includes('hi')) {
        responseText = "Hello! I'm an AI assistant that can help you create web content. Try asking me to create some HTML, a chart, or a webpage!";
      } else {
        responseText = `I understand you said: "${lastMessage.content}". I can help you create HTML content, visualizations, or interactive web elements. Just ask me to create something for the iframe!`;
      }
    }
    
    const response = {
      content: [{
        type: 'text',
        text: responseText
      }]
    };
    
    if (shouldUseIframeTool) {
      response.content.push({
        type: 'tool_use',
        id: 'tool_' + Date.now(),
        name: 'populate_iframe',
        input: {
          html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demo Content</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 20px;
            animation: fadeInUp 1s ease-out;
        }
        p {
            font-size: 1.2em;
            margin-bottom: 20px;
            animation: fadeInUp 1s ease-out 0.2s both;
        }
        .chart {
            width: 300px;
            height: 200px;
            background: rgba(255,255,255,0.2);
            margin: 20px auto;
            border-radius: 10px;
            display: flex;
            align-items: end;
            justify-content: center;
            gap: 10px;
            padding: 20px;
            animation: fadeInUp 1s ease-out 0.4s both;
        }
        .bar {
            background: #ffd700;
            width: 30px;
            border-radius: 3px;
            animation: growUp 1.5s ease-out;
        }
        .bar:nth-child(1) { height: 60%; }
        .bar:nth-child(2) { height: 80%; }
        .bar:nth-child(3) { height: 40%; }
        .bar:nth-child(4) { height: 90%; }
        .bar:nth-child(5) { height: 70%; }
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        @keyframes growUp {
            from {
                height: 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 Agent Demo Content</h1>
        <p>This HTML content was generated by the AI agent and populated into the iframe!</p>
        <div class="chart">
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
        </div>
        <p>The agent can create interactive content, visualizations, and more!</p>
    </div>
</body>
</html>`,
          title: 'Demo Visualization'
        }
      });
    }
    
    return response;
  }

  isConfigured() {
    return this.anthropic !== null && this.apiKey !== null;
  }

  async sendMessage(message) {
    if (!message.trim()) {
      return;
    }

    if (!this.isConfigured()) {
      alert('Please set your Anthropic API key first');
      return;
    }

    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.updateUIState();

    const chatInput = document.getElementById('chatInput');
    chatInput.value = '';

    try {
      // Add user message
      const userMsg = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      this.messages.push(userMsg);
      this.displayMessage(userMsg);

      // Add to chat messages for API
      this.chatMessages.push({
        role: 'user',
        content: message
      });

      // Start agent loop
      await this.agentLoop();
    } catch (error) {
      console.error('Error sending message:', error);
      this.displayError(`Error: ${error.message || String(error)}`);
    } finally {
      this.isProcessing = false;
      this.updateUIState();
    }
  }

  async agentLoop() {
    let continueLoop = true;

    while (continueLoop) {
      try {
        // Get response from Claude
        const response = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          messages: this.chatMessages,
          tools: [{
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
          }],
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
        const toolCalls = [];

        // Parse response content
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

        // Display agent response
        if (content.trim()) {
          const agentMsg = {
            id: Date.now().toString(),
            role: 'assistant',
            content: content,
            timestamp: new Date()
          };
          this.messages.push(agentMsg);
          this.displayMessage(agentMsg);
        }

        // Prepare assistant message content for API
        const assistantContent = [];
        if (content.trim()) {
          assistantContent.push({ type: 'text', text: content });
        }

        // Add tool calls to assistant message
        for (const toolCall of toolCalls) {
          assistantContent.push({
            type: 'tool_use',
            id: toolCall.id,
            name: toolCall.name,
            input: toolCall.input
          });
        }

        if (assistantContent.length > 0) {
          this.chatMessages.push({
            role: 'assistant',
            content: assistantContent
          });
        }

        if (toolCalls.length > 0) {
          // Execute tool calls
          const toolResults = [];
          
          for (const toolCall of toolCalls) {
            this.displayToolCall(toolCall);
            
            const result = await this.executeTool(toolCall.name, toolCall.input);
            result.tool_use_id = toolCall.id;
            toolResults.push(result);
            
            this.displayToolResult(result);
          }

          // Add tool results to chat messages
          const toolResultsMessage = {
            role: 'user',
            content: toolResults.map(result => ({
              type: 'tool_result',
              tool_use_id: result.tool_use_id,
              content: result.content,
              is_error: result.is_error
            }))
          };
          this.chatMessages.push(toolResultsMessage);

          // Continue the loop to get agent's response to tool results
          continueLoop = true;
        } else {
          // No tool calls, end the loop
          continueLoop = false;
        }
      } catch (error) {
        console.error('Agent loop error:', error);
        this.displayError(`Agent loop error: ${error.message || String(error)}`);
        continueLoop = false;
      }
    }
  }

  async executeTool(toolName, input) {
    switch (toolName) {
      case 'populate_iframe':
        return this.executePopulateIframe(input);
      default:
        return {
          type: 'tool_result',
          tool_use_id: '',
          content: `Unknown tool: ${toolName}`,
          is_error: true
        };
    }
  }

  executePopulateIframe(input) {
    try {
      const iframe = document.getElementById('agentOutput');
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
        content: `Error populating iframe: ${error.message || String(error)}`,
        is_error: true
      };
    }
  }

  displayMessage(message) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.role === 'assistant' ? 'agent' : message.role}`;
    messageDiv.textContent = message.content;
    messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }

  displayToolCall(toolCall) {
    const messagesContainer = document.getElementById('chatMessages');
    const toolDiv = document.createElement('div');
    toolDiv.className = 'message tool';
    toolDiv.textContent = `🔧 Calling tool: ${toolCall.name}\n${JSON.stringify(toolCall.input, null, 2)}`;
    messagesContainer.appendChild(toolDiv);
    this.scrollToBottom();
  }

  displayToolResult(result) {
    const messagesContainer = document.getElementById('chatMessages');
    const resultDiv = document.createElement('div');
    resultDiv.className = 'message tool';
    const status = result.is_error ? '❌' : '✅';
    resultDiv.textContent = `${status} Tool result: ${result.content}`;
    messagesContainer.appendChild(resultDiv);
    this.scrollToBottom();
  }

  displayError(error) {
    const messagesContainer = document.getElementById('chatMessages');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = error;
    messagesContainer.appendChild(errorDiv);
    this.scrollToBottom();
  }

  scrollToBottom() {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  updateUIState() {
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendMessage');
    
    if (this.isProcessing) {
      chatInput.disabled = true;
      sendButton.disabled = true;
      sendButton.textContent = 'Processing...';
    } else {
      chatInput.disabled = !this.isConfigured();
      sendButton.disabled = !this.isConfigured();
      sendButton.textContent = 'Send';
    }
  }

  showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AgentLoopChat();
});
