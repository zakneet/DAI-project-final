"""
Views for AI Agent module
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from casefile.models import AnesthesiaCase
from patient.models import Patient
from common.permissions import IsClinicalStaff
from .service import AIService


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsClinicalStaff])
def generate_report_view(request):
    """
    POST /api/ai/generate-report/
    
    Generate AI-assisted clinical report
    """
    
    try:
        case_id = request.data.get('case_id')
        patient_id = request.data.get('patient_id')
        
        if not case_id or not patient_id:
            return Response(
                {"error": "case_id and patient_id required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        case = AnesthesiaCase.objects.get(id=case_id)
        patient = Patient.objects.get(id=patient_id)
        
        # Prepare data for AI
        patient_data = {
            "name": f"{patient.first_name} {patient.last_name}",
            "age": patient.birth_date,
            "id": str(patient.id)
        }
        
        case_data = {
            "surgery_type": case.surgery_type,
            "status": case.status,
            "preop_risk_score": 0,  # TODO: fetch from preop module
            "critical_findings": []  # TODO: fetch from vitals/observations
        }
        
        # Call AI service
        result = AIService.generate_report(patient_data, case_data)
        
        return Response(result, status=status.HTTP_200_OK)
    
    except AnesthesiaCase.DoesNotExist:
        return Response(
            {"error": "Case not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Patient.DoesNotExist:
        return Response(
            {"error": "Patient not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsClinicalStaff])
def analyze_scores_view(request):
    """
    POST /api/ai/analyze-scores/
    
    Analyze clinical scores and vitals
    """
    
    try:
        scores = request.data.get('scores', {})
        vitals = request.data.get('vitals', {})
        
        result = AIService.analyze_scores(scores, vitals)
        
        return Response(result, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsClinicalStaff])
def treatment_plan_view(request):
    """
    POST /api/ai/treatment-plan/
    
    Get AI-assisted treatment plan
    """
    
    try:
        patient_id = request.data.get('patient_id')
        diagnosis = request.data.get('diagnosis', '')
        
        if not patient_id:
            return Response(
                {"error": "patient_id required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        patient = Patient.objects.get(id=patient_id)
        
        patient_data = {
            "age": patient.birth_date,
            "comorbidities": [],  # TODO: fetch from medical history
            "allergies": []  # TODO: fetch from medical record
        }
        
        result = AIService.suggest_treatment_plan(patient_data, diagnosis)
        
        return Response(result, status=status.HTTP_200_OK)
    
    except Patient.DoesNotExist:
        return Response(
            {"error": "Patient not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ai_health_check(request):
    """
    GET /api/ai/health/
    
    Check AI service status
    """
    
    try:
        provider_name = "claude"  # Could be configurable
        return Response(
            {
                "status": "ok",
                "provider": provider_name,
                "message": "AI Agent service is available"
            },
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {
                "status": "error",
                "error": str(e)
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
