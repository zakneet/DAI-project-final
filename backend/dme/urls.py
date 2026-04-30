from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MedicalRecordViewSet, MedicalHistoryViewSet, DiagnosisViewSet,
    PrescriptionViewSet, ClinicalDocumentViewSet, AllergieViewSet
)

router = DefaultRouter()
router.register(r'medical-records', MedicalRecordViewSet, basename='medical-record')
router.register(r'history', MedicalHistoryViewSet, basename='history')
router.register(r'diagnoses', DiagnosisViewSet, basename='diagnosis')
router.register(r'prescriptions', PrescriptionViewSet, basename='prescription')
router.register(r'documents', ClinicalDocumentViewSet, basename='clinical-document')
router.register(r'allergies', AllergieViewSet, basename='allergie')

urlpatterns = [
    path('', include(router.urls)),
]
