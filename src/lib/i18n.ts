import { cookies } from 'next/headers'
import { languages, type Language } from '@/lib/languages'
export type { Language } from '@/lib/languages'

const messages = {
  en: {
    skip: 'Skip to content', products: 'Products', articles: 'Articles', disclosure: 'Disclosure', privacy: 'Privacy',
    footer: 'Independent research. Some links may earn us a commission.', language: 'Language',
    heroEyebrow: 'Independent marketplace intelligence', heroTitle: 'Make a clearer choice before you buy.',
    heroText: 'Explore current marketplace listings and practical buying guides designed around verification—not hype.',
    explore: 'Explore marketplace', guides: 'Read buying guides', how: 'How this site works', trust: 'Current products. Clear context. Transparent links.',
    refresh: 'Daily marketplace data refresh', ai: 'Carefully reviewed buying guides', transparent: 'Visible affiliate disclosure on every offer',
    recent: 'Recently updated', viewAll: 'View all →', listing: 'Marketplace listing', noProducts: 'No active products yet.',
    marketplace: 'Marketplace', allProducts: 'All products', regions: 'regions',
    editorial: 'Editorial library', practicalGuides: 'Practical buying guides', guidesIntro: 'Balanced, verification-first explainers connected to current marketplace products.',
    aiChecked: 'Editorial review', editorialLabel: 'Editorial', noArticles: 'No published articles yet.',
    globalListing: 'Global marketplace listing', overview: 'Overview', features: 'Key features', availableRegions: 'Available regions',
    currentPrice: 'Current listed price', priceNote: 'Pricing and availability may change on the provider’s website.', visit: 'Visit official site →',
    affiliateNote: 'Affiliate disclosure: we may earn a commission if you purchase through this link.',
    searchProducts: 'Search products', searchPlaceholder: 'Search by product name or description', sortBy: 'Sort by', newest: 'Recently updated', alphabetical: 'Name A–Z', popular: 'Marketplace rank', search: 'Search', clear: 'Clear', results: 'products found', previous: '← Previous', next: 'Next →', page: 'Page', of: 'of',
    save: 'Save product', saved: 'Saved', share: 'Share', copied: 'Link copied',
    details: 'Product details', vendor: 'Vendor', commission: 'Commission', billing: 'Billing model', conversion: 'Conversion rate', cancellation: 'Cancellation rate', earningsSale: 'Average earnings per sale', earningsClick: 'Earnings per order-form click', approval: 'Affiliate approval', automatic: 'Automatic approval', manual: 'Application required', updated: 'Data updated', resources: 'Official resources', salesPage: 'View sales page', promoMaterials: 'View promotional materials', metricNote: 'Marketplace metrics are historical indicators and may change. Verify current terms with the provider.',
    qualityChecked: 'Editorial review', qualityScore: 'Review score', included: 'Affiliate disclosure included',
    imageCaption: 'Product image supplied by the marketplace listing. Verify current details with the provider.', related: 'Related product', exploreProduct: 'Explore', viewProduct: 'View product details',
  },
  zh: {
    skip: '跳到主要内容', products: '产品', articles: '文章', disclosure: '联盟声明', privacy: '隐私', footer: '独立研究内容；部分链接可能为我们带来佣金。', language: '语言',
    heroEyebrow: '独立市场信息', heroTitle: '购买前，做出更清晰的选择。', heroText: '浏览最新市场产品和经过核实的实用购买指南，拒绝夸大宣传。',
    explore: '浏览产品', guides: '阅读购买指南', how: '网站如何运作', trust: '最新产品、清晰信息、透明链接。', refresh: '每日更新市场数据', ai: '经过认真审阅的购买指南', transparent: '每个产品都明确标注联盟链接',
    recent: '最近更新', viewAll: '查看全部 →', listing: '市场产品', noProducts: '暂无可用产品。', marketplace: '产品市场', allProducts: '全部产品', regions: '个地区',
    editorial: '编辑资料库', practicalGuides: '实用购买指南', guidesIntro: '与当前产品关联的客观、注重核实的解读。', aiChecked: '编辑审阅', editorialLabel: '编辑内容', noArticles: '暂无已发布文章。',
    globalListing: '全球市场产品', overview: '产品概述', features: '主要特点', availableRegions: '可用地区', currentPrice: '当前标价', priceNote: '价格和可用性可能在供应商网站上发生变化。', visit: '访问官方网站 →', affiliateNote: '联盟声明：通过此链接购买时，我们可能获得佣金。',
    searchProducts: '搜索产品', searchPlaceholder: '按产品名称或描述搜索', sortBy: '排序', newest: '最近更新', alphabetical: '名称 A–Z', popular: '市场排名', search: '搜索', clear: '清除', results: '个产品', previous: '← 上一页', next: '下一页 →', page: '第', of: '/', save: '收藏产品', saved: '已收藏', share: '分享', copied: '链接已复制',
    details: '产品数据', vendor: '供应商', commission: '佣金', billing: '结算模式', conversion: '转化率', cancellation: '取消率', earningsSale: '平均每单收益', earningsClick: '每次订单页点击收益', approval: '联盟申请', automatic: '自动批准', manual: '需要申请', updated: '数据更新', resources: '官方资料', salesPage: '查看销售页', promoMaterials: '查看推广素材', metricNote: '市场数据是历史参考，可能发生变化，请向供应商核实当前条款。',
    qualityChecked: '编辑审阅', qualityScore: '审阅得分', included: '已包含联盟声明', imageCaption: '图片由市场产品页提供，请向供应商核实最新信息。', related: '相关产品', exploreProduct: '了解', viewProduct: '查看产品详情',
  },
  ja: {}, de: {}, fr: {},
} as const

type EnglishMessages = { [K in keyof typeof messages.en]: string }
const fallbackOverrides: Record<'ja' | 'de' | 'fr', Partial<EnglishMessages>> = {
  ja: {
    skip: 'コンテンツへ移動', products: '製品', articles: '記事', disclosure: 'アフィリエイト開示', privacy: 'プライバシー', language: '言語', footer: '独立した調査。一部のリンクから手数料を得る場合があります。',
    heroEyebrow: '独立したマーケット情報', heroTitle: '購入前に、より明確な選択を。', heroText: '最新の商品と、検証を重視した購入ガイドを掲載します。', explore: '商品を見る', guides: '購入ガイドを読む', how: 'このサイトの仕組み', trust: '最新の商品、明確な情報、透明なリンク。',
    refresh: '毎日のデータ更新', ai: '丁寧に検証された購入ガイド', transparent: 'すべてのオファーに開示表示', recent: '最近の更新', viewAll: 'すべて見る →', listing: 'マーケット商品', noProducts: '現在利用できる製品はありません。', marketplace: 'マーケット', allProducts: 'すべての製品', regions: '地域',
    searchProducts: '製品を検索', searchPlaceholder: '製品名または説明で検索', sortBy: '並び替え', newest: '最近の更新', alphabetical: '名前 A–Z', popular: 'ランキング', search: '検索', clear: 'クリア', results: '件の製品', previous: '← 前へ', next: '次へ →', page: 'ページ', of: '/', save: '保存', saved: '保存済み', share: '共有', copied: 'リンクをコピーしました',
    details: '製品データ', vendor: '販売者', commission: 'コミッション', billing: '課金方式', conversion: 'コンバージョン率', cancellation: 'キャンセル率', earningsSale: '1件あたり平均収益', earningsClick: '注文ページクリック収益', approval: '参加承認', automatic: '自動承認', manual: '申請が必要', updated: '更新日', resources: '公式資料', salesPage: '販売ページ', promoMaterials: 'プロモーション素材', metricNote: '数値は過去の指標で変更される場合があります。最新条件は提供元にご確認ください。',
    editorial: '編集ライブラリ', practicalGuides: '実用的な購入ガイド', guidesIntro: '現在の商品に関連する、バランスと検証を重視した解説。', aiChecked: '編集レビュー', editorialLabel: '編集記事', noArticles: '公開済みの記事はありません。', globalListing: 'グローバル商品', overview: '概要', features: '主な特徴', availableRegions: '利用可能な地域', currentPrice: '現在の価格', priceNote: '価格と在庫は提供元サイトで変更される場合があります。', visit: '公式サイトへ →', affiliateNote: 'このリンクから購入すると手数料を得る場合があります。',
  },
  de: {
    skip: 'Zum Inhalt', products: 'Produkte', articles: 'Artikel', disclosure: 'Affiliate-Hinweis', privacy: 'Datenschutz', language: 'Sprache', footer: 'Unabhängige Recherche. Einige Links können uns eine Provision einbringen.', heroEyebrow: 'Unabhängige Marktinformationen', heroTitle: 'Treffen Sie vor dem Kauf eine klarere Entscheidung.', heroText: 'Entdecken Sie aktuelle Angebote und praxisnahe Kaufratgeber mit Fokus auf Prüfung statt Werbung.', explore: 'Marktplatz entdecken', guides: 'Kaufratgeber lesen', how: 'So funktioniert diese Website', trust: 'Aktuelle Produkte. Klarer Kontext. Transparente Links.', refresh: 'Tägliche Aktualisierung der Marktdaten', ai: 'Sorgfältig geprüfte Kaufratgeber', transparent: 'Sichtbarer Affiliate-Hinweis bei jedem Angebot', recent: 'Kürzlich aktualisiert', viewAll: 'Alle ansehen →', listing: 'Marktplatz-Angebot', noProducts: 'Derzeit sind keine aktiven Produkte verfügbar.', marketplace: 'Marktplatz', allProducts: 'Alle Produkte', regions: 'Regionen', editorial: 'Ratgeber-Bibliothek', practicalGuides: 'Praktische Kaufratgeber', guidesIntro: 'Ausgewogene, prüfungsorientierte Erklärungen zu aktuellen Produkten.', aiChecked: 'Redaktionell geprüft', editorialLabel: 'Redaktionell', noArticles: 'Noch keine veröffentlichten Artikel.', globalListing: 'Globales Marktplatz-Angebot', overview: 'Übersicht', features: 'Wichtige Merkmale', availableRegions: 'Verfügbare Regionen', currentPrice: 'Aktueller Preis', priceNote: 'Preis und Verfügbarkeit können sich auf der Anbieterwebsite ändern.', visit: 'Offizielle Website →', affiliateNote: 'Affiliate-Hinweis: Bei einem Kauf über diesen Link erhalten wir möglicherweise eine Provision.',
    searchProducts: 'Produkte suchen', searchPlaceholder: 'Nach Name oder Beschreibung suchen', sortBy: 'Sortieren', newest: 'Zuletzt aktualisiert', alphabetical: 'Name A–Z', popular: 'Marktplatzrang', search: 'Suchen', clear: 'Zurücksetzen', results: 'Produkte gefunden', previous: '← Zurück', next: 'Weiter →', page: 'Seite', of: 'von', save: 'Produkt speichern', saved: 'Gespeichert', share: 'Teilen', copied: 'Link kopiert',
    details: 'Produktdaten', vendor: 'Anbieter', commission: 'Provision', billing: 'Abrechnungsmodell', conversion: 'Conversion-Rate', cancellation: 'Stornoquote', earningsSale: 'Durchschnittlicher Ertrag pro Verkauf', earningsClick: 'Ertrag pro Bestellformular-Klick', approval: 'Affiliate-Freigabe', automatic: 'Automatische Freigabe', manual: 'Bewerbung erforderlich', updated: 'Daten aktualisiert', resources: 'Offizielle Ressourcen', salesPage: 'Verkaufsseite ansehen', promoMaterials: 'Werbemittel ansehen', metricNote: 'Marktdaten sind historische Kennzahlen und können sich ändern. Aktuelle Bedingungen bitte beim Anbieter prüfen.',
  },
  fr: {
    skip: 'Aller au contenu', products: 'Produits', articles: 'Articles', disclosure: 'Divulgation', privacy: 'Confidentialité', language: 'Langue', footer: 'Recherche indépendante. Certains liens peuvent nous rapporter une commission.', heroEyebrow: 'Informations indépendantes sur le marché', heroTitle: 'Faites un choix plus clair avant d’acheter.', heroText: 'Découvrez les offres actuelles et des guides d’achat pratiques axés sur la vérification.', explore: 'Explorer les produits', guides: 'Lire les guides', how: 'Fonctionnement du site', trust: 'Produits actuels. Contexte clair. Liens transparents.', refresh: 'Mise à jour quotidienne des données', ai: 'Guides d’achat soigneusement vérifiés', transparent: 'Divulgation visible sur chaque offre', recent: 'Récemment mis à jour', viewAll: 'Tout voir →', listing: 'Offre du marché', noProducts: 'Aucun produit actif actuellement.', marketplace: 'Marché', allProducts: 'Tous les produits', regions: 'régions', editorial: 'Éditorial', practicalGuides: 'Guides d’achat pratiques', guidesIntro: 'Des explications équilibrées, axées sur la vérification des produits actuels.', aiChecked: 'Revue éditoriale', editorialLabel: 'Éditorial', noArticles: 'Aucun article publié.', globalListing: 'Offre mondiale', overview: 'Aperçu', features: 'Caractéristiques principales', availableRegions: 'Régions disponibles', currentPrice: 'Prix affiché', priceNote: 'Le prix et la disponibilité peuvent changer sur le site du fournisseur.', visit: 'Voir le site officiel →', affiliateNote: 'Divulgation : nous pouvons recevoir une commission si vous achetez via ce lien.',
    searchProducts: 'Rechercher des produits', searchPlaceholder: 'Rechercher par nom ou description', sortBy: 'Trier par', newest: 'Récemment mis à jour', alphabetical: 'Nom A–Z', popular: 'Classement', search: 'Rechercher', clear: 'Effacer', results: 'produits trouvés', previous: '← Précédent', next: 'Suivant →', page: 'Page', of: 'sur', save: 'Enregistrer', saved: 'Enregistré', share: 'Partager', copied: 'Lien copié',
    details: 'Données produit', vendor: 'Fournisseur', commission: 'Commission', billing: 'Mode de facturation', conversion: 'Taux de conversion', cancellation: 'Taux d’annulation', earningsSale: 'Gain moyen par vente', earningsClick: 'Gain par clic sur la commande', approval: 'Approbation affilié', automatic: 'Approbation automatique', manual: 'Candidature requise', updated: 'Données actualisées', resources: 'Ressources officielles', salesPage: 'Voir la page de vente', promoMaterials: 'Voir les supports promotionnels', metricNote: 'Les statistiques sont historiques et peuvent changer. Vérifiez les conditions actuelles auprès du fournisseur.',
  },
}

export async function getLanguage(): Promise<Language> {
  const value = (await cookies()).get('site-language')?.value
  return languages.includes(value as Language) ? value as Language : 'en'
}

export function getMessages(language: Language): EnglishMessages {
  if (language === 'en') return messages.en
  if (language === 'zh') return messages.zh as EnglishMessages
  return { ...messages.en, ...fallbackOverrides[language] }
}

export function localeTag(language: Language) {
  return ({ en: 'en-US', zh: 'zh-CN', ja: 'ja-JP', de: 'de-DE', fr: 'fr-FR' } as const)[language]
}
