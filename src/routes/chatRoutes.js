  const express = require('express');
  const chatController = require('../controllers/chatController');
  const router = express.Router();
                                                                                                                                                                                                            
  router.post('/chat', chatController.chat.bind(chatController));
  router.post('/chat/stream', chatController.streamChat.bind(chatController));                                                                                                                              
  router.post('/chat/tools', chatController.chatWithTools.bind(chatController));                                                                                                                            
  router.delete('/chat/:sessionId', chatController.resetChat.bind(chatController));
                                                                                                                                                                                                            
  module.exports = router;
