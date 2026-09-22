import { getLanguage } from '@/lib/i18n'

const copy = {
  en: ['Privacy', 'Privacy policy', 'We process only the technical information required to deliver and protect this website, such as request logs, device information, and approximate country information supplied by our hosting provider.', 'Affiliate links', 'External providers may set cookies or process data after you follow an affiliate link. Their privacy policies govern that processing.', 'Contact and retention', 'Operational logs are retained only for the period needed for security and troubleshooting.'],
  zh: ['隐私', '隐私政策', '我们仅处理运行和保护本网站所必需的技术信息，例如请求日志、设备信息和托管服务商提供的大致国家/地区信息。', '联盟链接', '点击联盟链接后，外部供应商可能设置 Cookie 或处理数据，该处理适用其隐私政策。', '联系与保留', '运行日志仅在安全与故障排查所需期间内保留。'],
  ja: ['プライバシー', 'プライバシーポリシー', 'サイトの提供と保護に必要な技術情報のみを処理します。', 'アフィリエイトリンク', '外部提供元は Cookie を設定したりデータを処理する場合があり、各社のポリシーが適用されます。', '連絡と保持', '運用ログはセキュリティと問題解決に必要な期間のみ保持します。'],
  de: ['Datenschutz', 'Datenschutzerklärung', 'Wir verarbeiten nur technische Informationen, die für Bereitstellung und Schutz dieser Website erforderlich sind.', 'Affiliate-Links', 'Externe Anbieter können nach dem Aufruf eines Affiliate-Links Cookies setzen oder Daten verarbeiten. Es gelten deren Datenschutzrichtlinien.', 'Kontakt und Aufbewahrung', 'Betriebsprotokolle werden nur so lange gespeichert, wie es für Sicherheit und Fehlerbehebung erforderlich ist.'],
  fr: ['Confidentialité', 'Politique de confidentialité', 'Nous traitons uniquement les informations techniques nécessaires au fonctionnement et à la protection de ce site.', 'Liens d’affiliation', 'Les fournisseurs externes peuvent utiliser des cookies ou traiter des données après un clic. Leurs politiques de confidentialité s’appliquent.', 'Contact et conservation', 'Les journaux techniques sont conservés uniquement pendant la durée nécessaire à la sécurité et au dépannage.'],
} as const

export default async function PrivacyPage() { const c = copy[await getLanguage()]; return <main className="content"><span className="eyebrow">{c[0]}</span><h1 style={{fontSize:'3rem'}}>{c[1]}</h1><p>{c[2]}</p><h2>{c[3]}</h2><p>{c[4]}</p><h2>{c[5]}</h2><p>{c[6]}</p></main> }
