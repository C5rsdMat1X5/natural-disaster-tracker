# 🌍 Natural Disaster Tracker (macOS)

An elegant desktop application built with Electron and Leaflet to visualize real-time natural disasters such as earthquakes and wildfires from trusted external APIs.

---

## 🚀 Features

- 📡 Real-time earthquake data from the USGS API.
- 🔥 Active fire detection via NASA FIRMS.
- 🖥️ Native transparency support and modern UI optimized for macOS.
- 🧭 Filter by date, disaster type, and data accuracy.
- 🧠 Efficient: fetches data only once and filters client-side based on map view.
- 🍎 Currently available **only for macOS**.
- 📦 Includes a prebuilt macOS version ready to run.

---

## 🛠 Requirements

- macOS (tested on M1 chip with 8GB RAM).
- Node.js v18+ and npm.
- A valid NASA API Key (required for fire data).

---

## 🧩 Installation

1. Clone the repo:

```bash
git clone https://github.com/C5rsdMat1X5/natural-disaster-tracker
cd natural-disaster-tracker
```

2. Install dependencies:

```bash
npm install
```

3. Configure your environment:

Rename `config_example.py` to `config.py` and replace `"YOUR_NASA_API_KEY"` with your own NASA API key.

```python
NASA_API_KEY = "YOUR_NASA_API_KEY"
```

4. Run the app:

```bash
npm run start
```

---

## 🧱 Project Structure

- `/backend` – Python server that pulls data from USGS and NASA.
- `/frontend` – HTML, CSS, and JS frontend using Leaflet.
- `main.js` – Electron main process.
- `config_example.py` – Rename to `config.py` to provide your NASA API key.

---

## 📦 macOS Build

A prebuilt macOS version is included and available for direct use. Just make sure to allow the app in your system preferences if macOS blocks it.

---

## 🔄 Updates

This project is actively maintained and improved. Expect regular updates, new features, and enhanced UI.

---

## 👤 Author

Developed by **C5rsdMat1X5** 🧠.

---