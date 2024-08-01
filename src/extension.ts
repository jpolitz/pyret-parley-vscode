import * as vscode from 'vscode';
import { PyretParleyProvider } from './pyretParleyEditor';

export function activate(context: vscode.ExtensionContext) {
	// Register our custom editor providers
	context.subscriptions.push(PyretParleyProvider.register(context));
}