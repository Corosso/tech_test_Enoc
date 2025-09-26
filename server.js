const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Agent configuration for OpenAI
const { salesAgent, paymentAgent } = require('./agents-config');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware

app.use(express.json());
app.use(express.static('.'));

// Serve static files from the resources directory
app.use(express.static(path.join(__dirname)));
app.use('/resources', express.static(path.join(__dirname, 'resources')));

// API routes
app.get('/api/menu-data', (req, res) => {
  try {
    const menuData = JSON.parse(fs.readFileSync('./menu-data.json', 'utf8'));
    res.json(menuData);
  } catch (error) {
    console.error('Error loading menu data:', error);
    res.status(500).json({ error: 'Failed to load menu data' });
  }
});

// Get agent configuration endpoint
app.get('/api/agent/:type', (req, res) => {
  const { type } = req.params;
  
  try {
    let agent;
    switch (type) {
      case 'sales':
        agent = salesAgent;
        break;
      case 'payment':
        agent = paymentAgent;
        break;
      default:
        return res.status(400).json({ error: 'Invalid agent type' });
    }
    
    res.json(agent);
  } catch (error) {
    console.error('Error getting agent config:', error);
    res.status(500).json({ error: 'Failed to get agent configuration' });
  }
});

// OpenAI Realtime WebRTC session endpoint
app.post('/api/session', async (req, res) => {
  const { agentType = 'sales' } = req.body;
  
  try {
    // Get the appropriate agent configuration
    let agent;
    switch (agentType) {
      case 'sales':
        agent = salesAgent;
        break;
      case 'payment':
        agent = paymentAgent;
        break;
      default:
        agent = salesAgent;
    }

    // Create session with OpenAI Realtime API
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy',
        instructions: agent.instructions,
        tools: agent.tools,
        tool_choice: agent.tool_choice,
        temperature: agent.temperature,
        max_response_output_tokens: 4096,
        modalities: ['text', 'audio'],
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API Error: ${response.status}`);
    }

    const sessionData = await response.json();
    res.json(sessionData);
    
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ 
      error: 'Failed to create session',
      details: error.message 
    });
  }
});

// Frontend-compatible session endpoint
app.get('/session', async (req, res) => {
  const { agentType = 'sales' } = req.query;
  
  try {
    // Get the appropriate agent configuration
    let agent;
    switch (agentType) {
      case 'sales':
        agent = salesAgent;
        break;
      case 'payment':
        agent = paymentAgent;
        break;
      default:
        agent = salesAgent;
    }

    // Create session with OpenAI Realtime API
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy',
        instructions: agent.instructions,
        tools: agent.tools,
        tool_choice: agent.tool_choice,
        temperature: agent.temperature,
        max_response_output_tokens: 4096,
        modalities: ['text', 'audio'],
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API Error: ${response.status}`);
    }

    const sessionData = await response.json();
    
    // Add agent config to the response for frontend compatibility
    const responseData = {
      ...sessionData,
      agent_config: {
        type: agentType,
        ...agent
      }
    };
    
    res.json(responseData);
    
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ 
      error: 'Failed to create session',
      details: error.message 
    });
  }
});

// Agent switching endpoint
app.post('/api/switch-agent', async (req, res) => {
  const { sessionId, agentType } = req.body;
  
  try {
    let agent;
    switch (agentType) {
      case 'sales':
        agent = salesAgent;
        break;
      case 'payment':
        agent = paymentAgent;
        break;
      default:
        return res.status(400).json({ error: 'Invalid agent type' });
    }

    // Update session with new agent configuration
    const response = await fetch(`https://api.openai.com/v1/realtime/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instructions: agent.instructions,
        tools: agent.tools,
        tool_choice: agent.tool_choice,
        temperature: agent.temperature
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API Error: ${response.status}`);
    }

    const updateData = await response.json();
    res.json({ success: true, agent: agentType, data: updateData });
    
  } catch (error) {
    console.error('Error switching agent:', error);
    res.status(500).json({ 
      error: 'Failed to switch agent',
      details: error.message 
    });
  }
});

// Frontend-compatible agent switching endpoint
app.post('/api/switch-agent/:agentType', async (req, res) => {
  const { agentType } = req.params;
  const { sessionId } = req.body;
  
  try {
    let agent;
    switch (agentType) {
      case 'sales':
        agent = salesAgent;
        break;
      case 'payment':
        agent = paymentAgent;
        break;
      default:
        return res.status(400).json({ error: 'Invalid agent type' });
    }

    // Responder con 'config' como espera el frontend
    res.json({ 
      success: true, 
      agent_type: agentType,
      config: {
        instructions: agent.instructions,
        tools: agent.tools,
        tool_choice: agent.tool_choice
      }
    });
    
  } catch (error) {
    console.error('Error switching agent:', error);
    res.status(500).json({ 
      error: 'Failed to switch agent',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    openai_configured: !!process.env.OPENAI_API_KEY
  });
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Restaurant AI Voice Chat ready!`);
  console.log(`🔑 OpenAI API Key configured: ${!!process.env.OPENAI_API_KEY}`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  Warning: OPENAI_API_KEY not found in environment variables');
    console.warn('   Please set your OpenAI API key in the .env file');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
/*   _________        _________
//  /  _______|      / _______ \
//  |  |            | | x   x | |
//  |  |            | |  x x  | |
//  |  |            | |   +   | |
//  |  |            | |   +   | |
//  |  |            | |  x x  | |
//  |  |_______     | |_x___x_| |
//  \__________|     \_________/
//   _________        _________
//  |    __   \      / _______ \
//  |   |  |   |    | | x   x | |
//  |   |__|   |    | |  x x  | |
//  |   __   __|    | |   +   | |
//  |  |  \  \      | |   +   | |
//  |  |   \  \     | |  x x  | |
//  |  |    \  \    | |_x___x_| |
//  |__|     \__\    \_________/
*/