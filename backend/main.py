"""
Fetch.ai Chat Agent + FastAPI WebSocket Server
Everything in one main.py file
"""

import os
import json
import asyncio
import sys
import requests
from datetime import datetime
from uuid import uuid4
from typing import Optional, List

import google.generativeai as genai
from uagents import Agent, Context, Protocol, Model
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import urllib 
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

# Fetch.ai Agent (kept minimal; no extra ports, no subprocess)
chat_agent = Agent(name="chat-router")

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

# Mapbox agent communication models
class GeocodeRequest(Model):
    query: str
    limit: int = 5

class GeocodeResponse(Model):
    result: dict
    success: bool

class DirectionsRequest(Model):
    profile: str
    coordinates: list
    alternatives: bool = False

class DirectionsResponse(Model):
    result: dict
    success: bool

# Create simple protocol
chat_proto = Protocol("ChatProtocol", "0.1.0")

# Conversation history
conversation_history = []
last_directions_json = None
last_route_summary = None

def is_travel_question(message: str) -> bool:
    """Check if the message is travel-related"""
    travel_keywords = [
        "travel"
    ]
    message_lower = message.lower()
    return any(keyword in message_lower for keyword in travel_keywords)

def is_how_long_followup(message: str) -> bool:
    m = message.lower()
    return (
        "how long" in m or
        "how much time" in m or
        "duration" in m or
        "how many minutes" in m or
        "how many hours" in m
    )


async def chat_with_gemini_and_mapbox(user_message, ctx: Context = None):
    """Enhanced function to chat with Gemini + Mapbox agent communication"""
    try:
        # Add user message to history
        conversation_history.append({"role": "user", "content": user_message})
        
        # Check if it's a travel question and we have a context (agent communication)
        if is_travel_question(user_message) and ctx:
            print(f"🌍 Travel question detected: {user_message}")
            
            # Send entire message to Mapbox agent
            try:
                mapbox_agent_address = "agent1qv8z39cxn58654zjq7w8cyxxm6jjg78m9a6grmhfgwy759we3sxz5xahzup"
                
                # Send plain text message to Mapbox agent
                response, status = await ctx.send_and_receive(
                    mapbox_agent_address, 
                    SimpleMessage(text=user_message), 
                    response_type=SimpleMessage
                )
                
                if status and response:
                    # Try to parse as JSON
                    try:
                        import json
                        json_data = json.loads(response.text)
                        print(f"🗺️ Mapbox agent returned JSON: {json_data}")
                        return "okay i provided you with the route"
                    except json.JSONDecodeError:
                        print(f"🗺️ Mapbox agent returned non-JSON: {response.text}")
                        return "I need more details. Can you specify your starting location and destination more clearly?"
                        
            except Exception as e:
                print(f"Mapbox agent communication error: {e}")
                return "I need more details. Can you specify your starting location and destination more clearly?"
        
        # Regular Gemini response
        response = model.generate_content(
            user_message,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=1000,
            )
        )
        
        # Handle Gemini response safely
        try:
            if response.text:
                assistant_response = response.text
            else:
                # Handle cases where response.text is not available
                assistant_response = "I understand your question, but I'm having trouble generating a response right now. Please try rephrasing your question."
        except Exception as e:
            print(f"Gemini response error: {e}")
            assistant_response = "I understand your question, but I'm having trouble generating a response right now. Please try rephrasing your question."
        
        conversation_history.append({"role": "assistant", "content": assistant_response})
        
        return assistant_response
        
    except Exception as e:
        return f"Sorry, I encountered an error: {str(e)}"

@chat_proto.on_message(SimpleMessage)
async def handle_chat_message(ctx: Context, sender: str, msg: SimpleMessage):
    ctx.logger.info(f"Chat agent received: {msg.text}")
    try:
        response_text = await chat_with_gemini_and_mapbox(msg.text, ctx)
        await ctx.send(sender, SimpleMessage(text=response_text))
    except Exception:
        await ctx.send(sender, SimpleMessage(text="Sorry, I encountered an error processing your message."))

# Include the protocol
chat_agent.include(chat_proto)

# Inline Mapbox helpers (no MCP, direct HTTP to Mapbox APIs)
MAPBOX_TOKEN = os.getenv("MAPBOX_ACCESS_TOKEN")

def _mapbox_get(url: str, params: dict):
    if not MAPBOX_TOKEN:
        raise RuntimeError("MAPBOX_ACCESS_TOKEN is not set")
    clean = {k: v for k, v in params.items() if v is not None}
    clean["access_token"] = MAPBOX_TOKEN
    r = requests.get(url, params=clean, timeout=30)
    r.raise_for_status()
    return r.json()

def mapbox_geocode(query: str, limit: int = 1):
    encoded = urllib.parse.quote(query)
    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{encoded}.json"
    return _mapbox_get(url, {"limit": limit})

def mapbox_directions(profile: str, coordinates: list, alternatives: bool = False,
                      geometries: str = "geojson", overview: str = "full", steps: bool = True):
    if not coordinates or len(coordinates) < 2:
        raise ValueError("coordinates must have at least 2 [lon,lat] points")
    coord_str = ";".join(f"{lon},{lat}" for lon, lat in coordinates)
    url = f"https://api.mapbox.com/directions/v5/mapbox/{profile}/{coord_str}"
    return _mapbox_get(url, {
        "alternatives": str(alternatives).lower(),
        "geometries": geometries,
        "overview": overview,
        "steps": str(steps).lower(),
    })

# Remove REST forwarder entirely – we handle travel inline in WebSocket

# Single-process only – no subprocess/thread spawn

# FastAPI Routes
@app.get("/")
async def root():
    return {"message": "Fetch.ai Chat Agent + WebSocket Server Ready!"}

@app.get("/route/latest")
async def get_latest_route():
    if last_directions_json is None:
        from fastapi import Response
        return Response(status_code=204)
    return last_directions_json

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
            
            # Handle travel questions inline with Mapbox helpers (single process)
            if is_travel_question(user_message):
                print(f"🌍 Travel question detected: {user_message}")
                try:
                    # Use Gemini to extract origin and destination without regex
                    extraction = model.generate_content(
                        f"Extract origin and destination from this message as JSON with keys origin and destination only. No prose, only JSON. Message: {user_message}",
                        generation_config=genai.types.GenerationConfig(
                            temperature=0.0,
                            max_output_tokens=200,
                            response_mime_type="application/json"
                        ),
                    )
                    origin = None
                    destination = None
                    try:
                        print("extraction.text:", getattr(extraction, "text", None))
                        data = json.loads(extraction.text)
                        origin = data.get("origin")
                        destination = data.get("destination")
                    except Exception as e:
                        # Fallback: simple split on 'from' and 'to' (no regex)
                        try:
                            lower = user_message.lower()
                            f_idx = lower.find(" from ")
                            t_idx = lower.find(" to ")
                            if f_idx != -1 and t_idx != -1 and t_idx > f_idx:
                                origin = user_message[f_idx + 6:t_idx].strip()
                                destination = user_message[t_idx + 4:].strip()
                            else:
                                raise ValueError("cannot infer origin/destination from message")
                        except Exception as e2:
                            response = f"extraction error: {e2}"
                            raise

                    if not origin or not destination:
                        response = "extraction error: missing origin/destination"
                        raise RuntimeError(response)

                    # Geocode both endpoints
                    g1 = mapbox_geocode(origin)
                    g2 = mapbox_geocode(destination)
                    if not g1.get("features") or not g2.get("features"):
                        response = "geocode error: one or both locations not found"
                        raise RuntimeError(response)
                    start = g1["features"][0]["center"]
                    end = g2["features"][0]["center"]

                    # Get directions
                    directions = mapbox_directions("driving", [start, end])
                    print("Mapbox directions JSON:", directions)
                    global last_directions_json
                    last_directions_json = directions
                    
                    # Extract route information from JSON
                    if directions.get("routes") and len(directions["routes"]) > 0:
                        route = directions["routes"][0]
                        duration = route.get("duration", 0) / 60  # Convert to minutes
                        distance = route.get("distance", 0) / 1000  # Convert to km
                        
                        response = f"""🗺️ **Route Found:**
📍 From: {origin} → {destination}
⏱️ Duration: {duration:.1f} minutes
📏 Distance: {distance:.1f} km
🚗 Driving route available"""
                        # remember summary for follow-ups
                        global last_route_summary
                        last_route_summary = {
                            "origin": origin,
                            "destination": destination,
                            "duration_minutes": round(duration, 1),
                            "distance_km": round(distance, 1),
                        }
                    else:
                        response = "No route found between these locations"
                except Exception as e:
                    print("Travel handling error:", e)
                    response = f"{e}"
            else:
                # Regular Gemini response for non-travel questions
                try:
                    # If user asks about duration and we have last_route_summary, answer directly
                    if is_how_long_followup(user_message) and last_route_summary:
                        mins = last_route_summary["duration_minutes"]
                        km = last_route_summary["distance_km"]
                        response = f"Approximately {mins} minutes (~{(mins/60):.1f} hours), distance about {km} km."
                    else:
                    # Build compact inline transcript + optional last route summary
                    transcript_lines = []
                    for t in conversation_history[-10:]:
                        role = t.get("role", "user").upper()
                        content = t.get("content", "")
                        transcript_lines.append(f"{role}: {content}")
                    context_blob = "\n".join(transcript_lines)

                    route_hint = ""
                    if last_route_summary:
                        route_hint = (
                            f"\nLastRoute: origin={last_route_summary['origin']}, "
                            f"destination={last_route_summary['destination']}, "
                            f"duration_minutes={last_route_summary['duration_minutes']}, "
                            f"distance_km={last_route_summary['distance_km']}"
                        )

                    prompt = (
                        "You are a helpful assistant. Use the recent transcript to maintain context.\n" \
                        f"Transcript:\n{context_blob}{route_hint}\n" \
                        f"USER: {user_message}\nASSISTANT:"
                    )

                        gemini_response = model.generate_content(
                            prompt,
                            generation_config=genai.types.GenerationConfig(
                                temperature=0.7,
                                max_output_tokens=1000,
                            )
                        )
                        
                        if gemini_response.text:
                            response = gemini_response.text
                        else:
                            response = "I understand your question, but I'm having trouble generating a response right now. Please try rephrasing your question."
                except Exception as e:
                    print(f"Gemini error: {e}")
                    response = "I understand your question, but I'm having trouble generating a response right now. Please try rephrasing your question."
            
            print(f"Response: {response}")
            
            # Send response back to client
            response_data = {
                "type": "assistant",
                "message": response,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            await websocket.send_text(json.dumps(response_data))
            # Record assistant reply into conversation history to keep context
            conversation_history.append({"role": "assistant", "content": response})
            
    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--run-agent":
        # Run only the chat_agent (serves /forward on :5050)
        print("Starting chat_agent on http://127.0.0.1:5050")
        chat_agent.run()
    else:
        import uvicorn
        print("Starting Fetch.ai Chat Agent + WebSocket Server on http://localhost:8000")
        uvicorn.run(app, host="0.0.0.0", port=8000)