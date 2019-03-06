import Controller from '@ember/controller';
import {computed} from '@ember/object';

export default Controller.extend({
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
    console.log('onChange', facets);
    this.set('_facetsCopy', facets);
  },
  onCreateFacet: function (facets) {
    console.log('onCreateFacet', facets);
  },

  onSearchButton: function (facets) {
    console.log('onSearchButton', facets);
  },

  getKeyValues(facet) {
    console.log('getKeyValues', facet);
    return [];
  },

  getKeyValuesFunc(facet) {
    console.log('getKeyValuesFunc::', facet);
    if (facet.key === 'extension') {
      return [
        'com',
        'org',
        'be',
        'gl'
      ];
    }else
    if (facet.key === 'website') {
      return [
        'Facebook.com',
        'Twitter.com',
        'Google.com',
        'Youtube.com',
        'Instagram.com',
        'Linkedin.com',
        'Wordpress.org',
        'Pinterest.com',
        'Wikipedia.org',
        'Wordpress.com',
        'Blogspot.com',
        'Apple.com',
        'Adobe.com',
        'Tumblr.com',
        'Youtu.be',
        'Amazon.com',
        'Goo.gl',
        'Vimeo.com'
      ];
    }
  }

});
