import * as vscode from 'vscode';
import { PyretParleyProvider } from './pyretParleyEditor';
import { PyretCPOProvider } from './pyretCPOEditor';

export function activate(context: vscode.ExtensionContext) {
	// Register our custom editor providers
	context.subscriptions.push(PyretParleyProvider.register(context));
	context.subscriptions.push(PyretCPOProvider.register(context));
}