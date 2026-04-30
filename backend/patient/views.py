from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404

from audit.services import create_audit_log
from common.models import Profile
from .models import Patient
from .serializers import PatientSerializer, PatientOnboardingSerializer


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        patient = serializer.save()
        create_audit_log(
            action="CREATE",
            entity_type="Patient",
            entity_id=str(patient.id),
            details={
                "first_name": patient.first_name,
                "last_name": patient.last_name,
            },
        )

    @action(detail=False, methods=["get", "patch"], url_path="my-profile",
            permission_classes=[IsAuthenticated])
    def my_profile(self, request):
        """
        GET/PATCH /api/patients/my-profile/
        Permet à un patient de consulter et mettre à jour son propre profil.
        """
        try:
            profile = request.user.profile
            patient = profile.patient
        except Exception:
            return Response(
                {"detail": "Profil patient introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )

        if request.method == "GET":
            serializer = PatientSerializer(patient)
            return Response(serializer.data)

        elif request.method == "PATCH":
            serializer = PatientOnboardingSerializer(patient, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                create_audit_log(
                    action="UPDATE",
                    entity_type="Patient",
                    entity_id=str(patient.id),
                    user=request.user,
                    details={"updated_fields": list(request.data.keys())},
                )
                return Response(PatientSerializer(patient).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)