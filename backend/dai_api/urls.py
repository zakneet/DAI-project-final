from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api-auth/", include("rest_framework.urls")),
    
    # Core auth & patient
    path("api/", include("common.urls")),
    path("api/", include("patient.urls")),
    path("api/", include("casefile.urls")),
    
    # Clinical workflow
    path("api/", include("preop.urls")),
    path("api/", include("perop.urls")),
    path("api/", include("postop.urls")),
    
    # Management
    path("api/", include("audit.urls")),
    path("api/", include("alert.urls")),
    
    # NEW: Extended modules
    path("api/dme/", include("dme.urls")),
    path("api/ai/", include("ai_assistant.urls")),
    path("api/report/", include("report.urls")),
    path("api/settings/", include("settings_app.urls")),
]