# JavaScript Promise
> 한빛미디어 [리얼타임] JavaScript Promise

## 2. Promise 사용

### 2.1 Promise.resolve

```javascript
// new 생성자보다 편리하게 쓸 수 있다.
Promise.resolve(42).then(value => {
    console.log(vale)
})
```

**`Promise.resolve()`는 thenable 객체를 프로미스 객체로 변환할 수 있다.**

유사 배열처럼, `thenable`은 `then`메서드를 가진 객체를 뜻한다.

대표적 `thenable`객체는 `jQuery.ajax()`가 반환하는 `jqXHR` 객체다.

`thenable`객체의 `then`이 프로미스의 `then`과 같을 것이라 기대하고

프로미스 객체로 변환한다. 일단 프로미스 객체로 만들었다면 ES6 Promise의

`then`과 `catch`를 사용할 수 있게된다.

```javascript
let promise = Promise.resolve($.ajax('http://some.url/get'));

promise.then(value => {
    console.log(value);
})
```

#### jQuery와 thenable

`jqXHR`객체는 Deffered Object를 상속한다. 하지만 Deffered Object는

Promise/A+나 ES6 Promise 스펙을 따른것이 아니므로 프로미스 객체 변환 후

특정 처리에서 문제가 발생할 수 있다.(Deffered의 then과 Promise의 then의 동작 차이에서 기인)


### 2.2 Promise.reject

```javascript
new Promise((resolve, reject) => {
    reject(new Error('오류'));
}).catch((error) => {
    console.error(error.message);
});

// Promise.resolve와 동일하다

Promise.reject(new Error('오류')).catch((error) => {
    console.error(error.message);
});
```


### 2.3 Promise.prototype.then

기본적으로 프로미스는 비동기 처리를 **쉽게** 다룰 수 있도록 해주는 것이다.
체인은 짧을수록 좋다. 가상 코드를 통해 체인의 흐름을 본다면

```javascript
function taskA(){ console.log('Task A') }
function taskB(){ console.log('Task A') }

function onRejected(error){ console.log('Catch Error : A or B', error) }
function finalTask(){ console.log('Final Taskk') }

let promise = Promise.resolve();
promise
    .then(taskA)
    .then(taskB)
    .catch(onRejected)
    .then(finalTask);

/*
 *  Task A
 *  Task B
 *  Final Task
 */
```

1. Task A/B를 처리하던 중 에러 발생 -> catch
1. 주의할 점: onRejected와 Final Task 처리 중 예외가 발생할 경우 감지 할 수 없다.

```javascript
function finalTask(){ 
    throw new Error('Final Task 처리 중 에러');
    console.log('Final Taskk') 
}

let promise = Promise.resolve();
promise
    .then(taskA)
    .then(taskB)
    .catch(onRejected)
    .then(finalTask);

// 예외가 발생했음을 알 수 없다.
// 개발도구에 출력되지 않는다.
```
> 이해를 위해 예외 처리시 throw 구문을 사용했지만 Rejected 상태인 
> 
> promise 객체를 반환하면 되므로 reject()사용을 권장한다. 이후에 다룰 예정

Task A 처리 중 예외가 발생한다면 task B는 실행되지 않고 catch로 넘어간다.

---

```javascript
function doubleUp(value) { return value * 2 }
function increment(value){ return value + 1 }
function output(value) { console.log(value) }

let promise = Promise.resolve(1);
promise
    .then(increment)
    .then(doubleUp)
    .then(output); // 4
```

반환 값으로는 숫자, 문자열, 객체뿐만 아니라 `promise`객체도 가능하다.

반환 값은 `Promise.resolve(반환값)`처럼 처리되기 때문에 무엇을 반환하더라도

최종적으로는 새로운 `promise` 객체가 반환 된다.

##### 즉, `then()`은 단순히 콜백함수를 등록하는 것뿐 아니라 콜백에서 반환받은 값을 기준으로

##### 새로운 `promise`객체를 생성하여 전달하는 기능도 하고 있다.

---

#### 복수의 xhr요청 예시

```javascript
// 전통적 콜백 스타일

function getURLCallback(URL, callback){
    var req = new XMLHttpRequest();

    req.open('GET', URL, true);

    req.onload = function(){
        if(req.status == 200){
            callbck(null, req.responseText);
        } else {
            callback(new Error(req.statusText), req.response);
        }
    };

    req.onerror = function() {
        callback(new Error(req.statusText));
    };

    req.send();
}

function jsonParse(callback, error, value){
    if(error){
        callback(error, value);
    } else {
        try {
            var result = JSON.parse(value);
            callback(null, result);
        } catch(e){
            callback(e, value);
        }
    }
}

// xhr 요청
var request = {
    information: (callback) => {
        return getURLCallback(
            'http://some.url/get',
            jsonParse.bind(null, callback)
        );
    },
    cookie: (callback) => {
        return getURLCallback(
            'http://some.url/cookies',
            jsonParse.bind(null, callback)
        );
    }
};


// 복수의 xhr 요청 후 모두 완료 된 후 콜백 호출
function allRequest(requests, callback, results){
    var req = null;

    if(requests.length === 0) return callback(null, results);

    req = requests.shift();

    req((error, value) => {
        if(error){
            callback(error, value);
        } else {
            results.push(value);
        }
    });
}

function main(callback){
    allRequest([request.information, request.cookie], callback, []);
}

// run
main((error, results) => {
    if(error) return console.error(error);

    console.log(results);
})
```

- JSON.parse를 바로 사용하면 문제가 될 수 있으므로 랩핑 함수 이용(jsonParse)
- 복수의 xhr요청시 콜백이 길어지므로 다수의 요청 처리를 위한 함수 이용(allRequest)
- Node.js의 흔한 인터페이스를 차용 콜백에 error, value 순으로 전달
- 익명함수를 줄이기 위해 jsonParse에 bind 사용

위 패턴을 통해 전통적인 콜백 스타일이라도 목적에 맞게 함수를 잘 분리하면 익명함수의 사용을 줄일 수 있다.

하지만 코드를 읽다보면 신경쓰이는 부분을 발견할 수 있다.

- 예외처리 코드의 반복
- 중첩 회피를 위한 별도의 함수 필요
- 콜백의 남용 

이제 이러한 문제를 `then()`으로 해결한다. `Promise.all`, `Promise.race`라는 

스태틱 메서드가 있지만 이후에 다룰 예정이므로 `then()`만으로 해결해보자.

```javascript
function getURL(URL){
    return new Promise((resolve, reject) => {
        let req = new XMLHttpRequest();

        req.open('GET', URL, true);

        req.onload = () => {
            if(req.status === 200){
                resolve(req.responseText);
            } else {
                reject(new Error(req.statusText));
            }
        };

        req.onerror = () => {
            reject(new Error(req.statusText));
        };

        req.send();
    });
}

var request = {
    information: () => {
        return getURL('http://some.url/get').then(JSON.parse);
    },
    cookie: () => {
        return getURL('http://some.url/cookies').then(JSON.parse);
    }
};

function main(){
    let pushValue = null;

    function recordValue(results, value){
        results.push(value);
        return results;
    }

    pushValue = recordValue.bind(null, []);

    return request
        .information().then(pushValue)
        .then(request.cookie).then(pushValue)
}

main().then(value => {
    console.log(value);
}).catch(error => {
    console.error(error);
});
```

- JSON.parse를 바로 사용한다. 부가적 예외 처리가 없다.
- main()dms `promise`객체를 반환한다.
- 예외 처리는 반환된 `promise`객체에 작성한다.

### 2.4 Promise.prototype.catch

`catch()`는 promise.then(undefined, onRejected)의 래핑함수라 할 수 있다.(이미 첫번째 인자에 undefined를 등록한 형식으로)

`promise`객체가 `Rejected`상태가 됐을 때 호출될 콜백함수를 등록하기 위한 메서드이다.

#### Pollyfill

```javascript
var promise = Promise.reject(new Error('message'));

promise.catch(error => {
    console.error(error.message);
});
```

IE8 이하에서 위 코드는 "식별자를 찾을 수 없습니다."라며 Syntax Error를 뿜는다.

catch가 예약어이고 ECMAscript3에서 예약어를 객체의 프로퍼티명으로 사용할 수 없다.

IE8 이하는 ECMAscript3를 따르므로 `promise.catch`를 사용할 수 없다.

```javascript
var promise = Promise.reject(new Error('message'));

// 대괄호 표기법이나
promise['catch'](error => {
    console.error(error.message);
});

// then을 사용해 회피할 수 있다.
promise.then(undefined, error => {
    console.error(error.message);
});
```

일부 라이브러리에서 `caught`, `fail`과 같은 이름으로 `catch`와 같은 동작을 하는 메서드를 지원한다.

### 2.5 Promise.all

`promise`객체를 배열로 전달받고 객체의 상태가 모두 `Fulfilled`됐을 때 체이닝을 이어간다.

```javascript
var request = {
    information: () => {
        return getURL('http://some.url/get').then(JSON.parse);
    },
    cookie: () => {
        return getURL('http://some.url/cookies').then(JSON.parse);
    }
};

function main(){
    return Promise.all([request.information(), request.cookie()]);
}

main().then(value => {
    console.log(value);
}).catch(error => {
    console.log(error);
});
```
로직이 단순해졌다. request 요청들을 차례대로 실행하지 않고 동시에 실행되며 

결과 값의 순서 또한 `Promise.all`에 전달한 배열 순서와 동일하다.

### 2.6 Promise.race

`Promise.all`처럼 `promise`개게를 배열로 전달한다. 다른점은 하나라도 `Fulfilled`됐을 경우

다음 동작으로 넘어간다. 다음으로 넘어가도 뒤이어 `Fulfilled`된 `promise`객체들을 취소하지 않는다.

애초에 ES6 Promise 스펙에는 취소라는 개념이 없다.

`resolve()`, `reject()`를 사용한 상태 변경만 고려한다.

> 상태 변경이 있을지 알 수 없는 경우에는 `Promise`를 사용해선 안된다.

### 2.7 정리

1. `Fulfilled` 상태의 `promise`객체를 반환하는 `Promise.resolve()`

1. `Rejected` 상태의 `promise`객체를 반환하는 `Promise.reject()`

1. 상태 변경이 있을지 없을지 알수 없는 경우 적합하지 않다. 즉, `Promise`는 모든 비동기 처리 해결에 있어서 만능은 아니다.