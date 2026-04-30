"""
Role-Based Access Control (RBAC) Permissions

Defines who can access what based on their Profile.role
"""

from rest_framework.permissions import BasePermission
from .models import Role


class HasAllowedRole(BasePermission):
    """Base permission class for role-based access"""
    allowed_roles = []

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        # Check by Profile role
        try:
            profile = user.profile
            return profile.role in self.allowed_roles or (profile.role == Role.ADMIN)
        except:
            return False


# ── BASE ROLE PERMISSIONS ──

class IsDoctor(BasePermission):
    """Only DOCTOR role"""
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        
        try:
            return user.profile.role == Role.DOCTOR
        except:
            return False


class IsIADE(BasePermission):
    """Only IADE role"""
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        
        try:
            return user.profile.role == Role.IADE
        except:
            return False


class IsSSPI(BasePermission):
    """Only SSPI role"""
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        
        try:
            return user.profile.role == Role.SSPI
        except:
            return False


class IsAdmin(BasePermission):
    """Only ADMIN role"""
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        
        try:
            return user.profile.role == Role.ADMIN
        except:
            return False


class IsPatient(BasePermission):
    """Only PATIENT role"""
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        
        try:
            return user.profile.role == Role.PATIENT
        except:
            return False


# ── COMBINED PERMISSIONS ──

class IsDoctorOrAdmin(BasePermission):
    """DOCTOR or ADMIN"""
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        
        try:
            return user.profile.role in [Role.DOCTOR, Role.ADMIN]
        except:
            return False


class IsDoctorOrIADE(BasePermission):
    """DOCTOR or IADE - for pre-op and per-op modules"""
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        
        try:
            return user.profile.role in [Role.DOCTOR, Role.IADE, Role.ADMIN]
        except:
            return False


class IsDoctorOrIADEOrSSPI(BasePermission):
    """DOCTOR or IADE or SSPI - for clinical data access"""
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        
        try:
            return user.profile.role in [Role.DOCTOR, Role.IADE, Role.SSPI, Role.ADMIN]
        except:
            return False


class IsClinicalStaff(BasePermission):
    """Any clinical staff (DOCTOR, IADE, SSPI)"""
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        
        try:
            return user.profile.is_clinical_staff
        except:
            return False


class IsPerOpStaff(BasePermission):
    """DOCTOR or IADE - for per-op operations"""
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        
        try:
            return user.profile.role in [Role.DOCTOR, Role.IADE, Role.ADMIN]
        except:
            return False


class IsPostOpStaff(BasePermission):
    """DOCTOR or SSPI - for post-op operations"""
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        
        try:
            return user.profile.role in [Role.DOCTOR, Role.SSPI, Role.ADMIN]
        except:
            return False


# ── OBJECT-LEVEL PERMISSIONS ──

class IsOwnPatient(BasePermission):
    """Patient can only see their own data"""
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        
        try:
            # For Patient objects
            if hasattr(obj, 'id'):
                return user.profile.patient_id == obj.id
            # For AnesthesiaCase objects
            elif hasattr(obj, 'patient'):
                return user.profile.patient_id == obj.patient.id
        except:
            pass
        
        return False


# ── LEGACY SUPPORT ──

class HasAllowedRoleByGroup(HasAllowedRole):
    """Legacy: Check by Django groups"""
    allowed_roles = []

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        user_groups = set(user.groups.values_list("name", flat=True))
        return bool(user_groups.intersection(set(self.allowed_roles)))


class IsAnesthesist(HasAllowedRoleByGroup):
    """Legacy: Doctor role"""
    allowed_roles = ["DOCTOR", "ANESTHESIST", "ADMIN"]
