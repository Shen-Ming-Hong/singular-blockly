/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';
import { AIModelManager, CopilotTier, getModelMultiplierLabel } from './aiModelManager';
import { log } from './logging';

const TIER_LABELS: Record<CopilotTier, string> = {
	none: 'Not Available',
	free: 'Copilot Free',
	pro: 'Copilot Pro',
	pro_plus: 'Copilot Pro+',
};

/**
 * AI 狀態列控制中心
 * 顯示 AI Shadow Suggestion 狀態，提供 Hover tooltip 與 QuickPick 選單
 */
export class AIStatusBar implements vscode.Disposable {
	private readonly statusBarItem: vscode.StatusBarItem;
	private readonly disposables: vscode.Disposable[] = [];
	private quotaExhausted = false;

	constructor(
		private readonly aiModelManager: AIModelManager,
		context: vscode.ExtensionContext
	) {
		this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
		this.statusBarItem.command = 'singular-blockly.showAIStatusMenu';

		// Register commands
		this.disposables.push(
			vscode.commands.registerCommand('singular-blockly.showAIStatusMenu', () => this.showStatusMenu()),
			vscode.commands.registerCommand('singular-blockly.toggleAutoTrigger', () => this.toggleAutoTrigger()),
			vscode.commands.registerCommand('singular-blockly.selectAIModel', () => this.selectModel()),
			vscode.commands.registerCommand('singular-blockly.openAISettings', () =>
				vscode.commands.executeCommand('workbench.action.openSettings', 'singularBlockly.ai')
			)
		);
		context.subscriptions.push(...this.disposables);

		// Subscribe to dynamic updates
		this.disposables.push(
			this.aiModelManager.onTierChanged(() => {
				this.quotaExhausted = false;
				this.update();
			}),
			this.aiModelManager.onQuotaExhausted(() => {
				this.quotaExhausted = true;
				this.update();
			}),
			vscode.workspace.onDidChangeConfiguration(e => {
				if (e.affectsConfiguration('singularBlockly.ai')) {
					this.update();
				}
			})
		);

		this.update();
		log('AIStatusBar initialized', 'info');
	}

	/**
	 * 更新狀態列文字、tooltip 與可見性
	 */
	private update(): void {
		const tier = this.aiModelManager.getTier();

		if (tier === 'none') {
			this.statusBarItem.hide();
			return;
		}

		this.statusBarItem.text = tier === 'pro_plus' ? '$(sparkle) AI+' : '$(sparkle) AI';
		this.updateTooltip();
		this.statusBarItem.show();
	}

	/**
	 * 建立 MarkdownString hover tooltip
	 */
	private updateTooltip(): void {
		const tier = this.aiModelManager.getTier();
		const config = this.aiModelManager.getEffectiveConfig();

		const tooltip = new vscode.MarkdownString('', true);
		tooltip.isTrusted = true;
		tooltip.supportHtml = true;

		// Header with tier
		tooltip.appendMarkdown(`**Singular Blockly AI** — ${TIER_LABELS[tier]}\n\n`);

		// Model info
		const modelSetting = vscode.workspace.getConfiguration('singularBlockly.ai').get<string>('model', 'gpt-4o-mini');
		tooltip.appendMarkdown(`Model: \`${modelSetting}\`\n\n`);

		// Quota exhaustion notice
		if (this.quotaExhausted) {
			tooltip.appendMarkdown('$(warning) Quota exhausted — suggestions paused\n\n');
		}

		tooltip.appendMarkdown('---\n\n');

		// Shadow Block Suggestions section header with action icons
		tooltip.appendMarkdown('**Shadow Block Suggestions** &nbsp; [$(settings-gear)](command:singular-blockly.openAISettings "Open settings") [$(refresh)](command:singular-blockly.triggerAISuggestion "Trigger suggestion")\n\n');

		// Auto-trigger toggle — entire line is a clickable command link
		if (config.autoTrigger) {
			tooltip.appendMarkdown('[$(check) Auto-trigger](command:singular-blockly.toggleAutoTrigger "Click to disable")\n\n');
		} else {
			tooltip.appendMarkdown('[☐ Auto-trigger](command:singular-blockly.toggleAutoTrigger "Click to enable")\n\n');
		}

		tooltip.appendMarkdown('[$(rocket) Change Model...](command:singular-blockly.selectAIModel)\n\n');

		this.statusBarItem.tooltip = tooltip;
	}

	/**
	 * 顯示 AI 狀態 QuickPick 選單
	 */
	private async showStatusMenu(): Promise<void> {
		const tier = this.aiModelManager.getTier();
		const config = this.aiModelManager.getEffectiveConfig();
		const tierLabel = TIER_LABELS[tier];
		const modelSetting = vscode.workspace.getConfiguration('singularBlockly.ai').get<string>('model', 'gpt-4o-mini');

		const items: vscode.QuickPickItem[] = [
			{ label: `$(sparkle) Status: Ready (${tierLabel})`, kind: vscode.QuickPickItemKind.Default, description: '' },
			{ label: '', kind: vscode.QuickPickItemKind.Separator },
			{ label: '$(rocket) Change Model...', description: modelSetting },
			{ label: '$(settings-gear) Edit Settings...', description: '' },
			{ label: '$(keyboard) Edit Keyboard Shortcuts...', description: '' },
		];

		const selected = await vscode.window.showQuickPick(items, {
			title: 'Singular Blockly AI',
			placeHolder: 'Select an action',
		});

		if (!selected) {
			return;
		}

		switch (selected.label) {
			case '$(rocket) Change Model...':
				await vscode.commands.executeCommand('singular-blockly.selectAIModel');
				break;
			case '$(settings-gear) Edit Settings...':
				await vscode.commands.executeCommand('singular-blockly.openAISettings');
				break;
			case '$(keyboard) Edit Keyboard Shortcuts...':
				await vscode.commands.executeCommand('workbench.action.openGlobalKeybindings', 'singular-blockly');
				break;
		}
	}

	/**
	 * 切換自動觸發設定
	 */
	private async toggleAutoTrigger(): Promise<void> {
		const aiConfig = vscode.workspace.getConfiguration('singularBlockly.ai');
		const current = aiConfig.get<boolean>('autoTrigger', false);
		const newValue = !current;

		await aiConfig.update('autoTrigger', newValue, vscode.ConfigurationTarget.Global);

		const stateLabel = newValue ? 'enabled' : 'disabled';
		vscode.window.showInformationMessage(`AI auto-trigger ${stateLabel}.`);
		log(`AI auto-trigger ${stateLabel}`, 'info');

		if (newValue && this.aiModelManager.getTier() === 'free') {
			vscode.window.showWarningMessage(
				'Auto-trigger is enabled on the Copilot Free plan. This will consume your limited monthly quota faster.'
			);
		}
	}

	/**
	 * 顯示模型選擇 QuickPick
	 */
	private async selectModel(): Promise<void> {
		const models = await this.aiModelManager.listRawModels();

		if (models.length === 0) {
			vscode.window.showWarningMessage('No AI models available.');
			return;
		}

		const currentModel = vscode.workspace.getConfiguration('singularBlockly.ai').get<string>('model', 'gpt-4o-mini');

		const items: vscode.QuickPickItem[] = models.map(m => {
			const multiplierLabel = getModelMultiplierLabel(m);
			return {
				label: m.name,
				description: m.family + (multiplierLabel ? ` · ${multiplierLabel}` : ''),
				detail: m.family === currentModel ? '$(check) Currently selected' : undefined,
				picked: m.family === currentModel,
			};
		});

		const selected = await vscode.window.showQuickPick(items, {
			title: 'Select AI Model',
			placeHolder: 'Choose a model for AI suggestions',
		});

		if (!selected) {
			return;
		}

		const family = selected.description!.split(' · ')[0];
		await vscode.workspace.getConfiguration('singularBlockly.ai').update('model', family, vscode.ConfigurationTarget.Global);
		await this.aiModelManager.selectModel(family);
		log(`AI model changed to ${family}`, 'info');
	}

	dispose(): void {
		this.statusBarItem.dispose();
		for (const d of this.disposables) {
			d.dispose();
		}
	}
}
