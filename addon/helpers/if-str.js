import {helper} from '@ember/component/helper';

export function thisOrElse(params/*, hash*/) {
  let checker_bool = params[0];
  let string_a = params[1];
  let string_b = params[2];

  if (typeof(checker_bool) === 'undefined')
    return false;

  if (typeof(checker_bool) === 'string')
    checker_bool = (checker_bool.length > 0);

  if (checker_bool)
    return string_a; else
    return string_b;
}

export default helper(thisOrElse);
