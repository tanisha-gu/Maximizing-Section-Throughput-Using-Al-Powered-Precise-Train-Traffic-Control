"""
Indian Railways Intelligent Decision-Support System
Backend API - FastAPI Application
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import json
import logging
from datetime import datetime
from typing import List, Optional, Dict
import random

from models import (
    TrainStatus, SectionConfig, OptimizationRequest, OptimizationResult,
    WhatIfScenario, SimulationResult, KPIReport, TrainType, Priority,
    TrainMovement, ScheduleEntry, ConflictResolution
)
from optimizer import RailwayOptimizer
from simulator import TrainSimulator
from kpi_tracker import KPITracker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Indian Railways Intelligent Decision-Support System",
    description="AI-powered train traffic optimization and scheduling",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
optimizer = RailwayOptimizer()
simulator = TrainSimulator()
kpi_tracker = KPITracker()
connected_clients: List[WebSocket] = []

# Seed initial data
trains_db: Dict[str, TrainMovement] = {}
schedule_db: List[ScheduleEntry] = []
conflicts_db: List[ConflictResolution] = []
audit_log: List[dict] = []


def init_demo_data():
    """Initialize demo trains and schedule."""
    demo_trains = [
        TrainMovement(
            train_id="12951", train_name="Mumbai Rajdhani", train_type=TrainType.EXPRESS,
            priority=Priority.HIGH, current_station="NDLS", next_station="MTJ",
            scheduled_arrival="06:00", actual_arrival="06:05", delay_minutes=5,
            speed_kmh=120, status="RUNNING", direction="DOWN", platform="1"
        ),
        TrainMovement(
            train_id="12301", train_name="Howrah Rajdhani", train_type=TrainType.RAJDHANI,
            priority=Priority.CRITICAL, current_station="CNB", next_station="ALD",
            scheduled_arrival="08:30", actual_arrival="08:30", delay_minutes=0,
            speed_kmh=130, status="ON_TIME", direction="UP", platform="2"
        ),
        TrainMovement(
            train_id="19019", train_name="Dehradun Express", train_type=TrainType.EXPRESS,
            priority=Priority.MEDIUM, current_station="BE", next_station="ALJN",
            scheduled_arrival="10:15", actual_arrival="10:45", delay_minutes=30,
            speed_kmh=90, status="DELAYED", direction="DOWN", platform="3"
        ),
        TrainMovement(
            train_id="59001", train_name="Passenger Train", train_type=TrainType.PASSENGER,
            priority=Priority.LOW, current_station="GZB", next_station="NDLS",
            scheduled_arrival="11:00", actual_arrival="11:20", delay_minutes=20,
            speed_kmh=60, status="DELAYED", direction="UP", platform="4"
        ),
        TrainMovement(
            train_id="FRGT01", train_name="Freight Special", train_type=TrainType.FREIGHT,
            priority=Priority.LOW, current_station="TKJ", next_station="GZB",
            scheduled_arrival="13:00", actual_arrival="13:00", delay_minutes=0,
            speed_kmh=50, status="RUNNING", direction="UP", platform="5"
        ),
        TrainMovement(
            train_id="22691", train_name="Rajdhani Express", train_type=TrainType.RAJDHANI,
            priority=Priority.CRITICAL, current_station="MTJ", next_station="AGC",
            scheduled_arrival="14:30", actual_arrival="14:28", delay_minutes=-2,
            speed_kmh=135, status="EARLY", direction="DOWN", platform="1"
        ),
    ]
    for t in demo_trains:
        trains_db[t.train_id] = t

    # Init some KPIs
    kpi_tracker.record_event("system_start", {"trains": len(demo_trains)})


init_demo_data()


@app.get("/")
async def root():
    return {"message": "Indian Railways DSS API", "version": "1.0.0", "status": "operational"}


@app.get("/api/trains", response_model=List[TrainMovement])
async def get_trains():
    """Get all active trains in section."""
    # Simulate dynamic updates
    for tid, train in trains_db.items():
        if train.status == "RUNNING" or train.status == "DELAYED":
            # Simulate slight position changes
            if random.random() > 0.7:
                train.delay_minutes = max(0, train.delay_minutes + random.randint(-1, 2))
                train.speed_kmh = max(40, min(140, train.speed_kmh + random.randint(-5, 5)))
    return list(trains_db.values())


@app.get("/api/trains/{train_id}", response_model=TrainMovement)
async def get_train(train_id: str):
    if train_id not in trains_db:
        raise HTTPException(status_code=404, detail="Train not found")
    return trains_db[train_id]


@app.post("/api/optimize", response_model=OptimizationResult)
async def optimize_schedule(request: OptimizationRequest):
    """Run optimization algorithm for train scheduling."""
    logger.info(f"Optimization request for {len(request.train_ids)} trains")
    
    trains = [trains_db[tid] for tid in request.train_ids if tid in trains_db]
    if not trains:
        raise HTTPException(status_code=400, detail="No valid trains specified")
    
    result = optimizer.optimize(trains, request.section_config, request.horizon_minutes)
    
    # Log audit
    audit_log.append({
        "timestamp": datetime.now().isoformat(),
        "action": "OPTIMIZE",
        "trains": request.train_ids,
        "result_score": result.objective_score,
        "conflicts_resolved": len(result.resolved_conflicts)
    })
    
    kpi_tracker.record_optimization(result)
    
    # Broadcast update to WebSocket clients
    await broadcast_update({"type": "optimization_complete", "result": result.dict()})
    
    return result


@app.post("/api/whatif", response_model=SimulationResult)
async def run_whatif(scenario: WhatIfScenario):
    """Run what-if scenario simulation."""
    logger.info(f"What-if simulation: {scenario.scenario_name}")
    
    trains = list(trains_db.values())
    result = simulator.simulate(trains, scenario)
    
    audit_log.append({
        "timestamp": datetime.now().isoformat(),
        "action": "WHAT_IF_SIMULATION",
        "scenario": scenario.scenario_name,
        "improvement": result.improvement_percent
    })
    
    return result


@app.get("/api/conflicts")
async def get_conflicts():
    """Get current train conflicts."""
    trains = list(trains_db.values())
    conflicts = optimizer.detect_conflicts(trains)
    return {"conflicts": conflicts, "count": len(conflicts)}


@app.post("/api/resolve-conflict")
async def resolve_conflict(conflict_id: str, resolution: str):
    """Apply a conflict resolution."""
    audit_log.append({
        "timestamp": datetime.now().isoformat(),
        "action": "CONFLICT_RESOLVED",
        "conflict_id": conflict_id,
        "resolution": resolution
    })
    return {"status": "resolved", "conflict_id": conflict_id}


@app.get("/api/kpi", response_model=KPIReport)
async def get_kpi():
    """Get current KPI metrics."""
    trains = list(trains_db.values())
    return kpi_tracker.generate_report(trains)


@app.get("/api/schedule")
async def get_schedule():
    """Get optimized schedule entries."""
    trains = list(trains_db.values())
    schedule = optimizer.generate_schedule(trains)
    return {"schedule": schedule, "generated_at": datetime.now().isoformat()}


@app.get("/api/audit")
async def get_audit_log(limit: int = 50):
    """Get audit trail."""
    return {"logs": audit_log[-limit:], "total": len(audit_log)}


@app.get("/api/section-config")
async def get_section_config():
    """Get current section configuration."""
    return {
        "section_name": "Delhi Division - Northern Railway",
        "from_station": "NDLS",
        "to_station": "CNB",
        "distance_km": 440,
        "total_tracks": 4,
        "available_tracks": 3,
        "max_speed_kmh": 160,
        "signal_system": "Automatic Block",
        "platforms": 8,
        "active_blocks": 2,
        "line_capacity_trains_per_hour": 24
    }


@app.post("/api/trains/{train_id}/override")
async def override_train(train_id: str, action: str, reason: str = "Manual override"):
    """Controller override for a specific train."""
    if train_id not in trains_db:
        raise HTTPException(status_code=404, detail="Train not found")
    
    train = trains_db[train_id]
    
    if action == "HOLD":
        train.status = "HELD"
        train.speed_kmh = 0
    elif action == "PROCEED":
        train.status = "RUNNING"
    elif action == "SLOW":
        train.speed_kmh = min(train.speed_kmh, 60)
        train.status = "SLOW_ORDER"
    
    audit_log.append({
        "timestamp": datetime.now().isoformat(),
        "action": f"CONTROLLER_OVERRIDE_{action}",
        "train_id": train_id,
        "reason": reason,
        "controller": "SectionController_01"
    })
    
    await broadcast_update({"type": "train_override", "train_id": train_id, "action": action})
    
    return {"status": "applied", "train_id": train_id, "action": action}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time updates."""
    await websocket.accept()
    connected_clients.append(websocket)
    logger.info(f"WebSocket client connected. Total: {len(connected_clients)}")
    
    try:
        # Send initial state
        await websocket.send_json({
            "type": "initial_state",
            "trains": [t.dict() for t in trains_db.values()],
            "timestamp": datetime.now().isoformat()
        })
        
        while True:
            # Send periodic updates
            await asyncio.sleep(5)
            trains_update = [t.dict() for t in trains_db.values()]
            await websocket.send_json({
                "type": "trains_update",
                "trains": trains_update,
                "timestamp": datetime.now().isoformat()
            })
    except WebSocketDisconnect:
        connected_clients.remove(websocket)
        logger.info(f"WebSocket client disconnected. Total: {len(connected_clients)}")


async def broadcast_update(message: dict):
    """Broadcast message to all connected WebSocket clients."""
    disconnected = []
    for client in connected_clients:
        try:
            await client.send_json(message)
        except Exception:
            disconnected.append(client)
    for client in disconnected:
        connected_clients.remove(client)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
