/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Codicon } from 'vs/base/common/codicons';
import { KeyCode, KeyMod } from 'vs/base/common/keyCodes';
import { Lazy } from 'vs/base/common/lazy';
import { localize } from 'vs/nls';
import { Action2, MenuId } from 'vs/platform/actions/common/actions';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { ContextKeyExpr } from 'vs/platform/contextkey/common/contextkey';
import { ServicesAccessor } from 'vs/platform/instantiation/common/instantiation';
import { KeybindingWeight } from 'vs/platform/keybinding/common/keybindingsRegistry';
import { CHAT_CATEGORY } from 'vs/workbench/contrib/chat/browser/actions/chatActions';
import { CONTEXT_PROVIDER_EXISTS } from 'vs/workbench/contrib/chat/common/chatContextKeys';

export const ASK_QUICK_QUESTION_ACTION_ID = 'chat.action.askQuickQuestion';

export const enum QuickQuestionMode {
	SingleQuestion = 'singleQuestion',
	InputOnTopChat = 'inputOnTopChat',
	InputOnBottomChat = 'inputOnBottomChat',
}

export interface IQuickQuestionMode {
	run(accessor: ServicesAccessor, query: string): void;
}

// TODO: This should be registered per chat-provider probably.
export class AskQuickQuestionAction extends Action2 {

	private static readonly modeRegistry: Map<QuickQuestionMode, Lazy<IQuickQuestionMode>> = new Map();
	static registerMode(mode: QuickQuestionMode, modeAction: { new(): IQuickQuestionMode }) {
		AskQuickQuestionAction.modeRegistry.set(mode, new Lazy(() => new modeAction()));
	}

	constructor() {
		super({
			id: ASK_QUICK_QUESTION_ACTION_ID,
			title: { value: localize('chat', "Chat"), original: 'Chat' },
			precondition: CONTEXT_PROVIDER_EXISTS,
			icon: Codicon.commentDiscussion,
			f1: false,
			category: CHAT_CATEGORY,
			keybinding: {
				weight: KeybindingWeight.WorkbenchContrib,
				primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyI,
				linux: {
					primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyMod.Alt | KeyCode.KeyI
				}
			},
			menu: {
				id: MenuId.LayoutControlMenu,
				group: '0_workbench_toggles',
				when: ContextKeyExpr.equals('config.chat.experimental.defaultMode', 'quickQuestion'),
				order: 0
			}
		});
	}

	override run(accessor: ServicesAccessor, query: string): void {
		const configurationService = accessor.get(IConfigurationService);

		const mode = configurationService.getValue<QuickQuestionMode>('chat.experimental.quickQuestion.mode');
		const modeAction = AskQuickQuestionAction.modeRegistry.get(mode);
		if (modeAction) {
			modeAction.value.run(accessor, query);
		}
	}
}
