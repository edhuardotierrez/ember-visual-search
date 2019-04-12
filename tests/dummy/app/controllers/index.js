import Controller from '@ember/controller';
import {computed} from '@ember/object';

export default Controller.extend({

  variableInYourContext: null,

  //
  options: computed(function () {
    return {
      keys: [
        {
          key: 'name',
          title: 'Name',
        },
        {
          key: 'tag:application',
          title: 'Tag:Application',
        },
        {
          key: 'tag:host',
          title: 'Tag:Host',
        }]
    }
  }),

  myDefaultFacets: computed(function () {
    return [
      {
        key: 'name',
        title: 'Name',
        value: 'Your Name'
      }
    ]
  }),

  optionsFull: computed(function () {
    return {
      keys: [
        {
          key: 'website',
          title: 'Website',
        },
        {
          key: 'extension',
          title: 'Extension'
        }
      ]
    }
  }),

  _facetsCopyTest: computed('_facetsCopy', function () {
    return this.get('_facetsCopy');
  }),

  onChange: function (facets) {
    // console.log('onChange', facets);
    this.set('_facetsCopy', facets);
  },
  onCreateFacet: function (/*facets*/) {
    // console.log('onCreateFacet', facets);
  },

  onSearchButton: function (/*facets*/) {
    // console.log('onSearchButton', facets);
  },

  getKeyValues(/*facet*/) {
    // console.log('getKeyValues', facet);
    return [];
  },

  getKeyValuesFunc(facet) {
    // console.log('getKeyValuesFunc::', facet);
    if (facet.key === 'extension') {
      return [
        'com',
        'org',
        'be',
        'gl'
      ];
    } else if (facet.key === 'website') {
      return [
        'Facebook',
        'Twitter',
        'Google',
        'Youtube',
        'Instagram',
        'Linkedin',
        'Pinterest',
        'Wikipedia',
        'Wordpress',
        'Blogspot',
        'Apple',
        'Adobe',
        'Tumblr',
        'Youtu',
        'Amazon',
        'Goo',
        'Vimeo'
      ];
    }
  },

  _rotate: 0,
  actions: {
    changeDefaultFacets() {
      let searchComponent = this.get('variableInYourContext');
      this.incrementProperty('_rotate');

      let sets = [
        {
          'key': 'other-key-'+this._rotate,
          'title': 'OtherKey ' + this._rotate,
          'value': 'Your other value ' + this._rotate,
        }
      ];
      searchComponent.set('defaultFacets', sets);
      searchComponent.resetDefaults();
    }
  }

});
