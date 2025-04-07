// Stream test script for verifying the fix
import fetch from 'node-fetch';

async function testStreamHandling() {
  console.log('Testing stream handling...');
  
  try {
    const response = await fetch('http://localhost:3000/api/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dev-model',
        messages: [{ role: 'user', content: 'Hello, test the streaming functionality' }],
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, ${await response.text()}`);
    }

    console.log('Stream response started successfully');
    console.log('Headers:', response.headers);

    // Read and process the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        console.log('Stream completed successfully!');
        break;
      }
      
      const chunk = decoder.decode(value, { stream: true });
      console.log('Received chunk:', chunk);
    }
  } catch (error) {
    console.error('Error in stream test:', error);
  }
}

testStreamHandling(); 