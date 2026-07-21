import unittest

from app.services.resume_intelligence_service import analyze_resume_text


class ResumeIntelligenceServiceTests(unittest.TestCase):
    def test_groups_multiple_project_bullets_under_titles(self) -> None:
        analysis = analyze_resume_text(
            """
            Aditya Kumar
            PROFILE:
            Developer profile.
            ACADEMIC PROJECTS:
            DocuMind
            - Built a document assistant using Python, FastAPI and PostgreSQL.
            - Added semantic search with scikit learn and NumPy.

            HireMind
            * Built interview workflows with Next js and GitHub.
            * Added analytics.

            INTERNSHIPS:
            AWS Academy Virtual Internship
            - Completed cloud foundations labs.
            """,
        )

        self.assertEqual([project["name"] for project in analysis["projects"]], ["DocuMind", "HireMind"])
        self.assertEqual(len(analysis["projects"][0]["description"]), 2)
        self.assertIn("PostgreSQL", analysis["projects"][0]["technologies"])
        self.assertNotIn("INTERNSHIPS", str(analysis["projects"]))

    def test_handles_missing_projects_and_experience(self) -> None:
        analysis = analyze_resume_text(
            """
            Jane Doe
            SUMMARY:
            Data analyst.
            SKILLS:
            Python, SQL
            EDUCATION:
            B.Sc Statistics
            """,
        )

        self.assertEqual(analysis["projects"], [])
        self.assertEqual(analysis["experience"], [])
        self.assertEqual(analysis["education"], ["B.Sc Statistics"])
        self.assertEqual(analysis["summary"], "Data analyst.")

    def test_single_project_with_mixed_bullets_and_blank_lines(self) -> None:
        analysis = analyze_resume_text(
            """
            PROJECT:
            Travel Agent

            • Built itinerary recommendations with React.

            ◦ Integrated PostgreSQL storage.
            """,
        )

        self.assertEqual(len(analysis["projects"]), 1)
        self.assertEqual(analysis["projects"][0]["name"], "Travel Agent")
        self.assertEqual(len(analysis["projects"][0]["description"]), 2)

    def test_virtual_internships_and_simulations_become_experience(self) -> None:
        analysis = analyze_resume_text(
            """
            VIRTUAL INTERNSHIPS:
            AWS Academy Cloud Foundations Virtual Internship
            - Completed cloud labs.
            Google for Developers Android Virtual Internship
            - Built Android learning projects.
            Forage Deloitte Data Analytics Simulation
            - Completed dashboard tasks.
            TCS Cybersecurity Simulation
            - Reviewed security incidents.
            British Airways Data Science Simulation
            - Predicted customer behavior.
            """,
        )

        organizations = [item["organization"] for item in analysis["experience"]]
        self.assertIn("AWS Academy", organizations)
        self.assertIn("Google for Developers", organizations)
        self.assertIn("Forage", organizations)
        self.assertIn("TCS", organizations)
        self.assertIn("British Airways", organizations)
        self.assertIn("virtual_internship", {item["experience_type"] for item in analysis["experience"]})
        self.assertIn("simulation", {item["experience_type"] for item in analysis["experience"]})

    def test_duplicate_skills_are_normalized_and_categorized(self) -> None:
        analysis = analyze_resume_text(
            """
            TECHNICAL SKILLS:
            Python, python, Git, github, NumPy, numpy, sklearn, scikit learn,
            pytorch, PyTorch, tensorflow, next js, next.js, postgres, PostgreSQL
            """,
        )

        skills = analysis["skills_categorized"]
        self.assertEqual(skills["programming_languages"], ["Python"])
        self.assertEqual(skills["ml_ai"], ["NumPy", "PyTorch", "scikit-learn", "TensorFlow"])
        self.assertEqual(skills["databases"], ["PostgreSQL"])
        self.assertEqual(skills["frameworks_libraries"], ["Next.js"])
        self.assertEqual(skills["tools_platforms"], ["Git", "GitHub"])
        self.assertEqual(len(analysis["skills"]), len(set(value.lower() for value in analysis["skills"])))

    def test_uppercase_headings_colons_and_certification_promotion(self) -> None:
        analysis = analyze_resume_text(
            """
            ACHIEVEMENTS:
            AWS Academy Cloud Foundations certificate
            Winner at college hackathon
            Google for Developers badge
            """,
        )

        self.assertEqual(
            analysis["certifications"],
            [
                "AWS Academy Cloud Foundations certificate",
                "Google for Developers badge",
            ],
        )

    def test_certifications_section_takes_priority(self) -> None:
        analysis = analyze_resume_text(
            """
            CERTIFICATIONS:
            TensorFlow Developer Certificate
            ACHIEVEMENTS:
            Winner at hackathon
            """,
        )

        self.assertEqual(analysis["certifications"], ["TensorFlow Developer Certificate"])


if __name__ == "__main__":
    unittest.main()
