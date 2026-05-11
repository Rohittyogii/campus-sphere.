import json
import os
import re
from difflib import SequenceMatcher
from typing import List, Dict, Any, Optional
import pandas as pd

# Load configurations
# File is in backend/services/recommender/specialization_engine.py (4 levels deep from root)
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
CONFIG_DIR = os.path.join(ROOT_DIR, "backend", "config")
DATA_DIR = os.path.join(ROOT_DIR, "data")

def load_json(filename):
    path = os.path.join(CONFIG_DIR, filename)
    if os.path.exists(path):
        with open(path, 'r') as f:
            return json.load(f)
    return {}

def load_csv(filename):
    path = os.path.join(DATA_DIR, filename)
    # The system uses .xlsx files mostly, but user mentioned .csv. 
    # I'll check for both, prioritizing .csv as per request.
    csv_path = path.replace('.xlsx', '.csv')
    xlsx_path = path.replace('.csv', '.xlsx')
    
    try:
        if os.path.exists(csv_path):
            # Quick check for LFS pointer
            with open(csv_path, 'r', errors='ignore') as f:
                line = f.readline()
                if line.startswith('version https://git-lfs'):
                    print(f"WARNING: {csv_path} is a Git LFS pointer. Data will be missing.")
                    return None
            return pd.read_csv(csv_path)
        elif os.path.exists(xlsx_path):
            # Quick check for LFS pointer
            with open(xlsx_path, 'r', errors='ignore') as f:
                line = f.readline()
                if line.startswith('version https://git-lfs'):
                    print(f"WARNING: {xlsx_path} is a Git LFS pointer. Data will be missing.")
                    return None
            return pd.read_excel(xlsx_path)
    except Exception as e:
        print(f"ERROR loading {filename}: {e}")
        return None
    return None

class SpecializationEngine:
    def __init__(self):
        self.questionnaire = load_json("specialization_questionnaire.json")
        self.eligibility = load_json("specialization_eligibility.json")
        self.kw_map = load_csv("Keywords_Specialization_Map.csv")
        self.objectives = load_csv("Career_Objective.xlsx") 
        
        print(f"DEBUG: SpecializationEngine initialized. KW Map: {self.kw_map is not None}, Questionnaire: {len(self.questionnaire)} items")
        
        self.specializations = ["full_stack", "ai_ml", "data_science", "cyber_security", "game_tech"]
        self.labels = {
            "full_stack": "Full Stack Development",
            "ai_ml": "AI & Machine Learning",
            "data_science": "Data Science",
            "cyber_security": "Cyber Security",
            "game_tech": "Game Technology"
        }

    def check_eligibility(self, roll_no: str, semester: int, current_specialization: Optional[str]):
        """
        Validates if the student can use this module based on their batch and semester.
        """
        if not self.eligibility:
            return True, "Success", "Eligible"
            
        # Determine mode
        is_opting = not current_specialization or current_specialization.lower() in ["none", "pending", ""]
        mode = "opt" if is_opting else "switch"
        
        # Extract batch prefix (first 2 chars of roll_no)
        batch = roll_no[:2]
        
        # Find rule for batch
        batch_rule = next((rule for rule in self.eligibility.get("eligibility", []) if rule["batch_prefix"] == batch), None)
        
        if not batch_rule:
            return False, mode, f"Batch '{batch}' is not currently supported for specialization choices."
            
        if is_opting:
            if not batch_rule.get("can_opt"):
                return False, mode, f"{batch_rule['year']} students cannot 'opt' for a specialization via this module."
            if semester not in batch_rule.get("opt_semesters", []):
                return False, mode, f"Specialization opting is only allowed in semesters {batch_rule['opt_semesters']} for your batch."
        else:
            if not batch_rule.get("can_switch"):
                return False, mode, f"{batch_rule['year']} students are not eligible to switch specializations."
            if semester not in batch_rule.get("switch_semesters", []):
                return False, mode, f"Specialization switching is only allowed in semesters {batch_rule['switch_semesters']} for your batch."
                
        return True, mode, "Eligible"

    def calculate_recommendation(self, 
                                 roll_no: str, 
                                 semester: int, 
                                 selected_keywords: List[str], 
                                 objective_id: Optional[int], 
                                 current_specialization: Optional[str],
                                 answers: Dict[str, str]):
        
        eligible, mode, msg = self.check_eligibility(roll_no, semester, current_specialization)
        if not eligible:
            return {"allowed": False, "mode": mode, "message": msg}

        scores = {spec: 0.0 for spec in self.specializations}
        breakdown = {spec: {"keywords": 0, "objective": 0, "quiz": 0, "stickiness": 0} for spec in self.specializations}

        # 1. Keyword Matching
        if self.kw_map is not None:
            # Normalize column names to match self.specializations
            col_map = {c.lower().replace(' ', '_'): c for c in self.kw_map.columns}
            for kw in selected_keywords:
                match = self.kw_map[self.kw_map['keyword'].str.lower() == kw.lower()]
                if not match.empty:
                    for spec in self.specializations:
                        val = match.iloc[0].get(spec, 0) # Assumes col names match
                        if pd.isna(val): val = 0
                        scores[spec] += val
                        breakdown[spec]["keywords"] += val

        # 2. Career Objective (Fuzzy Matching)
        if objective_id and self.objectives is not None:
            obj_row = self.objectives[self.objectives['id'] == int(objective_id)]
            if not obj_row.empty:
                obj_text = str(obj_row.iloc[0].get('objective_text', '')).lower()
                for spec in self.specializations:
                    # Score based on keyword overlaps in objective text
                    sig_terms = {
                        "full_stack": ["web", "frontend", "backend", "fullstack", "app", "cloud"],
                        "ai_ml": ["intelligence", "machine", "learning", "neural", "vision", "ai"],
                        "data_science": ["analytics", "data", "visualization", "statistics", "big data"],
                        "cyber_security": ["security", "hacking", "encryption", "network", "cyber"],
                        "game_tech": ["game", "graphics", "engine", "unity", "unreal", "immersive"]
                    }
                    points = 0
                    for term in sig_terms[spec]:
                        if term in obj_text:
                            points += 5
                    scores[spec] += points
                    breakdown[spec]["objective"] += points

        # 3. Questionnaire Scoring
        for q_id, ans_text in answers.items():
            question = next((q for q in self.questionnaire if q["id"] == q_id), None)
            if question:
                option = next((o for o in question["options"] if o["text"] == ans_text), None)
                if option:
                    for spec, pts in option["scores"].items():
                        if spec in scores:
                            scores[spec] += pts
                            breakdown[spec]["quiz"] += pts

        # 4. Stickiness Penalty (Switching logic)
        if mode == "switch" and current_specialization:
            curr_key = current_specialization.lower().replace(' ', '_')
            if curr_key in scores:
                year = (semester + 1) // 2
                boost = 0
                if year == 2: boost = 3
                elif year == 3: boost = 10
                scores[curr_key] += boost
                breakdown[curr_key]["stickiness"] += boost

        # 5. Results & Confidence
        sorted_specs = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        top_spec, top_score = sorted_specs[0]
        second_spec, second_score = sorted_specs[1] if len(sorted_specs) > 1 else (None, 0)

        diff = top_score - second_score
        confidence = "High" if diff > 15 else "Medium" if diff > 5 else "Low"

        # Growth Areas (Identify keywords for top spec that user didn't pick)
        growth_areas = []
        if self.kw_map is not None:
            top_spec_col = top_spec # Assumes column matches key
            if top_spec_col in self.kw_map.columns:
                high_weight_kws = self.kw_map[self.kw_map[top_spec_col] >= 3]['keyword'].tolist()
                growth_areas = [str(kw) for kw in high_weight_kws if str(kw).lower() not in [sk.lower() for sk in selected_keywords]][:5]

        recommendations = []
        for spec, score in sorted_specs:
            # Ensure breakdown values are serializable
            spec_breakdown = {k: float(v) for k, v in breakdown[spec].items()}
            
            recommendations.append({
                "key": spec,
                "name": self.labels[spec],
                "score": float(round(score, 1)),
                "confidence": confidence if spec == top_spec else None,
                "breakdown": spec_breakdown,
                "growth_areas": growth_areas if spec == top_spec else []
            })

        return {
            "allowed": True,
            "mode": mode,
            "top_recommendation": recommendations[0],
            "recommendations": recommendations,
            "all_scores": {k: float(v) for k, v in scores.items()}
        }

specialization_engine = SpecializationEngine()
