# 🌍 Tripverse

**AI-Powered Travel Planning Assistant**

Tripverse is an intelligent travel planning platform that helps you create detailed, day-by-day itineraries through natural conversation. Powered by Google Gemini AI and Mapbox, Tripverse makes trip planning effortless and interactive.

---

## ✨ Features

### 🤖 **AI-Powered Chat Assistant**
- Natural language understanding for travel requests
- Real-time WebSocket communication
- Context-aware responses using conversation history
- Automatic route information integration

### 🗺️ **Smart Route Planning**
- Interactive Mapbox integration
- Real-time route calculation with distance and duration
- Geocoding for any location worldwide
- Visual route display on interactive maps

### 📅 **Intelligent Itinerary Generation**
- Multi-day trip planning (supports 5+ day itineraries)
- Day-by-day activity breakdown
- Multiple transport modes (🚗 car, 🚶 walk, 🚴 bike, 🚂 train, 🚌 bus, ✈️ plane)
- Time-based scheduling with departure/arrival times
- Detailed activity descriptions

### ⚡ **Real-Time Updates**
- Aggressive polling when generating itineraries (300ms intervals)
- Automatic detection of itinerary requests
- Instant UI updates as data becomes available

### 🎨 **Beautiful UI**
- Clean, modern interface with Tailwind CSS
- Responsive design for all screen sizes
- Collapsible sidebar for map focus
- Color-coded day headers with gradient backgrounds
- Activity cards with emoji indicators

---

## 🏗️ Tech Stack

### **Frontend**
- **Framework:** Next.js 14 (React 18)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI (shadcn/ui)
- **Icons:** Lucide React
- **Map:** Mapbox GL JS

### **Backend**
- **Framework:** FastAPI (Python)
- **AI:** Google Gemini 2.5 Flash
- **Maps:** Mapbox API (Geocoding & Directions)
- **Agents:** Fetch.ai uAgents (experimental)
- **WebSocket:** FastAPI native WebSocket support

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.11+
- Google Gemini API Key
- Mapbox Access Token

### Environment Variables

Create `.env` files in both frontend and backend directories:

**Backend (.env):**
```env
GOOGLE_API_KEY=your_gemini_api_key_here
MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

### Installation

#### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python main.py
```

The backend server will start on `http://localhost:8000`

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:3000`

---

## 📖 Usage

### Creating Travel Routes
Ask Tripverse about travel between two locations:
```
"I want to travel from San Francisco to Los Angeles"
"Show me the route from New York to Boston"
```

### Generating Itineraries
Request a multi-day itinerary:
```
"Create a 5 day itinerary from Sacramento to San Diego"
"Plan a 3-day trip to New York City"
```

### Understanding Your Plan
Tripverse will generate:
- **Trip Summary:** Total days, distance, and duration
- **Day-by-Day Breakdown:** Each day with its own card showing:
  - Day title and date
  - Multiple activities per day
  - Transport modes with emojis
  - Departure/arrival times
  - Activity descriptions
  - Duration and distance per activity

---

## 🎯 Key Features Explained

### Intelligent Routing
- Uses Mapbox Directions API for accurate route calculations
- Supports multiple transport profiles (driving, walking, cycling)
- Provides real-time distance and duration estimates
- Geocodes natural language locations ("San Francisco" → coordinates)

### Context-Aware Conversations
- Maintains conversation history for follow-up questions
- Remembers recent routes for context
- Supports clarifying questions about duration and distance

### Fast Itinerary Updates
When you request an itinerary:
1. System detects "itinerary" keyword
2. Switches to fast polling (300ms intervals)
3. Backend generates detailed multi-day plan with Gemini AI
4. Frontend updates immediately when data is ready
5. Returns to normal polling after data received

---

## 🗂️ Project Structure

```
ai-planner/
├── backend/
│   ├── main.py              # FastAPI server with WebSocket
│   ├── requirements.txt     # Python dependencies
│   └── mapbox_mcp/         # Mapbox agent components
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx        # Main dashboard
│   │   └── layout.tsx      # App layout
│   ├── components/
│   │   ├── chat/           # Chat interface
│   │   ├── details/        # Itinerary display
│   │   └── map/            # Mapbox integration
│   └── lib/                # Utilities and API adapters
│
└── README.md
```

---

## 🔧 API Endpoints

### WebSocket
- `ws://localhost:8000/ws/chat` - Real-time chat communication

### REST
- `GET /route/latest` - Get the most recent route calculation
- `GET /itinerary/latest` - Get the most recent itinerary (polls this)

---

## 🎨 UI Components

### Chat Panel
- Left sidebar with chat interface
- Message history with timestamps
- Real-time typing indicators
- Automatic scroll to latest messages

### Map View
- Center panel with interactive Mapbox
- Route visualization
- Pin markers for locations

### Itinerary Panel
- Right sidebar (collapsible)
- Trip summary header
- Day-by-day activity cards
- Trip completion footer

---

## 🤝 Contributing

Contributions are welcome! This project was built for a hackathon and can be extended with:
- More transport mode integrations
- Hotel and restaurant recommendations via Fetch.ai agents
- Calendar export functionality
- PDF generation
- Multi-language support

---

## 📝 License

MIT License - feel free to use this project for learning or building upon!

---

## 🙏 Acknowledgments

- **Google Gemini** for natural language processing
- **Mapbox** for mapping and geocoding services
- **Fetch.ai** for agent framework
- **Vercel** for Next.js framework
- **shadcn/ui** for beautiful UI components

---

## 📧 Contact

Built with ❤️ for hackathons and travel enthusiasts!

---

**Happy Traveling! ✈️🌍**
