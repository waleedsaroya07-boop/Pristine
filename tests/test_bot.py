import unittest
from pristine_bot import ConversationState, detect_quantity, reply, respond

class PristineBotTests(unittest.TestCase):
    def test_astra_moq_rejects_below_minimum(self):
        s=ConversationState(); self.assertIn('minimum is 50',reply('I want Astra football kits, 40 pieces for my club',s))
    def test_medium_moq(self):
        s=ConversationState(); text=reply('Medium training wear 150 pieces for a school',s); self.assertEqual(s.range_key,'medium'); self.assertEqual(s.quantity,150); self.assertNotIn('minimum is 150 pieces',text.lower())
    def test_workwear_moq(self):
        s=ConversationState(); reply('Workwear uniforms, 200 pieces for our company',s); self.assertEqual(s.range_key,'workwear'); self.assertEqual(s.quantity,200)
    def test_price_is_never_invented(self):
        text=reply('How much per piece?',ConversationState()); self.assertIn("won't invent a price",text); self.assertNotRegex(text,r'£\s?\d')
    def test_lead_time_is_not_invented(self):
        self.assertIn("won't give an unverified",reply('What is your lead time?',ConversationState()))
    def test_certification_is_not_assumed(self):
        self.assertIn('No certification is assumed',reply('Are these ISO certified?',ConversationState()))
    def test_quantity_parser(self):
        self.assertEqual(detect_quantity('We need 1,500 pieces'),1500)
    def test_sequential_spec_capture(self):
        s=ConversationState()
        reply('Astra football kits 50 pieces for a club',s)
        self.assertEqual(s.pending_field,'colour')
        reply('Navy and gold',s); self.assertEqual(s.colour,'Navy and gold'); self.assertEqual(s.pending_field,'fabric_preference')
        reply('technical polyester',s); self.assertEqual(s.fabric_preference,'technical polyester'); self.assertEqual(s.pending_field,'size_ratio')
        reply('S 10, M 20, L 20',s); self.assertEqual(s.size_ratio,'S 10, M 20, L 20'); self.assertEqual(s.pending_field,'branding_method')
        reply('sublimation',s); self.assertEqual(s.branding_method,'sublimation'); self.assertEqual(s.pending_field,'required_certifications')
        reply('none specified',s); self.assertEqual(s.required_certifications,'none specified'); self.assertEqual(s.pending_field,'delivery_timeline')
        reply('15 December',s); self.assertTrue(s.ready_for_quote); self.assertIsNone(s.pending_field)
    def test_policy_question_does_not_corrupt_pending_field(self):
        s=ConversationState(); reply('Astra football kits 50 pieces for a club',s)
        self.assertEqual(s.pending_field,'colour')
        reply('How much per piece?',s)
        self.assertIsNone(s.colour); self.assertEqual(s.pending_field,'colour')
    def test_grounded_private_label_answer_returns_source(self):
        s=ConversationState()
        result=respond('Can you manufacture private label for my brand?',s)
        self.assertIn('private-label',result['reply'].lower())
        self.assertTrue(result['citations'])
        self.assertEqual(result['citations'][0]['source_path'],'/pages/private-label-manufacturing')

if __name__=='__main__': unittest.main()
