// Test script to verify API response handling with new format
console.log('Testing API response handling with new format...');

// Simulate the current API response extraction logic
function extractResponseText(responseData) {
  return responseData.data?.response || responseData.response;
}

// Test cases with new API format
console.log('\nTest Case 1: New API format with success and data structure');
const newApiResponse = {
  "success": true,
  "data": {
    "response": "Hello! How are you today?",
    "audio": "<Buffer data>",
    "audioFormat": "mp3",
    "voice": "nova",
    "model": "tts-1-hd",
    "includeAudio": true,
    "provider": "openai"
  }
};

const extractedText1 = extractResponseText(newApiResponse);
console.log('Extracted text:', extractedText1);
console.log('Expected: "Hello! How are you today?"');
console.log('Match:', extractedText1 === "Hello! How are you today?");

console.log('\nTest Case 2: Fallback to old format (response.data.response)');
const oldApiResponse = {
  "response": "This is the old format response"
};

const extractedText2 = extractResponseText(oldApiResponse);
console.log('Extracted text:', extractedText2);
console.log('Expected: "This is the old format response"');
console.log('Match:', extractedText2 === "This is the old format response");

console.log('\nTest Case 3: Check if we can access additional fields');
console.log('Audio field:', newApiResponse.data?.audio);
console.log('Voice field:', newApiResponse.data?.voice);
console.log('Model field:', newApiResponse.data?.model);
console.log('Audio format:', newApiResponse.data?.audioFormat);

console.log('\nAll tests completed!');
