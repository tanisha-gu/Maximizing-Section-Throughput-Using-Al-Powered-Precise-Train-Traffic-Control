"""
Train Simulator - What-If Scenario Engine
"""

import random
from typing import List, Dict, Any
from models import TrainMovement, WhatIfScenario, SimulationResult, Priority


class TrainSimulator:
    def __init__(self):
        self.sim_count = 0

    def simulate(self, trains: List[TrainMovement], scenario: WhatIfScenario) -> SimulationResult:
        """Simulate a what-if scenario and return projected outcomes."""
        self.sim_count += 1
        
        baseline_delay = sum(max(0, t.delay_minutes) for t in trains)
        affected_trains = []
        recommendations = []
        alternative_schedules = []
        risk_level = "LOW"

        if scenario.scenario_type == "DELAY":
            extra = scenario.delay_minutes or 30
            affected = [t for t in trains if t.train_id in scenario.affected_trains] or trains[:2]
            affected_trains = affected
            sim_delay = baseline_delay + len(affected) * extra
            risk_level = "HIGH" if extra > 60 else "MEDIUM"
            recommendations = [
                f"Insert buffer at {s}" for s in (scenario.affected_stations or ["NDLS", "CNB"])
            ]
            recommendations.append("Re-sequence following trains to absorb delay propagation")
            impact = f"Cascading delay of ~{extra}min for {len(affected)} train(s), ripple effect on {len(trains) - len(affected)} downstream trains"
            alternative_schedules = [
                {"name": "Hold and Catch-Up", "estimated_delay_min": extra, "feasibility": "HIGH"},
                {"name": "Reroute via Loop Line", "estimated_delay_min": extra // 2, "feasibility": "MEDIUM"},
                {"name": "Platform Swap + Priority Pass", "estimated_delay_min": extra // 3, "feasibility": "LOW"},
            ]

        elif scenario.scenario_type == "BREAKDOWN":
            affected = [t for t in trains if t.train_id in scenario.affected_trains] or trains[:1]
            affected_trains = affected
            rescue_delay = 90 + random.randint(0, 30)
            sim_delay = baseline_delay + rescue_delay * len(affected) + 20 * (len(trains) - len(affected))
            risk_level = "CRITICAL"
            recommendations = [
                f"Dispatch breakdown relief to {affected[0].current_station if affected else 'section'}",
                "Halt following trains at nearest crossing station",
                "Issue slow-order for opposite-direction trains",
                "Notify divisional control and arrange bus replacement if needed"
            ]
            impact = f"Loco failure affecting {len(affected)} train(s). Section blockage ~{rescue_delay}min. Cascading impact on all following trains."
            alternative_schedules = [
                {"name": "Rescue Loco", "estimated_delay_min": rescue_delay, "feasibility": "HIGH"},
                {"name": "Push to Next Loop", "estimated_delay_min": 120, "feasibility": "MEDIUM"},
            ]

        elif scenario.scenario_type == "WEATHER":
            speed_reduction = 0.6
            sim_delay = int(baseline_delay * 1.4 + len(trains) * 8)
            risk_level = "HIGH"
            affected_trains = trains
            recommendations = [
                "Reduce max line speed to 75 km/h for all trains",
                "Issue fog-safe working circular to all loco pilots",
                "Increase block section clearance time by 50%",
                "Delay departure of non-critical trains by 30 min"
            ]
            impact = f"Adverse weather reduces section throughput by ~40%. All {len(trains)} trains affected with average additional delay of 8-15 min."
            alternative_schedules = [
                {"name": "Reduced Speed Working", "estimated_delay_min": 15, "feasibility": "HIGH"},
                {"name": "Selective Cancellation (Freight)", "estimated_delay_min": 8, "feasibility": "MEDIUM"},
            ]

        elif scenario.scenario_type == "EXTRA_TRAIN":
            extra_delay = random.randint(10, 25)
            sim_delay = baseline_delay + extra_delay * len(trains)
            risk_level = "MEDIUM"
            affected_trains = trains
            recommendations = [
                "Insert special train between 12951 and 19019 on DOWN line",
                "Adjust crossing at MTJ to accommodate new train",
                "Reduce freight train speed to create headway",
                "Issue path to special train with 15-min buffer"
            ]
            impact = f"Special train insertion increases section load. Existing trains experience average {extra_delay}min additional delay."
            alternative_schedules = [
                {"name": "Night Window Insertion", "estimated_delay_min": 5, "feasibility": "HIGH"},
                {"name": "Cancel One Freight", "estimated_delay_min": 0, "feasibility": "MEDIUM"},
            ]

        elif scenario.scenario_type == "TRACK_BLOCK":
            block_duration = scenario.duration_minutes or 60
            sim_delay = baseline_delay + block_duration * 2
            risk_level = "CRITICAL"
            affected_trains = trains
            recommendations = [
                f"Impose maintenance block on affected section for {block_duration} min",
                "Divert trains to alternate route if available",
                "Cancel/reschedule trains departing during block window",
                "Coordinate with engineering department for precise block timing"
            ]
            impact = f"Track block of {block_duration}min will affect all trains in section. Total additional delay: {block_duration * 2}min."
            alternative_schedules = [
                {"name": "Postpone Block", "estimated_delay_min": 0, "feasibility": "MEDIUM"},
                {"name": "Night Maintenance Block", "estimated_delay_min": 0, "feasibility": "HIGH"},
            ]

        else:
            sim_delay = baseline_delay
            affected_trains = []
            impact = "No significant impact detected."
            risk_level = "LOW"
            recommendations = ["No action required"]
            alternative_schedules = []

        improvement = max(0, ((sim_delay - baseline_delay) / max(sim_delay, 1)) * -100)
        improvement = round(improvement, 1)

        return SimulationResult(
            scenario_name=scenario.scenario_name,
            status="SIMULATED",
            improvement_percent=improvement,
            baseline_delay_minutes=baseline_delay,
            simulated_delay_minutes=sim_delay,
            impact_summary=impact,
            affected_trains_count=len(affected_trains),
            recommended_actions=recommendations,
            alternative_schedules=alternative_schedules,
            risk_level=risk_level
        )
