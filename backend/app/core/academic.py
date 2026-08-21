from datetime import date, datetime
from typing import Optional, TypeVar
from uuid import UUID

import httpx
from fastapi import HTTPException, status
from pydantic import BaseModel, Field, model_validator

from app.core.admin import _service_headers, _supabase_url

ModelType = TypeVar("ModelType", bound=BaseModel)


class AcademicPeriodCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    start_date: date
    end_date: date
    is_active: bool = True

    @model_validator(mode="after")
    def dates_are_valid(self) -> "AcademicPeriodCreate":
        if self.end_date < self.start_date:
            raise ValueError(
                "La fecha de finalización no puede ser anterior al inicio."
            )
        return self


class AcademicPeriod(AcademicPeriodCreate):
    id: UUID
    created_at: datetime


class SubjectCreate(BaseModel):
    code: Optional[str] = Field(default=None, max_length=40)
    name: str = Field(min_length=1, max_length=160)
    is_active: bool = True


class Subject(SubjectCreate):
    id: UUID
    created_at: datetime
    updated_at: datetime


class TeacherCreate(BaseModel):
    user_id: UUID
    employee_code: Optional[str] = Field(default=None, max_length=40)
    is_active: bool = True


class Teacher(TeacherCreate):
    id: UUID
    created_at: datetime
    updated_at: datetime


class CourseSectionCreate(BaseModel):
    subject_id: UUID
    teacher_id: UUID
    academic_period_id: UUID
    section: str = Field(min_length=1, max_length=40)
    semester: Optional[str] = Field(default=None, max_length=40)
    is_active: bool = True


class CourseSection(CourseSectionCreate):
    id: UUID
    created_at: datetime
    updated_at: datetime


class LaboratoryCreate(BaseModel):
    code: Optional[str] = Field(default=None, max_length=40)
    name: str = Field(min_length=1, max_length=160)
    location_description: Optional[str] = Field(default=None, max_length=300)
    is_active: bool = True


class Laboratory(LaboratoryCreate):
    id: UUID
    created_at: datetime


def _data_api_error(detail: str, error: httpx.HTTPError) -> HTTPException:
    if isinstance(error, httpx.HTTPStatusError) and error.response.status_code in {
        status.HTTP_400_BAD_REQUEST,
        status.HTTP_409_CONFLICT,
    }:
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=detail,
    )


def create_academic_resource(
    resource: str,
    payload: BaseModel,
    model: type[ModelType],
) -> ModelType:
    try:
        response = httpx.post(
            f"{_supabase_url()}/rest/v1/{resource}",
            json=payload.model_dump(mode="json"),
            headers={**_service_headers(), "Prefer": "return=representation"},
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise _data_api_error(
            "No fue posible crear el registro académico.",
            error,
        ) from error

    return model.model_validate(response.json()[0])


def list_academic_resources(
    resource: str,
    model: type[ModelType],
    order: str,
) -> list[ModelType]:
    try:
        response = httpx.get(
            f"{_supabase_url()}/rest/v1/{resource}",
            params={"select": "*", "order": order},
            headers=_service_headers(),
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise _data_api_error(
            "No fue posible consultar la configuración académica.",
            error,
        ) from error

    return [model.model_validate(row) for row in response.json()]
