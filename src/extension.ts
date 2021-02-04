// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs'

import { Selection, TextDocument, TextEditor } from 'vscode';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const registerCommand = vscode.commands.registerCommand;

	let command = registerCommand('diagramascodeviewer.start', () => {
		const _disposables: vscode.Disposable[] = [];

		const panel = vscode.window.createWebviewPanel(
			'diagramsPreview', 'Diagrams Preview',
			vscode.ViewColumn.Two,
			{
				localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media', 'out'))],
				enableScripts: true
			}
		);

		const getDiagramSource = () => vscode.window.activeTextEditor?.document.uri.path

		const genDiagram = () => {
			const proc = require('child_process')
			const full_path = getDiagramSource()

			const cmd = `cat ${full_path} | docker run -i --rm -v ${context.extensionPath}/media/out:/out gtramontina/diagrams:0.18.0`
			console.log(cmd);
			proc.exec(cmd, (err: string, stdout: string, stderr: string) => {
				if (err) {
					console.log('error: ' + err);
				}
			});
		}

		const getContent = () => {
			const full_path = getDiagramSource()
			const dir = path.dirname(full_path ?? "")
			const target = path.basename(full_path ?? "", ".py");
			const target_file = path.join(dir, "out", `${target}.png`)
			var data = fs.readFileSync(target_file).toString('base64');

			return `<!DOCTYPE html>
			<html>
			  <body>
				<img src="data:image/png;base64, ${data}" >
			  </body>
			`
		}

		const previewHandler = () => {
			const editor = vscode.window.activeTextEditor;
			const text = editor?.document.getText();
			const cursor = editor?.document.offsetAt(editor.selection.anchor);
			let folderPath = vscode.window.activeTextEditor?.document.fileName;
			console.log(folderPath)
			genDiagram();
		}

		vscode.workspace.onDidSaveTextDocument(
			(e) => {
				previewHandler();
				panel.webview.html = getContent();
			},
			null,
			_disposables
		);

		vscode.workspace.onDidChangeTextDocument(
			(e) => {

				if (e.document === vscode.window.activeTextEditor?.document) {
					//previewHandler();
				}
			},
			null,
			_disposables
		);

		vscode.workspace.onDidChangeConfiguration(
			(e) => {
				panel.webview.html = getContent();
			},
			null,
			_disposables
		);

		vscode.window.onDidChangeTextEditorSelection(
			(e) => {
				if (e.textEditor === vscode.window.activeTextEditor) {
					//previewHandler();
				}
			},
			null,
			_disposables
		);

		panel.onDidDispose(
			() => {
				console.log('panel closed');

				while (_disposables.length) {
					const item = _disposables.pop();
					if (item) {
						item.dispose();
					}
				}
			},
			null,
			context.subscriptions
		);

		panel.webview.html = getContent();
	});
	context.subscriptions.push(command);

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "diagramascodeviewer" is now active!');
}

// this method is called when your extension is deactivated
export function deactivate() {
	console.log('deactivated');
}