  const aiService = require('./aiService');                                                                                                                                                                 
                  
  class ChatService {                                                                                                                                                                                       
    constructor() { this.sessions = new Map(); }
                                                                                                                                                                                                            
    async chatWithSession(sessionId, prompt, system) {
      const messages = this.sessions.get(sessionId) || [];
      aiService.addUserMessage(messages, prompt);                                                                                                                                                           
      try {
        const aiResponse = await aiService.chat(messages, system);                                                                                                                                          
        aiService.addAssistantMessage(messages, aiResponse);                                                                                                                                                
        this.sessions.set(sessionId, messages);
        return { sessionId, prompt, aiResponse, turnCount: messages.length / 2 };                                                                                                                           
      } catch (err) { messages.pop(); throw err; }                                                                                                                                                          
    }                                                                                                                                                                                                       
                                                                                                                                                                                                            
    async *streamChatWithSession(sessionId, prompt, system) {                                                                                                                                               
      const messages = this.sessions.get(sessionId) || [];
      aiService.addUserMessage(messages, prompt);                                                                                                                                                           
      let full = '';
      try {                                                                                                                                                                                                 
        for await (const chunk of aiService.chatStream(messages, system)) {
          full += chunk;                                                                                                                                                                                    
          yield chunk;
        }
        aiService.addAssistantMessage(messages, full);
        this.sessions.set(sessionId, messages);                                                                                                                                                             
      } catch (err) { messages.pop(); throw err; }
    }                                                                                                                                                                                                       
                                                                                                                                                                                                            
    async chatWithToolsSession(sessionId, prompt, system) {
      const messages = this.sessions.get(sessionId) || [];                                                                                                                                                  
      const startLen = messages.length;
      aiService.addUserMessage(messages, prompt);                                                                                                                                                           
      try {
        const aiResponse = await aiService.chatWithTools(messages, system);                                                                                                                                 
        this.sessions.set(sessionId, messages);                                                                                                                                                             
        return { sessionId, prompt, aiResponse, turnCount: Math.floor(messages.length / 2) };
      } catch (err) { messages.length = startLen; throw err; }                                                                                                                                              
    }             
                                                                                                                                                                                                            
    resetChatSession(sessionId) {                                                                                                                                                                           
      return { sessionId, cleared: this.sessions.delete(sessionId) };
    }                                                                                                                                                                                                       
  }               

  module.exports = new ChatService();                                                                                                                                                                       
  
