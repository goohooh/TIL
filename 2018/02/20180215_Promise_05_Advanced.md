# JavaScript Promise
> 한빛미디어 [리얼타임] JavaScript Promise

## 5. Promise 고급

- 프로미스로 `Web Notification API` 다루기
- `throw` 대신 `reject`를 사용해야 하는 이유
- `Deffered`와 `Promise`의 관계
- 다양한 라이브러리

### 5.1 Promise 라이브러리

#### 폴리필

- [es6-promise](https://github.com/stefanpenner/es6-promise) : `Promise/A+` 스펙을 호환하는 RSVP.js 기반의 폴리필 라이브러리
- [native-promise-only](https://github.com/getify/native-promise-only) : `ES6 Promise` 스펙을 엄격히 따르는 폴리필 라이브러리.

#### 확장 라이브러리

- [q](https://github.com/kriskowal/q) : `Promise`와 `Deferred` 구현 라이브러리. Node.js 환경을 위한 파일 API 쩨공. 다양한 환경 지원을 위한 `Q-IO` 인터페이스 제공.
- [bluebird](https://github.com/petkaantonov/bluebird) : 취소 기능, 진행 정도 파악 기능 제공.

두 라이브러리 모두 문서화가 매우 뛰어나다고 한다.

### 5.2 Promise.resolve와 Thenable

#### 5.2.1 Web Notification

- [MDN | Web Noticications](https://developer.mozilla.org/ko/docs/Web/API/notification)
- [Can I use Web Noticications](https://caniuse.com/#feat=notifications) ~~**(IE는 11도 지원이 안된다...)**~~

다음과 같이 알람 출력

```javascript
new Notification('Hi');
```

하지만 생성자로 인스턴스를 생성하기 위해서는 허가를 받아야 한다

허가 결과는 `Notification.permission`으로 알 수 있다. 값은 **`granted`**, **`denied`**가 있다.

알림 허가창은 `Notification.requestPermission` 호출로 가능하며, 사용자의 선택 결과를 콜백에 매개변수로 넘긴다.

허가한 경우에만 생성자로 알람을 할 수 있지만 불허한 경우 인스턴스를 생성해도 아무 동작을 하지 않는다.

#### 5.2.2 Web Notifications 래핑

언제나 그렇듯 먼저 콜백 스타일로 예제 진행

```javascript
function notifyMessage(message, options, callback){
    var notification = null;

    if(Notification && Notification.permission === 'granted'){
        notification = new Notification(message, options);
        callback(null, notification);
    } else if (Notification.requestPermission) {
        Notification.requestPermission(function(status){
            if(Notification.permission !== status){
                Notification.permission = status;
            }
            
            if(status === 'granted'){
                notification = new Noticications(message, options);
                callback(null, notification);
            } else {
                callback(new Error('User denied'));
            }
        });
    } else {
        callback(new Error('Doesn\'t support Notification API'));
    }
}

notifyMessage('Hi!', {}, function(error, notification){
    if(error) return console.error(error);

    console.log(notification);
})
```

다음은 프로미스로 작성

```javascript
function notifyMessageAsPromise(message, options){
    return new Promise(function(resolve, reject){
        notifyMessage(message, options, function(error, notification){
            error ? reject(error) : resolve(notification);
        });
    });
}

notifyMessageAsPromise('Hi!').then(noti => {
    console.log(noti);
}).catch(err => {
    console.error(err)
})
```

thenable 코드

```javascript
function notifyMessageAsThenable(message, options){
    return {
        then : function(resolve, reject){
            notifyMessage(message, options, function(error, notification){
                error ? reject(error) : resolve(notification);
            });
        }
    };
}

Promise.resovle(notifyMessageAsThenable('Hi')).then(function(notification){
    console.log(notification);
}).catch(function(error){
    console.error(error);
})
```

#### 5.2.3 Thenable에 대해

프로미스에 **직접** 의존하지 않지만 인터페이스는 스펙을 따르고 있으므로 **간접적**으로 프로미스에 의존한다.
이는 콜백과 프로미스 둘 다 지원하는 방법이다. 하지만 라이브러리의 API로써는 어중간한 방법이므로 자주 볼 수 있는 방식은 아니다. `thenable`객체를 사용하기 위해 사용자가 `then`이나 `Promise.resolve(thenable)`에 대한 이해가 필요하므로 공개 API보단 내부적으로 사용하는 경우가 많다.

`thenable`은 프로미스 라이브러리간 상호 변환 시 가장 많이 사용한다.

```javascript
var Q = require('Q');

// ES6 Promise
var promise = new Promise(function(resolve){
    resolve(1);
});

// Q 객체로 변환
Q(promise).then(function(value){
    console.log(value);
}).finally(function(){
    console.log('finally');
});
```

`then()`이 이기 때문에 네이티브 객체는 물론 라이브러리 객체간 변환이 가능하다. `thenable`은 보통 라이브러리 내부에서만 사용하기 때문에 자주 볼 수 없지만 프로미스에서 꼭 알아야 할 개념이다.

### 5.3 throw 대신 reject 사용

프로미스 추상화 로직은 기본적으로 `try-catch`되는 것과 동일. 

`throw`가 발생해도 프로그램은 종료되지 않고 프로미스 객체의 상태가 `Rejected`된다.

```javascript
let promise = new Promise((resolve, reject) => {
    throw new Error('message');
});

promise.catch(error => {
    console.error(error.message);
});


// 위 처럼 작성해도 되지만 reject()를 사용하는 것이 일반적이다
let promise = new Promise((resolve, reject) => {
    reject(new Error('message'));
});
```

`reject()`를 사용하면

1. 의도한 예외인지 예기치 않은 오류인지 구별할 수 있다.
2. 예를 들어 크롬 개발 도구는 예외가 발생했을 때 디버거가 자동으로 그 위치를 break하는 기능이 있다.
3. 프로미스에서 직접 `throw`한다면 디버거는 중단된다.
4. 이는 디버깅 목적과 관계없는 곳에서 중단될 수 있기 때문에 옳지 않다.

하지만 다음처럼 `then()`에서 `reject()`를 사용하고 싶은 경우엔 어떨까?

```javascript
let promise = Promise.resolve();

promise.then(value => {
    setTimeout(() => {
        // 처리가 1초 이상 지나면 reject(2)
    }, 1000);

    // 시간이 걸리는 처리 수행(1)
    somethingHardWork();
}).catch(error => {
    // 타임아웃 에러 처리(3)
})
```

then 안에서 reject를 사용하고 싶지만 콜백함수에 전달된것은 이전 프로미스 객체의 리턴값일 뿐이다.

5.5절에서 프로미스를 사용한 타임아웃 처리를 알아보겠지만 이번 절은 then에서 reject를 사용하는 법을 알아본다.

먼저 `then()`의 동작에 대해 생각해본다.

1. then()으로 등록한 콜백은 값을 반환할 수 있다.

2. 반환값은 다음 then()이나 catch()의 콜백에 전달된다.

3. **이때 반환 값은 원시 타입뿐 아니라 프로미스 객체도 가능하다**

4. 반환값이 프로미스 객체인 경우 객체의 상태에 따라 어느 함수가 호출될지 결정된다.

```javascript
let promise = Promise.resolve();

promise.then(() => {
    let retPromise = new Promise((resolve, reject) => {
        // resolve 또는 reject 호출
        reject(new Error('this promise is rejected'));
    });

    return retPromise;

    // 혹은
    return Promise.reject(new Error('this promise is rejected'));
}).then(onFulfilled, onRejected)
```

### 5.4 Deferred와 Promise

`Deferred`는 프로미스를 랩핑하고 있으며 상태를 조작할 수 있는 메서드가 구현돼있다.(프로미스를 래핑하지 않은 Deferred도 있다.)

```javascript
// Deferred 구현
function Deferred(){
    this.promise = new Promise((resolve, reject) => {
        this._resolve = resolve;
        this._reject = reject;
    }).bind(this);
}

Deferred.prototype.resolve = function (value){
    this._resolve.call(this.promise, value);
}
Deferred.prototype.reject = function (reason){
    this._reject.call(this.promise, reason);
}
```

1.3절에서 사용한 `getURL()`을 Deferred로 재작성한다.

```javascript
function getURL(URL){
    let deferred = new Deferred();
    let req = new XMLHttpRequest();

    req.open('GET', URL, true);
    req.onload = function(){
        if(req.status === 200){
            deferred.resolve(req.responseText);
        } else {
            deferred.reject(new Error(req.statusText));
        }
    };

    req.onerror = function(){
        deferred.reject(new Error(req.statusText));
    }

    req.send();

    return deferred.promise;
}

const URL = 'http://httpbin.org/get';

getURL(URL).then(value => {
    console.log(value);
}).catch(error => {
    console.error(error.message);
})
```

```javascript
// 프로미스 구현
function getURL(URL){
    return new Promise((resolve, reject) => {
        let req = new XMLHttpRequest();

        req.open('GET', URL, true):

        req.onload = () => {
            if(req.status === 200){
                resolve(req.responseText);
            } else {
                reject(new Error(req.responseText));
            }
        }

        req.onerror = () => {
            reject(new Error(req.responseText));
        }

        req.send();
    });
}
```

큰맥락은 같으며, 특수한 메서드를 이용해 상태흐름을 제어할 수 있다.

- 프로미스 구현은 비동기 로직을 `new Promise()`로 감싸고 있다.

- `Deferred`는 감싸지 않기 떄문에 중첩이 줄어든다.

- `Deferred`는 처리 중 예상치 못한 오류가 발생하면 핸들링하지 못함다.

프로미스로 구현한 `getURL()`은 프로미스 객체를 반환할 뿐 아무 작업도 하지 않는다.

전체적인 비동기 로직은 프로미스에서 추상화되며 `resolve()`, `reject()`를 호출할 시점도 알기 쉽다.

*반면* `Deferred`는 함수형으로 문제를 해결하는 것이 아니라 deferred 객체를 생성하고

임의의 시점에서 `resolve()`, `reject()`를 호출하여 문제를 해결한다.

**`Promise`는 비동기 로직과 상태를 모두 추상화한 객체이고, `Deferred`는 상태만 추상화한다.**

#### 5.4.1 정리

- `Promise`란 미래 어느 시점에 정상/비정상 처리가 완료될 것을 예약한 객체

- `Deferred`는 아직 처리가 끝나지 않았다는 상태를 가리키는 객체

- 처리가 끝났을 땐 프로미스를 이용해 결과를 취득할 수 있도록 구조화됨

### 5.5 Promise.race를 사용한 타임아웃과 XHR 취소

#### 5.5.1 타임아웃 구현

```javascript
// 일정시간이 지난 후 resolve 호출
function delayPromise(ms){
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

/*
 * 일반 setTimeout과 비교
 */
setTimeout(() => {
    alert('Elapsed 100ms');
}, 100);

delayPromise(100).then(() => {
    alert('Elapsed 100ms');
});
```

##### `Promise.race()`를 사용한 타임아웃 구현

```javascript
function timeoutPromise(promise, ms){
    let timeout = delayPromise(ms).then(() => {
        throw new Error(`Operation timed out after ${ms} ms`)
    });

    // 가장 먼저 완료된 프로미스 객체 반환
    return Promise.race([promise, timeout]);
}
```

다음과 같이 사용할 수 있다.

```javascript
let taskPromise = new Promise((resolve) => {
    // do something...

    const delay = Math.ramdom() * 2000;
    setTimeout(() => {
        resolve(delay + 'ms');
    }, delay);
});

timeoutPromise(taskPromise, 1000).then(value => {
    console.log(`taskPromise가 시간 내 완료 : ${value}`);
}).catch(error => {
    console.error('Time out', error.message);
});
```

타임아웃 시 에러를 출력하지만 이는 일반적 오류와 타임아웃을 구별하지 못한다. 따라서 두 오류를 구벼할 수 있도록 `Error`객체를 상속하여 `TimeoutError`를 정의한다.

> ES5에선 Error객체를 온전히 상속받지 못한다.(스택 트레이스)
> 
> ES6부터 class를 이용해 쉽게 상속할 수 있다.

##### error instanceof

```javascript
// 상속 구현(Speaking Javascript/Chapter 28. Subclassing Built-ins)
function copyOwnFrom(target, source){
    Object.getOwnPropertyNames(source).forEach((propName) => {
        Object.defineProperty(
            target, 
            propName, 
            Object.getOwnPropertyDescriptor(source, propName)
        );
    });

    return target;
}

function TimeoutError(){
    let superInstance = Error.apply(null, arguments);
    copyOwnFrom(this, superInstance);
}

TimeoutError.prototype = Object.create(Error.prototype);
TimeoutError.prototype.constructor = TimeoutError;
```

생성자 함수 정의 및 Error 객체를 상속하였다.

```javascript
let promise = new Promise(() => {
    throw new TimeoutError('timeout');
});

promise.catch(error => {
    console.log(error instanceof TimeoutError); // true
});
```

이제 타임아웃 오류와 일반 오류를 구별할수 있으므로 코드를 재작성한다.

```javascript
function timeoutPromise(promise, ms){
    let timeout = delayPromise(ms).then(() => {
        return Promise.reject(new TimeoutError(`Operation timed out after ${ms} ms`));
    });

    return Promise.race([promise, timeout])
}
```

#### 5.5.2 타임아웃과 XHR 취소

XHR 취소는 abort 메서드를 호출한다.

```javascript
function cancelableXHR(URL){
    let req = new XMLHttpRequest();
    let promise = new Promise((resolve, reject) => {
        req.open('GET', URL, true);

        req.onload = () => {
            if(req.status === 200){
                resolve(req.responseText);
            } else {
                reject(new Error(req.responseText));
            }
        };

        req.onerror = () => {
            reject(new Error(req.responseText));
        };
        
        req.onabort = () => {
            reject(new Error('abort this request'));
        };

        req.send();
    });

    let abort = () => {
        // 이전 리퀘스트가 진행 중이라면 중단
        if(req.readyState !== XMLHttpRequest.UNSENT){
            req.abort();
        }
    };

    return {
        promise: promise,
        abort: abort
    };
}
```

이제 취소 기능을 위한 모든 요소 (`TimeoutError`, `cancelableXHR`)를 구현했다. 흐름은 다음과 같다.

1. `cancelableXHR()`로 프로미스 객체와 `abort()`를 반환받는다.

2. `timeoutPromise()`를 사용해 promise 객체가 타임아웃 되는지 `Promise.race()`로 판단.

3. XHR 요청이 시간 내 완료된 경우 `then()`에 등록된 콜백함수가 실행된다.

4. 타임아웃된 경우 `catch()`에 등록된 콜백이 실행되고 에러 객체가 전달된다.
    - 이때 안전성을 위해 `TimeoutError` 객체인지 확인 후 `abort()` 한다.

```javascript
let object = cancelableXHR('http://httpbin.org/get');

timeoutPromise(object.promise, 1000).then(contents => {
    console.log('Contents', contents);
}).catch(error => {
    if(error instanceof TimeoutError){
        object.abort();
        return console.log(error.message);
    }

    console.log('XHR Error :', error.message);
})
```

모듈화된 코드는 좋은 가독성과 실용성, 확장성을 제공한다.

```javascript
"use strict";

let requestMap = {};

function createXHRPromise(URL){
    let req = new XMLHttpRequest;
    let promise = new Promise((resolve, reject) => {
        req.open('GET', URL, true);

        req.onreadystatechange = () => {
            if(readyState === XMLHttpRequest.DONE){
                delete requestMap[URL];
            }
        }

        req.onload = () => {
            if(req.status === 200){
                resolve(req.responseText);
            } else {
                reject(new Error(req.responseText));
            }
        };

        req.onerror = () => {
            reject(new Error(req.responseText));
        };
        
        req.onabort = () => {
            reject(new Error('abort this request'));
        };

        req.send();
    });

    requestMap[URL] = { promise, request: req };

    return promise;
}

function abortPromise(promise){
    var request;

    if(typeof promise === 'undefined') return false;

    Object.keys(requestMap).some(URL => {
        if(requestMap[URL].promise === promise){
            request = requestMap[URL].request;
            return true;
        }
    });

    if(request != null && request.readyState !== XMLHttpRequest.UNSENT){
        request.abort();
    }
}

module.exports.createXHRPromise = createXHRPromise;
module.exports.abortPromise = abortPromise
```

```javascript
const cancelableXHR = require('./cancelableXHR');

let xhrPromise = cancelableXHR.createXHRPromise('http://httpbin.org/get');

xhrPromise.catch(error => {
    // abort된 에러
});

// 프로미스 객체의 request 취소
cancelableXHR.abortPromise(xhrPromise);
```

프로미스는 흐름을 제어하는 힘이 뛰어나기 때문에 그 장점을 최대한 살리기 위해서는

하나의 함수를 작은 단위로 나누는 등, 자바스크립트에 널리 알려진 안티패턴이나 구현 규칙을

더욱 의식하며 개발해야한다.

### 5.6 Promise.prototype.done

프로미스를 구현한 많은 라이브러리에서 `Promise.porotype.done`이 구현돼 있다.

`then()`과 사용법은 같지만 프로미스 객체를 반환하지 않는다.

```javascript
var donePromise = Promise.resolve();

donePromise.done(() => {
    JSON.parse('this is not json');  // SyntaxError: JSON.parse
});

var thenPromise = Promise.resolve();

thenPromise.then(() => {
    JSON.parse('this is not json');
}).catch(error => {
    console.error(error.message) // SyntaxError: JSON.parse
});
```

- `done()`은 프로미스를 반환하지 않으므로 체이닝을 할 수 없다. 따라서 마지막 체인에 사용한다.

- `done()`에서 발생한 오류는 프로미스에서 처리돼지 않고 일반적인 방법으로 처리된다.

- 이런 메서드가 생긴 이유는, Promise에서 오류가 발생했을 때 생길 수 있는 문제 때문이다.

- 프로미스의 강력한 예외 처리 메커니즘이 의도하지 않은 오류를 더욱 복잡하게 만드는 경향이 있다.(5.3절 처럼)

```javascript
function JSONPromise(value){
    return new Promise(resolve => {
        resolve(JSON.parse(value));
    });
}

var string = 'Not json. Just string';

JSONPromise(string).then(object => {
    console.log(object);
}).catch(error => {
    // JSON.parse 에러 발생
    console.error(error.message);
});
// catch()를 제대로 사용한다면 문제가 없다.
// 하지만 이를 잊어버리면 어디서 오류가 났는지 알 수 없다.

JSONPromise(string).then(object => {
    console.log(object);
});

// 오류가 발생했는지 알 수 없다.
```

문법 오류일 경우 문제는 심각해진다.

```javascript
var string = "{}";

JSONPromise(string).then(object => {
    conosle.log(object);
});
```

`console`을 `conosle`로 잘못 표기 했으므로
`ReferenceError: conosle is not defined`에러가 출력되어야 한다.

이렇게 처리되지 않은 오류를 `unhandled rejection`이라고 한다.

라이브러리, 브라우저에 따라 이 에러가 출력되지 않을 수도 있다.

이럴때 필요한 것이 `done()`이다. (의도가 명확한 메서드로써 분명 사용점이 있어보인다.)

```javascript
"use strict";

if(typeof Promise.prototype.done === 'undefined'){
    Promise.prototype.done = (onFulfilled, onRejected) => {
        this.then(onFulfilled, onRejected).catch(error => {
            setTimeout(() => {
                throw error;
            }, 0);
        });
    }
}
```

**`done()`은 "여기서 프로미스 체인을 종료하고 에러가 날 경우 일반적 방법으로 처리한다."** 고 말하는 것과 같다.

간단히 구현할 수 있기 때문인지 ES6 사양에 채택되진 않았다.

### 5.7 Promise와 메서드 체인

#### 5.7.1 File System API 메서드 체인

> 이해를 돕기 위할 뿐 실용적인 예제는 아니다.

```javascript
"use strict";

const fs = require('fs');

function File(){
    this.lastValue = null;
}

// Static method for File.prototype.read
File.read = function FileRead(filePath){
    let file = new File();
    return file.read(filePath);
};

File.prototype.read = (filePath) => {
    this.lastValue = fs.readFileSync(filePath, 'utf-8');
    return this;
}

File.prototype.transform = (fn) => {
    this.lastValue = fn.call(this, this.lastValue);
    return this;
}

File.prototype.write = (filePath) => {
    this.lastValue = fs.writeFileSync(filePath, this.lastValue);
    return this;
}

doule.exports = File;
```

위 모듈을 다음처럼 `read()`, `transform()`, `write()` 순으로 체인할 수 있다.

```javascript
const File = require('./fs-method-chain');
const inputFilePath = 'input.txt';
const outputFilePath = 'output.txt';

File.read(inputFilePath)
    .transform(content => {
        return '>>' + content;
    })
    .write(outputFilePath);
```

`transform()`은 전달받은 값을 변경하는 메서드로 예제에서는 '>>'를 원문 앞에 추가하고 있다.

```javascript
// Promise 구현

function File() {
    this.promise = Promise.resolve();
}

File.read = (filePath) => {
    const file = new File();
    return file.read(filePath);
};

File.prototype.then = (onFulfilled, onRejected) => {
    this.promise = this.promise.then(onFulfilled, onRejected);
    return this;
};

File.prototype['catch'] = (onRejected) {
    this.promise = this.promise.catch(onRejected);
    return this;
};

File.prototype.read = () => {
    return this.then(() => {
        return fs.readFileSync(filePath, 'utf-8');
    });
};

File.prototype.transform = (fn) => {
    return this.then(fn);
}

File.prototype.write = (filePath) => {
    return this.then(data => {
        return fs.writeFileSync(filePath, data);
    });
}
```

프로미스 객체를 래핑. 

```javascript
const File = require('./fs-promise-chain');

File.read(inputFilePath)
    .transform(content => {
        return '>>' + content;
    })
    .write(outputFilePath);

// 위는 아래와 흐름이 같다

promise.then(function read(){
    return fs.readFileSync(filePath, 'utf-8');
}).then(function transform(content){
    return '>>' + content;
}).then(function write(data){
    return fs.writeFileSync(filePath, data);
});
```

두 방법의 차이는

1. 동기적 처리와 비동기(프로미스 자체가 비동기적 처리이므로)
1. 오류 핸들링. 일반적으로 `try-catch`를 사용하지만 프로미스에서는 `catch()`를 이용한다.

일반적 메서드 체인 방식에서 비동기 처리를 구현하면 오류 핸들링에큰 문제가 되기 때문에
비동기 처리가 필요한 경우 프로미스를 사용하는 것이 좋다.

Node.js에 익숙한 개발자는 메서드 체인과 비동기 처리를 보면서 `Stream`을 생각 했을 것이다.
`this.lastValue`처럼 값을 유지할 필요가 없고, 큰 파일을 처리할 때 유용하며,
프로미스를 사용했을 때 보다 고속으로 처리될 가능성이 높다.

```javascript
// stream을 이용한 read > transform > write 처리
readableSream.pipe(transformStream).pipe(writableStream);
```

즉, 비동기 처리에 항상 프로미스가 최적일 것이라는 가정은 옳지 않다.

#### 5.7.2 Promisification

JS는 동적 메서드 정의가 가능하므로, 런타임 상 기존 코드에 프로미스 메서드를 정의해 사용할 수 있다.

이런 기능을 `promisification`이라 부른다. 인터페이스가 동적으로 결정되는 건 좋지 않지만

때로는 문제해결, 효율성 등의 이유로 사용된다. ES6 스펙은 없지만 여타 라이브러리에 구현돼있다.

```javascript
const fs = Promise.promisifyAll(require('fs'));

fs.readFileAsync('myfile.js', 'utf-8').then(contents => {
    console.log(contents);
}).catch(e => {
    console.error(e.stack);
});
```

Array에 프로미스 메서드를 추가하는 객체를 정의하는 예제이다.

```javascript
"use strict";

function ArrayAsPromise(array){
    this.array = array;
    this.promise = Promise.resolve();
}

ArrayAsPromise.prototype.then = function(onFulfilled, onRejected){
    this.promise = this.promise.then(onFulfilled, onRejected);
    return this;
}
ArrayAsPromise.prototype['catch'] = function(onRejected){
    this.promise = this.promise.catch(onRejected);
    return this;
}

Object.getOwnPropertyNames(Array.prototype).forEach(function(methodName){
    let arrayMethod = null;

    // Don't overwrite
    if(typeof ArrayAsPromise[methodName] !== 'undefined'){
        return null;
    }

    arrayMethod = Array.prototype[methodName];

    if(typeof arrayMethod !== 'function'){
        return null;
    }

    ArrayAsPromise.prototype[methodName] = function(){
        let that = this;
        let args = arguments;

        this.promise = this.promise.then(function(){
            that.array = Array.prototype[methodName].apply(that.array, args);
            return that.array;
        });

        return this;
    };
});

module.exports = ArrayAsPromise;
module.exports.array = function newArrayAsPromise(array){
    return new ArrayAsPromise(array);
}
```

네이티브 Array와 ArrayAsPromise() 비교

```javascript
"use strict";

const assert = require('power-assert');
const ArrayAsPromise = require('./array-promise-chain');

describe('array-promise-chain', () => {
    function isEven(value){
        return value%2 === 0;
    }

    function double(value){
        return value * 2;
    }

    beforeEach(function(){
        this.array = [1,2,3,4];
    });

    describe('Native array', () => {
        it('cat method chain', () => {
            let result = this.array.filter(isEven).map(double);
            assert.deppEqual(result, [4, 8]);
        });
    });

    describe('ArrayAsPromise', () => {
        it('can promise chain', done => {
            let array = new ArrayAsPromise(this.array);
            array.filter(isEven).map(double).then(value => {
                assert.deepEqual(value, [4, 8]);
            }).then(done, done);
        });
    });
});
```

Native Array는 동기적으로, ArrayAsPromise는 비동기적으로 처리된다. 

Node.js의 코어 모듈을 `Promisification`하는 경우 `function(error result){}` 인터페이스를

이용해 자동으로 Promise로 래핑한 객체를 생성한다. 이처럼 통일된 인터페이스로 구현한 API는 조금 더 유용하게

`Promisification`할 수 있다.

### 5.8 Promise를 이용한 순차 처리

```javascript
let request = {
    comment: function getComment(){
        return getURL('http://httpbin.org/get').then(JSON.parse);
    },
    people: function getPeople(){
        return getURL('http://httpbin.org/cookies').then(JSON.parse);
    }
}

function main(){
    function recordValue(results, value){
        results.push(value);
        return results;
    }

    // 처리가 끝났을 때 값을 []에 push
    let pushValue = recordValue.bind(null, []);

    // promise 객체를 반환하는 함수 배열
    let tasks = [request.comment, request.people];
    let promise = Promise.resolve();

    for(let i = 0; i < tasks.length; i++){
        let task = tasks[i];
        promise = promise.then(task).then(pushValue);
    }

    return promise;
}

main().then(value => {
    console.log(value);
}).catch(error => {
    console.error(error);
});
```

먼저 `for`문을 보면, `then()`은 항상 새로운 프로미스 객체를 반환한다.

따라서 `promise = pormise.then(task).then(pushValue)`는 promise 변수에

덮어쓴다기보다 기존 객체에 처리를 추가해나간다고 보면 된다. 하지만 임시 프로미스 객체가 필요하고 매끄럽지 않다.

```javascript
function main(){
    function recordValue(results, value){
        results.push(value);
        return results;
    }

    let pushValue = recordValue.bind(null, []);
    let tasks = [request.comment, request.people];

    return tasks.reduce((promise, task) => {
        return promise.then(task).then(pushValue);
    }, Promise.resolve());
}
```

`Array.prototype.reduce`는 두 번째 매개 변수에 초기값을 지정할 수 있다.

즉, 최초의 promise로 `Promise.resolve()`를 지정하고, 첫번째 task로 request.comment가 실행된다.

Reduce에서 반환한 객체가 다음 루프에서 promise로 전달된다. 따라서 체인을 이어갈 수 있게 됐다.

이제 `for`문의 임시 promise가 필요 없으므로 `promise = promise.then(task).then(pushValue)`같은 혼란스러운 코드가 없어졌다.

**`reduce`와 `Promise` 조합은 순차적 처리 구현 시 유용하게 사용할 수 있다.**

하지만 처음 코드를 읽을 때 어떤 식으로 동작할지 알기 어렵다. 따라서 promise 객체를 반환하는

함수를 배열로 전달받아 처리하는 `sequenceTasks()`를 작성한다.

```javascript
let pushValue = null;

function sequenceTasks(tasks){
    function recordValue(results, value){
        results.push(value);
        return results;
    }

    pushValue = recordValue.bind(null, []);

    return tasks.reduce((promise, task) => {
        return promise.then(task).then(pushValue);
    }, Promise.resolve());
}

sequenceTasks([request.comment, request.people])
```

### 5.9 정리

- `Promise`를 사용하더라도 목적별로 함수를 나눠야 한다.
    + 대게 프로미스를 사용하더라도 체인을 과도하게 연결하여 작성하는 경향이 있다. 
    + 이때 전체적인 로직을 알아보기 쉽게 함수를 나누는 것이 좋다.
    + `Promise`생성자 함수나 `then()`은 고차함수이므로 목적별로 나눈 함수를 조합하기 쉽다.

- `Promise`는 비동기 처리의 해답이 될 수 없다.
    + 예를 들어 여러번 콜백을 호출하는 `Event`같은 경우 오히려 부적합 하다.
    + 어떤 비동기든 `Promise`로 해결하기 보다 현재 상황에 `Promise`가 맞는지 먼저 생각해야 한다.

---