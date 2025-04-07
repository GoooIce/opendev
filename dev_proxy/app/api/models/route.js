import { NextResponse } from 'next/server';
import { listAvailableModels, llmProviders } from '@/config/llm-providers';

// Route to list available models based on the configuration
// Mimics OpenAI's /v1/models endpoint format

export async function GET() {
  try {
    const availableModelIds = listAvailableModels();

    // Format the response according to OpenAI /v1/models structure
    const modelsData = availableModelIds.map(modelId => {
        const providerId = modelId.split('/')[0];
        const provider = llmProviders[providerId];
        return {
            id: modelId, // Use the combined format "providerId/genericModelName"
            object: "model",
            created: provider?.creationDate || Math.floor(Date.now() / 1000), // Use a placeholder or add to config
            owned_by: provider?.name || providerId, // Use provider name
            // permission: [...], // Optional permissions field
            // root: modelId, // Optional root model ID
            // parent: null, // Optional parent model ID
        };
    });

    return NextResponse.json({ object: "list", data: modelsData });

  } catch (error) {
    console.error("Error fetching available models:", error);
    return NextResponse.json({ error: "Failed to retrieve model list" }, { status: 500 });
  }
} 