from fastapi import HTTPException

# Module registry — single source of truth for all routes
# Initialized with default values
MODULE_REGISTRY = [
    {"module_id": "auth",           "name": "Authentication",          "prefix": "/auth",            "enabled": True,  "type": "core"},
    {"module_id": "student",        "name": "Student Dashboard",       "prefix": "/student",         "enabled": True,  "type": "core"},
    {"module_id": "chat",           "name": "AI Companion (RAG)",      "prefix": "/chat",            "enabled": True,  "type": "ai"},
    {"module_id": "cafe",           "name": "Campus Cafe",             "prefix": "/cafe",            "enabled": True,  "type": "recommendation"},
    {"module_id": "clubs",          "name": "Clubs & Societies",       "prefix": "/clubs",           "enabled": True,  "type": "recommendation"},
    {"module_id": "events",         "name": "Events & Hackathons",     "prefix": "/events",          "enabled": True,  "type": "recommendation"},
    {"module_id": "library",        "name": "Library Portal",          "prefix": "/library",         "enabled": True,  "type": "transactional"},
    {"module_id": "oe",             "name": "Open Electives",          "prefix": "/oe",              "enabled": True,  "type": "recommendation"},
    {"module_id": "iro",            "name": "International Relations", "prefix": "/iro",             "enabled": True,  "type": "operational"},
    {"module_id": "lost_found",     "name": "Lost & Found",            "prefix": "/lost-found",      "enabled": True,  "type": "operational"},
    {"module_id": "recommendations", "name": "Recommendations Engine", "prefix": "/recommendations", "enabled": True,  "type": "ai"},
    {"module_id": "profile",        "name": "Student Profile",         "prefix": "/profile",         "enabled": True,  "type": "core"},
    {"module_id": "admin",          "name": "Admin Control Panel",     "prefix": "/admin",           "enabled": True,  "type": "admin"},
]

# Runtime state (resets on restart)
_module_toggles = {m["module_id"]: m["enabled"] for m in MODULE_REGISTRY}

class ModuleService:
    @staticmethod
    def get_registry():
        return [
            {**m, "enabled": _module_toggles.get(m["module_id"], m["enabled"])}
            for m in MODULE_REGISTRY
        ]

    @staticmethod
    def toggle_module(module_id: str):
        if module_id not in _module_toggles:
            return False
        _module_toggles[module_id] = not _module_toggles[module_id]
        return True

    @staticmethod
    def check_module_enabled(module_id: str):
        """Dependency to gate routes by module status."""
        if not _module_toggles.get(module_id, True):
            raise HTTPException(
                status_code=403, 
                detail=f"The {module_id} module is currently disabled by administrator."
            )

# Lazy-load service singleton on first use
_module_service_instance = None

def get_module_service():
    """Lazy-load ModuleService singleton."""
    global _module_service_instance
    if _module_service_instance is None:
        _module_service_instance = ModuleService()
    return _module_service_instance

# Lazy proxy that looks like the service but initializes on first attribute access
class _ModuleServiceLazyProxy:
    def __getattr__(self, name):
        service = get_module_service()
        return getattr(service, name)

module_service = _ModuleServiceLazyProxy()
