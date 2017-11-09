# Event loop

> `keywords` : 비동기, 논블락킹, 이벤트루프

## 구성

`Call Stack`, `Web APIs`, `Callback Queue` `Render Queue`

### 동작

1. 함수는 콜스택에 쌓임
2. Web API에 해당하는 함수들(돔 이벤트, setTimeout, Ajax 통신 등)은 Web API(=브라우저)로 들어가 나의 코드와 별개로 실행
3. Web API에 콜백이 주어졌을 경우 브라우저가 해당 동작을 마치고 이 콜백들을 콜백 큐에 넘김. 
4. 이벤트 루프는 단순히 콜스택과 콜백큐를 감시함
5. 콜스택에 함수가 쌓여있지 않고 이벤트 큐에 함수가 있으면 디큐하여 스택에 쌓음 
6. 콜스택에 함수가 존재하면 렌더 큐(DOM 렌더링)는 동작하지 않음

### 비동기 콜백 사용

싱글 스레드 == 하나의 콜 스택 == 한번에 하나의 일만 처리가능

_문제_ : 콜스택 함수가 동작하는 동안 브라우저에서 인터액션이 되지 않음

```.javascript
// Synchronous
[1,2,3,4].forEach((i) => console.log(i));

// Asynchronous
function asyncForEach(array, cb){
	array.forEach(() => {
		setTimeout(cb, 0);
	});
}

asyncForEach([1,2,3,4], (i) => console.log(i));
```

1. 콜스택에서 계속적인 함수 실행 -> 렌더큐 멈춤
2. `setTimeout`으로 콜백큐에 함수를 유도함 -> 렌더큐, 이벤트큐가 번갈아가며 동작. 유저에게 좋은 UX 제공

*referrences*

- [scope, event loop](https://www.youtube.com/watch?v=QyUFheng6J0)
- [event loop](https://www.youtube.com/watch?v=8aGhZQkoFbQ)

