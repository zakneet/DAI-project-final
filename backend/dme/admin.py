from django.contrib import admin
from .models import (
    MedicalRecord, MedicalHistory, Diagnosis, Prescription,
    ClinicalDocument, Allergie
)


@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'blood_group', 'weight', 'height', 'bmi', 'created_at')
    list_filter = ('blood_group', 'created_at')
    search_fields = ('patient__first_name', 'patient__last_name')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(MedicalHistory)
class MedicalHistoryAdmin(admin.ModelAdmin):
    list_display = ('type', 'medical_record', 'is_active', 'date_occurrence')
    list_filter = ('type', 'is_active', 'date_occurrence')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(Diagnosis)
class DiagnosisAdmin(admin.ModelAdmin):
    list_display = ('icd10_code', 'description', 'severity', 'is_primary')
    list_filter = ('severity', 'is_primary')
    search_fields = ('icd10_code', 'description')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ('medication_name', 'dosage', 'route', 'status', 'start_date')
    list_filter = ('status', 'route', 'start_date')
    search_fields = ('medication_name',)
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(ClinicalDocument)
class ClinicalDocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'document_type', 'document_date', 'is_archived')
    list_filter = ('document_type', 'document_date', 'is_archived')
    search_fields = ('title', 'description')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(Allergie)
class AllergieAdmin(admin.ModelAdmin):
    list_display = ('allergen', 'severity', 'is_active')
    list_filter = ('severity', 'is_active')
    search_fields = ('allergen',)
    readonly_fields = ('id', 'created_at', 'updated_at')
