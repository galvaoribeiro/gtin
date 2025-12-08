"""
Schemas para endpoints de métricas.
===================================
Define os modelos Pydantic para respostas de métricas de uso.
"""
import datetime
from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class DailyUsage(BaseModel):
    """Uso de uma API key em um dia específico."""
    date: datetime.date = Field(..., description="Data do uso")
    success_count: int = Field(..., description="Total de chamadas com sucesso (2xx)")
    error_count: int = Field(..., description="Total de chamadas com erro (4xx/5xx)")
    total_count: int = Field(..., description="Total de chamadas")


class ApiKeyUsageSummary(BaseModel):
    """Resumo de uso de uma API key."""
    api_key_id: int = Field(..., description="ID da API key")
    api_key_name: Optional[str] = Field(None, description="Nome da API key")
    total_success: int = Field(..., description="Total de chamadas com sucesso no período")
    total_error: int = Field(..., description="Total de chamadas com erro no período")
    total_calls: int = Field(..., description="Total de chamadas no período")


class UsageSummaryResponse(BaseModel):
    """Resposta com resumo de uso agregado."""
    period_days: int = Field(..., description="Número de dias do período (ex: 7, 30)")
    start_date: date = Field(..., description="Data inicial do período")
    end_date: date = Field(..., description="Data final do período")
    total_success: int = Field(..., description="Total de chamadas com sucesso")
    total_error: int = Field(..., description="Total de chamadas com erro")
    total_calls: int = Field(..., description="Total de chamadas")
    by_api_key: list[ApiKeyUsageSummary] = Field(default_factory=list, description="Resumo por API key")


class DailySeriesResponse(BaseModel):
    """Resposta com série diária de uso."""
    start_date: date = Field(..., description="Data inicial do período")
    end_date: date = Field(..., description="Data final do período")
    total_days: int = Field(..., description="Número de dias no período")
    series: list[DailyUsage] = Field(default_factory=list, description="Série diária de uso")


class ApiKeyDailySeriesResponse(BaseModel):
    """Resposta com série diária de uso de uma API key específica."""
    api_key_id: int = Field(..., description="ID da API key")
    api_key_name: Optional[str] = Field(None, description="Nome da API key")
    start_date: date = Field(..., description="Data inicial do período")
    end_date: date = Field(..., description="Data final do período")
    total_days: int = Field(..., description="Número de dias no período")
    total_success: int = Field(..., description="Total de sucesso no período")
    total_error: int = Field(..., description="Total de erro no período")
    series: list[DailyUsage] = Field(default_factory=list, description="Série diária de uso")
