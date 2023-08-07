import * as vscode from 'vscode';
import * as fs from 'fs';




async function createFolderStructure(folderPath: string, callback?: () => void): Promise<boolean> {


	try {
		if (!await checkIfFolderExists(folderPath)) {
			fs.mkdirSync(folderPath);
		}
	} catch (err) {
		console.error(err);
		vscode.window.showErrorMessage('createFolderStructure::Errore durante la creazione della sottostruttura di cartelle');
	}
	if (callback) { callback(); }
	return true;
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

	const disposable = vscode.commands.registerCommand('bbpm-helper.scaffoldingCR', async (folder) => {

		if (!folder) {
			return vscode.window.showInformationMessage('Seleziona una cartella prima di usare questo comando');
		}

		const regex4Groups = /^(.+\\(?:(?<year_and_month>20[0-9]{2}_[01][0-9])_(?<change_request>[^\\]+))?)$/;
		let match: RegExpExecArray | null;

		let yearAndMonth: string | undefined;
		let changeRequest: string | undefined;
		let path: string;

		path = folder.fsPath;

		match = regex4Groups.exec(path);
		if (match !== null) {
			console.log(`Match found year_and_month: ${match.groups!.year_and_month}`);
			console.log(`Match found change_request: ${match.groups!.change_request}`);
			yearAndMonth = match.groups!.year_and_month;
			changeRequest = match.groups!.change_request;
		}

		const date = new Date();
		const defaultYear = date.getFullYear().toString();
		const defaultMonth = (date.getMonth() + 1).toString().padStart(2, '0');

		if (!yearAndMonth) {
			yearAndMonth = await promptUserForInput(/^[0-9]{4}_[0-9]{2}$/, "Anno e Mese di riferimento in formato YYYY_MM: (default, anno e mese correnti)", `${defaultYear}_${defaultMonth}`);
		}
		if (!yearAndMonth) { return; }

		if (!changeRequest) {
			changeRequest = await promptUserForInput(/^[0-9A-Za-z_]+$/, "Nome CR (default: PrimaEsposizione", "PrimaEsposizione");
		} else {
			path = path.replace(`\\${yearAndMonth}_${changeRequest}`, ``);
		}
		if (!changeRequest) { return; }


		const foldersToCheck = [
			`${path}\\DocumentoArchitetturale`,
			`${path}\\DocumentoArchitetturale/Precedenti`,
			`${path}\\${yearAndMonth}_${changeRequest}`,
			`${path}\\${yearAndMonth}_${changeRequest}\\Stime`,
		];


		try {
			foldersToCheck.forEach(async folder => {
				await createFolderStructure(folder);
			});
		} catch (err) {
			console.error(err);
			vscode.window.showErrorMessage('activate::Errore durante la creazione della sottostruttura di cartelle');
			return false;
		}

		try {
			await createFolderStructure(`${path}\\${yearAndMonth}_${changeRequest}`, () => {
				const readmePath = `${path}\\${yearAndMonth}_${changeRequest}\\readme.md`;
				
				if (fs.existsSync (readmePath)) {
					return;
				}

				const { readmeTemplate } = require("./resources/file_definitions");
				const fileContent = readmeTemplate(changeRequest);

				fs.writeFileSync(readmePath, fileContent);
			});
		} catch (err) {
			console.error(err);
			vscode.window.showErrorMessage('activate::Errore durante la creazione dei file');
			return false;
		}


	});

	const disposable2 = vscode.commands.registerCommand('bbpm-helper.scaffoldingServizio', async (folder) => {

		if (!folder) {
			return vscode.window.showInformationMessage('Seleziona una cartella prima di usare questo comando');
		}

		const regex4Groups = /^(.+\\(?:\\(?<service_name>[A-Z0-9]{5}_[A-Za-z0-9]+))?(?:\\v(?<service_version>[0-9]+\.[0-9]+))?)$/;
		let match: RegExpExecArray | null;

		let serviceName: string | undefined;
		let serviceVersion: string | undefined;
		let path: string;

		path = folder.fsPath;

		match = regex4Groups.exec(path);
		if (match !== null) {
			console.log(`Match found service_name: ${match.groups!.service_name}`);
			console.log(`Match found service_version: ${match.groups!.service_version}`);
			serviceName = match.groups!.service_name;
			serviceVersion = match.groups!.service_version;
		}

		if (!serviceName) {
			serviceName = await promptUserForInput(/^([A-Z0-9]{5}|EXT[A-Z0-9]{1,})_[A-Z][A-Za-z0-9]+$/, "Nome del servizio: in formato XXXXX_NomeServizio(API|Service)");
		} else {
			path = path.replace(`\\${serviceName}`, ``);
		}

		if (!serviceName) { return; }

		if (!/^([A-Z0-9]{5}|EXT[A-Z0-9]{1,})_[A-Z][A-Za-z0-9]+(API|Service)$/.test(serviceName)) {
			const serviceSubfixes = ['Service', 'API'];
			await vscode.window.showQuickPick(serviceSubfixes, { placeHolder: 'Tipo del Servizio:' }).then(serviceSufix => {
				if (serviceSufix) {
					serviceName += serviceSufix;
				}
			});

		};

		const completeServiceName = serviceName;

		if (!serviceVersion) {
			serviceVersion = await promptUserForInput(/^[0-9]+\.[0-9]+$/, "Versione del servizio: in formato X.Y", "1\\.0");
		} else {
			path = path.replace(`\\v${serviceVersion}`, ``);
		}

		if (!serviceVersion) { return; }


		const serviceTypes = ['Swagger', 'Wsdl'];
		let serviceType: string | undefined;

		await vscode.window.showQuickPick(serviceTypes, { placeHolder: 'Tipo del Servizio:' }).then(type => {
			serviceType = type;
		});

		const foldersToCheck = [
			`${path}\\DocumentoArchitetturale`,
			`${path}\\DocumentoArchitetturale/Precedenti`,
			`${path}\\${serviceName}`,
			`${path}\\${serviceName}\\v${serviceVersion}`,
			`${path}\\${serviceName}\\v${serviceVersion}\\AnalisiFunzionale`,
			`${path}\\${serviceName}\\v${serviceVersion}\\AnalisiFunzionale\\Precedenti`,
			`${path}\\${serviceName}\\v${serviceVersion}\\DatiPerTest`,
			`${path}\\${serviceName}\\v${serviceVersion}\\MaterialeBanca`,
			`${path}\\${serviceName}\\v${serviceVersion}\\RichiestaDiEsposizione`,
			`${path}\\${serviceName}\\v${serviceVersion}\\RichiestaDiEsposizione\\Precedenti`,
			`${path}\\${serviceName}\\v${serviceVersion}\\${serviceType}`,
		];


		try {
			foldersToCheck.forEach(async folder => {
				await createFolderStructure(folder);
			});
		} catch (err) {
			console.error(err);
			vscode.window.showErrorMessage('activate::Errore durante la creazione della sottostruttura di cartelle');
			return false;
		}


		try {
			await createFolderStructure(`${path}\\${serviceName}\\v${serviceVersion}\\${serviceType}`, () => {
				let pomContent: string;

				if (serviceType === "Swagger") {
					const { swaggerPomTemplate } = require("./resources/file_definitions");
					pomContent = swaggerPomTemplate(completeServiceName, serviceVersion);
				}else {
					const { wsdlPomTemplate } = require("./resources/file_definitions");
					pomContent = wsdlPomTemplate(completeServiceName, serviceVersion);
				}

				const pomPath = `${path}\\${serviceName}\\v${serviceVersion}\\${serviceType}\\pom.xml`;


				fs.writeFileSync(pomPath, pomContent);

			});
		} catch (err) {
			console.error(err);
			vscode.window.showErrorMessage('Errore durante la creazione della sottostruttura di cartelle');
			return false;
		}


	});


	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);
}

// This method is called when your extension is deactivated
export function deactivate() { }