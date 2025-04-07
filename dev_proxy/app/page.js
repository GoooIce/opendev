'use client';

import { useState, useEffect } from 'react';

export default function HomePage() {
  // Initialize apiKey from localStorage or empty string
  const [apiKey, setApiKey] = useState('');
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [prompt, setPrompt] = useState('Write a short haiku about a proxy server.');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  // Effect to load API key from localStorage on mount
  useEffect(() => {
    setIsMounted(true); // Indicate component has mounted
    const storedApiKey = localStorage.getItem('proxyApiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []); // Run only once on mount

  // Effect to save API key to localStorage when it changes
  useEffect(() => {
    // Only save if apiKey is not empty after the initial mount potentially sets it
    if (isMounted && apiKey) {
        localStorage.setItem('proxyApiKey', apiKey);
    } else if (isMounted && !apiKey) {
        // Remove key if user clears the input
        localStorage.removeItem('proxyApiKey');
    }
  }, [apiKey, isMounted]); // Run when apiKey or isMounted changes

  // Fetch available models when apiKey is set or changed
  useEffect(() => {
    // Only fetch if mounted and apiKey is present
    if (!isMounted || !apiKey) {
        setModels([]); // Clear models if no API key
        setSelectedModel('');
        return;
    }

    async function fetchModels() {
      try {
        // Add Authorization header using the current apiKey state
        const res = await fetch('/api/models', { headers: { 'Authorization': `Bearer ${apiKey}` } });
        if (!res.ok) {
          const errorData = await res.json();
          // Provide more context in the error message
          throw new Error(`(${res.status}) ${errorData.error || 'Failed to fetch models'}`);
        }
        const data = await res.json();
        const modelIds = Array.isArray(data.data) ? data.data.map(m => m.id) : [];
        setModels(modelIds);
        // Set default model only if models were successfully fetched
        if (modelIds.length > 0) {
            // If the previously selected model still exists, keep it, otherwise default to the first one
            setSelectedModel(prev => modelIds.includes(prev) ? prev : modelIds[0]);
        } else {
            setSelectedModel(''); // No models available
        }
        setError(''); // Clear previous errors on success
      } catch (err) {
        setError(`Error fetching models: ${err.message}`);
        setModels([]); // Clear models on error
        setSelectedModel('');
        console.error(err);
      }
    }
    fetchModels();
  }, [apiKey, isMounted]); // Re-run when apiKey changes or after mount completes

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission
    setIsLoading(true);
    setResponse('');
    setError('');

    if (!apiKey) {
        setError('Please enter your API Key (used for proxy authentication).');
        setIsLoading(false);
        return;
    }
     if (!selectedModel) {
        setError('Please select a model.');
        setIsLoading(false);
        return;
    }


    try {
      const requestBody = {
        model: selectedModel,
        messages: [
          // { role: "system", content: "You are a helpful assistant." }, // Optional system prompt
          { role: "user", content: prompt }
        ],
        stream: true, // Request streaming response
        max_tokens: 1000, // Example: Limit tokens
      };

      const res = await fetch('/api/openai/v1/chat/completions', {
      // const res = await fetch('/api/hello', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // This is the proxy's API key, not the backend provider's key
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`API Error (${res.status}): ${errorData?.error?.message || 'Unknown error'}`);
      }

      if (!res.body) {
        throw new Error('Response body is null');
      }

      // Handle the stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      // let accumulatedResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('Stream finished.');
          break;
        }

        const chunk = decoder.decode(value);
        // Process SSE chunk(s) - may receive multiple events in one chunk
        const lines = chunk.split('\n');
        for (const line of lines) {
             if (line.startsWith('data: ')) {
                const dataStr = line.substring(6).trim();
                if (dataStr === '[DONE]') {
                    console.log('Received [DONE] signal.');
                    // Break the inner loop, the outer loop will check reader.done
                     break;
                }
                 if (!dataStr) continue; // Skip empty data lines

                try {
                    const parsedData = JSON.parse(dataStr);
                    if (parsedData.choices && parsedData.choices[0]?.delta?.content) {
                        const contentDelta = parsedData.choices[0].delta.content;
                        // accumulatedResponse += contentDelta;
                        setResponse(prev => prev + contentDelta); // Update state progressively
                    }
                 } catch (e) {
                    console.error('Error parsing stream data:', e, "Data:", dataStr);
                    // Continue processing other lines/chunks if possible
                 }
            }
        }
      }

    } catch (err) {
      setError(`Request failed: ${err.message}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-blue-600 text-white p-4">
          <h1 className="text-xl md:text-2xl font-bold">LLM Proxy Test Interface</h1>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                Proxy API Key:
              </label>
              <input
                type="password"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter the API key allowed by the proxy middleware"
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="modelSelect" className="block text-sm font-medium text-gray-700 mb-1">
                Select Model:
              </label>
              <select
                id="modelSelect"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!isMounted || models.length === 0}
              >
                {!isMounted ? (
                  <option value="" disabled>Loading...</option>
                ) : models.length === 0 ? (
                  <option value="" disabled>Loading models...</option>
                ) : (
                  models.map((modelId) => (
                    <option key={modelId} value={modelId}>
                      {modelId}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
                Prompt:
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-inherit"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || models.length === 0}
              className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
                isLoading || models.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
            >
              {isLoading ? 'Processing...' : 'Send Request'}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    <strong>Error:</strong> {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {response && (
            <div className="mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Response:</h2>
              <pre className="p-4 bg-gray-50 rounded-md border border-gray-200 overflow-auto max-h-96 text-sm whitespace-pre-wrap break-words">
                {response}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 