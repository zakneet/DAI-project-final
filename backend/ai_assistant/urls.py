from django.urls import path
from .views import AskAICopilotView

urlpatterns = [
    path('ask/', AskAICopilotView.as_view(), name='ai-ask'),
]
