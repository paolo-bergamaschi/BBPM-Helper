import * as vscode from 'vscode';
import * as fs from 'fs';
import * as fsp from 'fs/promises'; // Importa fs.promises per le versioni asincrone
import * as path from 'path';



export async function createFolderStructure(folderPath: string): Promise<boolean> {


	try {
		if (!await checkIfFolderExists(folderPath)) {
			vscode.workspace.fs.createDirectory(vscode.Uri.file(folderPath));
		}
	} catch (err) {
		console.error(err);
		vscode.window.showErrorMessage('createFolderStructure::Errore durante la creazione della sottostruttura di cartelle');
		return false;
	}

	return true;
}

export async function checkIfFolderExists(folderPath: string): Promise<boolean> {
	try {
		const stat = await vscode.workspace.fs.stat(vscode.Uri.file(folderPath));
		return stat.type === vscode.FileType.Directory;
	} catch (error) {
		return false;
	}
}

async function waitForFolderToExist(folderPath: string, maxAttempts: number = 10, delayMs: number = 100): Promise<void> {
    let attempts = 0;
    while (attempts < maxAttempts) {
        if (await checkIfFolderExists(folderPath)) {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
        attempts++;
    }
    throw new Error(`La cartella ${folderPath} non esiste dopo ${maxAttempts} tentativi.`);
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
		let finalpath: string;

		finalpath = folder.fsPath;

		match = regex4Groups.exec(finalpath);
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
			finalpath = finalpath.replace(`\\${yearAndMonth}_${changeRequest}`, ``);
		}
		if (!changeRequest) { return; }


		const foldersToCheck = [
			`${finalpath}\\DocumentoArchitetturale`,
			`${finalpath}\\DocumentoArchitetturale/Precedenti`,
			`${finalpath}\\${yearAndMonth}_${changeRequest}`,
			`${finalpath}\\${yearAndMonth}_${changeRequest}\\Stime`,
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
			const folderPath = path.join(finalpath, `${yearAndMonth}_${changeRequest}`);
			
			// Crea la cartella in modo asincrono se non esiste
			
			await createFolderStructure(folderPath);	
		   	// Aspetta che la cartella esista prima di procedere
   			await waitForFolderToExist(folderPath);

			const readmePath = path.join(folderPath, 'readme.md');
		
			try {
				// Usa fs.promises.access per controllare l'esistenza del file in modo asincrono
				await fs.promises.access(readmePath);
		
				// Il file esiste, non fare nulla
				return;
			} catch (err) {
				// fs.promises.access genera un'eccezione se il file non esiste, che è il comportamento desiderato
			}
		
			// Importa il modulo in modo asincrono
			const { readmeTemplate } = await import("./resources/file_definitions");
			const fileContent = readmeTemplate(changeRequest);
		
			// Usa fs.promises.writeFile per scrivere il file in modo asincrono
			await fs.promises.writeFile(readmePath, fileContent, { flag: 'w' });

			let folderPathStima = path.join(folderPath, "Stime");

			await waitForFolderToExist(folderPathStima);

			const placeholderPathStima = path.join( folderPathStima,`placeholder.md`);
			// Importa il modulo in modo asincrono
			const { placeHolderTemplate } = await import("./resources/file_definitions");
			const placeHolderTemplatefileContent = placeHolderTemplate();
		
			// Usa fs.promises.writeFile per scrivere il file in modo asincrono
			await fs.promises.writeFile(placeholderPathStima, placeHolderTemplatefileContent, { flag: 'w' });
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

		//const regex4Groups = /\\(?<service_name>([A-Z0-9]{5}|EXT[A-Z0-9]{1,})_[A-Z][A-Za-z0-9]+)(?:\\v(?<service_version>[0-9]+\.[0-9]+))?)$/;
		const regex4Groups = /(?<service_name>(?:[A-Z0-9]{5}|EXT[A-Z0-9]{1,})_[A-Z][A-Za-z0-9]+)(?:\\v(?<service_version>[0-9]+\.[0-9]+))?$/;
		let match: RegExpExecArray | null;

		let serviceName: string | undefined;
		let serviceVersion: string | undefined;
		let finalpath: string;

		finalpath = folder.fsPath;

		match = regex4Groups.exec(finalpath);
		if (match !== null) {
			console.log(`Match found service_name: ${match.groups!.service_name}`);
			console.log(`Match found service_version: ${match.groups!.service_version}`);
			serviceName = match.groups!.service_name;
			serviceVersion = match.groups!.service_version;
		}

		if (!serviceName) {
			serviceName = await promptUserForInput(/^([A-Z0-9]{5}|EXT[A-Z0-9]{1,})_[A-Z][A-Za-z0-9]+$/, "Nome del servizio: in formato XXXXX_NomeServizio(API|Service)");
		} else {
			finalpath = finalpath.replace(`\\${serviceName}`, ``);
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
			finalpath = finalpath.replace(`\\v${serviceVersion}`, ``);
		}

		if (!serviceVersion) { return; }


		const serviceTypes = ['Swagger', 'Wsdl'];
		let serviceType: string | undefined;

		await vscode.window.showQuickPick(serviceTypes, { placeHolder: 'Tipo del Servizio:' }).then(type => {
			serviceType = type;
		});

		const foldersToCheck = [
			`${finalpath}\\DocumentoArchitetturale`,
			`${finalpath}\\DocumentoArchitetturale/Precedenti`,
			`${finalpath}\\${serviceName}`,
			`${finalpath}\\${serviceName}\\v${serviceVersion}`,
			`${finalpath}\\${serviceName}\\v${serviceVersion}\\AnalisiFunzionale`,
			`${finalpath}\\${serviceName}\\v${serviceVersion}\\AnalisiFunzionale\\Precedenti`,
			`${finalpath}\\${serviceName}\\v${serviceVersion}\\DatiPerTest`,
			`${finalpath}\\${serviceName}\\v${serviceVersion}\\MaterialeBanca`,
			`${finalpath}\\${serviceName}\\v${serviceVersion}\\RichiestaDiEsposizione`,
			`${finalpath}\\${serviceName}\\v${serviceVersion}\\RichiestaDiEsposizione\\Precedenti`,
			`${finalpath}\\${serviceName}\\v${serviceVersion}\\${serviceType}`,
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
			let pppath = `${finalpath}\\${serviceName}\\v${serviceVersion}\\${serviceType}`;
			await createFolderStructure(pppath);

			await waitForFolderToExist(pppath);

			
			let pomContent: string;

			if (serviceType === "Swagger") {
				const { swaggerPomTemplate } = require("./resources/file_definitions");
				pomContent = swaggerPomTemplate(completeServiceName, serviceVersion);
			}else {
				const { wsdlPomTemplate } = require("./resources/file_definitions");
				pomContent = wsdlPomTemplate(completeServiceName, serviceVersion);
			}

			const pomPath = path.join(pppath, 'pom.xml');


			await fs.promises.writeFile(pomPath, pomContent, { flag: 'w' });


			const placeholderPathAnalisi = `${finalpath}\\${serviceName}\\v${serviceVersion}\\AnalisiFunzionale\\placeholder.md`;
			// Importa il modulo in modo asincrono
			const { placeHolderTemplate } = await import("./resources/file_definitions");
			const placeHolderTemplatefileContent = placeHolderTemplate();
			
			// Usa fs.promises.writeFile per scrivere il file in modo asincrono
			await fs.promises.writeFile(placeholderPathAnalisi, placeHolderTemplatefileContent, { flag: 'w' });
			
			const placeholderPathRdE = `${finalpath}\\${serviceName}\\v${serviceVersion}\\RichiestaDiEsposizione\\placeholder.md`;
			// Usa fs.promises.writeFile per scrivere il file in modo asincrono
			await fs.promises.writeFile(placeholderPathRdE, placeHolderTemplatefileContent, { flag: 'w' });

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