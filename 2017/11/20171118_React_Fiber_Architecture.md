# React Fiber Architecture

> _원문 : [React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture)_

### 사전 지식

아래 글을 읽어보길 **강력하게 권장**한다.

1. [React Component, Elements and Instances](https://reactjs.org/blog/2015/12/18/react-components-elements-and-instances.html) - "Component"는 자주 여러번 사용된다. 이 용어를 정확히 파악해야한다. _[(번역보기)](https://github.com/goohooh/TIL/blob/master/2017/11/20171111_React_Components_Elements_Instances.md)_

1. [Reconciliation](https://reactjs.org/docs/reconciliation.html) - 고수준의 리액트 reconciliation 알고리즘 명세 _[(번역보기)](https://github.com/goohooh/TIL/blob/master/2017/11/20171109_React_Reconciliation.md)_

1. [React Basic Theoretical Conceps](https://github.com/reactjs/react-basic) - 리액트의 개념 모델 상세 _[(번역보기)](https://github.com/goohooh/TIL/blob/master/2017/11/20171112_React_Basic_Theoretical_Concepts.md)_

1. [React Design Principles](https://reactjs.org/docs/design-principles.html) - "Scheduling" 섹션을 주의 깊게 일어 보라. 왜 리액트 Fiber인지 잘 설명해준다. _[(번역보기)](https://github.com/goohooh/TIL/blob/master/2017/11/20171117_React_Design_Principles.md)_


## Review

몇가지 컨셉을 리뷰해보자.

#### reconciliation이란?

<dl>
	<dt>reconciliation</dt>
	<dd>리액트에서 하나의 트리와 다른 하나의 트리의 차이별로 변경해야할 부분을 결정하는 알고리즘.</dd>
</dl>

<dl>
	<dt>update</dt>
	<dd>리액트 앱을 그릴때 사용되는 데이터의 변경. 일반적으로 `setState`의 결과. 결과적으로 다시 렌더링함.</dd>
</dl>

리액트 API의 핵심 아이디어는 업데이트를 전체 앱이 다시 렌더링 되는 것으로 여기는 것이다.
이는 개발자가 어떻게 하면 어플리케이션에서	어떠한 특정 state에서 또다른 state로의 변경이 효율적으로 일어나게할지 고민 하기 보다 선언적으로 추론할 수 있게 해준다. 

실제로 매 변경마다 전체 앱을 다시 그리는 것은 평범한 앱에서만 효과적이다.
실제 앱들에서는 성능에 엄청난 비용을 치루어야 한다.
리액트는 성능을 유지하면서 전체 앱들 다시 그리는 모습을 만드는 최적화 기능을 가지고 있다.
이런 다량의 최적화는 **reconciliation**이라 불리는 프로세스의 일부다.

Reconciliation은 널리 알려진 "버추얼 DOM" 뒤에서 동작하는 알고리즘이다.
고 수준 명세에는 이와같이 설명한다: 리액트 어플리케이션을 렌더링할 때,
앱을 설명하는 노드들의 트리가 생성되고 메모리에 저장된다. 이 트리는 렌더링 환경으로 넘어간다. 브라우저 어플리케이션을 예로 들어, 이는 곧 일련의 DOM 작업으로 변환된다. 앱이 업데이트되고(일반적으로 `setState`에 의해), 새로운 트리가 만들어진다. 이 새로운 트리는 이전 트리와 구분되어 렌더링 된 앱을 업데이트하는 데 필요한 작업을 계산한다.

비록 Fiber가 reconciler을 갈아 엎지만, 리액트 문서에 설명된 고 수준의 알고리즘은 대체로 동일하다. 키포인트는:

 - 다른 컴포넌트 타입은 대체로 다른 트리들을 생성한다고 가정한다. 리액트는 그들을 분별하지 않지만, 예전 트리를 완전히 대체한다.

 - 목록들의 Diffing은 키를 가지고 수행된다. 키는 반드시 "안정적이고 예측가능하며 독자적"이어야 한다.

#### Reconciliation versus rendering

DOM은 그저 리액트가 그릴수 있는 렌더링 환경 중 하나일 뿐이며, 다른 대상으로는 리액트 네이브를 통한 기본 iOS 및 안드로이드 뷰가 있다. ("버추얼 DOM"는 약간 잘못된 이름이다)

이처럼 다양한 대상을 지원할 수 있는 이유는 리액트가 reconciliation과 렌더링이 분리된 단계로 디자인 됐기 때문이다. reconciler는 트리의 어느 부분이 변경됐는지 계산하는 작업을 수행한다. 그리고나면 렌더러는 해당 정보를 이용하여 실제로 렌더링된 앱을 업데이트 한다.

이러한 분리 체계는 리액트 코어가 제공하는 같은 reconciler를 공유하며 React DOM과 React Native가 그들만의 렌더러를 사용할 수 있음을 의미한다.

Fiber는 reconciler를 재구현하는 것이다. 비록 렌더러가 새로운 아키텍처를 지원(및 활용)하기 위해 변경되야 하지만, 렌더링에 관련된 것은 아니다.

#### Scheduling

<dl>
	<dt>scheduling</dt>
	<dd>작업 수행시기를 결정하는 프로세스</dd>
</dl>

<dl>
	<dt>work</dt>
	<dd>어떠한 계산도 수행되어야 함. 작업은 일반적으로 업데이트의 결과임(예: `setState`)</dd>
</dl>

리액트의 디자인 원칙 문서에는 이 주제가 잘 설명돼있다. 키포인트는:

 - UI에서, 모든 업데이트가 즉시 적용되는건 중요치 않다; 사실 그러한 동작은 불필요하다, 프레임저하를 일으키고 사용자 경험을 저해한다.

 - 다른 유형의 업데이트는 다른 중요도를 가진다: 에니메이션 업데이트는, 예를 들어 저장소의 업데이트보다 빨리 완료되어야 한다.

 - 푸시-기반 접근법은 어떻게 작업을 계획해야할지 (당신, 프로그래머)에게 요구한다. 풀-기반 접근법은 당신을 위해 이러한 결정을 프레임워크(리액트)가 똑똑하게 처리하도록 허용한다.

리액트는 현재 중요한 방식으로써 스케쥴링을 활용하지 않고있다; 모든 서브 트리의 업데이트 결과는 즉시 리렌더링 된다. 스케쥴링의 이점을 얻기위해 리액트의 코어 알고리즘을 손보는 것은 곧 Fiber의 원동력이다.

---

이제 Fiber의 구현으로 넘어갈 준비가 됬다. 다음 섹션은 우리가 논의 했던것들 보다 좀더 기술적이다. 

## Fiber란?

우린 리액트 Fiber의 아키텍처에 관해 논의하고 있다. Fiber는 어플리케이션 개발자가 전형적으로 생각하는 것 이상으로 lower-level의 추상화다. 이를 이해하려는데 어려움을 느낀다 해도, 실망하지 않아도 된다. 계속 시도하면 결국 알아낼 수 있다.(그런날이 온다면, 이 섹션을 어떻게 개선할지 제안해주면 고맙겠다)

ㄱㄱ

---

이전에 Fiber의 핵심 목표가 스케쥴링의 이점을 얻는 것이라 확인했다. 구체적으로 우리는:

- 작업을 멈추가 나중에 다시 돌아와야 한다.
- 다른 유형의 작업에 중요도를 할당한다.
- 이전에 완료된 작업을 재사용한다.
- 더이상 필요하지 않은 작업은 중단한다.

이를 위해 우리는 먼저 작업을 단위로 쪼개는 방법이 필요하다. 한 가지 의미로, 그것이 Fiber(섬유)다. Fiber는 작업 단위를 나타낸다.

더 나아가기 위해, [React component as functions of data](https://github.com/reactjs/react-basic#transformation) 개념을 돌아가본다. 

	v = f(d)

리액트 앱을 렌더링하면 본문에서 다른 함수를 호출하는 등을 포함해 함수를 호출하는 것과 비슷하다. 이러한 유사성은 fiber에 관해 생각해볼때 유용한다.

전형적으로 컴퓨터가 프로그램 실행을 추적하는 방식은 콜 스택이다. 함수를 실행하면, 새로운 스택 프레임이 스택에 추가된다. 그 스택 프레임은 함수에 의해 실행되는 작업을 나타낸다.

UI를 다룰 때 문제는 한번에 실행할 작업이 너무 많다는 것이다. 이는 애니메이션 프레임저하나 보기 조잡해보이는 이유가 된다. 게다가, 일부 작업은 최근에 업데이트된 것으로 대체됨으로 인해 불필요해 질 수도 있다. 여기서 UI 컴포넌트들과 함수의 비교가 의미 없어 진다. 컴포넌트는 일반적인 함수에 비해 상세한 고려 사항이 많기 때문이다.

새로운 브라우저들(그리고 리액트 네이티브)은 정확이 앞선 상황과 같은 문제를 해결하기위한 API를 구현했다: `requestIdleCallback`은 낮은 중요도를 가진 함수를 한가한 때에 호출하도록 스케쥴링한다. 그리고 	`requestAnimationFrame`은 높은 중요도를 가진 함수를 다음 애니메이션 프레임에 호출하도록 스케쥴링한다. 여기의 문제는 이런 API를 사용함에 있어, 당신에게 렌더링 작업을 증대 단위로 쪼개는 방법이 필요하다는 것이다. 당신이 콜스택에만 의존한다면, 스택이 비어있을 때까지 계속 작업을 수행해야 한다.

우리가 UI렌더링 최적화를 위한 콜 스택 동작을 커스터마이징 한다면 꽤 멋지지 않겠는가?
우리가 원하는대로 콜 스택을 중단하고 스택 프레임을 수동으로 조작할 수 있다면 멋지지 않겠는가?

그것이 바로 Fiber의 목적이다. Fiber는 리액트 컴포넌트에 특화된 스택의 재구현이다. 단일 Fiber를 **가상의 스택 프레임**이라 봐도 좋다.

스택을 재 구현함으로써 얻는 이득은 [메모리에서 스택 프레임을 유지](https://www.facebook.com/groups/2003630259862046/permalink/2054053404819731/)할 수 있다는 것과 어떤식으로든(또 언제든) 원한다면 그들을 실행할 수 있다는 것이다. 이는 스케쥴링을 위해 달성해야할 중대한 목표가 된다.

스케쥴링을 제외하고, 손수 스택프레임을 처리하면 동시성과 에러 바운더리 같은 기능의 잠재력이 해제된다. 이후 섹션에서 이 주제를 다룰것이다.

다음 섹션에서, fiber의 구조를 더 보게될것이다.

#### Structure of a fiber

_Note: 구현 세부 사항을 더 자세히 볼때, 무언가 바뀔 가능성이 농후하다. 혹여 잘못되거나 outdated된 정보를 본다면 PR을 부탁한다_

구체적으로 fiber는 컴포넌트와 컴포넌트의 입출력에 관한 정보를 포함한 자바스크립트 객체다.

fiber는 스택 프레임과 상응하면서도 또한 컴포넌트의 인스턴스와도 상응한다.

다음은 fiber에 속한 몇가지 중요한 필드들이다.(이 목록은 완전하지 않다)

##### `type` 과 `key`

fiber의 type과 key는 그것들이 리액트 element에서 행동하는 것처럼 동일한 목적을 수행한다.
(실제로, fiber가 element로부터 만들어 질 때, 이 두 필드는 직접 복사된다)

fiber의 type은 해당 컴포넌트를 나타낸다. 합성된 컴포넌트들에선, 이 type은 그 함수 혹은 클래스 컴포넌트 그 자체다. 호스트 컴포넌트들(div, span 등)에서 type은 문자열이다.

개념상, type은 스택 프레임에 의해 실행이 추적되는 함수(v = f(d)처럼)다.

type과 함께, key는 fiber가 재사용 될지 말지 결정되는 reconciliation 중에 사용된다.

##### `child` and `sibling`

이 두 피드는 또 다른 fiber를 가리키며, fiber의 재귀 트리 구조를 명세한다.

이 child fiber는 컴포넌트의 렌더 메서드에 의해 리턴된 값에 상응한다.
```javascript
function Parent() {
	return <Child />
}
```

`Parent`의 자식 fiber는 `Child`에 해당한다.

sibling 필드는 렌더 메서드가 다양한 children을 리턴하는(Fiber의 새로운 기능) 경우를 설명한다.
```javascript
function Parent() {
	return [<Child1 />, <Child2 />]
}
```

자식 fiber는 헤드가 첫번쨰 자식인 singly-linked list 형태를 취한다.
`Parent`의 자식은 `Child1`과 `Child1`의 형제인 `Child2`다.

함수 비유로 돌아가서, 자식 fiber를 [꼬리 호출 함수](https://en.wikipedia.org/wiki/Tail_call)로 생각할 수 있다.

##### `return`

리턴된 fiber는 프로그램이 현재 fiber를 처리한 후 리턴해야하는 fiber이다.
이는 개념적으로 스택 프레임의 리턴 주소와 같다. 또한 부모 fiber로 생각할 수도 있다.

fiber가 다양한 자식 fiber를 가진다면, 각 자식 fiber의 리턴된 fiber는 그 부모다.
이전 섹션의 예시를 보면 리턴된 fiber `Child1` and `Child2`는 곧 `Parent`다.

##### `pendingProps` and `memoizedProps`

개념상, props는 함수의 인자다. fiber의 `pendingProps`는 fiber의 실행이 시작될때 설정되고, `mepoizedProps`는 종료될 때 설정된다.

들어온 `pendingProps`가 `memoizedProps`와 동일할 때, fiber의 이전 출력물을 재사용해도 된다는 신호로 불필요한 작업을 사전에 차단할 수 있다.

##### `pendingWorkPriority`

작업의 중요도를 가르키는 숫자는 fiber에 의해 나타난다. ReactPriorityLevel(링크 깨짐, 최신 버전에서 해당 모듈을 아직 찾지 못함) 모듈은 서로 다른 우선 순위와 그 의미를 나열한다.

`NoWork`(0의 경우)를 제외하고 큰 숫자는 낮은 우선순위를 나타낸다.
다음 함수를 사용하여 fiber의 우선 순위가 주어진 수준 이상인지 여부를 확인할 수 있다.

```javascript
function matchesPriority(fiber, priority) {
  return fiber.pendingWorkPriority !== 0 &&
         fiber.pendingWorkPriority <= priority
}
```

> _위 함수는 이해를 돕기위한 예제일뿐 실제 리액트 fiber의 코드베이스에 존재하지 않는다_

스케쥴러는 수행할 다음 작업 단위를 찾기위해 priority 필드를 이용한다. 이 알고리즘은 future 섹션에서 논의중이다.

##### `alternate`

<dl>
	<dt>flush</dt>
	<dd>fiber를 flush 하려는 것은 fiber의 결과물을 화면에 렌더링하기 위함이다. </dd>
</dl>

<dl>
	<dt>work-in-progress</dt>
	<dd>아직 리턴되지 않은 스택 프레임</dd>
</dl>

컴포넌트 인스턴스는 언제나 최대 2개의 fiber를 가진다: 현재, flush된 fiber, work-in-progress fiber

현재 fiber를 대체하는건 work-in-progress이며, 그 반대도 성립한다.

fiber의 교대는 `cloneFiber`라 불리는 함수를 통해 천천히 만들어진다.
항상 새로운 객체를 생성하기 보다, fiber의 대체물이 존재하면 이를 재사용하여 할당을 최소화 한다.

alternate 필드의 구현 세부 사항으로 생각해야 하지만, 코드베이스에서 충분히 자주 튀어나오므로 여기서 논의하는것이 중요하다.


##### `output`

<dl>
	<dt>host component</dt>
	<dd>리액트 어플리케이션의 잎사귀 노드. 렌더링 환경에 특화돼있다. 브라우져 앱에서 `div`, `span` 같은 것이다. JSX에서 소문자 태그네임으로 표시된다.</dd>
</dl>

개념적으로, fiber의 output은 함수의 리턴값이다.

모든 fiber는 결과적으로 output을 가지지만, **host component**들로 이루어진 잎사귀 노드에 의해서만 output이 만들어진다. 이후 output은 트리 위로 전송된다.

output은 결국 렌더링 환경에 대한 변경 사항을 플러시 할 수 있도록 렌더러에 제공된다. 출력이 생성되고 업데이트되는 방법을 정의하는 것은 렌더러의 책임이다.

## Future sections

이 문서는 거의 완성되지 않았다. 향후 섹션에서는 업데이트의 수명주기 전반에 걸쳐 사용되는 알고리즘을 설명한다. 다루는 주제는 다음과 같다.

- 어떻게 스케쥴러가 수행할 다음 작업 단위를 찾는지
- 어떻게 우선순위가 fiber 트리를 통해 전파되고 추적되는지
- 어떻게 스케쥴러가 언제 작업을 멈추고 재개 하는지 알수 있는지
- 어떻게 작업이 flush 되고 완료 표시가 되는지
- 어떻게 사이드 이펙트(생명순환주기 메서드 같은)가 동작하는지
- coroutine이 무엇이고 어떻게 그것이 context나 layout같은 기능을 구현하는데 어떻게 사용될 수 있는지

## 관련 영상

- [What's next for React (ReactNext 2016)](https://www.youtube.com/watch?v=aV1271hd9ew&feature=youtu.be)