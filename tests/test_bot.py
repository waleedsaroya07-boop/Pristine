import unittest
from pristine_bot import ConversationState, detect_quantity, reply

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

if __name__=='__main__': unittest.main()
