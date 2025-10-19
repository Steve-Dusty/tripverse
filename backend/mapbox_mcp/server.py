import os
import urllib.parse
import requests
from typing import Optional, List
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

MAPBOX_TOKEN = os.environ["MAPBOX_ACCESS_TOKEN"]  # required

mcp = FastMCP("mapbox-tools")

def _get(url: str, params: dict):
    clean = {k: v for k, v in params.items() if v is not None}
    clean["access_token"] = MAPBOX_TOKEN
    r = requests.get(url, params=clean, timeout=30)
    r.raise_for_status()
    return r.json()

@mcp.tool()
def geocode(query: str, limit: int = 5, types: Optional[str] = None, country: Optional[str] = None,
            proximity: Optional[str] = None, language: Optional[str] = None):
    """Forward geocoding via Mapbox."""
    encoded = urllib.parse.quote(query)
    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{encoded}.json"
    return _get(url, {"limit": limit, "types": types, "country": country,
                      "proximity": proximity, "language": language})

@mcp.tool()
def reverse_geocode(longitude: float, latitude: float, limit: int = 5,
                    types: Optional[str] = None, language: Optional[str] = None):
    """Reverse geocoding via Mapbox."""
    coords = f"{longitude},{latitude}"
    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{coords}.json"
    return _get(url, {"limit": limit, "types": types, "language": language})

@mcp.tool()
def directions(profile: str, coordinates: List[List[float]], alternatives: bool = False,
               geometries: str = "geojson", overview: str = "full", steps: bool = True,
               annotations: Optional[str] = None, language: Optional[str] = None):
    """Mapbox Directions API. profile: driving|walking|cycling|driving-traffic."""
    if not coordinates or len(coordinates) < 2:
        raise ValueError("coordinates must have at least 2 [lon,lat] points")
    coord_str = ";".join(f"{lon},{lat}" for lon, lat in coordinates)
    url = f"https://api.mapbox.com/directions/v5/mapbox/{profile}/{coord_str}"
    return _get(url, {
        "alternatives": str(alternatives).lower(),
        "geometries": geometries,
        "overview": overview,
        "steps": str(steps).lower(),
        "annotations": annotations,
        "language": language,
    })

@mcp.tool()
def isochrones(profile: str, longitude: float, latitude: float, contours_minutes: List[int],
               polygons: bool = True, generalize: Optional[float] = None, denoise: Optional[float] = None):
    """Mapbox Isochrone API."""
    contours = ",".join(str(m) for m in contours_minutes)
    url = f"https://api.mapbox.com/isochrone/v1/mapbox/{profile}/{longitude},{latitude}"
    return _get(url, {
        "contours_minutes": contours,
        "polygons": str(polygons).lower(),
        "generalize": generalize,
        "denoise": denoise,
    })

@mcp.tool()
def echo(payload: dict):
    """Debug helper."""
    return {"echo": payload}