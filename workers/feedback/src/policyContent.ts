import { COMPACT_POLICY_LOCALES, type CompactPolicyCopy } from './policyContentTranslations';

export type PolicyKind = 'privacy' | 'support' | 'terms';

export interface PolicySection {
	heading: string;
	paragraphs: readonly string[];
}

export interface PolicyDocument {
	updated: string;
	intro: string;
	sections: readonly PolicySection[];
}

type DetailedPolicyLocale = 'en' | 'zh-hant' | keyof typeof COMPACT_POLICY_LOCALES;

const POLICIES: Record<'en' | 'zh-hant', Record<PolicyKind, PolicyDocument>> = {
	en: {
		privacy: {
			updated: 'Last updated: August 20, 2026',
			intro: 'This policy explains how the Provide feedback and My feedback features handle data. This is a user-initiated support submission, not telemetry or behavior analytics. Opening, editing, or closing the form does not transmit data.',
			sections: [
				{
					heading: 'Information collected and purpose',
					paragraphs: [
						'Before anything is sent, the extension shows the complete payload and requires explicit confirmation. Required fields are the feedback type, title, and user-written description. Reproduction steps and the expected result are optional.',
						'Basic environment information is enabled by default but can be disabled. It is limited to allowlisted values such as the Singular Blockly and VS Code versions, operating-system family and major version, architecture, interface language, normalized host and workspace types, workspace trust, selected board, programming language, relevant tool versions or readiness, and the last stable error stage and code. Recent structured events are disabled by default and, when enabled, contain only bounded timestamps, stages, stable event codes, and outcomes.',
						'The feature does not automatically read or send source code, Blockly workspace content, generated code, file or folder names, full or partial paths, machine or device identifiers, serial ports, Wi-Fi information, IP addresses, environment variables, tokens, credentials, raw errors, or raw logs.',
						'One screenshot may be attached voluntarily. It is re-encoded locally, original metadata is removed, and it is limited to 1920 pixels and 3 MiB before a second server-side check. Visible names, email addresses, paths, program content, or other private information may still appear, so the preview must be checked before sending.',
					],
				},
				{
					heading: 'Identity, network, and security data',
					paragraphs: [
						'The extension creates a random 256-bit secret in VS Code SecretStorage so the reporter can view, add to, or delete their feedback without an account. The service stores only a server-keyed, non-reversible HMAC representation. A backup link places the secret in the URL fragment, which is not sent in a normal HTTP request; after exchange, the browser uses an HttpOnly, Secure, SameSite session lasting at most 24 hours.',
						'Cloudflare may process the source network address briefly to protect the service. The application uses only an HMAC-derived value for rate limiting and does not store the raw IP address in the feedback database. Cloudflare, network providers, and GitHub may process request metadata under their own security-log policies.',
					],
				},
				{
					heading: 'Processors, location, and cross-border transfer',
					paragraphs: [
						'Feedback text and state are stored in Cloudflare D1, and screenshots are stored in a private Cloudflare R2 bucket. A maintainer working copy is synchronized to a project-maintainer-only private GitHub repository.',
						'Cloudflare and GitHub may process and back up data in different countries or regions, so data may be transferred across borders under their infrastructure, terms, and security-backup policies.',
					],
				},
				{
					heading: 'Maintainer access and public summaries',
					paragraphs: [
						'Internal maintainer notes are private by default. Only an explicit public reply or public status action is shown to the reporter.',
						'A public development issue can be created only after separate project-owner approval and may contain only a de-identified summary. The public issue is not linked back to the private feedback record.',
					],
				},
				{
					heading: 'Retention, deletion, and backups',
					paragraphs: [
						'Feedback content, public messages, and screenshots are retained until the reporter deletes them. Idempotency records are intended to remain for 7 days, browser sessions for at most 24 hours, and content-free security audit records for at most 90 days. Rate-limit and external-event deduplication data use shorter or otherwise bounded retention.',
						'Deleting one or all reports removes primary content, public messages, screenshots, and original content from the private GitHub working copy. A content-free deletion tombstone may remain to prevent retry-based restoration. An owner-approved de-identified public development issue may remain.',
						'Cloudflare, GitHub, or other provider security backups may retain encrypted copies briefly under provider policy and cannot always be erased item-by-item immediately. The service does not promise immediate deletion from every backup.',
					],
				},
				{
					heading: 'Children and students',
					paragraphs: [
						'Singular Blockly is often used in education, but the feedback form does not request a name, email address, or age. Students should not include their own or another person\'s personal information in text or screenshots and should ask a teacher, parent, or guardian to review the payload when needed. Obtain guardian consent first where applicable law requires it.',
					],
				},
				{
					heading: 'Rights and contact',
					paragraphs: [
						'Use My feedback or the private backup link to view, add to, and delete data. Use the Support page for general support or privacy requests. Report security vulnerabilities through the private process in the project SECURITY.md, not through public feedback.',
						'If the anonymous secret and backup link are lost, we cannot safely prove ownership and may be unable to recover or delete a specific report. Material policy changes are disclosed in the extension changelog and this policy.',
					],
				},
			],
		},
		support: {
			updated: 'Last updated: August 20, 2026',
				intro: 'Expand the rightmost toolbar menu in the Blockly editor and use the blue round feedback icon (tooltip: Provide feedback), or run Singular Blockly: Provide feedback from the Command Palette. No GitHub account is required, and the complete payload is shown before sending.',
			sections: [
				{ heading: 'Feedback and account recovery', paragraphs: ['Keep the feedback number and private backup link. The link acts as an access credential and must not be shared publicly. If the built-in service is unavailable, wait and try again or use the public project issue tracker only for non-private information.'] },
				{ heading: 'View, add to, or delete feedback', paragraphs: ['Use Singular Blockly: My feedback or the private backup link to review public status and maintainer replies, add text, or delete one or all reports. Provider-backup limits and the approved de-identified public-summary exception are described on the Privacy page.'] },
				{ heading: 'Security vulnerabilities', paragraphs: ['Do not use general feedback or a public issue for an exploitable vulnerability, leaked secret, or access-control problem. Follow the private GitHub Security Advisory process described in the project SECURITY.md.'] },
				{ heading: 'Support scope', paragraphs: ['Support is best effort. No response time, adoption, or reproducibility is guaranteed. PlatformIO, GitHub, Cloudflare, VS Code or VSCodium, hardware firmware, and network availability may affect the result. Keep your own project backup; this service is not a backup for project files or code.'] },
			],
		},
		terms: {
			updated: 'Last updated: August 20, 2026',
			intro: 'By using the Singular Blockly feedback service, you agree to these terms and the Privacy policy. You may continue using Singular Blockly without this optional service.',
			sections: [
				{ heading: 'Purpose', paragraphs: ['The service is for reporting Singular Blockly problems, suggesting features, asking usage questions, and providing other product feedback. Submitting content does not promise a response, fix, adoption, schedule, or release.'] },
				{ heading: 'User responsibilities', paragraphs: ['Submit only content you have the right to share and review all text and screenshots first. Do not submit unlawful, infringing, harassing, impersonating, malicious, spam, automated-abuse, credential, or unrelated bulk content, and do not bypass rate limits, authentication, access controls, or maintainer approval. Students should avoid personal information and seek adult help when needed.'] },
				{ heading: 'Content and permission', paragraphs: ['You retain rights in your feedback and grant project maintainers the non-exclusive permission needed to provide support, diagnose problems, triage requests, and improve Singular Blockly. With project-owner approval, maintainers may create a de-identified public development issue that cannot be linked back to the reporter or private item; that public issue may remain after private feedback is deleted.'] },
				{ heading: 'Restriction and deletion', paragraphs: ['To protect security and availability, the service may rate-limit requests, reject invalid content, close spam or abuse, or revoke an abused anonymous credential. Reporter deletion is available as described in the product; technical scope and backup exceptions follow the Privacy policy.'] },
				{ heading: 'Availability and limitation', paragraphs: ['The service is provided as-is and may be interrupted, delayed, changed, or discontinued. Do not use it for emergencies, life or hardware safety, legal notice, or project backup. To the extent allowed by law, project maintainers are not responsible for indirect loss caused by interruption, third-party services, a lost backup link, or submitted content. Mandatory law still applies.'] },
				{ heading: 'Changes and contact', paragraphs: ['Changes are recorded on this page. Use the Support page for general help and the project SECURITY.md private process for security matters.'] },
			],
		},
	},
	'zh-hant': {
		privacy: {
			updated: '最後更新：2026 年 8 月 20 日',
			intro: '本說明解釋「提供回饋」與「我的回饋」功能如何處理資料。這是使用者主動啟動的支援傳送，不是遙測或行為分析；只開啟、填寫或關閉表單不會對外傳送資料。',
			sections: [
				{ heading: '收集的資料與目的', paragraphs: ['送出前會顯示完整傳送內容並要求明確確認。必填內容為回饋種類、標題與使用者撰寫的說明；重現步驟與預期結果為選填。', '基本環境資訊預設開啟但可關閉，僅限允許清單中的 Singular Blockly 與 VS Code 版本、作業系統家族與主版本、處理器架構、介面語系、標準化主機與工作區類型、工作區信任狀態、目前開發板、程式語言、相關工具版本或就緒狀態，以及最近一次穩定錯誤的階段與代碼。近期結構化事件預設關閉；開啟後也只包含有上限的時間、階段、穩定事件代碼與結果。', '系統不會為回饋自動讀取或傳送原始碼、Blockly 工作區內容、產生的程式碼、檔案或資料夾名稱、完整或部分路徑、機器或裝置識別碼、序列埠、Wi-Fi 資訊、IP 位址、環境變數、權杖、憑證、原始錯誤訊息或原始紀錄。', '使用者可主動附加一張截圖。截圖會先在本機重新編碼並移除原始中繼資料，限制最長邊 1920 像素與 3 MiB，服務端再做第二次檢查。截圖仍可能包含畫面上可見的姓名、電子郵件、路徑、程式內容或其他私人資訊，因此送出前必須自行檢查預覽。'] },
				{ heading: '識別、網路與安全資料', paragraphs: ['擴充套件會在 VS Code SecretStorage 建立不含個人資訊的 256-bit 隨機秘密，讓回報者查看、補充或刪除自己的回饋。服務端只保存以伺服器秘密計算的不可逆 HMAC 表示。備援連結把秘密放在 URL fragment；一般 HTTP 請求不會傳送 fragment。交換後會改用最長 24 小時的 HttpOnly、Secure、SameSite 工作階段。', '為防止濫用，Cloudflare 可能短時間處理來源網路位址；應用程式只使用 HMAC 衍生值做速率限制，不把原始 IP 寫入回饋資料庫。Cloudflare、網路供應商與 GitHub 仍可能依各自的安全紀錄政策處理請求中繼資料。'] },
				{ heading: '處理者、資料位置與跨境', paragraphs: ['回饋文字與狀態保存在 Cloudflare D1，截圖保存在非公開 Cloudflare R2。維護工作副本會同步到只有專案維護者可存取的 GitHub 私有儲存庫。', 'Cloudflare 與 GitHub 可能在不同國家或地區處理及備援資料，因此資料可能依其基礎設施、條款與安全備份政策跨境傳輸。'] },
				{ heading: '維護者存取與公開摘要', paragraphs: ['內部維護者留言預設不會顯示給回報者；只有明確的公開回覆或公開狀態操作才會同步。', '任何公開開發 Issue 都必須由專案負責人另外核准，而且只能包含去識別化摘要。公開 Issue 不會連回私密回饋紀錄。'] },
				{ heading: '保存、刪除與備份', paragraphs: ['回饋內容、公開訊息與截圖會保存到回報者刪除為止。冪等紀錄預計保存 7 天；瀏覽器工作階段最長 24 小時；不含回饋本文的安全稽核紀錄最長 90 天；速率限制與外部事件去重資料採更短或有限期限。', '刪除單筆或全部回饋時，主要資料、公開訊息、截圖與私密 GitHub 工作副本中的原始內容會被移除。為避免重試後重新出現，系統可保留不含內容的刪除墓碑；已獲核准且去識別化的公開開發 Issue 可能保留。', 'Cloudflare、GitHub 或其他服務提供者的安全備份可能依其政策短期保留加密副本，且無法立即逐筆清除；本服務不承諾所有備份即時抹除。'] },
				{ heading: '兒童與學生', paragraphs: ['Singular Blockly 常用於教育情境，但回饋表單不要求姓名、電子郵件或年齡。學生不應在文字或截圖中填入自己或他人的個人資訊；需要時應請老師、家長或監護人協助檢查傳送內容。若適用法令要求監護人同意，應先取得同意。'] },
				{ heading: '權利與聯絡方式', paragraphs: ['使用「我的回饋」或私人備援連結可查看、補充及刪除資料。一般支援與隱私請求請使用「支援」頁面；安全漏洞請依專案 SECURITY.md 的私密流程通報，不要使用公開回饋。', '若匿名秘密與備援連結遺失，我們無法安全證明資料所有權，也可能無法找回或刪除特定回饋。重大政策變更會在擴充套件更新紀錄與本頁揭露。'] },
			],
		},
		support: {
			updated: '最後更新：2026 年 8 月 20 日',
				intro: '請展開 Blockly 編輯器最右側的工具列選單，使用藍色圓形的回饋圖示按鈕（游標提示為「提供回饋」），或從命令選單執行「Singular Blockly: 提供回饋」。不需要 GitHub 帳號，送出前會顯示完整傳送內容。',
			sections: [
				{ heading: '回饋與備援存取', paragraphs: ['請保留回饋編號與私人備援連結；連結等同存取憑證，不要公開分享。若內建服務暫時無法使用，請稍後再試；也可只把不含私人資訊的內容提交到公開專案 Issue。'] },
				{ heading: '查看、補充與刪除', paragraphs: ['使用「Singular Blockly: 我的回饋」或私人備援連結，可查看公開狀態與維護者回覆、補充純文字，或刪除單筆及全部回饋。供應商備份限制與核准後去識別化公開摘要的例外，請參閱「隱私權」頁面。'] },
				{ heading: '安全漏洞', paragraphs: ['疑似可被利用的漏洞、秘密外洩或存取控制問題，不要使用一般回饋或公開 Issue。請依專案 SECURITY.md 使用 GitHub Security Advisory 私密通報。'] },
				{ heading: '支援範圍', paragraphs: ['支援採盡力而為，不保證回覆時間、一定採納或能重現。PlatformIO、GitHub、Cloudflare、VS Code／VSCodium、硬體韌體與網路可用性都可能影響結果。請保留自己的專案備份；回饋服務不是專案檔案或程式碼的備份服務。'] },
			],
		},
		terms: {
			updated: '最後更新：2026 年 8 月 20 日',
			intro: '使用 Singular Blockly 回饋服務即表示您同意本條款與隱私權政策。若不同意，仍可使用不需要回饋服務的 Singular Blockly 功能。',
			sections: [
				{ heading: '服務用途', paragraphs: ['本服務用於回報 Singular Blockly 問題、提出功能建議、詢問使用方式及提供其他產品回饋。送出內容不代表維護者承諾回覆、修正、採納、排程或發布。'] },
				{ heading: '使用者責任', paragraphs: ['您應只提交有權分享的內容，並先檢查所有文字與截圖。不得提交違法、侵權、騷擾、冒充、惡意程式、垃圾訊息、自動化濫用、秘密憑證或無關的大量資料，也不得嘗試繞過速率限制、驗證、存取控制或維護者核准。學生應避免提供個人資訊，必要時請成人協助。'] },
				{ heading: '內容處理與授權', paragraphs: ['您保有回饋內容的權利，並授予專案維護者為提供支援、除錯、分流與改善 Singular Blockly 所必要的非專屬使用權。經專案負責人核准後，維護者可建立無法連回回報者或私密項目的去識別化公開開發 Issue；該公開 Issue 可能在私密回饋刪除後保留。'] },
				{ heading: '限制與刪除', paragraphs: ['為維護安全與可用性，服務可限制請求、拒絕不符合格式的內容、關閉垃圾或濫用項目，或撤銷被濫用的匿名憑證。回報者可依產品介面刪除資料；技術範圍與備份例外以隱私權政策為準。'] },
				{ heading: '服務可用性與責任限制', paragraphs: ['本服務依現況提供，可能中斷、延遲、變更或停止。請勿把它當作緊急通報、生命或硬體安全、法定通知或專案備份管道。在法律允許的範圍內，專案維護者不對因服務中斷、第三方服務、遺失備援連結或提交內容造成的間接損失負責；適用法律另有強制規定者從其規定。'] },
				{ heading: '變更與聯絡', paragraphs: ['條款更新會記錄在本頁。一般支援請使用「支援」頁面；安全問題請依專案 SECURITY.md 的私密流程通報。'] },
			],
		},
	},
};

function compactDocument(copy: CompactPolicyCopy, kind: PolicyKind): PolicyDocument {
	return {
		updated: copy.updated,
		intro: copy[kind].intro,
		sections: [{ heading: copy[kind].heading, paragraphs: [copy[kind].body] }],
	};
}

export function detailedPolicy(locale: string, kind: PolicyKind): { language: DetailedPolicyLocale; document: PolicyDocument } {
	if (locale === 'en' || locale === 'zh-hant') {
		return { language: locale, document: POLICIES[locale][kind] };
	}
	if (Object.prototype.hasOwnProperty.call(COMPACT_POLICY_LOCALES, locale)) {
		const language = locale as keyof typeof COMPACT_POLICY_LOCALES;
		return { language, document: compactDocument(COMPACT_POLICY_LOCALES[language], kind) };
	}
	return { language: 'en', document: POLICIES.en[kind] };
}
