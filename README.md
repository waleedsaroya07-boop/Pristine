# Pristine Apparel Wholesale Assistant + Knowledge Hub

Website-ready wholesale chatbot and grounded knowledge service for **Pristine Apparel**.

The hybrid voice interaction pattern was inspired by `Riyan-Farooq/Hybrid-IVR-Voice-Survey`. The grounded retrieval and citation pattern was inspired by `Riyan-Farooq/Enterprise-Knowledge-Hub`. This repository is an original Pristine-specific implementation rather than a copy of either project.

## Locked commercial rules

- **Astra — Premium:** minimum 50 pieces per style/colour.
- **Medium — Mid-premium:** minimum 150 pieces per style/colour.
- **Workwear / Workmon:** minimum 200 pieces per style/colour.
- MOQs are minimums only; larger and container-scale quantities can be quoted.
- UK-facing wholesale operation with production facilities in Pakistan.
- Quote-first workflow: no payment is taken and an enquiry is not an order.
- The assistant never invents prices, lead times, fabric weights, certifications, stock, or production claims.
- Before quotation it gathers range, buyer type, product/style, quantity, colour, fabric preference, size ratio, branding method, required standards/certifications, delivery timing, and contact/destination details.

## Knowledge Hub

The customer-facing knowledge layer is deliberately **verified and read-only**. It does not expose an unauthenticated document uploader, default admin credentials, or unrestricted internal documents.

- `knowledge/pristine_wholesale.json` contains approved Pristine wholesale facts mapped to Shopify source pages.
- `knowledge_base.py` provides scoped deterministic retrieval and source citations.
- `GET /api/knowledge` exposes the safe knowledge index.
- `GET /api/knowledge/search?q=...` searches approved knowledge.
- `POST /api/chat` uses grounded knowledge for factual questions and returns citations with the answer.
- If a fact is not in the approved knowledge base, the system does not invent it.

This keeps the useful Enterprise Knowledge Hub pattern—scoped retrieval, grounding and citations—without adding a third-party LLM or vector database dependency to the public storefront service.

## Included

- `pristine_bot.py` — deterministic wholesale qualification, safeguards and grounded answer orchestration.
- `knowledge_base.py` — scoped retrieval and citations.
- `knowledge/pristine_wholesale.json` — source-controlled knowledge records.
- `app.py` — FastAPI chat and knowledge APIs.
- `static/chatbot.js` / `static/chatbot.css` — website widget with browser voice input and citation display.
- `shopify/pristine-chatbot.liquid` — Shopify native enquiry handoff.
- `tests/` — MOQ, no-invention, sequential qualification and knowledge-grounding tests.
- `Dockerfile` / `render.yaml` — deployment configuration.

## Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

Open `http://127.0.0.1:8000`.

## Production

The Render service is designed to host the public knowledge/chat API. Customer contact details are submitted through Shopify's native contact form, not persisted by the Render chatbot service.

Voice is an input convenience only. Typed and spoken enquiries use the same safeguards and knowledge rules.
