# Fetch.ai Chat Agent

Basic chat agent using Gemini 2.5 Flash for travel planning conversations.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file with your Google API key:
```
GOOGLE_API_KEY=your_google_api_key_here
```

3. Run the chat agent:
```bash
python main.py
```

## System Design

- **`main.py`** - Chat agent (handles conversations)
- **Future agents** - Will consume data from chat agent
- **Simple structure** - No classes, hobbyist conventions
- **Chat Protocol v0.3.0** - Agentverse compliant

## Features

- **Gemini 2.5 Flash** for intelligent responses
- **Chat Protocol v0.3.0** compliance
- **Simple function-based** design
- **Conversation history** maintained
- **Error handling** with proper acknowledgements

## Usage

Run locally or deploy to Agentverse. The chat agent handles travel planning conversations and can be extended with other agents that consume its data.
