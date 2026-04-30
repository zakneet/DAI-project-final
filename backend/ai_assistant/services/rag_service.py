import os
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.prompts import PromptTemplate
from django.conf import settings
from patient.models import Patient
from dme.models import MedicalRecord

# Initialize Gemini Model
try:
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.2,
        google_api_key=getattr(settings, "GOOGLE_API_KEY", None)
    )
except Exception as e:
    print(f"Error initializing Gemini: {e}")
    llm = None

def get_patient_context(patient_id):
    """Retrieve structured data (DPI) from MySQL for the patient."""
    if not patient_id:
        return "Aucun patient spécifique sélectionné."
    
    try:
        patient = Patient.objects.get(id=patient_id)
        context = f"Nom: {patient.first_name} {patient.last_name}\n"
        context += f"Âge: {patient.age} ans\n"
        context += f"Sexe: {patient.gender}\n"
        context += f"Groupe Sanguin: {patient.blood_type or 'Non renseigné'}\n"
        
        # Check if medical record exists
        record = MedicalRecord.objects.filter(patient=patient).first()
        if record:
            context += "\n--- ANTÉCÉDENTS ---\n"
            for item in record.history_items.all():
                context += f"- [{item.type}] {item.description}\n"
            
            context += "\n--- ALLERGIES ---\n"
            for alg in record.allergies.all():
                context += f"- {alg.allergen} ({alg.severity}): {alg.reaction}\n"
                
            context += "\n--- TRAITEMENTS EN COURS ---\n"
            for med in record.prescriptions.all():
                context += f"- {med.medication_name} {med.dosage} ({med.route})\n"
                
        return context
    except Patient.DoesNotExist:
        return "Patient introuvable dans la base de données."
    except Exception as e:
        return f"Erreur lors de la récupération du dossier: {str(e)}"

def ask_clinical_question(query, context_type="doctor", patient_id=None, case_id=None):
    """
    Main function to process the user's query.
    1. Fetches Patient Context from DB (DPI).
    2. (Future) Fetches similar medical protocols from VectorDB.
    3. Prompts Gemini and returns the answer.
    """
    if not llm:
        return {"answer": "L'API Gemini n'est pas configurée correctement sur le backend."}

    # 1. Fetch Patient Context
    patient_context = "Non applicable"
    if patient_id:
        patient_context = get_patient_context(patient_id)
    # TODO: if case_id, fetch surgery details (PerOp, PreOp scores)

    # 2. Prompt Template
    template = """
    Tu es un Assistant d'Aide à la Décision Clinique expert en anesthésie-réanimation.
    Ton rôle est d'aider le {context_type} (Médecin, IADE, ou équipe SSPI).
    
    INFORMATIONS DU DOSSIER PATIENT (DPI) :
    {patient_context}
    
    INSTRUCTIONS :
    - Réponds de manière professionnelle, concise et médicale.
    - Base-toi sur les informations du dossier si disponibles.
    - Si tu détectes une urgence ou un risque (ex: allergie, traitement contradictoire), mets-le en évidence.
    - Avertissement: Précise toujours que tu es une IA et que le médecin garde la responsabilité finale.
    
    QUESTION DU SOIGNANT :
    {query}
    
    RÉPONSE CLINIQUE :
    """
    
    prompt = PromptTemplate(
        input_variables=["context_type", "patient_context", "query"],
        template=template
    )
    
    # 3. Call LLM
    try:
        formatted_prompt = prompt.format(
            context_type=context_type,
            patient_context=patient_context,
            query=query
        )
        response = llm.invoke(formatted_prompt)
        return {"answer": response.content}
    except Exception as e:
        print(f"Error calling Gemini: {e}")
        return {"answer": "Désolé, une erreur technique est survenue lors de l'appel au modèle IA."}
