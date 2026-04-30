"""
AI Agent Service — Claude/Gemini Integration

Features:
- Generate medical reports
- Analyze risk scores
- Suggest treatment plans
- Provide clinical insights

IMPORTANT: AI is assistive only - no critical decisions
"""

import os
import json
from typing import Dict, Any, Optional
from abc import ABC, abstractmethod


class AIProvider(ABC):
    """Abstract base for AI providers"""
    
    @abstractmethod
    def generate_report(self, patient_data: Dict, case_data: Dict) -> Dict[str, Any]:
        """Generate clinical report"""
        pass
    
    @abstractmethod
    def analyze_scores(self, scores: Dict, vitals: Dict) -> Dict[str, Any]:
        """Analyze clinical scores"""
        pass
    
    @abstractmethod
    def suggest_treatment_plan(self, patient_data: Dict, diagnosis: str) -> Dict[str, Any]:
        """Suggest treatment plan"""
        pass


class ClaudeProvider(AIProvider):
    """Claude API provider"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('CLAUDE_API_KEY')
        self.model = "claude-3-opus-20240229"
        
        if not self.api_key:
            raise ValueError("CLAUDE_API_KEY environment variable not set")
        
        # Note: Requires anthropic library
        try:
            import anthropic
            self.client = anthropic.Anthropic(api_key=self.api_key)
        except ImportError:
            raise ImportError("Install anthropic library: pip install anthropic")
    
    def generate_report(self, patient_data: Dict, case_data: Dict) -> Dict[str, Any]:
        """Generate clinical report using Claude"""
        
        prompt = f"""
        Analyze this anesthesia case and generate a brief clinical report.
        
        Patient: {patient_data.get('name')}
        Age: {patient_data.get('age')}
        
        Surgery Type: {case_data.get('surgery_type')}
        Case Status: {case_data.get('status')}
        
        Pre-op Risk Score: {case_data.get('preop_risk_score')}
        Critical Findings: {case_data.get('critical_findings', [])}
        
        Provide:
        1. Summary (1 paragraph)
        2. Key Risk Factors (3-5 bullets)
        3. Recommendations (3-5 bullets)
        
        Format as JSON with keys: summary, risk_factors, recommendations
        """
        
        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            # Parse response
            response_text = message.content[0].text
            
            # Try to extract JSON
            try:
                result = json.loads(response_text)
            except json.JSONDecodeError:
                # Fallback if not valid JSON
                result = {
                    "summary": response_text,
                    "risk_factors": [],
                    "recommendations": []
                }
            
            return {
                "success": True,
                "data": result,
                "model": self.model,
                "tokens_used": message.usage.output_tokens
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to generate report"
            }
    
    def analyze_scores(self, scores: Dict, vitals: Dict) -> Dict[str, Any]:
        """Analyze clinical scores"""
        
        prompt = f"""
        Analyze these anesthesia clinical scores and vital signs.
        
        Scores:
        {json.dumps(scores, indent=2)}
        
        Vitals:
        {json.dumps(vitals, indent=2)}
        
        Provide:
        1. Overall Risk Assessment
        2. Critical Values Alert (if any)
        3. Trend Analysis
        4. Clinical Interpretation
        
        Format as JSON with keys: overall_risk, critical_alerts, trends, interpretation
        """
        
        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            response_text = message.content[0].text
            
            try:
                result = json.loads(response_text)
            except json.JSONDecodeError:
                result = {
                    "overall_risk": "Unable to assess",
                    "critical_alerts": [],
                    "trends": [],
                    "interpretation": response_text
                }
            
            return {
                "success": True,
                "data": result,
                "model": self.model,
                "tokens_used": message.usage.output_tokens
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to analyze scores"
            }
    
    def suggest_treatment_plan(self, patient_data: Dict, diagnosis: str) -> Dict[str, Any]:
        """Suggest treatment plan"""
        
        prompt = f"""
        Based on this patient profile and diagnosis, suggest evidence-based treatment considerations.
        
        Patient Age: {patient_data.get('age')}
        Comorbidities: {patient_data.get('comorbidities', [])}
        Allergies: {patient_data.get('allergies', [])}
        
        Primary Diagnosis: {diagnosis}
        
        Provide treatment plan considerations (NOT prescriptions - assistive only):
        1. Anesthetic Considerations
        2. Monitoring Priorities
        3. Risk Mitigation Strategies
        4. Post-op Considerations
        5. Consultation Recommendations (if needed)
        
        Format as JSON with keys: anesthetic_considerations, monitoring_priorities, risk_mitigation, postop_considerations, consultations
        
        IMPORTANT: This is assistive guidance only. Final medical decisions must be made by qualified physicians.
        """
        
        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            response_text = message.content[0].text
            
            try:
                result = json.loads(response_text)
            except json.JSONDecodeError:
                result = {
                    "anesthetic_considerations": [],
                    "monitoring_priorities": [],
                    "risk_mitigation": [],
                    "postop_considerations": [],
                    "consultations": [],
                    "note": response_text
                }
            
            return {
                "success": True,
                "data": result,
                "model": self.model,
                "tokens_used": message.usage.output_tokens,
                "disclaimer": "AI-assisted guidance only. Medical decisions require qualified physician review."
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to suggest treatment plan"
            }


class GeminiProvider(AIProvider):
    """Google Gemini API provider"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('GOOGLE_API_KEY')
        self.model = "gemini-1.5-pro"
        
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY environment variable not set")
        
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            self.client = genai.GenerativeModel(self.model)
        except ImportError:
            raise ImportError("Install google library: pip install google-generativeai")
    
    def generate_report(self, patient_data: Dict, case_data: Dict) -> Dict[str, Any]:
        """Generate clinical report using Gemini"""
        
        prompt = f"""
        Analyze this anesthesia case and generate a brief clinical report.
        
        Patient: {patient_data.get('name')}
        Age: {patient_data.get('age')}
        Surgery Type: {case_data.get('surgery_type')}
        Case Status: {case_data.get('status')}
        Pre-op Risk Score: {case_data.get('preop_risk_score')}
        
        Provide:
        1. Summary (1 paragraph)
        2. Key Risk Factors (3-5 bullets)
        3. Recommendations (3-5 bullets)
        
        Return as JSON with keys: summary, risk_factors, recommendations
        """
        
        try:
            response = self.client.generate_content(prompt)
            
            response_text = response.text
            try:
                result = json.loads(response_text)
            except json.JSONDecodeError:
                result = {
                    "summary": response_text,
                    "risk_factors": [],
                    "recommendations": []
                }
            
            return {
                "success": True,
                "data": result,
                "model": self.model
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to generate report"
            }
    
    def analyze_scores(self, scores: Dict, vitals: Dict) -> Dict[str, Any]:
        """Analyze clinical scores"""
        
        prompt = f"""
        Analyze these clinical scores and vitals:
        Scores: {json.dumps(scores)}
        Vitals: {json.dumps(vitals)}
        
        Return JSON: {{overall_risk, critical_alerts, trends, interpretation}}
        """
        
        try:
            response = self.client.generate_content(prompt)
            response_text = response.text
            
            try:
                result = json.loads(response_text)
            except json.JSONDecodeError:
                result = {"interpretation": response_text}
            
            return {"success": True, "data": result, "model": self.model}
        
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def suggest_treatment_plan(self, patient_data: Dict, diagnosis: str) -> Dict[str, Any]:
        """Suggest treatment plan"""
        
        prompt = f"""
        Suggest treatment considerations for this case:
        Age: {patient_data.get('age')}
        Diagnosis: {diagnosis}
        
        Provide: anesthetic_considerations, monitoring_priorities, risk_mitigation
        Format as JSON.
        
        DISCLAIMER: This is assistive guidance only.
        """
        
        try:
            response = self.client.generate_content(prompt)
            response_text = response.text
            
            try:
                result = json.loads(response_text)
            except json.JSONDecodeError:
                result = {"guidance": response_text}
            
            return {
                "success": True,
                "data": result,
                "model": self.model,
                "disclaimer": "AI-assisted guidance only. Medical decisions require qualified physician review."
            }
        
        except Exception as e:
            return {"success": False, "error": str(e)}


# ── SERVICE FACTORY ──

class AIService:
    """Factory service for AI operations"""
    
    @staticmethod
    def get_provider(provider_name: str = "claude") -> AIProvider:
        """Get AI provider instance"""
        
        provider_name = (os.getenv('AI_PROVIDER') or provider_name).lower()
        
        if provider_name == "claude":
            return ClaudeProvider()
        elif provider_name == "gemini":
            return GeminiProvider()
        else:
            # Default to Claude
            return ClaudeProvider()
    
    @staticmethod
    def generate_report(patient_data: Dict, case_data: Dict) -> Dict[str, Any]:
        """Generate medical report"""
        provider = AIService.get_provider()
        return provider.generate_report(patient_data, case_data)
    
    @staticmethod
    def analyze_scores(scores: Dict, vitals: Dict) -> Dict[str, Any]:
        """Analyze clinical scores"""
        provider = AIService.get_provider()
        return provider.analyze_scores(scores, vitals)
    
    @staticmethod
    def suggest_treatment_plan(patient_data: Dict, diagnosis: str) -> Dict[str, Any]:
        """Suggest treatment plan"""
        provider = AIService.get_provider()
        return provider.suggest_treatment_plan(patient_data, diagnosis)
