from uuid import UUID

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
    update_academic_resource,
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


@router.patch("/periods/{period_id}", response_model=AcademicPeriod)
def update_academic_period(
    period_id: UUID,
    payload: AcademicPeriodCreate,
    _: set[RoleCode] = Depends(require_admin),  # noqa: B008
) -> AcademicPeriod:
    return update_academic_resource(
        "academic_periods", period_id, payload, AcademicPeriod
    )


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


@router.patch("/subjects/{subject_id}", response_model=Subject)
def update_subject(
    subject_id: UUID,
    payload: SubjectCreate,
    _: set[RoleCode] = Depends(require_admin),  # noqa: B008
) -> Subject:
    return update_academic_resource("subjects", subject_id, payload, Subject)


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


@router.patch("/teachers/{teacher_id}", response_model=Teacher)
def update_teacher(
    teacher_id: UUID,
    payload: TeacherCreate,
    _: set[RoleCode] = Depends(require_admin),  # noqa: B008
) -> Teacher:
    return update_academic_resource("teachers", teacher_id, payload, Teacher)


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


@router.patch("/course-sections/{course_section_id}", response_model=CourseSection)
def update_course_section(
    course_section_id: UUID,
    payload: CourseSectionCreate,
    _: set[RoleCode] = Depends(require_admin),  # noqa: B008
) -> CourseSection:
    return update_academic_resource(
        "course_sections", course_section_id, payload, CourseSection
    )


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


@router.patch("/laboratories/{laboratory_id}", response_model=Laboratory)
def update_laboratory(
    laboratory_id: UUID,
    payload: LaboratoryCreate,
    _: set[RoleCode] = Depends(require_admin),  # noqa: B008
) -> Laboratory:
    return update_academic_resource(
        "laboratories", laboratory_id, payload, Laboratory
    )
