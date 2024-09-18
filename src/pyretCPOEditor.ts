import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';



export function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export class PyretCPOProvider implements vscode.CustomTextEditorProvider {

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new PyretCPOProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(PyretCPOProvider.viewType, provider, {
      webviewOptions: {
        retainContextWhenHidden: true,
      }
    });
    return providerRegistration;
  }

  private static readonly viewType = 'pyret-parley.cpo';

  constructor(
    private readonly context: vscode.ExtensionContext
  ) { }

  /**
   * Called when our custom editor is opened.
   * 
   * 
   */
  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    const knownModules = {
      'fs': {
        'readFileSync': (p: string, options: any) => {
          const actualCwd = path.dirname(document.uri.fsPath);
          const resolved = path.resolve(actualCwd, p);
          if (!resolved.startsWith(path.dirname(document.uri.fsPath))) {
            throw new Error(`Bad path outside of current directory: ${resolved} ${actualCwd}`);
          }
          return String(fs.readFileSync(resolved, options));
        }
      },
      'path': {
        'join': path.join,
        'resolve': path.resolve
      },
      'process': {
        'cwd': () => process.cwd()
      }
    }

    // Setup initial content for the webview
    webviewPanel.webview.options = {
      enableScripts: true,
    };
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    function updateWebview() {
      webviewPanel.webview.postMessage({
        type: 'setContents',
        text: document.getText(),
      });
    }

    // Hook up event handlers so that we can synchronize the webview with the text document.
    //
    // The text document acts as our model, so we have to sync change in the document to our
    // editor and sync changes in the editor back to the document.
    // 
    // Remember that a single text document can also be shared between multiple custom
    // editors (this happens for example when you split a custom editor)

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        updateWebview();
      }
    });

    // Make sure we get rid of the listener when our editor is closed.
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    function sendRpcResponse(data: { callbackId: string }, result: any) {
      webviewPanel.webview.postMessage({
        protocol: 'pyret-rpc',
        data: {
          type: 'rpc-response',
          callbackId: data.callbackId,
          result: result
        }
      });
    }

    // Receive message from the webview.
    webviewPanel.webview.onDidReceiveMessage(e => {
      console.log("Message: ", e);
      if (e.protocol === 'pyret-rpc') {
        /**
         * data: { module: string, method: string, args: string[], callbackId: string }
         * 
         * { type: 'rpc', module: 'fs', method: 'readFileSync', args: ['path/to/file'], callbackId: 'some-id' }
         */
        console.log("RPC:", e.data);
        const module = (knownModules as any)[e.data.module];
        if (!(module as any)[e.data.method]) {
          sendRpcResponse(e.data, { error: "Unknown method" });
        }
        else {
          const result = (module as any)[e.data.method](...e.data.args);
          sendRpcResponse(e.data, result);
        }
        return;
      }
      if (e.protocol !== 'pyret') { console.warn("Non-pyret message: ", e); return; }
      const initialState = {
        definitionsAtLastRun: false,
        interactionsSinceLastRun: [],
        editorContents: document.getText(),
        replContents: "",
      };
      switch (e.data.type) {
        case 'pyret-init': {
          console.log("Got init", e);
          webviewPanel.webview.postMessage({
            protocol: 'pyret',
            data: {
              type: 'reset',
              state: JSON.stringify(initialState)
            },
          });
          webviewPanel.webview.postMessage({
            type: 'gainControl'
          });
          break;
        }
        case 'change': {
          console.log("Got change", e);
          const edit = new vscode.WorkspaceEdit();

          // Just replace the entire document every time for this example extension.
          // A more complete extension should compute minimal edits instead.
          // NOTE(joe): we have these on the change events from CodeMirror
          edit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            e.state.editorContents)
          vscode.workspace.applyEdit(edit);
          document.save();
          break;
        }
        default: console.log("Got a message: ", e);
      }
    });

    updateWebview();
  }

  /**
   * Get the static html used for the editor webviews.
   */
  private getHtmlForWebview(webview: vscode.Webview): string {
    return `
        <!doctype HTML>
        <html>
        <head>
        <style type="text/css">
            body, html
            {
                margin: 0;
                padding: 0;
                height: 100%;
                border: none;
            }
        </style>
        </head>
        <body>
        <iframe id="pyret" frameBorder="0" width="100%" height="100%" src="https://pyret-vmt-dfb765867402.herokuapp.com/editor#controlled=true"></iframe>
        <script>
        const pyret = document.getElementById('pyret');
        const vscode = acquireVsCodeApi();
        window.addEventListener('message', (e) => {
          if(e.origin !== 'https://pyret-vmt-dfb765867402.herokuapp.com') {
            pyret.contentWindow.postMessage(e.data, "*");
          }
          else {
            vscode.postMessage(e.data, '*');
          }
        });
        </script>
        </body>
        </html>
        `;
  }
}