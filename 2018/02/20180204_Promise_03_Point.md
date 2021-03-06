# JavaScript Promise
> 한빛미디어 [리얼타임] JavaScript Promise

## 3. Promise 특징

### 3.1 항상 비동기로 처리되는 Promise

`Promise`는 추상화하는 로직이 동기적일지라도 항상 비동기로 처리된다.

```javascript
let = promise = new Promise(resolve => {
    console.log('inner promise');
    resolve(42);
});

promise.then(val => {
    console.log(val);
});

console.log('outer promise');

// inner promise
// outer promise
// 42
```

당연한 결과...

```javascript
function onReady(fn){
    var readyState = document.readyState;

    if(readyState === 'interactive' || readyState === 'complete'){
        fn();
    } else {
        window.addEventListener('DOMContentLoaded', fn);
    }
}

onReady(() => {
    console.log('DOM fully loaded and parsed');
});

console.log('====START====');
```

위 코드는 console에 찍히는 텍스트의 순서를 보장할 수 없다.

순서 보장을 위해 비동기 코드로 손을 보면

```javascript
if(readyState === 'interactive' || readyState === 'complete'){
    setTimeout(fn, 0);
}
```

> 데이비드 허먼의 "Effective JavaScript"에서 아래와 같이 설명한다고 한다.

- 데이터를 즉시 사용할 수 있더라도, 절대로 비동기 콜백을 동기적으로 호출하지 마라.

- 비동기 콜백을 동기적으로 호출하면 기대한 연산의 순서를 방해하고, 예상치 않은 코드의 간섭을 초래할 수 있다.

- 비동기 콜백을 동기적으로 호출하면 스택 오버플로우나 처리되지 않는 예외를 초래할 수 있다.

- 비동기 콜백을 다른 턴에 실행되도록 스케줄링하기 위해 `setTimeout` 같은 비동기 API를 사용하라.

항시 비동기로 처리되기 때문에 명시적으로 비동기 처리를 위한 코드를 추가로 작성할 필요가 없다.

```javascript
function onReadyPromise() {
    return new Promise((resolve, reject) => {
        let readyState = document.readyState;

        if(readyState === 'interactive' || readyState === 'complete'){
            resolve(); // 이미 비동기 수행
        } else {
            window.addEventListener('DOMContentLoaded', resolve);
        }
    });
}

onReadyPromise().then(() => {
    console.log('DOM fully loaded and parsed');
});

console.log('====START====');
```

### 3.2 새로운 promise 객체를 반환하는 then

`promise.then().catch()`는 언뜻 최초의 promise 객체를 체이닝하는 것처럼 보이지만

각각의 메서드는 새로운 promise 객체를 반환한다.

```javascript
var promise = new Promise(resolve => {
    resolve(100)
});
var thenPromise = promise.then(value => { 
    console.log(value)
});
var catchPromise = thenPromise.catch(error => {
    console.error(error)
});

console.log(promise === thenPromise); // false
console.log(thenPromise === catchPromise); // false
```
**항상 이 구조를 의식하고 개발 할 것!!**

```javascript
/*
 * then()으로 등록한 함수가 동시에 호출됨
 */
var aPromise = new Promise(resolve => {
    resovle(100);
});

aPromise.then(value => {
    return value * 2;
});

aPromise.then(value => {
    return value * 2;
});

aPromise.then(value => {
    console.log('1: ' + value); // 100
});

/*
 * then()으로 등록한 함수가
 * promise 체인의 순서대로 호출됨
 */
 var bPromise = new Promise(resolve => {
    resolve(100);
});

bPromise.then(value => {
    return value * 2;
}).then(value => {
    return value * 2;
}).then(value => {
    console.log('2: '+ value); // 400
});
```

`aPromise`는 체인으로 연결하지 않았다.

그걸과 `then()`에 등록된 각 콜백 함수는 동시에 호출되므로 `value`가 모두 100이다.

`bPromise`는 체이닝을 통해 value가 전달된다.(당연히 첫번째 방식은 안티패턴)

```javascript
function anAsyncCall() {
    let promise = Promise.resolve();

    promise.then(() => {
        // do something...

        return newVar;
    });

    return promise;
}
```

위 안티패턴처럼 작성하면 `then()`처리 중 어떤 오류가 발생했을 때 감지할 방법이 없다.

또한 특정 결과값을 반환하더라도 전달받을 수 없다.(newVar)

```javascript
function anAsyncCall() {
    let promise = Promise.resolve();

    return promise.then(() => {
        // do something...

        return newVar;
    });
}
```

### 3.3 예외 처리가 되지 않는 onRejected

`catch()`를 사용하지 않고, `then()`만 사용하였을 시 발생할 수 있는 문제

```javascript
function throwError(value){
    // 코드 진행 중 에러 발생
    throw new Error(value);
}

// onRejcted가 호출되지 않는다
function badMain(onRejected){
    return Promise.resolve(32).then(throwError, onRejected);
}

// 예외 발생시 onRejcted 호출
function goodMain(onRejected){
    return Promise.resolve(32).then(throwError).catch(onRejcted);
}

badMain(() => { console.log('BAD!') });

goodMain(() => { console.log('GOOD!!') });
```

`onRejected()`의 대상은 `then()`을 이용해 등록한 `throwError`가 아니라

이전 promise 객체의 대한 처리이므로 차이가 발생한다.

앞선 `then()`,`catch()`가 새로운 `promise`객체를 생성한다는 설명과 일맥상통한다. 

### 3.4 콜백-헬과 무관한 Promise

콜백헬을 완화할 수 있을 뿐 해결할 순 없다.

- 단일 인터페이스
- 명확한 비동기 시점 표현
- 강력한 에러 처리 메커니즘

위 같은 특징은 콜백헬 뿐만 아니라 비동기 처리 자체를 쉽게 다룰 수 있게 하기 위함이다.

```javascript
// 전통적 콜백

/**
 * 커피 주문
 * @param { string } menu
 * @param { function } callback
 */
function order(menu, callback){
    getGreenBeans(menu, function(err, greenBeans){
        if(err){
            callback(err);
        } else {
            doRoasting(greenBeans, function(err, blackBeans){
                if(err){
                    callback(err);
                } else {
                    createCoffee(menu, blackBeans, function(err, coffee){
                        callback(err, coffee);
                    });
                }
            });
        }
    });
}

order('Americano', function(err, coffee){
    if(err) throw err;
    console.log('have ' + coffee);
});
```
```javascript
// Promise

/**
 * 커피 주문
 * @param { string } menu
 * @returns { Promise }
 */
function order(menu){
    return getGreenBeans(menu).then(function(greenBeans){
        return doRoasting(greenBeans);
    }).then(function(blackBeans){
        return createCoffee(menu, blackBeans);
    });
}

order('Americano').then(function(coffee){
    console.log('have ' + coffee);
}).catch(function(err){
    console.error(err.message);
});
```

예제에서 `order()`는 프로미스 객체를 반환한다. 중첩없는 형태로 변환했을 뿐

콜백헬 문제를 해결했다고 보기 어렵다.(전보다 아주 조금 깔끔해지긴 했다)

> 프로미스는 미래 어느 시점이 되면 값을 채워주기로 약속한 빈 그릇이며
>
> 비동기 처리를 추상화한 추상 컨테이너다. 즉, 통일된 인터페이스로 데이터를 전달할 수 있는
>
> 컨테이너로써 장점을 발휘하는 것이다. 중첩을 해결하고 프로미스 체인을
>
> 길게 연결하는 것은 외형의 느낌만 다를 뿐 콜백헬과 큰 차이가 없다.

```javascript
function somePromise(){
    return Promise.reject(true).then(function(value){
        // do something...
    }).then(function(value){
        // do something...
    }).then(function(value){
        // do something...
    }).then(function(value){
        // do something...
    }).catch(function(err){
        // do something...
    });
```

**본질적으로 콜백 패턴과 프로미스 패턴이 해결하고자 하는 것은 같다.**

**두 패턴 모두 비동기 처리를 손쉽게 다루기 위함이다**

이벤트 리스너, 스트림처럼 정기적/지속적으로 비동기 처리가 필요한 경우

프로미스는 되려 이상한 결과를 초래한다. 강력한 에러 처리 메커니즘도 독이 될수 있다.

---

긴 중첩의 콜백이나 긴 체이닝의 프로미스 모두 함수 하나의 책임이 거대하다는 뜻이다.

즉, 분석/설계가 전혀 이루어지지 않았고 구조가 망가져 있음을 뜻한다.

order > greeBeans > Roasting > blackBeans > coffee

이 흐름을 분석하여 3가지 객체를 추출한다.

- 주문을 위한 커피전문점
- 로스팅을 위한 로스터기
- 생두를 보관하는 창고

```javascript
/**
 * 생두 저장소 객체
 * @namespace
 */
var beansStorage = {
    
    /**
     * 메뉴에 해당하는 생두를 반환한다.
     * @params {string} type
     * @returns {Promise}
     */
    get: (type) => {
        return new Promise((resolve, reject) => {
            if(type === '케냐'){
                resolve('생두');
            } else {
                reject('불분명한 원산지 입니다.');
            }
        });
    }
}
```

다음은 로스터기 객체

```javascript
/**
 * 로스터 객체
 * @namespace
 */
var roaster = {
    /**
     * 생두를 로스팅하여 원두를 반환
     * @params {string} greenBeans
     * @returns {Promise}
     */
    execute: (beanType) => {
        return beansStorage.get(beanType).then(greenBeans => {
            return new Promise((resolve, reject) => {
                if(greenBeans === '생두'){
                    resolve('원두');
                } else {
                    reject('생두가 아닙니다');
                }
            });
        });
    }
}
```

로스터 객체의 `execute()`는 `beansStorage` 객체를 통해 생두를 가져와 로스팅하고

최종적으로 원두를 반환한다. 마지막 커피전문점 객체를 작성해보자

```javascript
/**
 * 커피하우스 객체
 */
var coffeehouse = {

    /**
     * 커피를 주문한다.
     * @params {string} menu
     * @returns {Promise}
     */
    order: (menu) => {
        return roaster.execute('케냐').then(blackBeans => {
            return new Promise((resolve, reject) => {
                if(menu === '아메리카노' && blackBeans === '원두'){
                    resolve('따뜻한 아메리카노 한잔');
                } else {
                    reject(new Error('알 수 없는 메뉴입니다.'));
                }
            });
        });
    }
};
```

```javascript
// 주문
coffeehouse.order('아메리카노').then(coffee => {
    console.log(coffee);
}).catch(err => {
    console.error(err.message);
});
```

#### 책임 및 관심사 별로 나누어 추상화하고 객체를 설계

프로미스의 장점을 느끼기 위해선 이렇게 분석 및 설계를 통한 모듈화가 선행돼야 한다.

**깊은 콜백 중첩으로 이미 망가진 곳에 프로미스로 해결하려 노력하는것은 헛수고다.**

### 3.5 정리

1. 프로미스 또한 비동기로 처리

2. `then()`, `catch()`모두 새로운 프로미스객체 반환 

3. `then(onFulfilled, onRejected)`에서 `onFulfilled`에서 발생한 예외가 `onRejected`에서 감지되지 않음