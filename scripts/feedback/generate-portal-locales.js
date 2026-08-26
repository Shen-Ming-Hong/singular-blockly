#!/usr/bin/env node
/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '../..');
const OUTPUT = path.join(ROOT, 'workers/feedback/src/portalLocales.ts');
const LOCALES = ['en', 'zh-hant', 'ja', 'ko', 'de', 'fr', 'es', 'it', 'pt-br', 'ru', 'pl', 'cs', 'hu', 'bg', 'tr'];
const KEYS = {
	navigation: 'FEEDBACK_NAVIGATION_LABEL', privacy: 'FEEDBACK_PRIVACY_ACTION', support: 'FEEDBACK_SUPPORT_ACTION', terms: 'FEEDBACK_TERMS_ACTION',
	myFeedbackTitle: 'FEEDBACK_MY_FEEDBACK_TITLE', myFeedbackHelp: 'FEEDBACK_MY_FEEDBACK_HELP', empty: 'FEEDBACK_EMPTY', loadMore: 'FEEDBACK_LOAD_MORE',
	detailDescriptionLabel: 'FEEDBACK_DETAIL_DESCRIPTION_LABEL', detailStepsLabel: 'FEEDBACK_DETAIL_STEPS_LABEL', detailExpectedLabel: 'FEEDBACK_DETAIL_EXPECTED_LABEL',
	detailDiagnosticsLabel: 'FEEDBACK_DETAIL_DIAGNOSTICS_LABEL', detailAttachmentIncluded: 'FEEDBACK_DETAIL_ATTACHMENT_INCLUDED', detailAttachmentNotIncluded: 'FEEDBACK_DETAIL_ATTACHMENT_NOT_INCLUDED',
	addMessage: 'FEEDBACK_ADD_MESSAGE_ACTION', messageLabel: 'FEEDBACK_MESSAGE_LABEL', deleteOne: 'FEEDBACK_DELETE_ONE_ACTION', deleteAll: 'FEEDBACK_DELETE_ALL_ACTION',
	deleteOneHelp: 'FEEDBACK_DELETE_ONE_HELP', deleteAllHelp: 'FEEDBACK_DELETE_ALL_HELP', deletionNotice: 'FEEDBACK_DELETION_BACKUP_NOTICE',
	operationSuccess: 'FEEDBACK_OPERATION_SUCCESS', error: 'FEEDBACK_ERROR_GENERIC', authorReporter: 'FEEDBACK_AUTHOR_REPORTER', authorMaintainer: 'FEEDBACK_AUTHOR_MAINTAINER',
	statusReceived: 'FEEDBACK_STATUS_RECEIVED', statusTriaging: 'FEEDBACK_STATUS_TRIAGING', statusNeedsInfo: 'FEEDBACK_STATUS_NEEDS_INFO',
	statusPlanned: 'FEEDBACK_STATUS_PLANNED', statusInProgress: 'FEEDBACK_STATUS_IN_PROGRESS', statusResolved: 'FEEDBACK_STATUS_RESOLVED', statusClosed: 'FEEDBACK_STATUS_CLOSED',
	intro: 'FEEDBACK_INTRO', personalWarning: 'FEEDBACK_PERSONAL_DATA_WARNING', diagnosticsHelp: 'FEEDBACK_BASIC_DIAGNOSTICS_HELP',
	serviceDisclosure: 'FEEDBACK_SERVICE_DISCLOSURE', copyRecovery: 'FEEDBACK_COPY_RECOVERY_ACTION', recoveryCopied: 'FEEDBACK_RECOVERY_COPIED',
};

const EXTRA = {
	en: ['Loading your feedback…', 'This backup link is invalid. Copy it again from Singular Blockly.', 'The backup link could not be verified and may have expired.', 'Your session expired. Open your private backup link again.', 'This service is for product feedback, does not guarantee a response or adoption, and must not be used for emergencies or prohibited content.'],
	'zh-hant': ['正在載入您的回饋…', '備援連結無效，請回到 Singular Blockly 重新複製。', '無法驗證備援連結；連結可能已失效。', '工作階段已失效，請重新開啟您的私人備援連結。', '本服務僅供產品回饋，不保證回覆或採納，也不得用於緊急事件或提交禁止內容。'],
	ja: ['フィードバックを読み込んでいます…', '予備リンクが無効です。Singular Blockly でもう一度コピーしてください。', '予備リンクを確認できませんでした。期限切れの可能性があります。', 'セッションの期限が切れました。非公開の予備リンクをもう一度開いてください。', '本サービスは製品へのフィードバック用であり、返信や採用を保証しません。緊急連絡や禁止された内容の送信には使用できません。'],
	ko: ['내 피드백을 불러오는 중…', '백업 링크가 올바르지 않아요. Singular Blockly에서 다시 복사해 주세요.', '백업 링크를 확인할 수 없어요. 링크가 만료됐을 수 있어요.', '작업 시간이 만료됐어요. 비공개 백업 링크를 다시 열어 주세요.', '이 서비스는 제품 의견을 위한 것이며 답변이나 반영을 보장하지 않아요. 긴급 상황이나 금지된 내용을 보내는 데 사용할 수 없어요.'],
	de: ['Dein Feedback wird geladen…', 'Dieser Ersatzlink ist ungültig. Kopiere ihn erneut aus Singular Blockly.', 'Der Ersatzlink konnte nicht geprüft werden und ist möglicherweise abgelaufen.', 'Deine Sitzung ist abgelaufen. Öffne deinen privaten Ersatzlink erneut.', 'Dieser Dienst ist für Produktfeedback gedacht, garantiert keine Antwort oder Umsetzung und darf nicht für Notfälle oder verbotene Inhalte verwendet werden.'],
	fr: ['Chargement de vos retours…', 'Ce lien de secours n’est pas valide. Copiez-le à nouveau depuis Singular Blockly.', 'Le lien de secours n’a pas pu être vérifié et a peut-être expiré.', 'Votre session a expiré. Ouvrez à nouveau votre lien de secours privé.', 'Ce service sert aux retours sur le produit, ne garantit ni réponse ni adoption et ne doit pas être utilisé pour les urgences ou les contenus interdits.'],
	es: ['Cargando tus comentarios…', 'Este enlace de respaldo no es válido. Vuelve a copiarlo desde Singular Blockly.', 'No se pudo verificar el enlace de respaldo y puede haber caducado.', 'Tu sesión caducó. Abre de nuevo tu enlace de respaldo privado.', 'Este servicio es para comentarios sobre el producto, no garantiza una respuesta ni su adopción y no debe usarse para emergencias ni contenido prohibido.'],
	it: ['Caricamento dei tuoi feedback…', 'Questo link di riserva non è valido. Copialo di nuovo da Singular Blockly.', 'Non è stato possibile verificare il link di riserva; potrebbe essere scaduto.', 'La sessione è scaduta. Apri di nuovo il tuo link di riserva privato.', 'Questo servizio è destinato ai feedback sul prodotto, non garantisce risposta o adozione e non deve essere usato per emergenze o contenuti vietati.'],
	'pt-br': ['Carregando seus feedbacks…', 'Este link de acesso alternativo é inválido. Copie-o novamente no Singular Blockly.', 'Não foi possível verificar o link de acesso alternativo; ele pode ter expirado.', 'Sua sessão expirou. Abra novamente seu link privado de acesso alternativo.', 'Este serviço é destinado a feedback sobre o produto, não garante resposta nem adoção e não deve ser usado para emergências ou conteúdo proibido.'],
	ru: ['Загрузка ваших отзывов…', 'Эта резервная ссылка недействительна. Скопируйте её ещё раз из Singular Blockly.', 'Не удалось проверить резервную ссылку; возможно, срок её действия истёк.', 'Срок сеанса истёк. Снова откройте свою закрытую резервную ссылку.', 'Сервис предназначен для отзывов о продукте, не гарантирует ответ или принятие предложения и не должен использоваться для экстренных обращений или запрещённого содержимого.'],
	pl: ['Wczytywanie Twoich opinii…', 'Ten zapasowy link jest nieprawidłowy. Skopiuj go ponownie z Singular Blockly.', 'Nie udało się zweryfikować zapasowego linku; mógł wygasnąć.', 'Sesja wygasła. Otwórz ponownie swój prywatny zapasowy link.', 'Ta usługa służy do przekazywania opinii o produkcie, nie gwarantuje odpowiedzi ani realizacji i nie może być używana w nagłych przypadkach ani do przesyłania zabronionych treści.'],
	cs: ['Načítání vaší zpětné vazby…', 'Tento záložní odkaz není platný. Zkopírujte ho znovu ze Singular Blockly.', 'Záložní odkaz se nepodařilo ověřit a mohl vypršet.', 'Platnost relace vypršela. Otevřete znovu svůj soukromý záložní odkaz.', 'Tato služba slouží ke zpětné vazbě k produktu, nezaručuje odpověď ani přijetí návrhu a nesmí se používat pro naléhavé případy nebo zakázaný obsah.'],
	hu: ['A visszajelzések betöltése…', 'Ez a tartalék hivatkozás érvénytelen. Másolja ki újra a Singular Blockly alkalmazásból.', 'A tartalék hivatkozás nem ellenőrizhető, és lehet, hogy lejárt.', 'A munkamenet lejárt. Nyissa meg újra a privát tartalék hivatkozást.', 'Ez a szolgáltatás termékvisszajelzésre szolgál, nem garantál választ vagy megvalósítást, és nem használható vészhelyzetekhez vagy tiltott tartalomhoz.'],
	bg: ['Вашата обратна връзка се зарежда…', 'Тази резервна връзка е невалидна. Копирайте я отново от Singular Blockly.', 'Резервната връзка не можа да бъде потвърдена и може да е изтекла.', 'Сесията изтече. Отворете отново личната си резервна връзка.', 'Услугата е за обратна връзка за продукта, не гарантира отговор или приемане и не трябва да се използва за спешни случаи или забранено съдържание.'],
	tr: ['Geri bildirimleriniz yükleniyor…', 'Bu yedek erişim bağlantısı geçersiz. Singular Blockly uygulamasından yeniden kopyalayın.', 'Yedek erişim bağlantısı doğrulanamadı ve süresi dolmuş olabilir.', 'Oturumunuzun süresi doldu. Özel yedek erişim bağlantınızı yeniden açın.', 'Bu hizmet ürün geri bildirimi içindir; yanıt veya kabul garantisi vermez ve acil durumlar ya da yasak içerikler için kullanılamaz.'],
};

function messages(locale) {
	let value;
	const sandbox = { window: { languageManager: { loadMessages: (_name, loaded) => {value = loaded;} } } };
	vm.runInNewContext(fs.readFileSync(path.join(ROOT, `media/locales/${locale}/messages.js`), 'utf8'), sandbox);
	if (!value) throw new Error(`Unable to load locale ${locale}`);
	return value;
}

function build() {
	const output = {};
	for (const locale of LOCALES) {
		const source = messages(locale);
		const selected = Object.fromEntries(Object.entries(KEYS).map(([name, key]) => {
			if (typeof source[key] !== 'string') throw new Error(`Missing ${locale}:${key}`);
			return [name, source[key]];
		}));
		const [loading, invalidRecovery, failedRecovery, expiredSession, termsBody] = EXTRA[locale];
		output[locale] = { ...selected, loading, invalidRecovery, failedRecovery, expiredSession, termsBody };
	}
	return `/** Generated by scripts/feedback/generate-portal-locales.js. */\nexport const PORTAL_LOCALES = ${JSON.stringify(output, null, '\t')} as const;\n`;
}

const generated = build();
if (process.argv.includes('--check')) {
	if (!fs.existsSync(OUTPUT) || fs.readFileSync(OUTPUT, 'utf8') !== generated) {
		process.stderr.write('workers/feedback/src/portalLocales.ts is stale.\n');
		process.exitCode = 1;
	}
} else {
	fs.writeFileSync(OUTPUT, generated);
	process.stdout.write('Generated Worker portal locales for 15 languages.\n');
}
