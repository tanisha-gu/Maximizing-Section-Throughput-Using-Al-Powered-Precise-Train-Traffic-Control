from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime


class TrainType(str, Enum):
    RAJDHANI = "RAJDHANI"
    SHATABDI = "SHATABDI"
    EXPRESS = "EXPRESS"
    MAIL = "MAIL"
    PASSENGER = "PASSENGER"
    FREIGHT = "FREIGHT"
    SUBURBAN = "SUBURBAN"
    SPECIAL = "SPECIAL"
    MAINTENANCE = "MAINTENANCE"

class Priority(str, Enum):
    CRITICAL = "CRITICAL"   # Rajdhani, Shatabdi
    HIGH = "HIGH"           # Express Mail
    MEDIUM = "MEDIUM"       # Passenger
    LOW = "LOW"             # Freight, Maintenance

class TrainStatus(str, Enum):
    ON_TIME = "ON_TIME"
    DELAYED = "DELAYED"
    EARLY = "EARLY"
    HELD = "HELD"
    RUNNING = "RUNNING"
    CANCELLED = "CANCELLED"
    SLOW_ORDER = "SLOW_ORDER"

class TrainMovement(BaseModel):
    train_id: str
    train_name: str
    train_type: TrainType
    priority: Priority
    current_station: str
    next_station: str
    scheduled_arrival: str
    actual_arrival: str
    delay_minutes: int = 0
    speed_kmh: float = 0
    status: str = "RUNNING"
    direction: str = "UP"
    platform: Optional[str] = None
    passengers_onboard: Optional[int] = None
    distance_to_next_km: Optional[float] = None
    engine_number: Optional[str] = None
    loco_pilot: Optional[str] = None

class SectionConfig(BaseModel):
    section_name: str = "Delhi Division"
    from_station: str = "NDLS"
    to_station: str = "CNB"
    distance_km: float = 440
    total_tracks: int = 4
    available_tracks: int = 3
    max_speed_kmh: float = 160
    gradient_percent: float = 0.5
    signal_block_length_km: float = 2.0
    platforms_count: int = 8
    line_capacity_per_hour: int = 24

class OptimizationRequest(BaseModel):
    train_ids: List[str]
    section_config: Optional[SectionConfig] = SectionConfig()
    horizon_minutes: int = 120
    objective: str = "minimize_delay"  # minimize_delay, maximize_throughput, balanced
    constraints: Optional[Dict[str, Any]] = {}

class ConflictDetail(BaseModel):
    conflict_id: str
    train_a: str
    train_b: str
    conflict_type: str  # CROSSING, OVERTAKE, PLATFORM, BLOCK
    location: str
    time_window: str
    severity: str
    recommended_action: str

class ScheduleEntry(BaseModel):
    train_id: str
    station: str
    arrival_time: str
    departure_time: str
    platform: str
    track: str
    action: str  # PASS, STOP, CROSS, OVERTAKE

class OptimizationResult(BaseModel):
    status: str
    objective_score: float
    improvement_percent: float
    computation_time_ms: int
    algorithm_used: str
    resolved_conflicts: List[ConflictDetail] = []
    optimized_schedule: List[ScheduleEntry] = []
    recommendations: List[str] = []
    warnings: List[str] = []
    total_delay_minutes: int
    trains_on_time: int
    trains_delayed: int

class WhatIfScenario(BaseModel):
    scenario_name: str
    scenario_type: str  # DELAY, BREAKDOWN, WEATHER, EXTRA_TRAIN, TRACK_BLOCK
    affected_trains: List[str] = []
    affected_stations: List[str] = []
    delay_minutes: Optional[int] = None
    duration_minutes: Optional[int] = 60
    description: str = ""
    parameters: Optional[Dict[str, Any]] = {}

class SimulationResult(BaseModel):
    scenario_name: str
    status: str
    improvement_percent: float
    baseline_delay_minutes: int
    simulated_delay_minutes: int
    impact_summary: str
    affected_trains_count: int
    recommended_actions: List[str] = []
    alternative_schedules: List[Dict[str, Any]] = []
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL

class KPIReport(BaseModel):
    report_time: str
    period: str
    punctuality_percent: float
    average_delay_minutes: float
    total_trains: int
    trains_on_time: int
    trains_delayed: int
    trains_early: int
    throughput_trains_per_hour: float
    section_utilization_percent: float
    conflicts_resolved: int
    optimizations_run: int
    avg_optimization_time_ms: float
    total_delay_minutes_saved: int
    top_delay_causes: List[Dict[str, Any]] = []
    station_performance: List[Dict[str, Any]] = []

class ConflictResolution(BaseModel):
    conflict_id: str
    resolution_type: str
    action_taken: str
    controller: str
    timestamp: str
    outcome: str
