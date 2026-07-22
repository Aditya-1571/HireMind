import unittest
from datetime import UTC, datetime
from uuid import uuid4

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError

from app.api.auth import get_current_user
from app.api.profile import ProfileUpdateRequest
from app.models import User, UserProfile
from app.services.profile_service import (
    InterviewDefaultsPatchValues,
    ProfilePatchValues,
    ProfileValues,
    build_profile_response,
    calculate_profile_completion,
    get_profile_response,
    patch_profile_response,
)


def user(name: str = "Google User") -> User:
    return User(
        id=uuid4(),
        google_id=f"google-{uuid4()}",
        email="user@example.com",
        name=name,
        profile_picture="https://example.com/avatar.png",
        created_at=datetime(2026, 7, 23, tzinfo=UTC),
    )


def profile(owner: User, **overrides: object) -> UserProfile:
    values = {
        "user_id": owner.id,
        "full_name": None,
        "professional_headline": None,
        "target_role": None,
        "experience_level": None,
        "bio": None,
        "default_interview_type": None,
        "default_difficulty": None,
        "default_question_count": 10,
        "default_time_limit_minutes": None,
        "default_evaluation_style": "balanced",
        "default_answer_mode": "text",
    }
    values.update(overrides)
    return UserProfile(**values)


class FakeDb:
    def __init__(self, stored_profile: UserProfile | None = None) -> None:
        self.profile = stored_profile
        self.add_count = 0
        self.commit_count = 0
        self.rollback_count = 0

    def scalar(self, _statement: object) -> UserProfile | None:
        return self.profile

    def add(self, value: UserProfile) -> None:
        self.add_count += 1
        self.profile = value

    def commit(self) -> None:
        self.commit_count += 1

    def rollback(self) -> None:
        self.rollback_count += 1

    def refresh(self, _value: UserProfile) -> None:
        return None


class RaceDb(FakeDb):
    def __init__(self, owner: User) -> None:
        super().__init__(None)
        self.owner = owner
        self._raised = False

    def commit(self) -> None:
        self.commit_count += 1
        if not self._raised:
            self._raised = True
            self.profile = profile(self.owner)
            raise IntegrityError("insert", {}, Exception("duplicate"))


class ProfileSettingsTests(unittest.TestCase):
    def test_authenticated_get_returns_defaults_when_no_profile_exists(self) -> None:
        current_user = user()
        response = get_profile_response(FakeDb(None), current_user)

        self.assertEqual(response.profile.full_name, "Google User")
        self.assertEqual(response.interview_defaults.interview_type, "HR")
        self.assertEqual(response.interview_defaults.difficulty, "Easy")
        self.assertEqual(response.interview_defaults.question_count, 10)
        self.assertEqual(response.interview_defaults.evaluation_style, "balanced")
        self.assertEqual(response.interview_defaults.answer_mode, "text")

    def test_get_uses_user_name_and_completion_is_twenty(self) -> None:
        response = get_profile_response(FakeDb(None), user("Ada Lovelace"))

        self.assertEqual(response.profile.full_name, "Ada Lovelace")
        self.assertEqual(response.profile_completion, 20)

    def test_unauthenticated_get_is_rejected(self) -> None:
        with self.assertRaises(HTTPException) as raised:
            get_current_user(FakeDb(None), authorization=None)

        self.assertEqual(raised.exception.status_code, 401)

    def test_patch_creates_missing_profile_row(self) -> None:
        current_user = user()
        db = FakeDb(None)

        response = patch_profile_response(
            db,
            current_user,
            profile_patch=ProfilePatchValues(target_role="Backend Developer"),
        )

        self.assertEqual(db.add_count, 1)
        self.assertEqual(response.profile.target_role, "Backend Developer")

    def test_partial_profile_patch_preserves_omitted_fields(self) -> None:
        current_user = user()
        stored = profile(
            current_user,
            full_name="Existing Name",
            target_role="Frontend Developer",
        )

        response = patch_profile_response(
            FakeDb(stored),
            current_user,
            profile_patch=ProfilePatchValues(professional_headline="Engineer"),
        )

        self.assertEqual(response.profile.full_name, "Existing Name")
        self.assertEqual(response.profile.target_role, "Frontend Developer")
        self.assertEqual(response.profile.professional_headline, "Engineer")

    def test_partial_defaults_patch_preserves_omitted_fields(self) -> None:
        current_user = user()
        stored = profile(
            current_user,
            default_interview_type="Technical",
            default_difficulty="Hard",
        )

        response = patch_profile_response(
            FakeDb(stored),
            current_user,
            defaults_patch=InterviewDefaultsPatchValues(question_count=30),
        )

        self.assertEqual(response.interview_defaults.interview_type, "Technical")
        self.assertEqual(response.interview_defaults.difficulty, "Hard")
        self.assertEqual(response.interview_defaults.question_count, 30)

    def test_combined_patch_updates_both_sections(self) -> None:
        current_user = user()
        response = patch_profile_response(
            FakeDb(profile(current_user)),
            current_user,
            profile_patch=ProfilePatchValues(bio="Builds APIs."),
            defaults_patch=InterviewDefaultsPatchValues(
                interview_type="Mixed",
                difficulty="Medium",
            ),
        )

        self.assertEqual(response.profile.bio, "Builds APIs.")
        self.assertEqual(response.interview_defaults.interview_type, "Mixed")
        self.assertEqual(response.interview_defaults.difficulty, "Medium")

    def test_clearing_full_name_returns_to_user_name_fallback(self) -> None:
        current_user = user("Google Name")
        stored = profile(current_user, full_name="Profile Name")

        response = patch_profile_response(
            FakeDb(stored),
            current_user,
            profile_patch=ProfilePatchValues(full_name=None),
        )

        self.assertEqual(response.profile.full_name, "Google Name")

    def test_whitespace_only_optional_strings_normalize_to_null(self) -> None:
        payload = ProfileUpdateRequest.model_validate(
            {
                "profile": {
                    "full_name": "   ",
                    "professional_headline": "  ",
                    "target_role": "\t",
                    "bio": "\n",
                }
            }
        )

        self.assertIsNone(payload.profile.full_name)
        self.assertIsNone(payload.profile.professional_headline)
        self.assertIsNone(payload.profile.target_role)
        self.assertIsNone(payload.profile.bio)

    def test_unsupported_fields_are_rejected(self) -> None:
        invalid_payloads = [
            {"email": "new@example.com"},
            {"profile": {"email": "new@example.com"}},
            {"interview_defaults": {"google_id": "abc"}},
            {"account": {"auth_provider": "google"}},
        ]

        for payload in invalid_payloads:
            with self.subTest(payload=payload):
                with self.assertRaises(ValidationError):
                    ProfileUpdateRequest.model_validate(payload)

    def test_text_length_validation(self) -> None:
        invalid_payloads = [
            {"profile": {"full_name": "a" * 101}},
            {"profile": {"professional_headline": "a" * 151}},
            {"profile": {"target_role": "a" * 101}},
            {"profile": {"bio": "a" * 501}},
        ]

        for payload in invalid_payloads:
            with self.subTest(payload=payload):
                with self.assertRaises(ValidationError):
                    ProfileUpdateRequest.model_validate(payload)

    def test_invalid_experience_level_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            ProfileUpdateRequest.model_validate(
                {"profile": {"experience_level": "principal"}}
            )

    def test_valid_question_count_bounds_are_accepted(self) -> None:
        for question_count in (5, 30):
            with self.subTest(question_count=question_count):
                payload = ProfileUpdateRequest.model_validate(
                    {"interview_defaults": {"question_count": question_count}}
                )
                self.assertEqual(payload.interview_defaults.question_count, question_count)

    def test_invalid_question_count_values_rejected(self) -> None:
        invalid_values = [4, 31, True, 10.5]
        for value in invalid_values:
            with self.subTest(value=value):
                with self.assertRaises(ValidationError):
                    ProfileUpdateRequest.model_validate(
                        {"interview_defaults": {"question_count": value}}
                    )

    def test_invalid_default_values_rejected(self) -> None:
        invalid_payloads = [
            {"interview_defaults": {"time_limit_minutes": 20}},
            {"interview_defaults": {"interview_type": "technical"}},
            {"interview_defaults": {"difficulty": "medium"}},
            {"interview_defaults": {"evaluation_style": "casual"}},
            {"interview_defaults": {"answer_mode": "voice"}},
        ]

        for payload in invalid_payloads:
            with self.subTest(payload=payload):
                with self.assertRaises(ValidationError):
                    ProfileUpdateRequest.model_validate(payload)

    def test_completion_calculation_returns_expected_percentages(self) -> None:
        self.assertEqual(
            calculate_profile_completion(
                ProfileValues(None, None, None, None, None)
            ),
            0,
        )
        self.assertEqual(
            calculate_profile_completion(
                ProfileValues("Name", "Headline", "Role", "junior", "Bio")
            ),
            100,
        )
        self.assertEqual(
            calculate_profile_completion(
                ProfileValues("Name", None, "Role", None, None)
            ),
            40,
        )

    def test_response_excludes_google_id_and_tokens(self) -> None:
        response = build_profile_response(user(), None)
        text = str(response)

        self.assertNotIn("google_id", text)
        self.assertNotIn("session", text)
        self.assertNotIn("token", text)

    def test_repeated_patch_updates_same_profile_row(self) -> None:
        current_user = user()
        db = FakeDb(None)

        patch_profile_response(
            db,
            current_user,
            profile_patch=ProfilePatchValues(target_role="Backend Developer"),
        )
        patch_profile_response(
            db,
            current_user,
            profile_patch=ProfilePatchValues(target_role="Data Analyst"),
        )

        self.assertEqual(db.add_count, 1)
        self.assertEqual(db.profile.target_role, "Data Analyst")

    def test_integrity_error_during_lazy_create_is_handled(self) -> None:
        current_user = user()
        db = RaceDb(current_user)

        response = patch_profile_response(
            db,
            current_user,
            profile_patch=ProfilePatchValues(target_role="Cloud Engineer"),
        )

        self.assertEqual(db.rollback_count, 1)
        self.assertEqual(response.profile.target_role, "Cloud Engineer")

    def test_malformed_stored_defaults_normalize_safely_on_get(self) -> None:
        current_user = user()
        stored = profile(
            current_user,
            default_interview_type="technical",
            default_difficulty="medium",
            default_question_count=100,
            default_time_limit_minutes=20,
            default_evaluation_style="casual",
            default_answer_mode="voice",
        )

        response = get_profile_response(FakeDb(stored), current_user)

        self.assertEqual(response.interview_defaults.interview_type, "HR")
        self.assertEqual(response.interview_defaults.difficulty, "Easy")
        self.assertEqual(response.interview_defaults.question_count, 10)
        self.assertIsNone(response.interview_defaults.time_limit_minutes)
        self.assertEqual(response.interview_defaults.evaluation_style, "balanced")
        self.assertEqual(response.interview_defaults.answer_mode, "text")

    def test_model_relationship_is_one_to_one_with_cascade(self) -> None:
        relationship = User.profile.property
        foreign_key = next(iter(UserProfile.__table__.c.user_id.foreign_keys))

        self.assertFalse(relationship.uselist)
        self.assertIn("delete-orphan", relationship.cascade)
        self.assertTrue(UserProfile.__table__.c.user_id.unique)
        self.assertEqual(foreign_key.ondelete, "CASCADE")

    def test_auth_me_still_rejects_missing_session(self) -> None:
        with self.assertRaises(HTTPException) as raised:
            get_current_user(FakeDb(None), authorization=None)

        self.assertEqual(raised.exception.status_code, 401)


if __name__ == "__main__":
    unittest.main()
