from fastapi import FastAPI
from typing import Optional
from services.nasa_fires import get_fires
from services.usgs import get_equakes

app = FastAPI()

@app.get("/api/fires")
def fires(date: Optional[str] = None):
    return get_fires(date)

@app.get("/api/earthquakes")
def get_quakes(date: Optional[str] = None):
    return get_equakes(date)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)