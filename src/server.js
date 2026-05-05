  require('dotenv').config();                                                                                                                                                                               
  const express = require('express');
  const chatRoutes = require('./routes/chatRoutes');                                                                                                                                                        
  
  const app = express();                                                                                                                                                                                    
  app.use(express.json());
  app.use(express.static('public'));
  app.use('/api', chatRoutes);                                                                                                                                                                              
  
  const PORT = process.env.PORT || 3000;                                                                                                                                                                    
  app.listen(PORT, () => console.log(`LLM chat service listening on :${PORT}`));
