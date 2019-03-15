import {module, test} from 'qunit';
import {setupRenderingTest} from 'ember-qunit';
import {click, fillIn, focus, render} from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | visual-search', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    this.set('newPlaceholder', 'New filter');

    await render(hbs`{{visual-search options=(hash keys=['search']) placeholder=newPlaceholder}}`);

    assert.equal(this.element.querySelector('.vs-placeholder').textContent.trim(), 'New filter', 'initial placeholder is \'New filter\'');

    // first value
    await focus('input.is-available');
    await fillIn('input.is-available', 'search');
    await click('ul.suggestions li:first-child');
    await fillIn('input.is-facet-input', 'New value');

    assert.equal(this.element.querySelectorAll('.vs-facet-block').length, 1, 'first facet block created');

    assert.equal(this.element.querySelector('.is-facet-key').value.trim(), 'search', 'first facet key');
    assert.equal(this.element.querySelector('.is-facet-input').value.trim(), 'New value', 'first facet value');

    // second value
    await focus('input.is-available');
    await fillIn('input.is-available', 'search');
    await click('ul.suggestions li:first-child');
    await fillIn('input.is-facet-input', 'New value');

    assert.equal(this.element.querySelectorAll('.vs-facet-block').length, 2, 'first facet block created');

    // close 2
    await click('.vs-facet-close');
    await click('.vs-facet-close');

    assert.equal(this.element.querySelectorAll('.vs-facet-block').length, 0, 'all cleared');

    // await pauseTest();

  });
});
