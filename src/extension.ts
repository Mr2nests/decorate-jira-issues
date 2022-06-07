import * as vscode from 'vscode';

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {

	console.log('Extension decorate-jira-issues is activated');

	let timeout: NodeJS.Timer | undefined = undefined;

	// create a decorator type that we use to decorate jira numbers
	const jiraNumberDecorationType = vscode.window.createTextEditorDecorationType({
		// use a themable color. See package.json for the declaration and default values.
		backgroundColor: { id: 'decorateJiraIssues.background' }
	});

	let activeEditor = vscode.window.activeTextEditor;

	function updateDecorations() {
		if (!activeEditor) {
			return;
		}
		const regEx = /jira-\d+/g;
		const text = activeEditor.document.getText();
		const jiraNumbers: vscode.DecorationOptions[] = [];
		let match;

		const { instanceUrl } = vscode.workspace.getConfiguration('decorateJiraIssues');

		if (!instanceUrl) {
			vscode.window.showErrorMessage("You need to configure your Jira instance URL in the settings.");
			return null;
		}

		while ((match = regEx.exec(text))) {
			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
			const jiraNumber = match[0].replace('jira-','');
			const decoration = {
				range: new vscode.Range(startPos, endPos),
				hoverMessage: new vscode.MarkdownString('Open [ticket '+ jiraNumber + ']('+ instanceUrl + jiraNumber + ')')
			};
			decoration.hoverMessage.isTrusted = true;

			jiraNumbers.push(decoration);
		}
		activeEditor.setDecorations(jiraNumberDecorationType, jiraNumbers);
	}

	function triggerUpdateDecorations(throttle = false) {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		if (throttle) {
			timeout = setTimeout(updateDecorations, 500);
		} else {
			updateDecorations();
		}
	}

	if (activeEditor) {
		triggerUpdateDecorations();
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations(true);
		}
	}, null, context.subscriptions);

}