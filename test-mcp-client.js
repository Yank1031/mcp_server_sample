#!/usr/bin/env node

import fetch from 'node-fetch';

async function testMCPConnection() {
  console.log('🔍 Testing MCP SSE connection...');
  
  try {
    const response = await fetch('https://employee-mcp-server.onrender.com/sse', {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'User-Agent': 'MCP-Test-Client/1.0',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));

    if (!response.ok) {
      console.error('❌ HTTP error:', response.status, response.statusText);
      return;
    }

    if (!response.body) {
      console.error('❌ No response body');
      return;
    }

    console.log('✅ Connection established, reading stream...');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // Set a timeout for reading
    const timeout = setTimeout(() => {
      console.log('⏱️ Timeout reached, closing connection');
      reader.cancel();
    }, 10000);

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('📡 Stream ended');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete events
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Keep incomplete event in buffer

        for (const event of events) {
          if (event.trim()) {
            console.log('📥 Received event:', event);
            
            // Parse MCP messages
            if (event.includes('data:')) {
              const dataMatch = event.match(/data: (.+)/);
              if (dataMatch) {
                try {
                  const data = JSON.parse(dataMatch[1]);
                  console.log('📋 Parsed MCP message:', JSON.stringify(data, null, 2));
                } catch (e) {
                  console.log('📄 Raw data:', dataMatch[1]);
                }
              }
            }
          }
        }
      }
    } finally {
      clearTimeout(timeout);
    }

    console.log('✅ Test completed');

  } catch (error) {
    console.error('❌ Connection error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Check if node-fetch is available
try {
  await testMCPConnection();
} catch (error) {
  if (error.code === 'ERR_MODULE_NOT_FOUND') {
    console.error('❌ node-fetch not found. Installing...');
    console.log('Run: npm install node-fetch');
  } else {
    console.error('❌ Unexpected error:', error);
  }
}
