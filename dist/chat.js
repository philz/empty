import { AnthropicClient } from './anthropic.js';
import { executeTool } from './tools.js';
export class ChatManager {
    constructor() {
        this.messages = [];
        this.chatMessages = [];
        this.isProcessing = false;
        this.anthropic = new AnthropicClient();
        this.messagesContainer = document.getElementById('chatMessages');
    }
    setApiKey(apiKey) {
        this.anthropic.setApiKey(apiKey);
    }
    isConfigured() {
        return this.anthropic.isConfigured();
    }
    async sendMessage(userMessage) {
        if (this.isProcessing) {
            return;
        }
        this.isProcessing = true;
        this.updateUI();
        try {
            // Add user message
            const userMsg = {
                id: Date.now().toString(),
                role: 'user',
                content: userMessage,
                timestamp: new Date()
            };
            this.messages.push(userMsg);
            this.displayMessage(userMsg);
            // Add to chat messages for API
            this.chatMessages.push({
                role: 'user',
                content: [{ type: 'text', text: userMessage }]
            });
            // Start agent loop
            await this.agentLoop();
        }
        catch (error) {
            this.displayError(`Error: ${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            this.isProcessing = false;
            this.updateUI();
        }
    }
    async agentLoop() {
        let continueLoop = true;
        while (continueLoop) {
            try {
                // Get response from Claude
                const { content, toolCalls } = await this.anthropic.sendMessage(this.chatMessages);
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
                        const result = await executeTool(toolCall.name, toolCall.input);
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
                }
                else {
                    // No tool calls, end the loop
                    continueLoop = false;
                }
            }
            catch (error) {
                this.displayError(`Agent loop error: ${error instanceof Error ? error.message : String(error)}`);
                continueLoop = false;
            }
        }
    }
    displayMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role}`;
        messageDiv.textContent = message.content;
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    displayToolCall(toolCall) {
        const toolDiv = document.createElement('div');
        toolDiv.className = 'message tool';
        toolDiv.textContent = `🔧 Calling tool: ${toolCall.name}\n${JSON.stringify(toolCall.input, null, 2)}`;
        this.messagesContainer.appendChild(toolDiv);
        this.scrollToBottom();
    }
    displayToolResult(result) {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'message tool';
        const status = result.is_error ? '❌' : '✅';
        resultDiv.textContent = `${status} Tool result: ${result.content}`;
        this.messagesContainer.appendChild(resultDiv);
        this.scrollToBottom();
    }
    displayError(error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = error;
        this.messagesContainer.appendChild(errorDiv);
        this.scrollToBottom();
    }
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    updateUI() {
        const chatInput = document.getElementById('chatInput');
        const sendButton = document.getElementById('sendMessage');
        if (this.isProcessing) {
            chatInput.disabled = true;
            sendButton.disabled = true;
            sendButton.textContent = 'Processing...';
        }
        else {
            chatInput.disabled = !this.isConfigured();
            sendButton.disabled = !this.isConfigured();
            sendButton.textContent = 'Send';
        }
    }
    updateUIState() {
        this.updateUI();
    }
}
