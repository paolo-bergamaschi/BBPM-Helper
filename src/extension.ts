import * as vscode from 'vscode';
import * as fs from 'fs';


function createFolderStructure(folderPath: string, yearAndMonth:string, changeRequest:string, serviceName: string, version: string, serviceType: string): void {

	const foldersToCheck = [
		`${folderPath}/appunti`,
		`${folderPath}/DocumentoArchitetturale`,
		`${folderPath}/DocumentoArchitetturale/Precedenti`,
		`${folderPath}/MaterialeBancaComune`,
		`${folderPath}/${yearAndMonth}_${changeRequest}`,
		`${folderPath}/${yearAndMonth}_${changeRequest}/Stime`,
		`${folderPath}/${yearAndMonth}_${changeRequest}/${serviceName}`,
		`${folderPath}/${yearAndMonth}_${changeRequest}/${serviceName}/v${version}`,
		`${folderPath}/${yearAndMonth}_${changeRequest}/${serviceName}/v${version}/AnalisiFunzionale`,
		`${folderPath}/${yearAndMonth}_${changeRequest}/${serviceName}/v${version}/AnalisiFunzionale/Precedenti`,
		`${folderPath}/${yearAndMonth}_${changeRequest}/${serviceName}/v${version}/DatiPerTest`,
		`${folderPath}/${yearAndMonth}_${changeRequest}/${serviceName}/v${version}/MaterialeBanca`,
		`${folderPath}/${yearAndMonth}_${changeRequest}/${serviceName}/v${version}/RichiestaDiEsposizione`,
		`${folderPath}/${yearAndMonth}_${changeRequest}/${serviceName}/v${version}/RichiestaDiEsposizione/Precedenti`,
		`${folderPath}/${yearAndMonth}_${changeRequest}/${serviceName}/v${version}/${serviceType}`,
	];

	try {
		foldersToCheck.forEach(async folder => {
			if (!await checkIfFolderExists(folder)) {
				fs.mkdirSync(folder);
			}

		});
	} catch (err) {
		console.error(err);
		vscode.window.showErrorMessage('Errore durante la creazione della sottostruttura di cartelle');
	}
}

async function checkIfFolderExists(folderPath: string): Promise<boolean> {
	try {
		const stat = await vscode.workspace.fs.stat(vscode.Uri.file(folderPath));
		return stat.type === vscode.FileType.Directory;
	} catch (error) {
		return false;
	}
}
async function promptUserForInput(regex: RegExp, text: string, defaultValue?: string): Promise<string | undefined> {
	let input: string | undefined;
	let resultOK: boolean;

	do {
		input = await vscode.window.showInputBox({ prompt: text });

		if (input === undefined) {
			return input;
		}

		if (!input && defaultValue) {
			input = defaultValue;
		}

		resultOK = regex.test(input);
		if (!resultOK) { vscode.window.showErrorMessage('Errore Con il testo immesso'); }

	} while (!resultOK);

	return input;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const disposable = vscode.commands.registerCommand('bbpm-helper.scaffolding', async (folder) => {

		if (!folder) {
			return vscode.window.showInformationMessage('Seleziona una cartella prima di usare questo comando');
		}

		const date = new Date();
		const defaultYear = date.getFullYear().toString();
		const defaultMonth = (date.getMonth() +1).toString().padStart(2, '0');

		const yearAndMonth = await promptUserForInput(/^[0-9]{4}_[0-9]{2}$/, "Anno e Mese di riferimento in formato YYYY_MM: (default, anno e mese correnti)", `${defaultYear}_${defaultMonth}`);
		if (!yearAndMonth) { return; }
		
		const changeRequest = await promptUserForInput(/^[0-9A-Za-z_]+$/, "Nome CR (default: PrimaEsposizione", "PrimaEsposizione");
		if (!changeRequest) { return; }

		let serviceName = await promptUserForInput(/^[A-Z0-9]{5}_[A-Z][A-Za-z0-9]+$/, "Nome del servizio: in formato XXXXX_NomeServizio(API|Service)");
		if (!serviceName) { return; }

		if(!/^[A-Z0-9]{5}_[A-Z][A-Za-z0-9]+(API|Service)$/.test(serviceName))
		{
			const serviceSubfixes = ['Service', 'API'];
			await vscode.window.showQuickPick(serviceSubfixes, { placeHolder: 'Tipo del Servizio:' }).then(serviceSufix => {
				if( serviceSufix ){
				serviceName += serviceSufix;
				}
			});
		
		};
		
		const completeServiceName = serviceName;

		const serviceVersion = await promptUserForInput(/^[0-9]+\.[0-9]+$/, "Versione del servizio: in formato X.Y", "1.0");
		if (!serviceVersion) { return; }


		const serviceTypes = ['Swagger', 'Wsdl'];
		await vscode.window.showQuickPick(serviceTypes, { placeHolder: 'Tipo del Servizio:' }).then(serviceType => {
			if (serviceType) {
				createFolderStructure(folder.fsPath, yearAndMonth, changeRequest, completeServiceName, serviceVersion, serviceType);
			}
		});
		// Crea la sottostruttura di cartelle rispetto alla cartella selezionata
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }