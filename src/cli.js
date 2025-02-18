#!/usr/bin/env node

/* eslint-disable no-console */
"use strict";

var path = require('path');

var yargs = require('yargs');

var chalk = require('chalk');

var inquirer = require('inquirer');

var didYouMean = require('didyoumean'); // Setting edit length to be 60% of the input string's length


didYouMean.threshold = 0.6;

var init = require('./init');

var generate = require('./generate');

var util = require('./util');

var repo = require('./repo');

var updateContributors = require('./contributors');

var cwd = process.cwd();
var defaultRCFile = path.join(cwd, '.all-contributorsrc');
var yargv = yargs.help('help').alias('h', 'help').alias('v', 'version').version().command('generate', 'Generate the list of contributors').usage('Usage: $0 generate').command('add', 'add a new contributor').usage('Usage: $0 add <username> <contribution>').command('init', 'Prepare the project to be used with this tool').usage('Usage: $0 init').command('check', 'Compares contributors from the repository with the ones credited in .all-contributorsrc').usage('Usage: $0 check').boolean('commit').default('files', ['README.md']).default('contributorsPerLine', 5).default('contributors', []).default('config', defaultRCFile).config('config', function (configPath) {
  try {
    return util.configFile.readConfig(configPath);
  } catch (error) {
    if (error instanceof SyntaxError || configPath !== defaultRCFile) {
      onError(error);
    }
  }
}).argv;

function suggestCommands(cmd) {
  var suggestion = didYouMean(cmd, ['generate', 'add', 'init', 'check']);

  if (suggestion) {
    console.log(chalk.bold(`Did you mean ${suggestion}`));
  }
}

function startGeneration(argv) {
  return Promise.all(argv.files.map(function (file) {
    var filePath = path.join(cwd, file);
    return util.markdown.read(filePath).then(function (fileContent) {
      var newFileContent = generate(argv, argv.contributors, fileContent);
      return util.markdown.write(filePath, newFileContent);
    });
  }));
}

function addContribution(argv) {
  var username = argv._[1];
  var contributions = argv._[2]; // Add or update contributor in the config file

  return updateContributors(argv, username, contributions).then(function (data) {
    argv.contributors = data.contributors;
    return startGeneration(argv).then(function () {
      if (argv.commit) {
        return util.git.commit(argv, data);
      }
    });
  });
}

function checkContributors(argv) {
  var configData = util.configFile.readConfig(argv.config);
  return repo.getContributors(configData.projectOwner, configData.projectName, configData.repoType, configData.repoHost).then(function (repoContributors) {
    var checkKey = repo.getCheckKey(configData.repoType);
    var knownContributions = configData.contributors.reduce(function (obj, item) {
      obj[item[checkKey]] = item.contributions;
      return obj;
    }, {});
    var knownContributors = configData.contributors.map(function (contributor) {
      return contributor[checkKey];
    });
    var missingInConfig = repoContributors.filter(function (key) {
      return !knownContributors.includes(key);
    });
    var missingFromRepo = knownContributors.filter(function (key) {
      return !repoContributors.includes(key) && (knownContributions[key].includes('code') || knownContributions[key].includes('test'));
    });

    if (missingInConfig.length) {
      process.stdout.write(chalk.bold('Missing contributors in .all-contributorsrc:\n'));
      process.stdout.write(`    ${missingInConfig.join(', ')}\n`);
    }

    if (missingFromRepo.length) {
      process.stdout.write(chalk.bold('Unknown contributors found in .all-contributorsrc:\n'));
      process.stdout.write(`${missingFromRepo.join(', ')}\n`);
    }
  });
}

function onError(error) {
  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  process.exit(0);
}

function promptForCommand(argv) {
  var questions = [{
    type: 'list',
    name: 'command',
    message: 'What do you want to do?',
    choices: [{
      name: 'Add new contributor or edit contribution type',
      value: 'add'
    }, {
      name: 'Re-generate the contributors list',
      value: 'generate'
    }, {
      name: 'Compare contributors from the repository with the credited ones',
      value: 'check'
    }],
    when: !argv._[0],
    default: 0
  }];
  return inquirer.prompt(questions).then(function (answers) {
    return answers.command || argv._[0];
  });
}

promptForCommand(yargv).then(function (command) {
  switch (command) {
    case 'init':
      return init();

    case 'generate':
      return startGeneration(yargv);

    case 'add':
      return addContribution(yargv);

    case 'check':
      return checkContributors(yargv);

    default:
      suggestCommands(command);
      throw new Error(`Unknown command ${command}`);
  }
}).catch(onError);