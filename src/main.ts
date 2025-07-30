import './style.css';
import { ChatManager } from './chat.js';

class App {
  private chatManager: ChatManager;
  private apiKey: string | null = null;

  constructor() {
    this.chatManager = new ChatManager();
    this.initializeUI();
    this.loadSavedApiKey();
  }

  private initializeUI() {
    // API Key handling
    const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
    const saveKeyButton = document.getElementById('saveKey') as HTMLButtonElement;
    
    saveKeyButton.addEventListener('click', () => {
      this.saveApiKey(apiKeyInput.value);
    });

    apiKeyInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.saveApiKey(apiKeyInput.value);
      }
    });

    // Chat handling
    const chatInput = document.getElementById('chatInput') as HTMLInputElement;
    const sendButton = document.getElementById('sendMessage') as HTMLButtonElement;

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

  private loadSavedApiKey() {
    const saved = localStorage.getItem('anthropic_api_key');
    if (saved) {
      this.setApiKey(saved);
      const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
      apiKeyInput.value = '••••••••••••••••';
    }
  }

  private saveApiKey(key: string) {
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
    
    const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
    apiKeyInput.value = '••••••••••••••••';
    
    this.showMessage('API key saved successfully!', 'success');
  }

  private setApiKey(key: string) {
    this.apiKey = key;
    this.chatManager.setApiKey(key);
    this.chatManager.updateUIState();
  }

  private async sendMessage(message: string) {
    if (!message.trim()) {
      return;
    }

    if (!this.chatManager.isConfigured()) {
      alert('Please set your Anthropic API key first');
      return;
    }

    const chatInput = document.getElementById('chatInput') as HTMLInputElement;
    chatInput.value = '';

    try {
      await this.chatManager.sendMessage(message);
    } catch (error) {
      console.error('Error sending message:', error);
      this.showMessage(`Error: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }

  private showMessage(message: string, type: 'success' | 'error') {
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success' : 'error';
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      border-radius: 4px;
      color: white;
      background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
      z-index: 1000;
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      document.body.removeChild(messageDiv);
    }, 3000);
  }
}

// Initialize the app
new App();
