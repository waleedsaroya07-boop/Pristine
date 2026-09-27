from dataclasses import dataclass, asdict
import re

RANGES = {
    'astra': ('Astra', 50),
    'medium': ('Medium', 150),
    'workwear': ('Workwear / Workmon', 200),
}
ALIASES = {
    'astra': 'astra', 'premium': 'astra',
    'medium': 'medium', 'mid premium': 'medium', 'mid-premium': 'medium',
    'workwear': 'workwear', 'workmon': 'workwear', 'uniform': 'workwear', 'uniforms': 'workwear',
}
BUYERS = {
    'club': 'Club / Academy', 'academy': 'Club / Academy',
    'school': 'School / Education', 'college': 'School / Education', 'university': 'School / Education',
    'retailer': 'Retailer / Reseller', 'reseller': 'Retailer / Reseller',
    'private label': 'Private Label Brand', 'brand': 'Private Label Brand',
    'business': 'Business / Workwear Buyer', 'company': 'Business / Workwear Buyer',
}
PRODUCTS = [
    'football kits', 'football kit', 'training wear', 'tracksuits', 'tracksuit',
    'jackets', 'jacket', 'custom apparel', 'workwear', 'uniforms', 'uniform', 'private label',
]

@dataclass
class ConversationState:
    range_key: str | None = None
    buyer_type: str | None = None
    product: str | None = None
    quantity: int | None = None
    colour: str | None = None
    fabric_preference: str | None = None
    size_ratio: str | None = None
    branding_method: str | None = None
    required_certifications: str | None = None
    delivery_timeline: str | None = None
    name: str | None = None
    organisation: str | None = None
    email: str | None = None
    phone: str | None = None
    destination: str | None = None
    pending_field: str | None = None

    def as_dict(self):
        data = asdict(self)
        data['range'] = RANGES[self.range_key][0] if self.range_key else None
        data['ready_for_quote'] = self.ready_for_quote
        return data

    @property
    def ready_for_quote(self) -> bool:
        label_moq_ok = bool(self.range_key and self.quantity is not None and self.quantity >= RANGES[self.range_key][1])
        return label_moq_ok and all([
            self.buyer_type, self.product, self.colour, self.fabric_preference,
            self.size_ratio, self.branding_method, self.required_certifications,
            self.delivery_timeline,
        ])


def norm(text: str) -> str:
    return re.sub(r'\s+', ' ', (text or '').strip().lower())


def detect_quantity(text: str) -> int | None:
    nums = re.findall(r'\b(\d{2,7})\b', norm(text).replace(',', ''))
    return max(map(int, nums)) if nums else None


def policy_answer(text: str) -> str | None:
    t = norm(text)
    if any(x in t for x in ['price', 'cost', 'how much', 'per piece', 'unit price', 'quote']):
        return "Wholesale pricing is quotation-based. I won't invent a price. Pricing is confirmed after the product, range, quantity, fabric, branding, standards and destination are reviewed."
    if any(x in t for x in ['lead time', 'delivery time', 'how long', 'production time']):
        return "Lead time is confirmed against the actual product, quantity, material, branding, approvals and delivery requirement. I won't give an unverified production or delivery time."
    if any(x in t for x in ['certification', 'certified', 'certificate', ' iso', 'ce ']):
        return 'No certification is assumed to apply automatically. Tell me the exact standard or certification required and it must be verified for the specific order before quotation or production commitment.'
    if 'moq' in t or 'minimum order' in t:
        return 'Current minimums are Astra 50, Medium 150, and Workwear / Workmon 200 pieces per style/colour. These are minimums only; larger quantities, including container-scale orders, can be quoted.'
    if any(x in t for x in ['where made', 'where manufactured', 'factory', 'pakistan', 'uk-facing', 'uk facing']):
        return 'Pristine Apparel is UK-facing, with production facilities in Pakistan, using a specification-first wholesale process.'
    return None


def update_known_facts(text: str, state: ConversationState) -> None:
    t = norm(text)
    for word, key in ALIASES.items():
        if word in t:
            state.range_key = key
            break
    for word, label in BUYERS.items():
        if word in t:
            state.buyer_type = label
            break
    for product in PRODUCTS:
        if product in t:
            state.product = product.title()
            break
    if state.quantity is None or state.pending_field == 'quantity':
        quantity = detect_quantity(text)
        if quantity:
            state.quantity = quantity


def capture_pending_answer(text: str, state: ConversationState) -> None:
    field = state.pending_field
    if not field:
        return
    value = (text or '').strip()
    if not value:
        return
    if field == 'range':
        return
    if field == 'buyer_type':
        return
    if field == 'product':
        if not state.product:
            state.product = value[:200]
        return
    if field == 'quantity':
        quantity = detect_quantity(value)
        if quantity:
            state.quantity = quantity
        return
    if field in {'colour', 'fabric_preference', 'size_ratio', 'branding_method', 'required_certifications', 'delivery_timeline'}:
        setattr(state, field, value[:300])


def next_question(state: ConversationState) -> str:
    if not state.range_key:
        state.pending_field = 'range'
        return 'Which range are you looking at – Astra (premium), Medium, or Workwear?'
    if not state.buyer_type:
        state.pending_field = 'buyer_type'
        return 'What type of buyer are you – club/academy, school/education, retailer/reseller, private-label brand, or business/workwear buyer?'
    if not state.product:
        state.pending_field = 'product'
        return 'Which product or style do you need – for example football kits, training wear, tracksuits/jackets, custom apparel, or workwear/uniform?'

    label, moq = RANGES[state.range_key]
    if state.quantity is None:
        state.pending_field = 'quantity'
        return f'How many pieces do you need per style and colour? The {label} minimum is {moq} pieces per style/colour.'
    if state.quantity < moq:
        state.pending_field = 'quantity'
        return f'For {label}, the minimum is {moq} pieces per style/colour. You entered {state.quantity}. Would you like to increase the quantity or choose a different range?'
    if not state.colour:
        state.pending_field = 'colour'
        return 'What colour or colourway do you require?'
    if not state.fabric_preference:
        state.pending_field = 'fabric_preference'
        return 'What fabric do you prefer, or what is the intended use? Exact composition and weight are confirmed per order.'
    if not state.size_ratio:
        state.pending_field = 'size_ratio'
        return 'What size ratio or size breakdown do you need?'
    if not state.branding_method:
        state.pending_field = 'branding_method'
        return 'What branding method do you want – embroidery, print, sublimation, woven labels, or another method?'
    if not state.required_certifications:
        state.pending_field = 'required_certifications'
        return "Does the order require any specific certification, safety standard or compliance requirement? If none, say 'none specified'."
    if not state.delivery_timeline:
        state.pending_field = 'delivery_timeline'
        return 'What is your target delivery date or required timeline?'

    state.pending_field = None
    return 'Your core specification is complete. Select Continue to enquiry and add your contact and delivery details. Your specification will be attached automatically; no order or payment is placed by this chat.'


def reply(message: str, state: ConversationState) -> str:
    safe = policy_answer(message)
    update_known_facts(message, state)
    if not safe:
        capture_pending_answer(message, state)
    question = next_question(state)
    return f'{safe} {question}' if safe else question
