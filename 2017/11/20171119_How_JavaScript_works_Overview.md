# How JavaScript Works: an overview of the engine, the runtime, and the call stack

> _원문 : [How JavaScript Works - 1](https://blog.sessionstack.com/how-does-javascript-actually-work-part-1-b0bacc073cf)_

## Overview

이미 대부분 V8엔진에 대해 들어봤거나, 자바스크립트가 싱글 스레드 혹은 콜백큐를 이용한다는 것을 알고있다.

이번 포스트에서 이러한 모든 컨셉의 디테일과 실제로 자바스크립트가 어떻게 동작하는지 알아볼 것이다. 이러한 디테일들을 알게되면 제공된 API를 적절히 활용하여 보다 우수한 논-블락킹 어플리케이션을 작성할 수 있게된다.

자바스크립트에 친숙하지 않더라도 이 글을 통해 왜 자바스크립트가 다른 언어에 비해 "괴상한지" 이해하게 된다.

자바스크립트를 경험한 개발자라면, 희망컨대, 당신이 실제로 매일 사용하는 자바스크립트 런타임이 어떻게 작동하지 몇가지 새로운 통찰을 얻을 수 있다.

## The JavaScript Engine

구글의 V8 엔진은 유명한 자바스크립트 엔진중 하나다. 크롬과 노드js 내부에서 쓰인다.
간단히 자바스크립트를 표현하면 힙 메모리와 콜 스택으로 이루어져 있다.

- 힙 메모리 : 메모리 할당이 일어나는 곳
- 콜 스택 : 당신의 코드로 스택 프레임이 실행되는 곳

## The Runtime

JS 개발자라면 브라우져 안에서 사용해본 적 있는(setTimeout 처럼) API가 있다. 하지만 이러한 API는 엔진이 제공해주는 것은 아니다.

그렇다면 이것들은 어디서 오는가?

복잡하더라도 더 자세한 사항을 알아보자.

앞서 본 엔진이 있고, 브라우져에서 제공하는 Web API(DOM, AJAX, setTimeout 등)이 있다.

그리고 그 유명한 **이벤트 루프**와 **콜백 큐**가 있다.

## The Call Stack

자바스크립트는 싱글 스레드 프로그래밍 언어다. 이말인 즉 하나의 콜 스택만 있고, 이는 한번에 하나만 할 수 있다는 뜻이다.

콜 스택은 프로그램에서 우리가 어디있는지를 기록하는 기본적인 데이터 구조다. 함수로 보자면 우린 함수를 스택의 맨 위에 놓는다. 함수에서 리턴되면 스택의 맨 위에서 그 함수를 밖으로 내보낸다. 이것이 스택의 전부다.

```javascript
function multiply(x, y) {
    return x * y;
}
function printSquare(x) {
    var s = multiply(x, x);
    console.log(s);
}
printSquare(5);
```

엔진이 이 코드릴 실행할 때, 스택은 비어있는 상태다. 이제 아래 절차를 밟게 된다.

1. 스택에 `printSquare(5)`가 쌓인다.
1. `printSquare`내부에서 호출된 `multiply(x, x)`가 다시 스택에 쌓인다. s에 할당되고 `multiply`는 스택에서 튀어 나간다.
1. `console.log(s)`가 호출 되므로 `console.log(s)` 스택에 쌓인다.
1. `console.log(s)`는 실행 후 스택에서 튀어 나간다.
1. 맨 아래 있던 `printSquare(5)`의 실행이 끝났으므로 스택에서 튀어 나간다.

콜 스택의 각 항목을 **스택 프레임**이라 한다.

이는 바로 예외가 던져졌을 때 스택 트레이스가 어떻게 생성되는지 보여준다. 또한 예외가 발생했을 때 기본적인 콜 스택의 상태를 나타낸다.

```javascript
function foo() {
    throw new Error('SessionStack will help you resolve crashes :)');
}
function bar() {
    foo();
}
function start() {
    bar();
}
start();
```

파일 이름을 foo.js라 가정하고 이를 실행하면

	Uncaught Error: SessionStack will help you resolve crashed - foo.js:2
		at foo (foo.js:2)
		at bar (foo.js:6)
		at start (foo.js.:10)
		at foo.js:13

**Blowing the stack** - 이는 최대 콜스택 사이즈에 다다랐을 때 발생한다. 이는 꽤 쉽게 일어난다. 특히 당신이 테스트 없이 공공연히 재귀방식을 사용했다면 더욱 그렇다.

```javascript
function foo() {
	foo();
}

foo();
```

엔진이 이 코드를 실행할 때, foo 함수를 호출하며 시작한다. 하지만 이 함수는 어떠한 종료 조건 없이 다시 자신을 호출한다. 실행이 계속 되면서 같은 함수가 콜 스택에 계속 쌓이게 되고 
결국 스택의 범위를 넘어선다. 이때 브라우져는 에러를 던진다.

멀티 스레드 환경에서 일어나는 복잡한 시나리오(예: 교착상태)를 다룰 필요가 없기 때문에 싱글 스레드에서 코드를 동작하는건 꽤나 쉽다.

하지만 싱글 스레드에서 동작하는것 또한 제한을 가진다. 자바 스크립트가 싱글 스레드이기 때문에, 상황이 느리다면 어떻게 될지 생각해보라.

## 동시성 & 이벤트 루프

콜 스택에서 함수 호출을 처리하는 데 어마어마한 시간이 소요된다면? 브라우져에서 자바스크립트로 복잡한 이미지 변환을 한다고 가정해보자.

이런 상황이 왜 문제가 되는지 질문 할 수도 있지만, 콜스택의 함수가 실행되는 동한 브라우져는 아무것도 하지 못한다. 즉 모든게 막힌다는 것이다. 브라우져가 렌더링도 하지 못하고 다른 어떠한 코드도 실행하지 못한다. 이는 앱에서 당신이 원하는 UI흐름을 방해하는 문제를 일으킨다.

이뿐만 아니라, 콜 스택에서 수많은 작업을 처리하기 시작했다면, 꽤 긴시간 동안 반응을 멈출 수도 있다. 이런 상황에서 대부분의 브라우져는 웹페이지를 종료할지 말지 묻는 오류창을 띄울것이다.

이는 UX에 치명적이다.

그렇다면 어떻게 해야 방대한 코드를 브라우져의 반응없음과 UI 블락 없이 처리할 수 있을까?
**비동기 콜백**이 그 답이다.(이에 대해 다음 파트에서 다룰 것이다)