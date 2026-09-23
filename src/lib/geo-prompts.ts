/**
 * Shared Generative Engine Optimization guidance for public editorial content.
 * Evidence requirements take precedence over stylistic GEO improvements.
 */
export const GEO_OPTIMIZE_PROMPT = `
Apply Generative Engine Optimization (GEO) so the content is easy for AI search
systems to retrieve, understand, quote, and attribute.

1. Citation-ready facts: state concrete definitions, specifications, prices,
   dates, quantities, and limitations only when they appear in the supplied
   evidence. Place the evidence ID immediately after each factual article claim.
2. Entity and terminology alignment: use the product, vendor, category, feature,
   audience, and pricing names found in the evidence. Define specialized terms
   briefly on first use; do not replace an evidenced term with invented jargon.
3. High information density: prefer short subject-verb-object sentences. Each
   paragraph must answer one clear question and remain understandable when quoted
   independently. Remove filler, vague praise, and repetitive marketing language.
4. Answer-first structure: begin each section and FAQ answer with the direct
   conclusion, then add sourced context, tradeoffs, and verification details.
5. Comparison usefulness: use a compact, neutral set of decision criteria such as
   intended audience, documented capabilities, price model, constraints, support,
   and details that need verification. Do not name competitors without evidence.
6. Trust and attribution: distinguish verified facts, vendor claims, and editorial
   analysis. Never invent statistics, institutions, studies, tests, credentials,
   expert experience, dates, or authority signals. If a claim cannot be traced to
   the supplied evidence, omit it or explicitly mark it as something to verify.
7. Stable extraction: keep names and units consistent, use descriptive headings,
   factual bullet lists where useful, and avoid pronouns with ambiguous referents.

GEO never overrides factual accuracy, affiliate disclosure, balanced language,
source restrictions, or the required JSON schema.
`.trim()

