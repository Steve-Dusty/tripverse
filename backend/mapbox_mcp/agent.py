import os
from uagents import Agent
from uagents_adapter import MCPServerAdapter
from server import mcp  # FastMCP server from server.py

ASI1_API_KEY = os.environ["ASI1_API_KEY"]
ASI1_MODEL = os.getenv("ASI1_MODEL", "asi1-mini")

adapter = MCPServerAdapter(
    mcp_server=mcp,
    asi1_api_key=ASI1_API_KEY,
    model=ASI1_MODEL,
)

agent = Agent(name="mapbox-mcp-agent", mailbox=True)
for protocol in adapter.protocols:
    agent.include(protocol, publish_manifest=True)

if __name__ == "__main__":
    adapter.run(agent)