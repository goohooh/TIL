# JavaScript Promise
> 한빛미디어 [리얼타임] JavaScript Promise

## 1. Promise 정의

### 1.1 API

```javascript
/* Constructor */
let promise = new Promise((resolve, reject) => {
    // 비동기 처리
    // 처리 완료 후 resolve 혹은 reject 호출
})

/* Instance method */
promise.then(onFulfilled, onRejected) // 각각 옵션 인자이므로 생략 가능
promise.catch(onRejcted)

/* Static method */
Promise.all()
Promise.resolve()
```

### 1.2 Workflow

```javascript
// 프로미스 인스턴스 리턴
function asyncFunction(){
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('Async Hello World!');
        }, 20)
    });
}

asyncFunction().then(value => {
    console.log(value)
}).catch(error => {
    console.error(error);
})
```
대부분의 상황에서 catch가 호출 되지 안는다.

만아~안약에 setTimeout을 지원하지 않는 환경이라면 catch가 호출 된다.

`then(onFulfilled, onRejected)`형으로 대체 작성 가능.

```javascript
asyncFunction().then((value) => {
    console.log(value)
}, (error) => {
    console.error(error)
})
```

### 1.3 상태

프로미스 인스턴에는 3가지 상태 존재

- `Pending(unresolved)`

- `Fulfilled(has-resolution)` : Settled 상태(Pending과 대응)

- `Rejected(has-rejection)` : Settled 상태(Pending과 대응)

상태를 직접 다룰수 없고, 이름만으로도 쉽게 파악 가능

중요한 것은 *Pending상태에서 한번 Fulfilled나 Rejcted가 되면 다시는 변하지 않는다.*

이벤트리스너와 달리 `then`으로 등록한 콜백 함수가 한번만 호출되는 것이다.

