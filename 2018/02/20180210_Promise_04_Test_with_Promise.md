# JavaScript Promise
> 한빛미디어 [리얼타임] JavaScript Promise

---

**Warning**

[Promise Test Helper : Github repo](https://github.com/azu/promise-test-helper)

*확인 결과 ~~shouldFulfilled가 rejected 상황에 제대로 동작하지 않음.(`should be fulfilled` : return을 빼먹음...)~~ 원본 소스 API 바뀌었으므로 본 문서 재작성 필요*

## 4. Promise 테스트

Mocha를 이용한 Promise 테스트 작성법

### 4.1 기본적인 테스트 작성법

- 어설션 라이브러리 : power-assert

```javascript
"use strict"
// 콜백 스타일
var assert = require('power-assert');

describe('Basic Test', function(){
    context('When Callback(high-order function)', function(){
        // Mocha의 it()은 콜백함수의 배개 변수에 done()을 전달한다.
        // 그리고 done()이 호출될 때까지 테스트 케이스를 종료하지 않는 방식으로
        // 비동기 테스트를 지원한다.
        it('should use `done` for test', function(done){
            setTimeout(function(){
                assert(true);
                done();
            }, 0);
        });
    });

    context('When promise object', function(){
        it('should use `done` for test?', function(done){
            var promise = Promise.resolve(1);

            // 이 테스트 코드는 문제가 있다
            promise.then(function(value){
                assert(value === 1);
                done();
            });
        });
    });
});
```

두번째 context의 테스트에서 어설션이 실패해야하는 경우 문제가 된다

```javascript
context('When promise object', function(){
    it('should use `done` for test?', function(done){
        var promise = Promise.resolve();

        promise.then(function(value){
            assert(false); // throw AssertionError
            done();
        });
    });
});
```

테스트가 실패할 것 같지만 시제로는 테스트가 끝나지 않고 타임아웃된다.

테스트 프레임워크는 어설션이 실패한 경우, throw를 발생시켜 테스트가 실패했다고 판단한다.

그러나 프로미스의 경우, 추상화한 로직에서 발생한 오류는 모두

자체적인 예외 처리 메커니즘에 따라 처리되기 때문에 테스트 프레임워크에서 오류를 감지할 수 없다.

```javascript
it('should use `done` for test?', function(done){
    var promise = Promise.resolve();

    promise.then(function(value){
        assert(false); // throw AssertionError
    }).then(done, done);
});
```

then을 한번더 체인 하여 성공 및 실패한 경우 모두 done이 호출될 수 있도록 수정했다.

이로써 일반적 비동기 테스트와 동일한 프로미스 테스트를 작성할 수 있다.



### 4.2 Promise를 지원하는 Mocha

```javascript
doescribe("Promise Test", function() {
    it('should return a promise object', function(){
        let promise = Promise.resolve(1);

        return promise.then(function(value){
            assert(value === 1);
        });
    });
    
    it('should be fail', function(){
        return Promise.resolve().then(function(){
            assert(false);
        });
    });
});
```

이전처럼 `then(done, done)` 처럼 명시적이지 않은 형태를

사용하지 않고 프로미스 객체를 반환했다. 

### 4.3 의도하지 않은 테스트 결과

Mocha가 프로미스를 제공한다고 모든게 수월하진 않다.

프로미스 객체가 `Fulfilled`된 경우에 테스트가 실패하고,

`Rejected`된 경우에 테스트가 성공한다면?

```javascript
function mayBeRejected(){
    return Promise.reject(new Error('woo...'));
}

it('is bad pattern', function(){
    return mayBeRejected().catch(function(error){
        assert(error.message === 'woo...');
    });
});
```

위 코드는 `Rejceted`상태의 프로미스 객체가 반환되어 `catch`가 호출되고 테스트에 성공한다.

```javascript
function mayBeRejected(){
    return Promise.resolve(); 
}
```

이번엔 `Fulfilled`상태의 객체를 반환한다. `catch`가 호출되지 않은 채 테스트가 성공한다.

의도대로 테스트가 동작하지 않는다...

일단 해결을 위해 `catch`앞에 `then`을 추가해 `Fulfilled` 상태에서 실패하도록 해야한다.

```javascript
function failTest(){
    throw new Error('Expected promise to be rejectd but it was fulfilled');
}

function mayBeRejected(){
    return Promise.resolve(); 
}

it('should bad pattern', function(){
    return mayBeRejceted().then(failTest).catch(function(error){
        assert.deepEqual(error.message === 'woo...');
    });
});
```

원래 `catch`가 호출되며 성공해야 하지만, 앞선 체인에서 에러가 발생하여 `catch`가 호출 됐지만

테스트는 실패한다. `AssertionError`가 발생하므로 의도했던 상황이 절대 아니다.

```javascript
it('catch -> then', function(){
    return mayBeRejected().then(failTest, function(error){
        assert(error.message === 'woo...');
    });
});
```

이처럼 `then`에 두 함수를 등록하여 프로미스가 실패한 경우에만 어설션으로 진행한다.

**`Fulfilled` 또는 `Rejected` 상태에 따라 테스트가 어떻게 진행되길 바라는지 의도를 명확히 해야한다.**

앞선 *3.3 예외 처리가 되지 않는 onRejcted* 에서는 오류를 잃어버리지 않도록

`then`과 `catch`로 나눌것을 권장했지만, 테스트 코드를 작성하는 경우 오히려

프로미스 메커니즘이 테스트를 방해하므로 더 안전하고 명시적으로 진행하기 위해 `then`에

두 콜백을 등록하는 편이 좋다.

```javascript
promise.then(failTest, function(error){
    // assert로 error를 테스트
});
```

허나 이또한 직관적이진 못하다.

### 4.4 조금 더 직관적으로 테스트 작성

`Fulfilled`를 기대하는 테스트는 `Rejceted`된 경우와 어설션의 결과가 일치하지 않으면 실패한다.

반대로 `Rejcted`를 기대하고 `Fulfilled`된 경우와 어설션 결과가 일치하지 않으면 실패한다.

그리고 실패 요건에 해당하지 않으면 테스트는 성공한다.

```javascript
promise.then(failTest, function(error){
    // assert로 error 테스트
    assert(error instanceof Error);
})
```

프로미스로 테스트를 진행할 경우 `Fulfilled`와 `Rejceted` 중 어느 상태를 기대하는지,

또 어떤 값을 어설션 하는지 명시적으로 드러낼 필요가 있다. 따라서 기대하는 상태를 직관적으로

알 수 있도록 헬퍼함수를 작성한다. *(저자 : azu/promise-test-helper)*


#### Rejected 상태를 기대하는 shouldRejected

```javascript
function shouldRejected(promise){
    return {
        catch: (fn) => {
            return promise.then(() => {
                throw new Error('Expected promise to be rejected but it was fulfilled');
            }, (reason) => {
                fn.call(promise, reason);
            });
        }
    };
}

it('should be rejected', () => {
    let promise = Promise.reject(new Error('human error'));

    return shouldRejected(promise).catch(error => {
        assert(error.message === 'human error');
    });
});
```

`shouldRejected()`에 `promise`객체를 전달하면 `catch()`를 가진 리터럴 객체를 반환한다.

이떄의 `catch()`는 `fulfilled` 상태일 때 예외를 발생시킨다.

`shouldRejected`에 프로미스 객체를 전달하는 부분만 빼면 일반 프로미스 테스트와 같은 느낌이다.

```javascript
promise.then(failTest, (error) => {
    assert(error.message === 'human error');
});

// 더 명시적이다.
shouldRejected(promise).catch((error) => {
    assert(error.message === 'human error');
})
```

#### Fulfilled 상태를 기대하는 shouldFulfilled

```javascript
function shouldFulfilled(promise){
    return {
        then: (fn) => {
            return promise.then((value) => {
                fn.call(promise, value);
            }, (reason) => {
                throw reason;
            });
        }
    };
}

it('should be fulfilled', () => {
    let promise = Promise.resolve('value');

    return shouldFulfilled(promise).then((value) => {
        assert(value === 'value');
    });
});
```

두 헬퍼 함수 모두 리터럴 객체를 통해 하나의 인터페이스만을 제공한다.

`then` 혹은 `catch`에 하나의 함수를 등록함으로써 명시적인 테스트를 진행하도록 도와준다.

### 4.5 정리

헬퍼함수는 즉시 사용할 수 있지만 이는 Mocha의 프로미스 지원 환경이 전제돼있다.

`done`을 사용해야할 경우는 사용할 수 없다.

