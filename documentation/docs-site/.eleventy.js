/*
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { DateTime } = require('luxon');
const UglifyJS = require('uglify-es');
const htmlmin = require('html-minifier');
const eleventyNavigationPlugin = require('@11ty/eleventy-navigation');
const svgContents = require('eleventy-plugin-svg-contents');
const pluginTOC = require('eleventy-plugin-nesting-toc');
const embedEverything = require('eleventy-plugin-embed-everything');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const CleanCSS = require('clean-css');

const searchFilter = require('./search-filter');
const FORWARD_SLASH = '/';
const isProd = process.env.ELEVENTY_PRODUCTION;
const pathPrefix = isProd ? '/docs/' : FORWARD_SLASH;
let validDestinations = new Set();
const hasAbsPath = (str) => str[0] === FORWARD_SLASH && str[1] !== FORWARD_SLASH;
const replaceLink = (link) => {
  // Ensures all absolute links inside markdown files go to /docs/ in production
  if (hasAbsPath(link)) {
    if (!isProd && !['.webm', '.png'].some((item) => link.includes(item))) {
      const hashed = link.split('#');
      const lnk = hashed.length ? hashed[0] : link;
      if (!validDestinations.has(lnk)) {
        console.log('\x1b[31m', `LINK TO MISSING URL: ${link}`, '\x1b[0m');
      }
    }

    return pathPrefix + link.substr(1);
  }
  return link;
};

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(svgContents);
  eleventyConfig.addPlugin(pluginTOC);
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(embedEverything);
  eleventyConfig.addShortcode('version', () => String(Date.now()));
  eleventyConfig.addFilter('cssmin', (code) => new CleanCSS({}).minify(code).styles);
  eleventyConfig.addPassthroughCopy({
    './node_modules/elasticlunr/release/elasticlunr.min.js': './js/elasticlunr.min.js',
  });

  // Eleventy Navigation https://www.11ty.dev/docs/plugins/navigation/
  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  // Merge data instead of overriding
  // https://www.11ty.dev/docs/data-deep-merge/
  eleventyConfig.setDataDeepMerge(true);

  eleventyConfig.addCollection('pages', (collection) => {
    return collection.getFilteredByGlob('docs/pages/**/*.md');
  });

  eleventyConfig.addFilter('search', searchFilter);
  eleventyConfig.addCollection('results', (collection) => {
    return [...collection.getFilteredByGlob('docs/pages/**/*.md')];
  });

  const sortNavOrder = (a, b) => {
    const orderA = a.data.eleventyNavigation.order || 0;
    const orderB = b.data.eleventyNavigation.order || 0;
    return orderA - orderB;
  };

  /** Builds the pagination at the bottom of each page */
  eleventyConfig.addCollection('menuItems', (collection) => {
    const all = collection.getAll().filter((item) => 'eleventyNavigation' in item.data);

    validDestinations = new Set([
      ...all.flatMap(({ url }) => [url, url.substring(0, url.length - 1)]),
    ]);

    const topLevel = all
      .filter((item) => item.data.eleventyNavigation.parent === undefined)
      .sort(sortNavOrder);

    return topLevel
      .reduce((acc, curr) => {
        const key = curr.data.eleventyNavigation.key;
        const found = all
          .filter((item) => item.data.eleventyNavigation.parent === key)

          .sort(sortNavOrder);

        return [...acc, curr, ...found];
      }, [])
      .filter((item) => item.data.eleventyNavigation.hidden !== true);
  });

  // Date formatting (human readable)
  eleventyConfig.addFilter('readableDate', (dateObj) => {
    return DateTime.fromJSDate(dateObj).toFormat('LLL dd, yyyy');
  });

  // Date formatting (machine readable)
  eleventyConfig.addFilter('machineDate', (dateObj) => {
    return DateTime.fromJSDate(dateObj).toFormat('yyyy-MM-dd');
  });

  // Minify JS
  eleventyConfig.addFilter('jsmin', (code) => {
    const minified = UglifyJS.minify(code);
    if (minified.error) {
      console.log('UglifyJS error: ', minified.error);
      return code;
    }
    return minified.code;
  });

  // Minify HTML output
  eleventyConfig.addTransform('htmlmin', (content, outputPath) => {
    if (outputPath.indexOf('.html') > -1) {
      const config = { useShortDoctype: true, removeComments: true, collapseWhitespace: true };
      return htmlmin.minify(content, config);
    }
    return content;
  });

  // Don't process folders with static assets e.g. images
  eleventyConfig.addPassthroughCopy('docs/favicon.svg');
  eleventyConfig.addPassthroughCopy('docs/static');
  eleventyConfig.addPassthroughCopy('docs/_includes/assets/');

  /* Markdown Plugins */
  const markdownIt = require('markdown-it');
  const markdownItAnchor = require('markdown-it-anchor');
  const markdownItEmoji = require('markdown-it-emoji');
  const markdownItFootnote = require('markdown-it-footnote');
  const markdownItContainer = require('markdown-it-container');
  const markdownItReplaceLink = require('markdown-it-replace-link');
  const markdownToc = require('markdown-it-table-of-contents');
  const markdownItTasks = require('markdown-it-task-lists');
  const mdIterator = require('markdown-it-for-inline');
  const customBlock = require('markdown-it-custom-block');
  const markdownItAttrs = require('markdown-it-attrs');
  const markdownItCenterText = require('markdown-it-center-text');
  const options = {
    html: true,
    breaks: true,
    linkify: true,
    typographer: true,
    replaceLink,
  };

  eleventyConfig.setLibrary(
    'md',
    markdownIt(options)
      .use(mdIterator, 'url_new_win', 'link_open', (tokens, idx) => {
        const [attrName, href] = tokens[idx].attrs.find((attr) => attr[0] === 'href');
        if (href && !href.startsWith('/') && !href.startsWith('#')) {
          tokens[idx].attrPush(['target', '_blank']);
          tokens[idx].attrPush(['rel', 'noopener noreferrer']);
        }
      })
      .use(customBlock, {
        video(url) {
          const processedUrl = replaceLink(url);
          // this is a custom implementation located in /_includes/js/video.js
          return `<video-player src="${processedUrl}"></video-player>`;
        },
        embed(args) {
          const [url, aspectRatio = '16/9'] = args.split('[ratio]');
          const processedUrl = replaceLink(url);
          return `
          <div style="--aspect-ratio:${aspectRatio};">
            <iframe src="${processedUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen ></iframe>
          </div>
          `;
        },
        spec(link) {
          return `<a href="${link}"><i class="ico btm">link</i> Spec</a>`;
        },
      })
      .use(markdownItReplaceLink)
      .use(markdownItAnchor, {
        // permalink: true,
        // permalinkClass: 'direct-link',
        // permalinkSymbol: '',
      })
      .use(markdownItEmoji)
      .use(markdownItFootnote)
      .use(markdownToc)
      .use(markdownItContainer, 'callout')
      .use(markdownItContainer, 'callout-green')
      .use(markdownItContainer, 'code-comp-sample')
      .use(markdownItContainer, 'alert')
      .use(markdownItTasks)
      .use(markdownItCenterText)
      // .use(markdownLinkifyImages, {
      //   imgClass: "p-8",
      // })
      .use(markdownItAttrs, {
        includeLevel: [2, 3],
        listType: 'ol',
      })
  );

  return {
    templateFormats: ['md', 'njk', 'html', 'liquid'],
    pathPrefix,
    markdownTemplateEngine: 'liquid',
    htmlTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
    dir: {
      input: '.',
      includes: '_includes',
      data: '_data',
      output: 'dist/_site',
    },
  };
};
