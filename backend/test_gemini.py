import os, sys, django
sys.path.append(r'C:\Users\GIGABYTE\Documents\2emec2s\Projetsantepublic\DAI-VF\yasmine_DAI\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dai_api.settings')
django.setup()

from ai_assistant.services.rag_service import llm
from langchain_core.prompts import PromptTemplate

if not llm:
    print("LLM is None!")
    sys.exit(1)

template = "Say hello"
prompt = PromptTemplate(input_variables=[], template=template)
try:
    response = llm.invoke(prompt.format())
    print(response)
except Exception as e:
    print("EXCEPTION:", e)
