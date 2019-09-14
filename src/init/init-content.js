"use strict";

var _ = require('lodash/fp');

var injectContentBetween = require('../util').markdown.injectContentBetween;

var badgeContent = '[![All Contributors](https://img.shields.io/badge/all_contributors-0-orange.svg?style=flat-square)](#contributors-)';
var headerContent = '###### This project follows the [all-contributors](https://allcontributors.org/docs/en/emoji-key) specification.';
var listContent = ['<!-- ALL-CONTRIBUTORS-LIST:START -->', '<!-- ALL-CONTRIBUTORS-LIST:END -->\n\n'].join('\n');

function addBadge(lines) {
  return injectContentBetween(lines, badgeContent, 1, 1);
}

function splitAndRejoin(fn) {
  return _.flow(_.split('\n'), fn, _.join('\n'));
}

var findContributorsSection = _.findIndex(function (str) {
  return str.toLowerCase().indexOf('# contributors') === 1;
});

function addContributorsList(lines) {
  var insertionLine = findContributorsSection(lines);

  if (insertionLine === -1) {
    return lines.concat(['\n## Contributors', '', headerContent, '', listContent]);
  }

  return injectContentBetween(lines, listContent, insertionLine + 3, insertionLine + 3);
}

module.exports = {
  addBadge: splitAndRejoin(addBadge),
  addContributorsList: splitAndRejoin(addContributorsList)
};