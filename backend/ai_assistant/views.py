from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .services.rag_service import ask_clinical_question

class AskAICopilotView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        query = request.data.get('query')
        context_type = request.data.get('context_type', 'doctor')
        patient_id = request.data.get('patient_id')
        case_id = request.data.get('case_id')

        if not query:
            return Response({"error": "La requête (query) est requise."}, status=status.HTTP_400_BAD_REQUEST)

        # Process the question through the RAG service
        try:
            result = ask_clinical_question(
                query=query,
                context_type=context_type,
                patient_id=patient_id,
                case_id=case_id
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
