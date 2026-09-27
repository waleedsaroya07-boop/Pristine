import unittest

from knowledge_base import answer_knowledge, search_knowledge


class KnowledgeHubTests(unittest.TestCase):
    def test_moq_answer_is_grounded(self):
        result = answer_knowledge("What are your minimum order quantities?")
        self.assertIsNotNone(result)
        self.assertIn("Astra", result["answer"])
        self.assertIn("150", result["answer"])
        self.assertTrue(result["citations"])

    def test_private_label_scope(self):
        results = search_knowledge("Can you manufacture for my own brand?", scope="private_label")
        self.assertTrue(results)
        self.assertEqual(results[0]["id"], "private-label")

    def test_production_location(self):
        result = answer_knowledge("Where is your factory and production?")
        self.assertIsNotNone(result)
        self.assertIn("Pakistan", result["answer"])

    def test_specific_unverified_certification_detail_stays_guarded(self):
        result = answer_knowledge("What is your BSCI audit reference number?")
        self.assertIsNotNone(result)
        self.assertIn("No certification is assumed", result["answer"])
        self.assertNotIn("BSCI-", result["answer"])

    def test_unrelated_unknown_fact_is_not_fabricated(self):
        result = answer_knowledge("What is your registered VAT number?")
        self.assertIsNone(result)

    def test_scope_rejects_unknown_value(self):
        with self.assertRaises(ValueError):
            search_knowledge("hello", scope="finance")


if __name__ == "__main__":
    unittest.main()
