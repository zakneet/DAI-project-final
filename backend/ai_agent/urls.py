from django.urls import path
from .views import (
    generate_report_view, analyze_scores_view, treatment_plan_view,
    ai_health_check
)

urlpatterns = [
    path('generate-report/', generate_report_view, name='ai-generate-report'),
    path('analyze-scores/', analyze_scores_view, name='ai-analyze-scores'),
    path('treatment-plan/', treatment_plan_view, name='ai-treatment-plan'),
    path('health/', ai_health_check, name='ai-health'),
]
