// External Dependencies
const fs     = require('fs');
const github = require('@actions/github');
const core   = require('@actions/core');

const context = github.context;
const repo    = context.payload.repository;
const owner   = repo.owner;

const DIRS          = new Set();

const gh   = github.getOctokit(core.getInput('token'));

const forbiddenDirs = JSON.parse(core.getInput('forbidden'));
const args = { owner: owner.name || owner.login, repo: repo.name };

function debug(msg, obj = null) {
	core.debug(formatLogMessage(msg, obj));
}

function fetchCommitData(commit) {
	args.ref = commit.id || commit.sha;

	debug('Calling gh.repos.getCommit() with args', args)

	return gh.repos.getCommit(args);
}

function formatLogMessage(msg, obj = null) {
	return obj ? `${msg}: ${toJSON(obj)}` : msg;
}

async function getCommits() {
	let commits;

	debug('Getting commits...');

	switch(context.eventName) {
		case 'push':
			commits = context.payload.commits;
		break;

		case 'pull_request':
			const url = context.payload.pull_request.commits_url;

			commits = await gh.paginate(`GET ${url}`, args);
		break;

		default:
			info('You are using this action on an event for which it has not been tested. Only the "push" and "pull_request" events are officially supported.');

			commits = [];
		break;
	}

	return commits;
}

function info(msg, obj = null) {
	core.info(formatLogMessage(msg, obj));
}

async function outputResults() {
	debug('DIRS', Array.from(DIRS.values()));

	core.setOutput('all', toJSON(Array.from(DIRS.values()), 0));

	fs.writeFileSync(`${process.env.HOME}/dirs.json`, toJSON(Array.from(DIRS.values())), 'utf-8');
}

async function processCommitData(result) {
	let item;
	debug('Processing API Response', result);

	if (! result || ! result.data) {
		return;
	}

	result.data.files.forEach(file => {
		item = file.filename.match(/(.*)[\/\\]/)[1]||'';
		if (forbiddenDirs !== undefined && Array.isArray(forbiddenDirs)) {
			forbiddenDirs.forEach(forbiddenDir => {
				if (!forbiddenDir.startsWith(item)) {
					DIRS.add(item);
				}
			})
		} else {
			DIRS.add(item);
		}

	});
}

function toJSON(value, pretty=true) {
	return pretty
		? JSON.stringify(value, null, 4)
		: JSON.stringify(value);
}


debug('context', context);
debug('args', args);

getCommits().then(commits => {
	// Exclude merge commits
	commits = commits.filter(c => ! c.parents || 1 === c.parents.length);

	if ('push' === context.eventName) {
		commits = commits.filter(c => c.distinct);
	}

	debug('All Commits', commits);

	Promise.all(commits.map(fetchCommitData))
		.then(data => Promise.all(data.map(processCommitData)))
		.then(outputResults)
		.then(() => process.exitCode = 0)
		.catch(err => core.error(err) && (process.exitCode = 1));
});

