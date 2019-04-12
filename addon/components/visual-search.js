import Component from '@ember/component';
import EmberObject, {computed} from '@ember/object';
import {assign} from '@ember/polyfills';
import {A} from '@ember/array';
import {later, schedule} from '@ember/runloop';
import layout from '../templates/components/visual-search';

const ACTIONS = {
  FACET_CREATE: 'facet_create',
  FACET_FOCUS_LAST: 'facet_focus_last'
};

const KEYS = {
  TAB: 9,
  BACKSPACE: 8,
  DELETE: 46,
  ENTER: 13,
  ESC: 27
};

const STRIMMED = function (str) {
  return String(str || '').trim();
};

const STRLEN = function (str) {
  return STRIMMED(str).length;
};

export default Component.extend({
  layout,

  registerAs: null,
  editing: false,
  infocus: false,
  searchButton: false,
  searchButtonText: 'OK',
  suggestDefaultKey: true,
  minValueLength: 1,
  allowEmptyValues: true,
  defaultKey: 'search',
  lastId: null,
  availableValue: '', // initial input value
  defaultFacets: A(),
  suggestOnFocus: computed(function () {
    return {
      keys: true,
      values: false
    };
  }),
  isTyping: computed('editing', 'availableValue', function () {
    if (this.get('editing')) {
      let val = (this.get('availableValue') || '').trim();
      if (val.length > 0)
        return true;
    }
    return false;
  }),

  placeholder: 'Add filter',

  onChange: function (/*facets*/) {
  },
  onSearchButton: function (/*facets*/) {
  },
  onCreateFacet: function (/*facets*/) {
  },

  getKeyValues(/*facet*/) {
    return [];
  },

  init() {
    this._super(...arguments);
    this.set('facets', A());

    let context = this;
    schedule('afterRender', function () {
      later(this, function () {
        context._bindSuggestions();
      }, 100);

      //
      context.resetDefaults(false);

    });

  },

  resetDefaults(force_clear = true) {
    let context = this;
    if (force_clear) context.clear();
    if (context.get('defaultFacets')) {
      context.get('defaultFacets').forEach(function (item) {
        context.createFacet(item, false);
      });
    }
  },

  _options: computed('options', 'defaultKey', function () {
    let opts = assign({}, this.get('options'));
    if (!opts.keys) {
      if (STRLEN(this.get('defaultKey')) && this.get('suggestDefaultKey')) {
        opts.keys = [{
          key: this.get('defaultKey'),
          title: this.get('defaultKey'),
        }]
      } else {
        opts.keys = [];
      }
    }
    return opts;
  }),

  didInsertElement() {
    this._super(...arguments);

    let context = this;
    this.set('registerAs', this);

    this.$('.visual-search-box')
      .on('click', function () {
        let last_input = context.$('.vs-search-inner input.is-available').last();
        const last_value = last_input.val();
        // if clicked focus on end
        last_input.focus().val('').val(last_value);
      });

    // input events
    this._bindInputEvents();
  },

  _bindSuggestions() {
    let input = this.$('.vs-search-inner input.is-available');
    input = document.getElementById(input.attr('id'));
    let data = this.get('_options.keys').map((item) => item.title);
    this._bindSuggestionsToInput(input, data);
  },

  _bindSuggestionsToInput(input, data) {

    if (data && data.length === 1) {
      if (!STRLEN(data[0])) data = [];
    }

    let context = this;
    let Suggestions = window.Suggestions || Suggestions;

    let typeahead = new Suggestions(input, data, {
      highlight: true,
      minLength: 0,
      limit: 30
    });


    // custom suggestions prototypes
    Suggestions.prototype.handleBlur = function () {
      if (!this.list.selectingListItem) {
        this.list.hide();
      }
    };

    Suggestions.prototype.handleKeyDown = function (e) {
      switch (e.keyCode) {
        case 13: // ENTER
        case 9:  // TAB
          e.preventDefault();
          if (!this.list.isEmpty()) {
            if (this.list.active >= 0)
              this.value(this.list.items[this.list.active].original);
            this.list.hide();
          }
          break;
        case 27: // ESC
          if (!this.list.isEmpty()) this.list.hide();
          break;
        case 38: // UP
          this.list.previous();
          break;
        case 40: // DOWN
          this.list.next();
          break;
      }
    };

    // disable default auto-selection
    typeahead.list.clear = function () {
      this.active = -1;
      this.items = [];
    };

    typeahead.list.draw = function () {
      this.element.innerHTML = '';

      if (this.items.length === 0) {
        this.hide();
        return;
      }

      // first if one
      if (this.items.length === 1 && this.active <= -1) {
        this.active = 0;
      }

      for (var i = 0; i < this.items.length; i++) {
        this.drawItem(this.items[i], this.active === i);
      }

      this.show();
    };


    input.addEventListener('change', function (/*e*/) {
      let obj = context.$(this);

      let next_value = '';
      let next_input = null;
      if (obj.hasClass('is-facet-key')) {
        next_input = obj.closest('.vs-facet-block').find('is-facet-input');
        next_value = next_input.val();
      }

      if (obj.hasClass('is-facet-input')) {
        next_value = obj.val();
        let block = context._findFacetBlockByInput(obj);
        if (block.attr('vsfid')) {
          let facet = context.findFacetById(block.attr('vsfid'));
          if (facet) {
            facet.set('value', next_value);
          }
        }
      }

      let options = {'key': typeahead.selected, 'value': next_value};

      if (options.key) {

        context._inputFacetAction(obj, ACTIONS.FACET_CREATE, options);
        typeahead.handleInputChange('');
        typeahead.selected = null;

        if (next_input) {
          later(this, function () {
            next_input.val('');
          }, 10);
        }

      }

    });

    input.addEventListener('focus', function (/*e*/) {
      let obj = context.$(this);
      if (context.get('suggestOnFocus.keys') && (obj.hasClass('is-available') || obj.hasClass('is-facet-key'))) {
        typeahead.handleInputChange(obj.val() || '');
      } else if (context.get('suggestOnFocus.values') && obj.hasClass('is-facet-input')) {
        typeahead.handleInputChange(obj.val() || '');
      }

      let suggestions = context.$(this).closest('.vs-search-inner').find('.suggestions');
      if (suggestions) {
        let pos = obj.position();
        suggestions.css({left: pos.left});
      }

    });


    input.addEventListener('keyup', function (e) {
      let key = e.keyCode || -1;
      let obj = context.$(this);
      let val = obj.val().trim();

      let suggestions = context.$(this).closest('.vs-search-inner').find('.suggestions');
      if (suggestions) {
        let pos = obj.position();
        suggestions.css({left: pos.left});
      }

      if ([KEYS.ENTER, KEYS.TAB].includes(key)) {
        context.$(this)
          .removeClass('in-focus')
          .removeClass('editing');

        e.preventDefault();
        e.stopPropagation();

        if (val.length) {

          if (obj.hasClass('is-available')) {
            if (!STRLEN(typeahead.selected) && STRLEN(typeahead.query) > context.get('minValueLength')) {

              let queryValue = typeahead.query;
              let options = {'key': context.get('defaultKey'), 'value': queryValue};

              // issued on uppercase input
              if (queryValue.toLowerCase() === val.toLowerCase())
                options.value = val;

              context.createFacet(options);
              typeahead.handleInputChange('');
              typeahead.selected = null;
            }
          }

          context.triggerChanges();
        }
      } else if (key === KEYS.BACKSPACE) {
        e.preventDefault();
      }

    });

    input.addEventListener('keydown', function (e) {
      let key = e.keyCode || -1;
      let obj = context.$(this);

      if (key === KEYS.TAB && e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
      }

      // not this keys
      if (![KEYS.ENTER, KEYS.TAB, KEYS.BACKSPACE].includes(key)) {
        let suggestions = context.$(this).closest('.vs-search-inner').find('.suggestions');
        if (suggestions) {
          let pos = obj.position();
          suggestions.css({left: pos.left});
        }
      }

    });
  },

  _unbindSuggestions() {
    let inputs = this.$('.visual-search-container input');
    if (inputs && inputs.length) {
      inputs.remove();
    }
  },

  _unbindSuggestionsInput(el) {
    let input = this.$(el);
    if (input && input.length) {
      let nextEl = this.$(input[0].nextElementSibling);
      if (nextEl && nextEl.hasClass('suggestions')) {
        if (nextEl[0].tagName.toUpperCase() === "UL") {
          nextEl.remove();
          input.off('click').off('focus').off('blur').off('keydown');
        }
      }
    }
  },

  _lastKeyUp: null,
  _lastKeyDown: null,

  _bindInputEvents() {
    let context = this;
    let objs = this.$('.vs-search-inner input');
    if (objs) {
      context.$('.vs-search-inner input')
      // on click
        .on('click', function (e) {
          e.stopPropagation();
          context.$(this).select();
        })
        // on focus
        .on('focus', function (/*e*/) {
          let obj = context.$(this);
          context.set('editing', true);
          obj
            .addClass('in-focus')
            .addClass('editing');
          context.set('infocus', true);
        })
        // on blur

        .on('blur', function (e) {
          context.$(this)
            .removeClass('in-focus')
            .removeClass('editing');

          let obj = context.$(e.target);
          let val = obj.val().trim();

          if (obj.hasClass('is-available')) {
            if (!val.length) {
              context.set('editing', false);
            }
          }

          if (obj.hasClass('is-facet-key')) {
            if (!val.length) {
              let block = context._findFacetBlockByInput(obj);
              if (block.attr('vsfid')) {
                let facet = context.findFacetById(block.attr('vsfid'));
                context.deleteFacet(facet);
                return;
              }
            }
          }

          if (obj.hasClass('is-facet-input')) {
            if ([context.get('_lastKeyDown'), context.get('_lastKeyUp')].includes(KEYS.ESC)) {
              // pass
            } else if (!val.length && !context.get('allowEmptyValues')) {
              e.preventDefault();
              obj.focus();
            } else {
              context.triggerChanges();
            }
          }

          if (obj.hasClass('is-facet-key')) {
            if (!val.length) {
              e.preventDefault();
              obj.focus();
            } else {
              context.triggerChanges();
            }
          }

          if (e.relatedTarget)
            context.set('infocus', true); else
            context.set('infocus', false);

        })

        // on keydown
        .on('keydown', function (e) {
          let key = e.keyCode || -1;
          let obj = context.$(e.target);
          let val = obj.val().trim();

          if (key === KEYS.TAB && e.shiftKey) {
            if (obj.hasClass('is-facet-input')) {
              //
            } else {
              e.preventDefault();
              context._inputFacetAction(obj, ACTIONS.FACET_FOCUS_LAST);
            }
          }

          if (key === KEYS.BACKSPACE) {
            if (!val.length && obj.hasClass('is-available')) {
              context._inputFacetAction(obj, ACTIONS.FACET_FOCUS_LAST);
            }
          }

          context.set('_lastKeyUp', null);
          context.set('_lastKeyDown', key);

        })// on keyup
        .on('keyup', function (e) {
          let key = e.keyCode || -1;
          let obj = context.$(e.target);
          let val = obj.val().trim();

          if ([KEYS.TAB, KEYS.ENTER].includes(key) && !e.shiftKey && obj.hasClass('is-facet-key')) {
            let next_input = obj.closest('.vs-facet-block').find('input.is-facet-input');
            next_input.focus().select();
          } else if (key === KEYS.ENTER) {
            if (val.length > context.get('minValueLength') && obj.hasClass('is-facet-input')) {
              context.$('input.is-available').focus();
            }
          }

          if (key === KEYS.ESC) {
            if (obj.hasClass('is-facet-input')) {

              let input_cat = obj.closest('.vs-facet-block').find('input.is-facet-key');

              if (!STRLEN(context.get('defaultKey')) && !context.get('_options.keys').length) {
                if (!STRLEN(input_cat.val())) {
                  let input_avail = obj.closest('.vs-facet-block').find('input.is-available');
                  input_avail.focus();

                  context.set('_lastKeyUp', null);
                  context.set('_lastKeyDown', null);
                  return;
                }
              }

              input_cat.focus().select();
            }
            if (obj.hasClass('is-facet-key')) {
              let next_input = obj.closest('.vs-facet-block').find('input.is-facet-input');
              let next_val = next_input.val().trim();
              if (!STRLEN(next_val).length) {
                let block = context._findFacetBlockByInput(obj);
                block.focus();
              }
            }
          }

          context.set('_lastKeyUp', key);
          context.set('_lastKeyDown', null);

        });


      // facet block
      context.$('.vs-search-inner .vs-facet-block')
        .on('focus', function () {
          let obj = context.$(this);
          obj.addClass('in-focus');
          context.set('infocus', true);
        })
        .on('keydown', function (e) {
          let obj = context.$(this);
          let obj_vsfid = parseInt(obj.attr('vsfid') || -1);
          let key = e.keyCode || -1;

          const lastFacet = context.get('facets').lastObject;
          if (KEYS.TAB === key && !e.shiftKey && lastFacet && obj_vsfid === parseInt(lastFacet.id)) {
            e.preventDefault();
            context.$('input.is-available').focus();
          } else if ([KEYS.BACKSPACE, KEYS.DELETE].includes(key)) {
            if (obj.hasClass('in-focus')) {
              context.deleteFacet(context.findFacetById(obj.attr('vsfid')));
              if (context.lastId) {
                context._facetBlockFocus(context.lastId);
              } else {
                context.$('input.is-available').focus();
              }
            }
          }
        })
        .on('keyup', function (e) {
          let obj = context.$(this);
          let key = e.keyCode || -1;

          if (obj.hasClass('in-focus')) {
            if (KEYS.ENTER === key) {
              e.stopPropagation();
              e.preventDefault();
              let next_input = obj.closest('.vs-facet-block').find('input.is-facet-input');
              next_input.focus().select();
            }
          }
        })
        .on('blur', function (e) {
          let obj = context.$(this);
          obj.removeClass('in-focus');

          if (e.relatedTarget)
            context.set('infocus', true); else
            context.set('infocus', false);
        });
    }
  },

  _unbindInputEvents() {
    let objs = this.$('.vs-search-inner input');
    if (objs) {
      objs.off('click').off('focus').off('blur').off('keydown');

      this.$('.vs-search-inner .vs-facet-block').off('focus', 'keydown', 'blur');
    }
  },

  _inputFacetAction(obj, action, options) {
    let context = this;

    if (action === ACTIONS.FACET_CREATE) {

      // change key ?
      if (context.$(obj).hasClass('is-facet-key')) {
        if (options && options.key) {
          let block = context._findFacetBlockByInput(obj);
          if (block.attr('vsfid')) {
            let facet = context.findFacetById(block.attr('vsfid'));

            let new_opts = context._optionsRemapping(options);
            let changes = 0;
            let changes_data = {};

            if (new_opts.key && facet.key !== new_opts.key) {
              facet.set('key', new_opts.key);
              changes += 1;
              changes_data['key'] = String(new_opts.key);
            }

            if (new_opts.title && facet.title !== new_opts.title) {
              facet.set('title', new_opts.title);
              changes_data['title'] = String(new_opts.title);
              changes += 1;
            }

            if (changes) {

              let next_input = context.$('[vsfid=' + facet.id + '] input.is-facet-input');

              later(context, function () {
                context._updateInputSuggestionsData(next_input, facet);
                context.triggerChanges();

              }, 20);

              if (changes_data.key) {
                later(context, function () {
                  next_input.focus().select();
                }, 40);
              }

            }

          }
        }
      }

      // new ?
      if (this.$(obj).hasClass('is-available')) {
        let input_val = this.$(obj).val().trim();
        if (input_val.length > this.get('minValueLength')) {
          let opts = assign({key: 'search', value: input_val}, options);
          this.createFacet(opts);
        }
        this.$(obj).val('');
      }

      if (this.$(obj).hasClass('is-facet-input')) {
        later(context, function () {
          context.triggerChanges();
        }, 20);
      }

      this.$('input.is-available').focus();
      this.set('editing', true);
    }

    if (action === ACTIONS.FACET_FOCUS_LAST) {
      if (this.$(obj).hasClass('is-available')) {
        this._facetBlockFocus(this.get('lastId'));
      }
    }

  },
  _facetBlockFocus(id) {
    let context = this;
    let obj = context.$('[vsfid=' + id + ']');
    obj.focus();
  },

  _findFacetBlockByInput(input) {
    let context = this;
    if (input) {
      if (input.innerHTML)
        input = context.$(input);

      let block = input.closest('.vs-facet-block');
      if (block && block.length)
        return block;
    }
    return null;
  },

  _optionsRemapping(opts) {
    let context = this;
    opts = assign({id: null}, opts);

    if (!opts['id'])
      opts['id'] = this.get('facets').length + 1;

    if (opts['key'] || !opts['key']) {
      let item = context.get('_options.keys').filter((item) => item.title === opts['key'] || item.key === opts['key']);
      if (item && item.length && item[0].key) {
        opts = assign(opts, {key: item[0].key});
      }
    }

    if (!opts['title']) {
      let item = context.get('_options.keys').filter((item) => item.title === opts['key'] || item.key === opts['key']);
      if (!item || !item.length) {
        if (context.get('defaultKey')) {
          item = [{title: context.get('defaultKey')}];
        }
      }
      if (item && item.length && item[0].title) {
        opts = assign(opts, {title: item[0].title});
      }
    }

    if (!STRLEN(opts['key']) || (!STRLEN(opts['value']) && !STRLEN(opts['key']))) {

      if (!STRLEN(opts['key']) && !STRLEN(this.get('defaultKey'))) {
        if (!STRLEN(opts['value']))
          return;

        //
        opts['key'] = '';
      } else {
        return;
      }
    }
    return opts;
  },

  createFacet(opts, triggerChanges = true) {
    let context = this;

    opts = context._optionsRemapping(opts);

    let obj = EmberObject.create(opts);
    this.get('facets').pushObject(obj);
    this.set('lastId', obj.id);


    later(this, function () {
      this._rebindAllInputEvents();
    }, 20);

    later(this, function () {
      let obj = context.$('[vsfid=' + this.get('lastId') + '] input.is-facet-input');
      let facet = context.findFacetById(this.get('lastId'));

      context._updateInputSuggestionsData(obj, facet);

      if (triggerChanges) {
        obj.focus();
        //
        if (STRLEN(opts.value) >= context.get('minValueLength')) {
          let old_input = context.$('input.is-available');
          obj.focus();
          old_input.focus();
        }
      }

    }, 40);

    if (triggerChanges) {
      this.triggerChanges();
      this.triggerFacet(obj);

      // clean
      let old_input = context.$('input.is-available');
      if (old_input)
        old_input.val('');


    }
    this.hasChanged();
  },

  _updateInputSuggestionsData(obj, facet) {
    let context = this;

    // unbind
    context._unbindSuggestionsInput(document.getElementById(obj.attr('id')));

    // values
    context._bindSuggestionsToInput(
      document.getElementById(obj.attr('id')),
      context.getKeyValues(facet));

    // key
    let objcat = context.$('[vsfid=' + this.get('lastId') + '] input.is-facet-key');
    if (objcat.length) {
      context._bindSuggestionsToInput(
        document.getElementById(objcat.attr('id')),
        context.get('_options.keys').map((item) => item.title || item.key));
    }

  },


  findFacetById(id) {
    id = parseInt(id);
    let obj = this.get('facets').filter((item) => item.id === id);
    if (obj.length) return obj[0];
    return null;
  },

  deleteFacet(facet) {
    if (!facet) return;
    let facets = this.get('facets');
    facets.removeObject(facet);

    let lastFacet = facets.lastObject;
    if (lastFacet) {
      this.set('lastId', lastFacet.id);
    } else {
      this.set('lastId', null);
    }


    if (!this.lastId)
      this.$('input.is-available').focus();

    this._rebindAllInputEvents();

    this.triggerChanges();
  },

  clear() {
    let context = this;
    let facets = JSON.parse(JSON.stringify(this.get('facets')));
    facets.forEach((facet) => {
      context.deleteFacet(facet);
    });
    this.set('facets', A([]));
    context.$('input').val('');

    let next_input = context.$('.vs-search-inner input.is-available').last();
    next_input.focus();
  },

  _rebindAllInputEvents() {
    this._unbindInputEvents();
    later(this, function () {
      this._bindInputEvents();
    }, 200);
  },

  triggerChanges() {
    // let f_old = JSON.parse(JSON.stringify(this.get('_facetsCopy') || []));
    if (this.hasChanged()) {

      later(this, function () {

        let f_new = JSON.parse(JSON.stringify(this.get('facets') || []));
        this.onChange(f_new);

      }, 10);

    }
  },

  hasChanged() {
    let f_old = JSON.stringify(this.get('_facetsCopy'));
    let f_new = JSON.stringify(this.get('facets'));
    //
    if (f_old !== f_new) {
      this.set('_facetsCopy', JSON.parse(f_new));
      return true;
    }
    return false;
  },

  triggerFacet(facet) {

    // trigger on create
    if (this.get('onCreateFacet'))
      this.onCreateFacet(JSON.parse(JSON.stringify(facet)));

  },

  willDestroyElement() {
    this.$('.visual-search-box').off('click');
    this._unbindInputEvents();
    this._unbindSuggestions();
    //
    this._super(...arguments);
  },

  actions: {
    inputClick(e) {
      e.stopPropagation();
      this.$(e.target).focus().select();
    },
    facetKeyClick(e) {
      e.stopPropagation();
    },
    facetCloseClick(facet, e) {
      e.stopPropagation();
      this.deleteFacet(facet);
    },
    searchButtonClick(e) {
      e.stopPropagation();
      let facets = JSON.parse(JSON.stringify(this.get('facets')));
      this.onSearchButton(facets);
    }
  }
});
