import { getLanguage } from '@/lib/i18n'

const copy = {
  en: ['Transparency', 'Affiliate disclosure', 'Some links on this website are affiliate links. If you follow one of these links and make a purchase, we may receive a commission at no additional cost to you.', 'Compensation does not determine our descriptions, comparisons, or ratings. Product pricing, availability, and terms are controlled by the provider and should be verified before purchasing.', 'This website does not claim endorsement by any product or provider unless explicitly stated.'],
  zh: ['透明说明', '联盟营销声明', '本网站的部分链接是联盟链接。如果您通过这些链接购买，我们可能会获得佣金，但不会增加您的费用。', '佣金不会决定我们的产品描述、对比或评分。价格、供应情况和条款由供应商决定，购买前请到供应商网站核实。', '除非明确说明，本网站不声称获得任何产品或供应商的认可。'],
  ja: ['透明性', 'アフィリエイト開示', 'このサイトの一部はアフィリエイトリンクです。そのリンクから購入すると、追加費用なしで当サイトが手数料を受け取る場合があります。', '報酬は説明、比較、評価を左右しません。価格と条件は購入前に提供元でご確認ください。', '明記されていない限り、特定の製品や提供元の推奨を主張しません。'],
  de: ['Transparenz', 'Affiliate-Hinweis', 'Einige Links auf dieser Website sind Affiliate-Links. Bei einem Kauf darüber erhalten wir möglicherweise eine Provision, ohne dass Ihnen zusätzliche Kosten entstehen.', 'Eine Vergütung bestimmt nicht unsere Beschreibungen, Vergleiche oder Bewertungen. Preise und Bedingungen sollten vor dem Kauf beim Anbieter geprüft werden.', 'Diese Website beansprucht keine Empfehlung durch Produkte oder Anbieter, sofern dies nicht ausdrücklich angegeben ist.'],
  fr: ['Transparence', 'Divulgation d’affiliation', 'Certains liens sont des liens d’affiliation. Si vous effectuez un achat par leur intermédiaire, nous pouvons recevoir une commission sans frais supplémentaires pour vous.', 'La rémunération ne détermine pas nos descriptions, comparaisons ou notes. Vérifiez les prix et conditions auprès du fournisseur avant l’achat.', 'Ce site ne revendique aucune approbation d’un produit ou fournisseur sauf mention explicite.'],
} as const

export default async function AffiliateDisclosurePage() { const c = copy[await getLanguage()]; return <main className="content"><span className="eyebrow">{c[0]}</span><h1 style={{fontSize:'3rem'}}>{c[1]}</h1><p>{c[2]}</p><p>{c[3]}</p><p>{c[4]}</p></main> }
