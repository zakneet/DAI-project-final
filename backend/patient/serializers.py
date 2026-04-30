from rest_framework import serializers
from .models import Patient


class PatientSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    age = serializers.ReadOnlyField()

    class Meta:
        model = Patient
        fields = [
            "id", "first_name", "last_name", "full_name", "birth_date", "gender", "age",
            # Données confidentielles
            "id_card_number", "phone", "address",
            # Contact d'urgence
            "emergency_contact_name", "emergency_contact_phone", "emergency_contact_relation",
            # Complémentaires
            "profession", "nationality", "blood_type",
            # Habitudes
            "is_smoker", "is_alcohol_user", "physical_activity",
            # Onboarding
            "onboarding_completed",
            # Tracking
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "full_name", "age"]


class PatientPublicSerializer(serializers.ModelSerializer):
    """Serializer limité pour affichage public (sans données confidentielles)"""
    full_name = serializers.ReadOnlyField()
    age = serializers.ReadOnlyField()

    class Meta:
        model = Patient
        fields = [
            "id", "first_name", "last_name", "full_name",
            "birth_date", "gender", "age", "blood_type",
            "onboarding_completed", "created_at",
        ]
        read_only_fields = ["id", "created_at", "full_name", "age"]


class PatientOnboardingSerializer(serializers.ModelSerializer):
    """Serializer pour le formulaire d'onboarding patient"""
    class Meta:
        model = Patient
        fields = [
            "first_name", "last_name", "birth_date", "gender",
            "id_card_number", "phone", "address",
            "emergency_contact_name", "emergency_contact_phone", "emergency_contact_relation",
            "profession", "nationality", "blood_type",
            "is_smoker", "is_alcohol_user", "physical_activity",
            "onboarding_completed",
        ]