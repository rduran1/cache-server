const { spawn } = require('child_process');
const toolboxService = require('./toolboxService');

const mssqlService = {};

const runSQLStmt = (config) => new Promise((resolve, reject) => {
	const { timeout, sql } = config;
	const args = ['robocopy.exe'];
	const sqlCmd = spawn('robocopy.exe', [`/R:${retries}`, `/W:${wait}`, '/MIR', `/MT:${threads}`]);
	sqlCmd.on('close', (code) => {
		if (code !== 0) reject(new Error(`Powershell Invoke-SqlCmd exited with code ${code}`));
	});
	sqlCmd.stderr.on('data', (data) => {
		if (data.includes("The term 'Invoke-SqlCmd' is not recognized")) {
			reject(new Error("Powershell cannot find 'Invoke-SqlCmd'"));
		}
	});
	sqlCmd.on('error', (e) => reject(new Error((`Failed to start Powershell: ${e.message}`))));
});

mssqlService.restoreDatabaseFromDisk = async (config) => {
	toolboxService.validate(config, 'mssqlServiceDbNameAndBackupFile');
	const { databaseName, backupFileLocation, timeout = 0 } = config;
	let sql = `ALTER DATABASE ${databaseName} SET SINGLE_USER WITH ROLLBACK IMMEDIATE`;
	sql += `\n RESTORE DATABASE ${databaseName} FROM DISK = '${backupFileLocation}'`;
	sql += `\n ALTER DATABASE ${databaseName} SET MULTI_USER`;
	sql += '\n GO';
	await runSQLStmt({ timeout, sql });
};

mssqlService.backupDatabaseToDisk = async (config) => {
	toolboxService.validate(config, 'mssqlServiceDbNameAndBackupFile');
	const { databaseName, backupFileLocation, timeout = 0 } = config;
	const sql = `BACKUP DATABASE ${databaseName} TO DISK = '${backupFileLocation}'`;
	await runSQLStmt({ timeout, sql });
};

mssqlService.backupDatabaseToDiskWithCompression = async (config) => {
	toolboxService.validate(config, 'mssqlServiceDbNameAndBackupFile');
	const { databaseName, backupFileLocation, timeout = 0 } = config;
	const sql = `BACKUP DATABASE ${databaseName} TO DISK = '${backupFileLocation}' WITH COMPRESSION`;
	await runSQLStmt({ timeout, sql });
};

module.exports = mssqlService;
