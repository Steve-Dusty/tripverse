"""
Fetch.ai Chat Agent + FastAPI WebSocket Server
Everything in one main.py file
"""

import os
import json
import asyncio
from datetime import datetime
from uuid import uuid4

import google.generativeai as genai
from uagents import Agent, Context, Protocol, Model
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel('gemini-2.5-flash')

# FastAPI app
app = FastAPI(title="Fetch.ai Chat Agent + WebSocket Server")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Fetch.ai Agent
chat_agent = Agent()

# Simple message protocol using Pydantic Model
class SimpleMessage(Model):
    text: str
    msg_id: str = None
    timestamp: datetime = None
    
    def __init__(self, **kwargs):
        if kwargs.get('msg_id') is None:
            kwargs['msg_id'] = str(uuid4())
        if kwargs.get('timestamp') is None:
            kwargs['timestamp'] = datetime.utcnow()
        super().__init__(**kwargs)

# Create simple protocol
chat_proto = Protocol("ChatProtocol", "0.1.0")

# Conversation history
conversation_history = []

def chat_with_gemini(user_message):
    """Simple function to chat with Gemini"""
    try:
        # Add user message to history
        conversation_history.append({"role": "user", "content": user_message})
        
        # Generate response with Gemini
        response = model.generate_content(
            user_message,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=1000,
            )
        )
        
        # Add assistant response to history
        assistant_response = response.text
        conversation_history.append({"role": "assistant", "content": assistant_response})
        
        return assistant_response
        
    except Exception as e:
        return f"Sorry, I encountered an error: {str(e)}"

@chat_proto.on_message(SimpleMessage)
async def handle_chat_message(ctx: Context, sender: str, msg: SimpleMessage):
    """Handle chat messages"""
    
    # Log the incoming message
    ctx.logger.info(f"Chat agent received: {msg.text}")
    
    # Process with Gemini
    try:
        response_text = chat_with_gemini(msg.text)
        ctx.logger.info(f"Chat agent response: {response_text}")
        
        # Send response back
        await ctx.send(
            sender,
            SimpleMessage(text=response_text)
        )
        
    except Exception as e:
        ctx.logger.error(f"Chat agent error: {e}")
        
        # Send error response
        await ctx.send(
            sender,
            SimpleMessage(text="Sorry, I encountered an error processing your message.")
        )

# Include the protocol
chat_agent.include(chat_proto)

# FastAPI Routes
@app.get("/")
async def root():
    return {"message": "Fetch.ai Chat Agent + WebSocket Server Ready!"}

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time chat"""
    await websocket.accept()
    print("WebSocket connected!")
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            user_message = message_data.get("message", "")
            
            print(f"Received: {user_message}")
            
            # Get response from Gemini
            response = chat_with_gemini(user_message)
            
            print(f"Response: {response}")
            
            # Send response back to client
            response_data = {
                "type": "assistant",
                "message": response,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            await websocket.send_text(json.dumps(response_data))
            
    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")

if __name__ == "__main__":
    import uvicorn
    print("Starting Fetch.ai Chat Agent + WebSocket Server on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)