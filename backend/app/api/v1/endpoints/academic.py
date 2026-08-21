from fastapi import APIRouter, Depends, status

from app.api.v1.endpoints.admin import require_admin
from app.core.academic import (
    AcademicPeriod,
    AcademicPeriodCreate,
    CourseSection,
    CourseSectionCreate,
    Laboratory,
    LaboratoryCreate,
    Subject,
    SubjectCreate,
    Teacher,
    TeacherCreate,
    create_academic_resource,
    list_academic_resources,
)
from app.core.auth import RoleCode

router = APIRouter(prefix="/admin/academic")


@router.get("/periods", response_model=list[AcademicPeriod])
def get_academic_periods(
    _: set[RoleCode] = Depends(require_admin),  # noqa: B008
) -> list[AcademicPeriod]:
    return list_academic_resources(
        "academic_periods",
        AcademicPeriod,
        "start_date.desc",
    )


@router.post(
    "/periods",
    response_model=AcademicPeriod,
    status_code=status.HTTP_201_CREATED,
)
def create_academic_period(
    payload: AcademicPeriodCreate,
    _: set[RoleCode] = Depends(require_admin),  # noqa: B008
) -> AcademicPeriod:
    return create_academic_resource("academic_periods", payload, AcademicPeriod)


@router.get("/subjects", response_model=list[Subject])
def get_subjects(
    _: set[RoleCode] = Depends(require_admin),  # noqa: B008
) -> list[Subject]:
    return list_academic_resources("subjects", Subject, "name.asc")


@router.post("/subjects", response_model=Subject, status_code=status.HTTP_201_CREATED)
def create_subject(
    payload: SubjectCreate,
    _: set[RoleCode] = Depends(require_admin),  # noqa: B008
) -> Subject:
    return create_academic_resource("subjects", payload, Subject)


@router.get("/teachers", response_model=list[Teacher])
def get_teachers(
    _: set[RoleCode] = Depends(require_admin),  # noqa: B008
) -> list[Teacher]:
    return list_academic_resources("teachers", Teacher, "created_at.desc")


@router.post("/teachers", response_model=Teacher, status_code=status.HTTP_201_CREATED)
def create_teacher(
    payload: TeacherCreate,
    _: set[RoleCode] = Depends(require_admin),  # noqa: B008
) -> Teacher:
    return create_academic_resource("teachers", payload, Teacher)


@router.get("/course-sections", response_model=list[CourseSection])
def get_course_sections(
    _: set[RoleCode] = Depends(require_admin),  # noqa: B008
) -> list[CourseSection]:
    return list_academic_resources("course_sections", CourseSection, "created_at.desc")


@router.post(
    "/course-sections",
    response_model=CourseSection,
    status_code=status.HTTP_201_CREATED,
)
def create_course_section(
    payload: CourseSectionCreate,
    _: set[RoleCode] = Depends(require_admin),  # noqa: B008
) -> CourseSection:
    return create_academic_resource("course_sections", payload, CourseSection)


@router.get("/laboratories", response_model=list[Laboratory])
def get_laboratories(
    _: set[RoleCode] = Depends(require_admin),  # noqa: B008
) -> list[Laboratory]:
    return list_academic_resources("laboratories", Laboratory, "name.asc")


@router.post(
    "/laboratories",
    response_model=Laboratory,
    status_code=status.HTTP_201_CREATED,
)
def create_laboratory(
    payload: LaboratoryCreate,
    _: set[RoleCode] = Depends(require_admin),  # noqa: B008
) -> Laboratory:
    return create_academic_resource("laboratories", payload, Laboratory)
