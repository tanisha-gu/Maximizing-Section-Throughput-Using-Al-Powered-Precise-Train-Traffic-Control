# Railway DSS – Intelligent Train Traffic Optimization System

## 🚆 Overview

Railway DSS (Decision Support System) is an AI-powered railway traffic management platform designed to assist Indian Railways section controllers in making optimized real-time operational decisions.

The system combines:

* **Operations Research**
* **Constraint-Based Optimization**
* **AI-driven Scheduling**
* **Simulation & Scenario Analysis**
* **Real-Time KPI Monitoring**

to improve:

* Train punctuality
* Network throughput
* Resource utilization
* Conflict-free train movement planning

---

# 📌 Background

Indian Railways currently relies heavily on the experience and expertise of train traffic controllers to manage train movements and operational decisions. While this manual approach has been effective for decades, increasing network congestion and operational complexity now demand intelligent and scalable digital solutions.

Railway operations involve coordinating:

* Express trains
* Passenger trains
* Freight trains
* Local suburban services
* Maintenance blocks
* Emergency/special trains

across limited infrastructure resources such as:

* Tracks
* Junctions
* Crossings
* Platforms
* Signalling systems

The challenge is a **large-scale combinatorial optimization problem** involving:

* Safety constraints
* Track occupancy
* Train priorities
* Platform allocation
* Signalling dependencies
* Time scheduling constraints

As real-time disruptions occur (weather, delays, breakdowns, congestion), human-only decision making becomes increasingly difficult.

This project introduces an intelligent Decision Support System (DSS) that assists railway controllers with optimized recommendations and dynamic scheduling.

---

# 🎯 Problem Statement

The system aims to solve:

* Train precedence management
* Crossing optimization
* Platform allocation
* Conflict-free routing
* Delay minimization
* Throughput maximization

under real-time railway operational constraints.

---

# ✅ Expected Features

## Core Features

* Intelligent train scheduling
* Constraint-based optimization engine
* Dynamic re-optimization during disruptions
* Real-time conflict detection
* AI-assisted decision recommendations
* Train precedence management
* Platform allocation logic

---

## Simulation Features

* What-if scenario simulation
* Delay impact analysis
* Rerouting simulation
* Platform reassignment analysis
* Crossing strategy evaluation

---

## Dashboard & Monitoring

* KPI dashboards
* Throughput analysis
* Average delay tracking
* Punctuality monitoring
* Infrastructure utilization metrics
* Audit logs and controller actions

---

## Integration Features

* REST APIs for external systems
* Timetable integration
* Signalling system integration
* Rolling stock status integration
* Traffic Management System (TMS) support

---

# 🏗️ Project Structure

```bash
railway-dss/
│
├── backend/
│   ├── main.py                # FastAPI backend application
│   ├── models.py              # Pydantic data models
│   ├── optimizer.py           # Railway optimization engine
│   ├── simulator.py           # What-if simulation engine
│   ├── kpi_tracker.py         # KPI monitoring module
│   ├── requirements.txt       # Backend dependencies
│
├── frontend/
│   ├── App.jsx                # React dashboard frontend
│
├── README.md
```

---

# ⚙️ Technology Stack

## Backend

* Python
* FastAPI
* Pydantic
* OR-Tools / Optimization Algorithms
* NumPy
* Pandas

---

## Frontend

* React.js
* Axios
* Chart.js / Recharts
* Tailwind CSS

---

# 🧠 System Architecture

```text
+----------------------+
| Railway Data Sources |
+----------------------+
           |
           v
+----------------------+
| FastAPI Backend API  |
+----------------------+
           |
           v
+----------------------+
| Optimization Engine  |
+----------------------+
           |
           +------------------+
           |                  |
           v                  v
+----------------+   +----------------+
| KPI Tracker    |   | Simulation     |
+----------------+   +----------------+
           |
           v
+----------------------+
| React Dashboard UI   |
+----------------------+
```

---

# 🚀 Installation Guide

# 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/railway-dss.git

cd railway-dss
```

---

# 2️⃣ Create Virtual Environment

## Windows

```bash
python -m venv venv

venv\Scripts\activate
```

## Linux/Mac

```bash
python3 -m venv venv

source venv/bin/activate
```

---

# 3️⃣ Install Backend Dependencies

```bash
cd backend

pip install -r requirements.txt
```

---

# 4️⃣ Run Backend Server

```bash
uvicorn main:app --reload
```

Backend will start at:

```text
http://127.0.0.1:8000
```

Swagger API Docs:

```text
http://127.0.0.1:8000/docs
```

---

# 5️⃣ Run Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

---

# 📊 Optimization Objectives

The optimization engine focuses on:

* Minimizing overall train delays
* Maximizing track throughput
* Reducing platform conflicts
* Maintaining operational safety
* Prioritizing premium/high-priority trains
* Efficient crossing management

---

# 🔍 Example Use Cases

## Scenario 1 — Train Delay Recovery

* Detect delayed express train
* Recalculate crossing priorities
* Suggest optimal overtaking strategy
* Minimize cascading delays

---

## Scenario 2 — Platform Congestion

* Detect platform occupancy conflict
* Recommend reassignment
* Re-optimize arrival/departure schedule

---

## Scenario 3 — Weather Disruption

* Simulate reduced line speed
* Estimate throughput impact
* Generate alternate movement plans

---

# 📈 KPIs Tracked

| KPI                | Description                   |
| ------------------ | ----------------------------- |
| Punctuality %      | On-time train performance     |
| Average Delay      | Average delay per train       |
| Throughput         | Trains handled per section    |
| Track Utilization  | Infrastructure efficiency     |
| Platform Occupancy | Platform usage metrics        |
| Conflict Count     | Scheduling conflicts detected |

---

# 🔐 Safety & Constraints

The optimizer respects:

* Signal block rules
* Track occupancy constraints
* Platform availability
* Crossing restrictions
* Minimum headway requirements
* Train priority policies
* Maintenance blocks

---

# 🧪 Future Enhancements

* Machine Learning delay prediction
* Reinforcement Learning optimization
* Live GPS train tracking
* Digital twin railway simulation
* Multi-section optimization
* AI recommendation explanations
* Cloud deployment support

---

# 📡 API Endpoints

## Health Check

```http
GET /health
```

---

## Optimize Schedule

```http
POST /optimize
```

---

## Run Simulation

```http
POST /simulate
```

---

## Get KPI Metrics

```http
GET /kpi
```

