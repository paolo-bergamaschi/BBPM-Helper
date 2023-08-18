import { createFolderStructure, checkIfFolderExists } from '../../extension';
import * as chai from 'chai';
import * as fs from 'fs';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');
  
	test('should create a folder structure with the correct name', () => {
        const folderName = 'my-folder-structure';
        createFolderStructure(folderName);
    
        chai.expect(fs.existsSync(folderName)).to.be.true;
        // Delete the folder after the test.
        fs.rmdirSync(folderName);
	});

  test('should confirm that folder does not exists', async () => {
        const folderName = 'my-non-existant folder';

        const exists = await checkIfFolderExists(folderName);
    
        chai.expect(exists).to.be.false;
	});
});
