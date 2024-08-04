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
                'readFileSync': (p : string, options: any) => {
                    const actualCwd = path.dirname(document.uri.fsPath);
                    const resolved = path.resolve(actualCwd, p);
                    if(!resolved.startsWith(path.dirname(document.uri.fsPath))) {
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

        function sendRpcResponse(data: { callbackId: string }, result : any) {
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
            if(e.protocol === 'pyret-rpc') {
                /**
                 * data: { module: string, method: string, args: string[], callbackId: string }
                 * 
                 * { type: 'rpc', module: 'fs', method: 'readFileSync', args: ['path/to/file'], callbackId: 'some-id' }
                 */
                const module = (knownModules as any)[e.data.module];
                if(!(module as any)[e.data.method]) {
                    sendRpcResponse(e.data, { error: "Unknown method" });
                }
                else {
                    const result = (module as any)[e.data.method](...e.data.args);
                    sendRpcResponse(e.data, result);
                }
                return;
            }
            if(e.protocol !== 'pyret') { console.warn("Non-pyret message: ", e); return; }
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

        const stylesheets = [
            "/css/reset.css",
            "/css/codemirror.css",
            "/css/foldgutter.css",
            "/css/dialog.css",
            "/css/matchesonscrollbar.css",
            "/css/shared.css",
            "/css/editor.css",
            "/css/font-awesome.min.path-fixed.css",
            "/css/themes/default.css",
            "/css/themes/base16.css",
            "/css/themes/material-darker.css",
            "/css/themes/monokai.css",
            "/css/themes/panda-syntax.css",
            "/css/themes/high-contrast-light.css",
            "/css/themes/high-contrast-dark.css"
        ];

        const stylesheetUris = stylesheets.map((path) => webview.asWebviewUri(vscode.Uri.joinPath(
            this.context.extensionUri, 'cpo', 'web', path)));
        const stylesheetImports = stylesheetUris.map((uri) => `<link rel="stylesheet" type="text/css" href="${uri}">`).join("\n");

        const pyretUrl = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'cpo', 'web', 'js', 'cpo-main.jarr'));
        const localSettings = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'cpo', 'web', 'js', 'localSettings.js'));
        const es6shim = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'cpo', 'web', 'js', 'es6-shim.js'));
        const editorMisc = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'cpo', 'web', 'js', 'editor-misc.min.js'));
        const events = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'cpo', 'web', 'js', 'events.js'));
        const beforePyret = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'cpo', 'web', 'js', 'beforePyret.js'));

        const pyretLogo = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'cpo', 'web', 'img', 'pyret-logo.png'));
        const pyretIcon = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'cpo', 'web', 'img', 'pyret-icon.png'));

        // NOTE(joe): This I copied from a built index.html, lightly edited

        return /* html */`
<!doctype HTML>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <title>code.pyret.org</title>
  <link rel="preload" href="${pyretUrl}" as="script">
  <script>window.PYRET = "${pyretUrl}";</script>
  <link rel="stylesheet" href="https://ajax.googleapis.com/ajax/libs/jqueryui/1.10.4/themes/smoothness/jquery-ui.css" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Fira+Mono:400,700" />
  ${stylesheetImports}
  <link rel="icon" type="image/png" href="${pyretIcon}" />
  <style id="highlight-styles"></style>
  <script>var APP_LOG_URL = "";</script>
  <script src="${localSettings}"></script>
</head>
<body class="default">
  <script>
    var themeOnLoad = localSettings.getItem('theme') || 'default';
    document.body.classList.remove("default");
    document.body.classList.add(themeOnLoad);
    var params = {};
    document.location.hash.substr(1).split("&").forEach(function (p) {
      var parts = p.split("=");
      if (parts.length === 1) {
        params[parts[0]] = true;
      } else {
        params[parts[0]] = parts[1];
      }
    });
    if(params["hideDefinitions"]) {
      document.body.classList.add("hideDefinitions");
    }
    var footerStyle = params["footerStyle"] || "normal";
    switch (footerStyle) {
    case 'hide':
      document.body.classList.add("hideFooter");
      break;
    default:
      // nothing to do
    }
    var headerStyle = params["headerStyle"] || "normal";
    switch (headerStyle) {
    case 'hide':
      document.body.classList.add("hideHeader");
      break;
    case 'small':
      document.body.classList.add("smallHeader");
      break;
    default:
      // nothing to do
    }
    window.addEventListener('load', function() {
      document.getElementById('theme-select').value = themeOnLoad;
    }, { once: true });
  </script>
  <main>
  <div id="Toolbar" class="toolbarregion" role="region" aria-label="Tool Controls" tabindex="-1">
    <nav id="header">
      <h2 id="menutitle" class="screenreader-only">Navigation Controls</h2>
      <p class="screenreader-only" id="mhelp">
      <span id="mhelp-menus">Use left and right arrows to move across menus.
      </span>
      <span id="mhelp-open-submenu">Use down arrow to open submenu.</span>
      <span id="mhelp-submenu">Use up and down arrows to move within submenus.
      </span>
      <span id="mhelp-activate">Use Enter to activate.</span>
      <span id="mhelp-escape-submenu">Use Escape to move to parent menu.</span>
      <span id="mhelp-escape">Use Escape to exit menus.</span>
      </p>
      <div role="menubar">
      <ul id="topTierUl" role="menu" aria-labelledby="menutitle"
        aria-describedby="mhelp-menus mhelp-activate mhelp-escape"
        aria-label="Toolbar" >
        <li role="presentation"
          class="topTier" id="bonniemenuli">
          <div id="bonniemenu" class="tooltip menu menuitemtitle" style="float:none" >
            <button role="menuitem"
                    id="bonniemenubutton"
                    aria-label="Pyret Menu"
                    aria-haspopup="true"
                    aria-expanded="false"
                    aria-describedby="mhelp-menus mhelp-open-submenu mhelp-activate mhelp-escape"
                    tabindex="-1"
                    class="blueButton focusable">
              <span>▾</span>
              <img class="logo" src="${pyretLogo}" />
            </button>
          </div>
          <ul id="bonniemenuContents" class="menuContents submenu" role="menu" aria-hidden="true"
            aria-label="Pyret Menu">
            <li role="presentation">
              <div id="docs" class="menuButton">
                <a class="focusable" role="menuitem"
                  aria-describedby="mhelp-submenu mhelp-activate mhelp-escape-submenu"
                  tabindex="-1" target="_blank" href="http://pyret.org/docs/{{{ CURRENT_PYRET_DOCS }}}">Documentation</a>
              </div>
            </li>
            <li role="presentation">
              <div id="issues" class="menuButton">
                <a class="focusable" role="menuitem"
                  aria-describedby="mhelp-submenu mhelp-activate mhelp-escape-submenu"
                  tabindex="-1" target="_blank" href="https://github.com/brownplt/pyret-lang/issues/new">Report an Issue</a>
              </div>
            </li>
            <li role="presentation">
              <div id="discuss" class="menuButton">
                <a class="focusable" role="menuitem"
                  aria-describedby="mhelp-submenu mhelp-activate mhelp-escape-submenu"
                  tabindex="-1" target="_blank" href="https://groups.google.com/forum/#!forum/pyret-discuss">Discuss Pyret</a>
              </div>
            </li>
            <li role="presentation">
              <div id="fullConnectButton" class="menuButton loginOnly">
                <a class="focusable" role="menuitem"
                  aria-describedby="mhelp-submenu mhelp-activate mhelp-escape-submenu"
                  tabindex="-1" href="javascript:void(0)">Enable Full Google Access</a>
              </div>
            </li>
            <li role="presentation">
              <div id="choose-context" class="menuButton">
                <a class="focusable" role="menuitem"
                  aria-describedby="mhelp-submenu mhelp-activate mhelp-escape-submenu"
                  tabindex="-1" href="javascript:void(0)">Choose Context</a>
              </div>
            </li>
            <li role="presentation">
              <div id="logging" class="menuButton">
                <span>
                  <input class="focusable" role="menuitem" tabindex="-1" id="detailed-logging"
                  aria-labelledby="detailed-logging-label"
                  aria-describedby="mhelp-submenu mhelp-activate mhelp-escape-submenu"
                  type="checkbox" aria-pressed="false"
                  aria-label="Contribute detailed usage information"/>
                  <label for="detailed-logging" id="detailed-logging-label">
                    Contribute detailed usage information.</label>
                  <a href="https://www.pyret.org/cpo-faq#(part._logging)" target="_blank" rel="noopener noreferrer" class="focusable info-btn" role="menuitem" tabindex="-1"
                    id="detailed-logging-learn-more"
                    title="Learn More" aria-label="Learn More">?</a>
                </span>
              </div>
            </li>
            <li role="presentation">
              <div id="logout" class="menuButton">
                <a class="focusable" aria-describedby="mhelp-submenu mhelp-activate mhelp-escape-submenu"
                  role="menuitem" tabindex="-1" href="/logout">Log out</a>
              </div>
            </li>
          </ul>
        </li>

        <li role="presentation"
          class="topTier" id="displaymenuli">
          <div id="displaymenu" class="tooltip menu menuitemtitle" style="float:none" >
            <button role="menuitem"
                    id="displaymenubutton"
                    aria-label="Display Menu"
                    aria-haspopup="true"
                    aria-expanded="false"
                    aria-describedby="mhelp-menus mhelp-open-submenu mhelp-activate mhelp-escape"
                    tabindex="-1"
                    class="blueButton focusable">
              <span>▾ View</span>
            </button>
          </div>
          <ul id="viewmenuContents" class="menuContents submenu" role="menu" aria-hidden="true"
            aria-label="View Menu">
            <li role="presentation">
              <div id="ctrl-question" class="menuButton">
                <a class="focusable" role="menuitem"
                  aria-label="keyboard shortcuts"
                  aria-describedby="mhelp-submenu mhelp-activate mhelp-escape-submenu"
                  tabindex="-1" href="javascript:void(0)"
                  >Keyboard shortcuts (Ctrl-?)</a>
              </div>
            </li>
            <li role="presentation">
              <div id="font">
                <div id="font-label"></div>
                <button type="button" id="font-minus">-</button>
                <button type="button" id="font-plus">+</button>
              </div>
            </li>
            <li id="theme" role="presentation" style="white-space: nowrap;">
              <label for="theme-select">Theme:</label>
              <select id="theme-select">
                <option value="default">Ensign (Default)</option>
                <option value="base16">Base16</option>
                <option value="material-darker">Material-darker</option>
                <option value="monokai">Monokai</option>
                <option value="panda">Panda</option>
                <option value="high-contrast-light">High Contrast Light</option>
                <option value="high-contrast-dark">High Contrast Dark</option>
              </select>
            </li>
          </ul>
        </li>

        <li role="presentation" class="topTier logoutOnly" id="connectButtonli">
          <div class="menu menuitemtitle">
            <button role="menuitem"
              aria-describedby="mhelp-menus mhelp-activate mhelp-escape"
              id="connectButton" class="logoutOnly focusable blueButton" tabindex="-1">Connect to Google Drive</button>
          </div>
          <!--
            <div id="program-name-container" class="loginOnly">
            <input id="program-name" type="text" placeholder="Program Name"></input>
            </div>
          -->
        </li>

        <li role="presentation" class="loginOnly topTier" id="filemenuli">
          <div id="filemenu" class="loginOnly menu menuitemtitle" style="float:none" >
            <button role="menuitem"
              aria-label="File"
              aria-haspopup="true"
              aria-expanded="false"
              aria-describedby="mhelp-menus mhelp-open-submenu mhelp-activate mhelp-escape"
              id="filemenuItem"
              tabindex="-1"
              class="focusable blueButton">
              <span>▾ File</span><span id="filename"></span>
            </button>
          </div>
          <!-- div id="filemenuContents" class="menuContents" style="display: none; z-index: 8990;" -->
          <ul id="filemenuContents" class="menuContents submenu" role="menu" aria-hidden="true"
            aria-label="File Menu">
            <li role="presentation">
              <div id="new" class="menuButton">
                <a class="focusable" role="menuitem" aria-label="New file"
                  aria-describedby="mhelp-submenu mhelp-activate mhelp-escape-submenu"
                  tabindex="-1" href="javascript:void(0)" >New</a></div>
            </li>
            <li role="presentation">
              <div id="programs" class="menuButton">
                <a  class="focusable" role="menuitem" aria-label="My Programs"
                  aria-describedby="mhelp-submenu mhelp-activate mhelp-escape-submenu"
                  tabindex="-1"
                  target="_blank"
                  href="/">My Programs</a>
              </div>
            </li>
            <li role="presentation">
              <div id="open-original" class="menuButton disabled hidden">
                <a class="focusable" role="menuitem" aria-label="Open original file"
                  aria-describedby="mhelp-submenu mhelp-activate mhelp-escape-submenu"
                  tabindex="-1" href="javascript:void(0)">Open Original</a></div>
            </li>
            <li role="presentation">
              <div id="save" class="menuButton disabled">
                <a class="focusable disabled" role="menuitem" aria-label="Save file"
                  aria-describedby="mhelp-submenu mhelp-activate mhelp-escape-submenu"
                  tabindex="-1" href="javascript:void(0)">Save</a></div>
            </li>
            <li role="presentation">
              <div id="saveas" class="menuButton">
                <a class="focusable" role="menuitem" aria-label="Save a Copy"
                  aria-describedby="mhelp-submenu mhelp-activate mhelp-escape-submenu"
                  tabindex="-1" href="javascript:void(0)">Save a copy</a></div>
            </li>
            <li role="presentation">
              <div id="download" class="menuButton">
                <a class="focusable" role="menuitem" aria-label="Download"
                  aria-describedby="mhelp-submenu mhelp-activate mhelp-escape-submenu"
                  tabindex="-1" href="javascript:void(0)">Download</a></div>
            </li>
            <li role="presentation">
              <div id="rename" class="menuButton disabled">
                <a class="focusable disabled" role="menuitem" aria-label="Rename file"
                  aria-describedby="mhelp-submenu mhelp-activate mhelp-escape-submenu"
                  tabindex="-1" href="javascript:void(0)">Rename</a></div>
            </li>
          </ul>
        </li>

        <li role="presentation" class="loginOnly topTier" id="insertli">
          <div id="insertPart" class="loginOnly menu menuitemtitle">
            <button role="menuitem"
              aria-describedby="mhelp-menus mhelp-activate mhelp-escape"
              aria-label="Insert, F11" id="insert" class="focusable blueButton loginOnly"  tabindex="-1">Insert</button>
          </div>
          <!-- <button id="saveButton" class="blueButton loginOnly">Save</button> -->
          <!-- <button id="openFile" class="blueButton loginOnly">Open</button> -->
        </li>

        <li role="presentation" class="topTier" id="publishli" style="display: none;">
          <div id="shareContainer" class="menu menuitemtitle"></div>
        </li>

        <li role="presentation" class="topTier flexpushright" id="runli">
          <div id="runPart" class="menuitemtitle" >
            <button role="menuitem" aria-label="Run, F7 or Control-Enter" disabled id="runButton"
              aria-describedby="mhelp-menus mhelp-activate mhelp-escape"
              class="focusable blueButton" tabindex="-1">Run</button>
          </div>
        </li>

        <li role="presentation" class="topTier" id="rundropdownli">
          <div class="menu menuitemtitle">
            <button role="menuitem"
                    id="runDropdown"
                    class="focusable dropdown rhs"
                    aria-label="Run Options"
                    aria-haspopup="true"
                    aria-expanded="false"
                    aria-describedby="mhelp-menus mhelp-open-submenu mhelp-activate mhelp-escape"
                    disabled
                    tabindex="-1">▾
            </button>
          </div>
          <ul id="run-dropdown-content" class="submenu" role="menu" aria-hidden="true"
            aria-label="Run Options">
            <li id="select-run-old" >
              <div id="select-run" >
                <a class="focusable"
                  role="menuitem"
                  aria-label="Run" aria-setsize="2" aria-posinset="1"
                  aria-describedby="mhelp-submenu mhelp-activate mhelp-escape-submenu"
                  tabindex="-1" href="javascript:void(0)">Run</a>
              </div>
            </li>
            <li id="select-tc-run-old">
              <div id="select-tc-run" >
                <a class="focusable"
                  role="menuitem"
                  aria-label="Type-check and run" aria-setsize="2" aria-posinset="2"
                  aria-describedby="mhelp-submenu mhelp-activate mhelp-escape-submenu"
                  tabindex="-1" href="javascript:void(0)">Type-check and run<sup>(beta)</sup></a>
              </div>
            </li>
          </ul>
        </li>

        <li role="presentation" class="topTier" disabled id="stopli">
          <div class="menu menuitemtitle">
            <button role="menuitem" aria-label="Stop, F8" disabled id="breakButton"
              aria-describedby="mhelp-menus mhelp-activate mhelp-escape"
              class="focusable blueButton"  tabindex="-1">Stop</button>
          </div>
        </li>
      </ul>
      </div>
    </nav>
  </div>

<div id="toolbar"></div>
<div id="loader"><p>Raising the masts...</p></div>
<div id="main">
<!-- MODAL PROMPT (Adapted from W3Schools' example) -->
<div id="promptModal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3></h3>
    </div>
    <div class="modal-body">
    </div>
    <div class="modal-footer">
      <button class="submit blueButton">Submit</button>
      <button class="close blueButton">Close</button>
    </div>
  </div>
</div>
<div id="REPL" class="replContainer" role="region" aria-label="Interactions">
<div id="handle" class="ui-resizable-handle ui-resizable-w"></div>
</div>
<div id="help-keys">
  <p><b>Press <kbd>Esc</kbd> to close this help window</b></p>
  <ul>
    <li><b><kbd>Ctrl</kbd>-<kbd>?</kbd></b> - Show this help</li>
    <li><b><kbd>Ctrl</kbd>-<kbd>s</kbd></b> - Save</li>
    <li><b><kbd>Ctrl</kbd>-<kbd>/</kbd> or <kbd>Cmd</kbd>-<kbd>/</kbd></b> - Toggle commenting</li>
    <li><b><kbd>Ctrl</kbd>-<kbd>F</kbd> or <kbd>Cmd</kbd>-<kbd>F</kbd></b> - Find</li>
    <li><b><kbd>Ctrl</kbd>-<kbd>G</kbd> or <kbd>Cmd</kbd>-<kbd>G</kbd></b> - Find next</li>
    <li><b><kbd>Shift</kbd>-<kbd>Ctrl</kbd>-<kbd>G</kbd> or <kbd>Shift</kbd>-<kbd>Cmd</kbd>-<kbd>G</kbd></b> - Find previous</li>
    <li><b><kbd>Shift</kbd>-<kbd>Ctrl</kbd>-<kbd>F</kbd> or <kbd>Cmd</kbd>-<kbd>Option</kbd>-<kbd>F</kbd></b> - Replace</li>
    <li><b><kbd>Shift</kbd>-<kbd>Ctrl</kbd>-<kbd>R</kbd> or <kbd>Shift</kbd>-<kbd>Cmd</kbd>-<kbd>Option</kbd>-<kbd>F</kbd></b> - Replace all</li>
    <li><b><kbd>Ctrl</kbd>-<kbd>M</kbd></b> - Toggle sizing of the editor window between 50% and last resize</li>
    <li><b><kbd>F6</kbd>, <kbd>Shift</kbd>-<kbd>F6</kbd></b> - Cycle focus through regions</li>
    <li><b><kbd>F7</kbd>, <kbd>Ctrl</kbd>-<kbd>Enter</kbd></b> - Run the definitions window</li>
    <li><b><kbd>F11</kbd></b> - Insert image</li>
    <li><b><kbd>Ctrl</kbd>-<kbd>Left</kbd></b> - Move cursor left by one word</li>
    <li><b><kbd>Ctrl</kbd>-<kbd>Right</kbd></b> - Move cursor right by one word</li>
    <li><b><kbd>Alt</kbd>-<kbd>Left</kbd></b> - If cursor is just before a right-parenthesis or <code>end</code>
    keyword, move cursor left to matching delimiter; otherwise move cursor left by one word</li>
    <li><b><kbd>Alt</kbd>-<kbd>Right</kbd></b> - Like <b><kbd>Alt</kbd>-<kbd>Left</kbd></b>, but moving right.</li>
    <li><b><kbd>Esc</kbd>-<kbd>Left</kbd></b> - (two key sequence) synonym
      for <b><kbd>Alt</kbd>-<kbd>Left</kbd></b>, in case <b><kbd>Alt</kbd></b> key is in use by browser</li>
    <li><b><kbd>Esc</kbd>-<kbd>Right</kbd></b> - (two key sequence) synonym for <b><kbd>Alt</kbd>-<kbd>Right</kbd></b>.</li>
  </ul>
  <p><b>Toolbar region navigation</b></p>
  <ul>
    <li><b><kbd>Esc</kbd></b> - Exit toolbar submenu (if open) or region</li>
    <li><b><kbd>Left</kbd>, <kbd>Right</kbd></b> - Traverse toolbar top-level menu</li>
    <li><b><kbd>Up</kbd>, <kbd>Down</kbd></b> - Traverse toolbar submenus</li>
  </ul>
</div>
<div id="doc-containment">
<div id="doc-overlay">
  <div id="doc-bar"><div id="doc-close">&#x2715;</div></div>
  <div id="doc-cover"></div>
  <div id="doc-left" class="doc-handle ui-resizable-handle ui-resizable-w"></div>
  <div id="doc-right" class="doc-handle ui-resizable-handle ui-resizable-e"></div>
  <div id="doc-bottom" class="doc-handle ui-resizable-handle ui-resizable-s"></div>
  <div id="doc-se-corner" class="doc-handle ui-resizable-handle ui-resizable-se"></div>
  <div id="doc-sw-corner" class="doc-handle ui-resizable-handle ui-resizable-sw"></div>
</div>
</div>
</div>
<div id="footer">
  <div id="welcome">
    <span class="username-message">Programming as <span id="username" style="display: inline; padding: 0px;">a guest</span>.</span>
  </div>
  <div id="notification" class="notificationArea"></div>
  <div id="announcements" class="screenreader-only" role="region" aria-label="Announcements" tabindex="-1">
    <h2>Announcements</h2>
    <ul id="announcementlist" aria-live="assertive"
                              aria-relevant="additions" style="list-style: none;">
    </ul>
  </div>
</div>


<script>
var LOG_URL = "";
var GIT_REV = "";
var GIT_BRANCH = "";
</script>

<script src="${es6shim}"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.10.4/jquery-ui.min.js"></script>
<script src="${editorMisc}"></script>

<script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
<script>
var apiKey = "";
var appId = "";
function handleGoogLoad() {
  handleClientLoad(apiKey);
}
</script>
<!-- Google API Loader (For picker) -->
<!-- GAPI Client -->
<script type="text/javascript" src="https://apis.google.com/js/client.js?onload=handleGoogLoad"></script>
<script>
var POSTMESSAGE_ORIGIN = "";
console.log(window.performance.now());
</script>
<script src="${events}"></script>
<script src="${beforePyret}"></script>

  </main>
</body>
</html>
        `;
	}
}