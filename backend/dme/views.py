"""
Views for DME/DPI module
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from patient.models import Patient
from casefile.models import AnesthesiaCase
from common.permissions import IsDoctorOrIADE, IsPatient

from .models import MedicalRecord, MedicalHistory, Diagnosis, Prescription, ClinicalDocument, Allergie
from .serializers import (
    MedicalRecordSerializer, MedicalRecordDetailSerializer,
    MedicalHistorySerializer, DiagnosisSerializer, PrescriptionSerializer,
    ClinicalDocumentSerializer, AllergieSerializer
)


class MedicalRecordViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for Medical Records (DPI)
    Accessible: DOCTOR, IADE (lecture/écriture), SSPI (lecture seule)
    """
    queryset = MedicalRecord.objects.all()
    serializer_class = MedicalRecordSerializer
    permission_classes = [IsAuthenticated, IsDoctorOrIADE]
    lookup_field = 'patient_id'

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return MedicalRecordDetailSerializer
        return MedicalRecordSerializer

    def get_queryset(self):
        return MedicalRecord.objects.prefetch_related(
            'history_items',
            'diagnoses',
            'prescriptions',
            'documents',
            'allergies'
        )

    @action(detail=False, methods=['get'], url_path='patient/(?P<patient_id>[^/.]+)')
    def get_by_patient(self, request, patient_id=None):
        """
        GET /api/dme/medical-records/patient/{patient_id}/
        Retourne (et crée si inexistant) le DPI d'un patient
        """
        patient = get_object_or_404(Patient, id=patient_id)
        record, created = MedicalRecord.objects.get_or_create(patient=patient)
        serializer = MedicalRecordDetailSerializer(record)
        return Response(serializer.data)

    @action(detail=False, methods=['get', 'patch'], url_path='my-record',
            permission_classes=[IsAuthenticated])
    def my_record(self, request):
        """
        GET/PATCH /api/dme/medical-records/my-record/
        Accessible au patient connecté — consulter et enrichir son propre DME
        """
        try:
            profile = request.user.profile
            patient = profile.patient
        except Exception:
            return Response(
                {"detail": "Profil patient introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )

        record, _ = MedicalRecord.objects.get_or_create(patient=patient)

        if request.method == 'GET':
            serializer = MedicalRecordDetailSerializer(record)
            return Response(serializer.data)

        elif request.method == 'PATCH':
            serializer = MedicalRecordSerializer(record, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(MedicalRecordDetailSerializer(record).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MedicalHistoryViewSet(viewsets.ModelViewSet):
    queryset = MedicalHistory.objects.all()
    serializer_class = MedicalHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        patient_id = self.request.query_params.get('patient_id')

        # Le patient ne voit que ses propres antécédents
        try:
            profile = user.profile
            if profile.role == 'PATIENT' and profile.patient:
                return MedicalHistory.objects.filter(
                    medical_record__patient_id=profile.patient.id
                )
        except Exception:
            pass

        if patient_id:
            return MedicalHistory.objects.filter(medical_record__patient_id=patient_id)
        return self.queryset


class DiagnosisViewSet(viewsets.ModelViewSet):
    queryset = Diagnosis.objects.all()
    serializer_class = DiagnosisSerializer
    permission_classes = [IsAuthenticated, IsDoctorOrIADE]

    def get_queryset(self):
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            return Diagnosis.objects.filter(medical_record__patient_id=patient_id)
        return self.queryset


class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated, IsDoctorOrIADE]

    def get_queryset(self):
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            return Prescription.objects.filter(medical_record__patient_id=patient_id)
        return self.queryset


class ClinicalDocumentViewSet(viewsets.ModelViewSet):
    queryset = ClinicalDocument.objects.all()
    serializer_class = ClinicalDocumentSerializer
    permission_classes = [IsAuthenticated, IsDoctorOrIADE]

    def get_queryset(self):
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            return ClinicalDocument.objects.filter(medical_record__patient_id=patient_id)
        return self.queryset


class AllergieViewSet(viewsets.ModelViewSet):
    queryset = Allergie.objects.all()
    serializer_class = AllergieSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        patient_id = self.request.query_params.get('patient_id')

        try:
            profile = user.profile
            if profile.role == 'PATIENT' and profile.patient:
                return Allergie.objects.filter(
                    medical_record__patient_id=profile.patient.id
                )
        except Exception:
            pass

        if patient_id:
            return Allergie.objects.filter(medical_record__patient_id=patient_id)
        return self.queryset
