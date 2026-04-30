from django.db import models
import uuid


class Patient(models.Model):
    GENDER_CHOICES = [
        ('M', 'Masculin'),
        ('F', 'Féminin'),
        ('OTHER', 'Autre'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # ── Identité de base ───────────────────────────────────────────────────────
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    birth_date = models.DateField()
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, default='M')

    # ── Données confidentielles / de contact ──────────────────────────────────
    id_card_number = models.CharField(
        max_length=50, blank=True, null=True,
        help_text="Numéro de carte d'identité nationale"
    )
    phone = models.CharField(
        max_length=20, blank=True, null=True,
        help_text="Numéro de téléphone principal"
    )
    address = models.TextField(
        blank=True, null=True,
        help_text="Adresse complète"
    )

    # ── Contact d'urgence ─────────────────────────────────────────────────────
    emergency_contact_name = models.CharField(
        max_length=150, blank=True, null=True,
        help_text="Nom du contact en cas d'urgence"
    )
    emergency_contact_phone = models.CharField(
        max_length=20, blank=True, null=True,
        help_text="Téléphone du contact d'urgence"
    )
    emergency_contact_relation = models.CharField(
        max_length=50, blank=True, null=True,
        help_text="Relation (ex: conjoint, parent)"
    )

    # ── Informations complémentaires ──────────────────────────────────────────
    profession = models.CharField(max_length=100, blank=True, null=True)
    nationality = models.CharField(max_length=50, blank=True, null=True, default='Algérienne')
    blood_type = models.CharField(
        max_length=5, blank=True, null=True,
        help_text="A+, A-, B+, B-, AB+, AB-, O+, O-"
    )

    # ── Habitudes de vie ─────────────────────────────────────────────────────
    is_smoker = models.BooleanField(default=False)
    is_alcohol_user = models.BooleanField(default=False)
    physical_activity = models.CharField(
        max_length=20,
        choices=[('NONE', 'Sédentaire'), ('LIGHT', 'Légère'), ('MODERATE', 'Modérée'), ('INTENSE', 'Intense')],
        blank=True, null=True
    )

    # ── Statut d'onboarding ──────────────────────────────────────────────────
    onboarding_completed = models.BooleanField(
        default=False,
        help_text="Le patient a complété son profil initial"
    )

    # ── Tracking ─────────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "patients"
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def age(self):
        from datetime import date
        today = date.today()
        return today.year - self.birth_date.year - (
            (today.month, today.day) < (self.birth_date.month, self.birth_date.day)
        )