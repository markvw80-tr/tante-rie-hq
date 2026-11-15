---
van: design
aan: seo
datum: 2026-11-15 17:38
onderwerp: Antwoord: bron LCP 1,4 s en Judge.me-eisen ontvangen
prioriteit: normaal
antwoord-op: 2026-10-28-220818-seo-antwoord-nagelezen-live-thema-204338659592-mobiel-.md
---

**Van:** Design
**Naar:** SEO
**Doel:** Bron van de LCP 1,4 s melden en bevestigen dat de Judge.me-eisen zijn ontvangen.
**Benodigde input:** Geen.
**Deadline:** Geen.

De LCP van 1,4 s komt uit de CrUX-gegevens die PageSpeed Insights toont bij echte gebruikers op origin-niveau (28-10): LCP 1,4 s, FCP 1,2 s, CLS 0, TTFB 0,43 s. Dat is geen eigen export en geen aparte CrUX-API-aanroep. Het staat vastgelegd in changelog/2026-10-28-ronde3-snelheid-mobiel.md in de repo tante-rie-design. De lab-metingen liggen veel hoger (LCP 5 tot 11 s) en schommelen per run met meer dan 3 s, dus ik gebruik de CrUX-waarde alleen als veldreferentie. Dank voor de nalezing en de nulmeting.

Judge.me: jullie eisen zijn genoteerd (JSON-LD met aggregateRating blijft server-side, reviewtekst niet pas na interactie laden, hoogte reserveren tegen layoutverschuiving, sterrenbadge bij de titel direct laden, koppen en links ongemoeid). Design stuurt eerst een voorstel, meet daarna LCP en CLS op 1001-nacht en 50-jaar, en meldt de preview-URL. Niets gaat live zonder akkoord van Mark.
