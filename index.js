'use strict';

let path = require('path');
let Funnel = require('broccoli-funnel');
let MergeTrees = require('broccoli-merge-trees');

module.exports = {
  name: 'ember-visual-search',
  included(app) {
    this._super.included.apply(this, arguments);

    let defaults = {
      includeCss: true,
      includeTypeahead: true
    };

    let userConfig = app.options['ember-visual-search'] || {};
    let config = Object.assign(defaults, userConfig);

    if(config.includeCss) {
      app.import('vendor/visual-search.css');
    }

    if(config.includeTypeahead) {
      this.import('vendor/typeahead.jquery.js');
      this.import('vendor/suggestions.js');
    }
  },

  treeForVendor(vendorTree) {
    let typeaheadTree = new Funnel(path.dirname(require.resolve('corejs-typeahead/dist/typeahead.jquery.js')), {
      files: ['typeahead.jquery.js']
    });

    let momentTree = new Funnel(path.dirname(require.resolve('suggestions/dist/suggestions.js')), {
      files: ['suggestions.js']
    });

    return new MergeTrees([vendorTree, typeaheadTree, momentTree]);
  },

  name: require('./package').name
};
