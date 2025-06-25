import requests
import csv
import io
from .config import NASA_API_KEY

def get_fires(date_str=None):
    from datetime import date as dt_date

    if date_str is None:
        date_str = dt_date.today().strftime("%Y-%m-%d")
    
    url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{NASA_API_KEY}/MODIS_NRT/world/1/{date_str}"
    response = requests.get(url)
    if response.status_code != 200:
        return {"error": "Failed to fetch data from NASA"}
    response.encoding = 'utf-8'

    f = io.StringIO(response.text)
    reader = csv.DictReader(f)
    fires = [row for row in reader]

    return fires