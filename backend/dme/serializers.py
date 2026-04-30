"""
Serializers for DME/DPI module - Optimized for nested data access
"""

from rest_framework import serializers
from .models import (
    MedicalRecord, MedicalHistory, Diagnosis, Prescription,
    ClinicalDocument, Allergie
)


class AllergieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Allergie
        fields = ['id', 'allergen', 'reaction', 'severity', 'onset_date', 'is_active']
        read_only_fields = ['id']


class MedicalHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalHistory
        fields = ['id', 'type', 'description', 'date_occurrence', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class DiagnosisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Diagnosis
        fields = ['id', 'icd10_code', 'description', 'severity', 'is_primary', 'confirmed_at', 'created_at']
        read_only_fields = ['id', 'created_at']


class PrescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = ['id', 'medication_name', 'dosage', 'route', 'frequency', 
                  'start_date', 'end_date', 'status', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']


class ClinicalDocumentSerializer(serializers.ModelSerializer):
    file_url_display = serializers.SerializerMethodField()
    
    class Meta:
        model = ClinicalDocument
        fields = ['id', 'document_type', 'title', 'description', 'file', 'file_url', 
                  'file_url_display', 'document_date', 'created_by', 'is_confidential', 
                  'is_archived', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_file_url_display(self, obj):
        if obj.file:
            return obj.file.url
        return obj.file_url


class MedicalRecordDetailSerializer(serializers.ModelSerializer):
    """
    Serializer complet pour le DPI avec toutes les relations imbriquées
    """
    history_items = MedicalHistorySerializer(many=True, read_only=True)
    diagnoses = DiagnosisSerializer(many=True, read_only=True)
    prescriptions = PrescriptionSerializer(many=True, read_only=True)
    documents = ClinicalDocumentSerializer(many=True, read_only=True)
    allergies = AllergieSerializer(many=True, read_only=True)
    
    class Meta:
        model = MedicalRecord
        fields = ['id', 'patient', 'blood_group', 'weight', 'height', 'bmi', 'notes',
                  'history_items', 'diagnoses', 'prescriptions', 'documents', 'allergies',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class MedicalRecordSerializer(serializers.ModelSerializer):
    """
    Serializer simplifié pour listes
    """
    class Meta:
        model = MedicalRecord
        fields = ['id', 'patient', 'blood_group', 'weight', 'height', 'bmi', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
