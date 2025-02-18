"use strict";

var githubAPI = require('./github');

var gitlabAPI = require('./gitlab');

var privateToken = process.env && process.env.PRIVATE_TOKEN || '';
var SUPPORTED_REPO_TYPES = {
  github: {
    value: 'github',
    name: 'GitHub',
    checkKey: 'login',
    defaultHost: 'https://github.com',
    linkToCommits: '<%= options.repoHost || "https://github.com" %>/<%= options.projectOwner %>/<%= options.projectName %>/commits?author=<%= contributor.login %>',
    linkToIssues: '<%= options.repoHost || "https://github.com" %>/<%= options.projectOwner %>/<%= options.projectName %>/issues?q=author%3A<%= contributor.login %>',
    getUserInfo: githubAPI.getUserInfo,
    getContributors: githubAPI.getContributors
  },
  gitlab: {
    value: 'gitlab',
    name: 'GitLab',
    checkKey: 'name',
    defaultHost: 'https://gitlab.com',
    linkToCommits: '<%= options.repoHost || "https://gitlab.com" %>/<%= options.projectOwner %>/<%= options.projectName %>/commits/master',
    linkToIssues: '<%= options.repoHost || "https://gitlab.com" %>/<%= options.projectOwner %>/<%= options.projectName %>/issues?author_username=<%= contributor.login %>',
    getUserInfo: gitlabAPI.getUserInfo,
    getContributors: gitlabAPI.getContributors
  }
};

var getChoices = function () {
  return Object.keys(SUPPORTED_REPO_TYPES).map(function (key) {
    return SUPPORTED_REPO_TYPES[key];
  }).map(function (item) {
    return {
      value: item.value,
      name: item.name
    };
  });
};

var getHostname = function (repoType, repoHost) {
  if (repoHost) {
    return repoHost;
  } else if (repoType in SUPPORTED_REPO_TYPES) {
    return SUPPORTED_REPO_TYPES[repoType].defaultHost;
  }

  return null;
};

var getCheckKey = function (repoType) {
  if (repoType in SUPPORTED_REPO_TYPES) {
    return SUPPORTED_REPO_TYPES[repoType].checkKey;
  }

  return null;
};

var getTypeName = function (repoType) {
  if (repoType in SUPPORTED_REPO_TYPES) {
    return SUPPORTED_REPO_TYPES[repoType].name;
  }

  return null;
};

var getLinkToCommits = function (repoType) {
  if (repoType in SUPPORTED_REPO_TYPES) {
    return SUPPORTED_REPO_TYPES[repoType].linkToCommits;
  }

  return null;
};

var getLinkToIssues = function (repoType) {
  if (repoType in SUPPORTED_REPO_TYPES) {
    return SUPPORTED_REPO_TYPES[repoType].linkToIssues;
  }

  return null;
};

var getUserInfo = function (username, repoType, repoHost) {
  if (repoType in SUPPORTED_REPO_TYPES) {
    return SUPPORTED_REPO_TYPES[repoType].getUserInfo(username, getHostname(repoType, repoHost), privateToken);
  }

  return null;
};

var getContributors = function (owner, name, repoType, repoHost) {
  if (repoType in SUPPORTED_REPO_TYPES) {
    return SUPPORTED_REPO_TYPES[repoType].getContributors(owner, name, getHostname(repoType, repoHost), privateToken);
  }

  return null;
};

module.exports = {
  getChoices,
  getHostname,
  getCheckKey,
  getTypeName,
  getLinkToCommits,
  getLinkToIssues,
  getUserInfo,
  getContributors
};