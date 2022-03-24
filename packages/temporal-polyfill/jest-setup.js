
/*
Shims to make tests from @js-temporal/temporal-polyfill conform to Jest
*/

/*
Ignore the returned value of test. The tests often do arrow functions like this:
  it('test name', () => doSomething())
*/
const origTest = global.test
global.test = global.it = function(name, fn, timeout) {
  origTest(name, function() {
    fn() // don't forward return value
  }, timeout)
}

/*
Simple aliases
*/
global.before = global.beforeEach
global.after = global.afterEach
