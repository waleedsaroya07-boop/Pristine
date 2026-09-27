from dataclasses import dataclass, asdict
import re

RANGES={'astra':('Astra',50),'medium':('Medium',150),'workwear':('Workwear / Workmon',200)}
ALIASES={'astra':'astra','premium':'astra','medium':'medium','mid premium':'medium','mid-premium':'medium','workwear':'workwear','workmon':'workwear','uniform':'workwear','uniforms':'workwear'}
BUYERS={'club':'Club / Academy','academy':'Club / Academy','school':'School / Education','college':'School / Education','university':'School / Education','retailer':'Retailer / Reseller','reseller':'Retailer / Reseller','private label':'Private Label Brand','brand':'Private Label Brand','business':'Business / Workwear Buyer','company':'Business / Workwear Buyer'}
PRODUCTS=['football kits','football kit','training wear','tracksuits','tracksuit','jackets','jacket','custom apparel','workwear','uniforms','uniform','private label']

@dataclass
class ConversationState:
    range_key:str|None=None; buyer_type:str|None=None; product:str|None=None; quantity:int|None=None
    colour:str|None=None; fabric_preference:str|None=None; size_ratio:str|None=None; branding_method:str|None=None
    required_certifications:str|None=None; delivery_timeline:str|None=None; name:str|None=None; organisation:str|None=None
    email:str|None=None; phone:str|None=None; destination:str|None=None
    def as_dict(self):
        d=asdict(self); d['range']=RANGES[self.range_key][0] if self.range_key else None; return d

def norm(t): return re.sub(r'\s+',' ',(t or '').strip().lower())
def detect_quantity(t):
    nums=re.findall(r'\b(\d{2,7})\b',norm(t).replace(',','')); return max(map(int,nums)) if nums else None

def update(text,s):
    t=norm(text)
    for x,k in ALIASES.items():
        if x in t: s.range_key=k; break
    for x,v in BUYERS.items():
        if x in t: s.buyer_type=v; break
    for p in PRODUCTS:
        if p in t: s.product=p.title(); break
    q=detect_quantity(text)
    if q: s.quantity=q

def next_question(s):
    if not s.range_key:return 'Which range are you looking at – Astra (premium), Medium, or Workwear?'
    if not s.buyer_type:return 'What type of buyer are you – club/academy, school/education, retailer/reseller, private-label brand, or business/workwear buyer?'
    if not s.product:return 'Which product or style do you need – for example football kits, training wear, tracksuits/jackets, custom apparel, or workwear/uniform?'
    label,moq=RANGES[s.range_key]
    if s.quantity is None:return f'How many pieces do you need per style and colour? The {label} minimum is {moq} pieces per style/colour.'
    if s.quantity<moq:return f'For {label}, the minimum is {moq} pieces per style/colour. You entered {s.quantity}. Would you like to increase the quantity or choose a different range?'
    if not s.colour:return 'What colour or colourway do you require?'
    if not s.fabric_preference:return 'What fabric do you prefer, or what is the intended use? Exact composition and weight are confirmed per order.'
    if not s.size_ratio:return 'What size ratio or size breakdown do you need?'
    if not s.branding_method:return 'What branding method do you want – embroidery, print, sublimation, woven labels, or another method?'
    if not s.required_certifications:return "Does the order require any specific certification, safety standard or compliance requirement? If none, say 'none specified'."
    if not s.delivery_timeline:return 'What is your target delivery date or required timeline?'
    return 'Your core specification is complete. Please provide your name, organisation, email or phone/WhatsApp, and delivery destination so the wholesale team can prepare the quotation.'

def policy(text):
    t=norm(text)
    if any(x in t for x in ['price','cost','how much','per piece','unit price','quote']):return "Wholesale pricing is quotation-based. I won't invent a price. Pricing is confirmed after the product, range, quantity, fabric, branding, standards and destination are reviewed."
    if any(x in t for x in ['lead time','delivery time','how long','production time']):return "Lead time is confirmed against the actual product, quantity, material, branding, approvals and delivery requirement. I won't give an unverified production or delivery time."
    if any(x in t for x in ['certification','certified','certificate',' iso','ce ']):return 'No certification is assumed to apply automatically. Tell me the exact standard or certification required and it must be verified for the specific order before quotation or production commitment.'
    if 'moq' in t or 'minimum order' in t:return 'Current minimums are Astra 50, Medium 150, and Workwear / Workmon 200 pieces per style/colour. These are minimums only; larger quantities can be quoted.'
    if any(x in t for x in ['where made','where manufactured','factory','pakistan','uk-facing','uk facing']):return 'Pristine Apparel is UK-facing, with production facilities in Pakistan, using a specification-first wholesale process.'

def reply(message,state):
    update(message,state); safe=policy(message); q=next_question(state); return f'{safe} {q}' if safe else q
