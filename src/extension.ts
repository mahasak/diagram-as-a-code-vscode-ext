import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs'

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

		const isValidFileExtension = () => path.extname(getDiagramSource()) === '.py';

		const getDiagramSource = () => vscode.window.activeTextEditor?.document.uri.path ?? "";

		const  genDiagram = async () => {
			if(!isValidFileExtension()) {
				return;
			}

			const proc = require('child_process');
			const full_path = getDiagramSource();
			const cmd = `cat ${full_path} | docker run -i --rm -v ${context.extensionPath}/media/out:/out gtramontina/diagrams:0.18.0`;
			console.log(cmd);
			
			proc.exec(cmd, (err: string, stdout: string, stderr: string) => {
				if (err) {
					console.log('error: ' + err);
					return;
				} 
				panel.webview.html = getContent();
			});
		}

		const getContent = () => {
			const full_path = getDiagramSource();
			const target = path.basename(full_path ?? "", ".py");
			const target_file = path.join(context.extensionPath, "media", "out", `${target}.png`);
			var data = fs.readFileSync(target_file).toString('base64');
			
			const content = `<!DOCTYPE html>
			<html>
			  <body>
				<img src="data:image/png;base64, ${data}" >
			  </body>
			</html>`;

			return content;
		}

		vscode.workspace.onDidSaveTextDocument(
			(e) => {
				console.log("Source diagram changed");
				if (e.fileName === vscode.window.activeTextEditor?.document.fileName) {
					genDiagram();
				} else {
					console.log("Source diagram not matched");
				}
			},
			null,
			_disposables
		);

		panel.onDidDispose(
			() => {
				console.log('panel closed');

				while (_disposables.length) {
					const item = _disposables.pop()
					if (item) {
						item.dispose();
					}
				}
			},
			null,
			context.subscriptions
		);
		
		genDiagram();
	});
	context.subscriptions.push(command);

	console.log('Congratulations, your extension "diagramascodeviewer" is now active!');
}

export function deactivate() {
	console.log('deactivated');
}