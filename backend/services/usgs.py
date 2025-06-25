import requests
from datetime import datetime, timezone, date

def filter_earthquakes_by_date(data, target_date):
    filtered_features = []
    target_date = target_date.strip()
    try:
        target_date_obj = datetime.strptime(target_date, "%Y-%m-%d").date()
    except ValueError:
        return {"error": "Invalid date format. Expected YYYY-MM-DD."}
    for feature in data.get("features", []):
        time_ms = feature.get("properties", {}).get("time")
        if time_ms is None:
            continue
        time_dt = datetime.fromtimestamp(time_ms / 1000, tz=timezone.utc)
        quake_date = time_dt.date()
        if quake_date == target_date_obj:
            filtered_features.append(feature)
    return {"type": "FeatureCollection", "features": filtered_features}

def get_earthquakes(target_date=None):
    today_str = date.today().strftime("%Y-%m-%d")
    if target_date:
        target_date = target_date.strip()
        if len(target_date) != 10:
            return {"error": "Invalid date format. Expected YYYY-MM-DD."}
    if target_date is None or target_date == today_str:
        url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
    else:
        url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson"
    response = requests.get(url)
    if response.status_code != 200:
        return {"error": "Failed to fetch data from USGS"}
    data = response.json()
    if target_date and target_date != today_str:
        return filter_earthquakes_by_date(data, target_date)
    else:
        return data