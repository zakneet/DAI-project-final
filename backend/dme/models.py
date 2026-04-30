"""
DME/DPI Module — Medical Records & Documents

Entités principales:
- MedicalRecord: Dossier médical 1-1 avec Patient
- MedicalHistory: Antécédents médicaux
- Diagnosis: Diagnostics
- Prescription: Prescriptions de médicaments
- ClinicalDocument: Documents cliniques (rapports, images, PDF)
- Allergie: Allergies et intolerances
- Vital: Signes vitaux archivés

Relations:
  Patient → MedicalRecord → [History, Diagnosis, Prescription, Documents]
  AnesthesiaCase → (inherit from MedicalRecord)
"""

import uuid
from django.db import models
from django.utils import timezone
from patient.models import Patient
from casefile.models import AnesthesiaCase


class MedicalRecord(models.Model):
    """
    Dossier médical complet lié 1-1 à un Patient
    Point central d'agrégation de toutes les données médicales
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.OneToOneField(Patient, on_delete=models.CASCADE, related_name='medical_record')
    
    # Metadata
    blood_group = models.CharField(max_length=10, blank=True, null=True, help_text="A+, B-, etc.")
    weight = models.FloatField(null=True, blank=True, help_text="kg")
    height = models.FloatField(null=True, blank=True, help_text="cm")
    bmi = models.FloatField(null=True, blank=True, help_text="Calculated")
    
    # Important medical notes
    notes = models.TextField(blank=True, help_text="Résumé clinique important")
    
    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'medical_records'
        verbose_name = 'Medical Record'
    
    def __str__(self):
        return f"DPI - {self.patient}"
    
    def calculate_bmi(self):
        if self.weight and self.height:
            self.bmi = self.weight / ((self.height / 100) ** 2)
            self.save(update_fields=['bmi'])


class MedicalHistory(models.Model):
    """
    Antécédents médicaux et chirurgicaux
    """
    HISTORY_TYPES = [
        ('CARDIAC', 'Cardiaque'),
        ('PULMONARY', 'Pulmonaire'),
        ('METABOLIC', 'Métabolique'),
        ('NEUROLOGIC', 'Neurologique'),
        ('SURGICAL', 'Chirurgical'),
        ('MEDICATION', 'Médicamenteux'),
        ('ALLERGY', 'Allergie'),
        ('OTHER', 'Autre'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    medical_record = models.ForeignKey(MedicalRecord, on_delete=models.CASCADE, related_name='history_items')
    
    type = models.CharField(max_length=20, choices=HISTORY_TYPES)
    description = models.TextField(help_text="Description de l'antécédent")
    date_occurrence = models.DateField(null=True, blank=True)
    
    # Clinical significance
    is_active = models.BooleanField(default=True, help_text="Toujours pertinent ?")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'medical_history'
        ordering = ['-date_occurrence']
    
    def __str__(self):
        return f"{self.type} - {self.medical_record.patient}"


class Diagnosis(models.Model):
    """
    Diagnostics liés au cas anesthésique ou au dossier
    """
    SEVERITY_LEVELS = [
        ('CRITICAL', 'Critique'),
        ('HIGH', 'Élevée'),
        ('MODERATE', 'Modérée'),
        ('LOW', 'Faible'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    medical_record = models.ForeignKey(MedicalRecord, on_delete=models.CASCADE, related_name='diagnoses')
    anesthesia_case = models.ForeignKey(AnesthesiaCase, on_delete=models.SET_NULL, null=True, blank=True, related_name='diagnoses')
    
    icd10_code = models.CharField(max_length=10, help_text="ICD-10 code")
    description = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_LEVELS, default='MODERATE')
    
    # Clinical context
    is_primary = models.BooleanField(default=False)
    confirmed_at = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'diagnoses'
        ordering = ['-severity', '-confirmed_at']
    
    def __str__(self):
        return f"{self.icd10_code} - {self.description[:50]}"


class Prescription(models.Model):
    """
    Prescriptions de médicaments
    """
    ROUTES = [
        ('IV', 'Intraveineuse'),
        ('PO', 'Per os'),
        ('IM', 'Intramusculaire'),
        ('SC', 'Sous-cutanée'),
        ('INHAL', 'Inhalation'),
        ('TOPICAL', 'Topique'),
    ]
    
    STATUSES = [
        ('ACTIVE', 'Actif'),
        ('COMPLETED', 'Complété'),
        ('DISCONTINUED', 'Arrêté'),
        ('SUSPENDED', 'Suspendu'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    medical_record = models.ForeignKey(MedicalRecord, on_delete=models.CASCADE, related_name='prescriptions')
    anesthesia_case = models.ForeignKey(AnesthesiaCase, on_delete=models.SET_NULL, null=True, blank=True, related_name='prescriptions')
    
    medication_name = models.CharField(max_length=255)
    dosage = models.CharField(max_length=100, help_text="e.g., 500mg")
    route = models.CharField(max_length=20, choices=ROUTES)
    frequency = models.CharField(max_length=100, help_text="e.g., 3x daily")
    
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUSES, default='ACTIVE')
    
    notes = models.TextField(blank=True, help_text="Contra-indications, interactions, etc.")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'prescriptions'
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.medication_name} - {self.dosage}"


class ClinicalDocument(models.Model):
    """
    Documents cliniques: rapports, images, résultats de labs, etc.
    """
    DOC_TYPES = [
        ('REPORT', 'Rapport médical'),
        ('LAB_RESULT', 'Résultat de labo'),
        ('IMAGING', 'Image médicale'),
        ('ECG', 'ECG'),
        ('CHART', 'Feuille de soins'),
        ('NOTE', 'Note clinique'),
        ('PRESCRIPTION', 'Ordonnance'),
        ('CONSENT', 'Consentement'),
        ('OTHER', 'Autre'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    medical_record = models.ForeignKey(MedicalRecord, on_delete=models.CASCADE, related_name='documents')
    anesthesia_case = models.ForeignKey(AnesthesiaCase, on_delete=models.SET_NULL, null=True, blank=True, related_name='clinical_documents')
    
    document_type = models.CharField(max_length=20, choices=DOC_TYPES)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Storage (can be file, URL, or base64 reference)
    file = models.FileField(upload_to='documents/%Y/%m/%d/', null=True, blank=True)
    file_url = models.URLField(blank=True, help_text="External URL if not stored locally")
    
    # Metadata
    document_date = models.DateField()
    created_by = models.CharField(max_length=255, blank=True, help_text="Provider name")
    
    is_confidential = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'clinical_documents'
        ordering = ['-document_date']
        indexes = [
            models.Index(fields=['medical_record', '-document_date']),
            models.Index(fields=['document_type', 'document_date']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.document_date})"


class Allergie(models.Model):
    """
    Allergies et intolerances
    """
    SEVERITY_LEVELS = [
        ('MILD', 'Légère'),
        ('MODERATE', 'Modérée'),
        ('SEVERE', 'Grave'),
        ('LIFE_THREATENING', 'Menaçante pour la vie'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    medical_record = models.ForeignKey(MedicalRecord, on_delete=models.CASCADE, related_name='allergies')
    
    allergen = models.CharField(max_length=255, help_text="e.g., Penicillin, Peanuts")
    reaction = models.TextField(help_text="Description de la réaction")
    severity = models.CharField(max_length=20, choices=SEVERITY_LEVELS)
    
    onset_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'allergies'
    
    def __str__(self):
        return f"{self.allergen} - {self.severity}"
