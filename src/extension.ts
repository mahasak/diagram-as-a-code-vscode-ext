// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const registerCommand = vscode.commands.registerCommand;

	let command = registerCommand('diagramascodeviewer.start', () => {
		const _disposables: vscode.Disposable[] = [];

		const panel = vscode.window.createWebviewPanel(
			'diagramsPreview', 'Diagrams Preview',
			vscode.ViewColumn.Two,
			{enableScripts: true}
		);

		const genDiagram = () => {
			const proc = require('child_process')
			let full_path = vscode.window.activeTextEditor?.document.uri.path
			let dir = path.dirname(full_path ?? "")
			let filename2 = path.basename(full_path ?? "");
			console.log()
			const cmd = `cat ${full_path} | docker run -i --rm -v ${dir}/out:/out gtramontina/diagrams:0.18.0`
			proc.exec(cmd, (err: string, stdout: string, stderr: string) => {
				if (err) {
					console.log('error: ' + err);
				}
			});
		}

		const getContent = () => {
			return `<!DOCTYPE html>
			<html>
			  <head>
				<base href="">
			  </head>
			  <body>
				<div id="root">Test Preview</div>
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