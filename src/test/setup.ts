import * as path from 'path';

const repositoryRoot = process.env.SINGULAR_BLOCKLY_TEST_ROOT;
if (!repositoryRoot || !path.isAbsolute(repositoryRoot)) {
	throw new Error('SINGULAR_BLOCKLY_TEST_ROOT must be an absolute path');
}

process.chdir(repositoryRoot);
