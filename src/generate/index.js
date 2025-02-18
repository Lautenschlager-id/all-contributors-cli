"use strict";

var _ = require('lodash/fp');

var formatBadge = require('./format-badge');

var formatContributor = require('./format-contributor');

var badgeRegex = /\[!\[All Contributors\]\([a-zA-Z0-9\-./_:?=]+\)\]\(#[\w-]+\)/;

function injectListBetweenTags(newContent) {
  return function (previousContent) {
    var tagToLookFor = '<!-- ALL-CONTRIBUTORS-LIST:';
    var closingTag = '-->';
    var startOfOpeningTagIndex = previousContent.indexOf(`${tagToLookFor}START`);
    var endOfOpeningTagIndex = previousContent.indexOf(closingTag, startOfOpeningTagIndex);
    var startOfClosingTagIndex = previousContent.indexOf(`${tagToLookFor}END`, endOfOpeningTagIndex);

    if (startOfOpeningTagIndex === -1 || endOfOpeningTagIndex === -1 || startOfClosingTagIndex === -1) {
      return previousContent;
    }

    return [previousContent.slice(0, endOfOpeningTagIndex + closingTag.length), newContent, '\n', previousContent.slice(startOfClosingTagIndex)].join('');
  };
}

function formatLine(contributors) {
  return `<td align="center">${contributors.join('</td>\n    <td align="center">')}</td>`;
}

function generateContributorsList(options, contributors) {
  return _.flow(_.map(function (contributor) {
    return formatContributor(options, contributor);
  }), _.chunk(options.contributorsPerLine), _.map(formatLine), _.join('\n  </tr>\n  <tr>\n    '), function (newContent) {
    return `\n<table>\n  <tr>\n    ${newContent}\n  </tr>\n</table>`;
  })(contributors);
}

function replaceBadge(newContent) {
  return function (previousContent) {
    var regexResult = badgeRegex.exec(previousContent);

    if (!regexResult) {
      return previousContent;
    }

    return previousContent.slice(0, regexResult.index) + newContent + previousContent.slice(regexResult.index + regexResult[0].length);
  };
}

module.exports = function (options, contributors, fileContent) {
  var contributorsList = contributors.length === 0 ? '\n' : generateContributorsList(options, contributors);
  var badge = formatBadge(options, contributors);
  return _.flow(injectListBetweenTags(contributorsList), replaceBadge(badge))(fileContent);
};