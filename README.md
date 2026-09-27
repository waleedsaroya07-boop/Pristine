# Pristine Apparel Wholesale Chatbot

Website-ready wholesale chatbot for **Pristine Apparel**, adapted from the useful hybrid interaction ideas in `Riyan-Farooq/Hybrid-IVR-Voice-Survey` but implemented as an original web/Shopify codebase.

## Locked commercial rules

- **Astra — Premium:** minimum 50 pieces per style/colour.
- **Medium — Mid-premium:** minimum 150 pieces per style/colour.
- **Workwear / Workmon:** minimum 200 pieces per style/colour.
- MOQs are minimums only; larger and container-scale quantities can be quoted.
- UK-facing wholesale operation with production facilities in Pakistan.
- Quote-first workflow: no payment is taken and an enquiry is not an order.
- The assistant never invents prices, lead times, fabric weights, certifications, stock, or production claims.
- Before quotation it gathers range, buyer type, product/style, quantity, colour, fabric preference, size ratio, branding method, required standards/certifications, delivery timing, and contact/destination details.

## Included

- `pristine_bot.py` — deterministic wholesale qualification and safeguards.
- `app.py` — FastAPI chat and lead-capture API.
- `static/chatbot.js` / `static/chatbot.css` — website widget with browser voice input when supported.
- `shopify/pristine-chatbot.liquid` — Shopify section loader.
- `tests/test_bot.py` — MOQ and no-invention tests.
- `Dockerfile` — container deployment.

## Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

Open `http://127.0.0.1:8000`.

## Shopify

Deploy the API behind HTTPS, add `shopify/pristine-chatbot.liquid` to the Shopify theme, set the API base URL to the HTTPS origin, test, then enable it.

Voice is an input convenience only. Typed and spoken enquiries use the same wholesale safeguards.