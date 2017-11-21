# How JavaScript works: inside the V8 engine + 5 tips on how to write optimized code

> _원문 : [How JavaScript works - 2](https://blog.sessionstack.com/how-javascript-works-inside-the-v8-engine-5-tips-on-how-to-write-optimized-code-ac089e62b12e)_

## Overview

**자바스크립트 엔진**은 자바스크립트 코드를 실행하는 프로그램 혹은 인터프리터라 할 수 있다. JS엔진은 일반적인 인터프리터 혹은 일부 형식에서 자바스크립트를 바이트코드로 컴파일하는 just-in-time 컴파일러로 구현할 수 있다.

다음은 유명한 JS엔진 프로젝트들이다.

- V8 : 오픈소스, 구글에서 만듬. C++로 작성
- Rhino : 오픈소스, 모질라 재단에서 운영, 전부 Java로 개발
- SpiderMonkey : 넷스케이프 네비게이터에 쓰인 첫번째 JS엔진, 현재 파이어폭스에 쓰임
- JavaScriptGore : 오픈소스, 사파리를 위해 애플에서 개발됐고 니트로로 시판됨
- KJS : Harri Porten이 KDE 프로젝트의 Konqueror 웹 브라우저 용으로 개발 한 KDE의 엔진
- Chakra(JScript9) - IE
- Chakra(JavaScript) - MS Edge
- JerryScript : IOT를 위한 가벼운 엔지

등등 여러가지가 있다.

## Why was the V8 Engine created?

다른 엔진들과 달리 V8은 노드js 런타임에도 쓰인다.

V8은 브라우져에서 JS의 실행 퍼포먼스를 향상시킬 목적으로 처음 고안됐다. 속도를 위해 인터프리터를 사용하는 대신 JS코드를 보다 효율적인 기계어로 변환한다. 이러한 변환은 스파이더 몽키나 라이노같은 모던 JS엔진에 구현된 **JIT(Just-In-Time) 컴파일러**에 의해 실행된다.

## 두개의 컴파일러를 사용하는 V8

5.9버전의 V8이 나오기 전까지, 2개의 컴파일을 사용했다

- full-codegen : 간단하고 비교적 느린 기계코드를 만드는 심플하고 매우 빠른 컴파일러
- Crankshaft : 상당히 최적화된 코드를 만드는 복잡한(Just-In-Time) 최적화 컴파일러

또한 V8은 내부적으로 몇개의 스레드를 사용한다.

- 당신이 예상하는 메인 스레드 : 당신의 코드를 가지고 가서, 컴파일 후 실행
- 컴파일링을 위해 분리된 스레드, 이로인해 코드가 최적화 되는 동안 메인 스레드가 계속 실행될 수 있음
- Crankshaft가 최적화할 수 있도록 많은 시간을 소요하는 메서드를 런타임에 Crankshaft에게 전하는 프로파일러 스레드
- 가비지 컬렉터를 위한 스레드

자바 스크립트 코드를 처음 실행할 때, V8은 full-codegen을 활용하여 파싱 된 자바 스크립트를 변환없이 기계어로 직접 번역함. 이는 매우 빠르게 기계코드 실행할 수 있게 해준다. V8이 중간 바이트코드 표현을 사용하지 않고 인터프리터의 필요성을 제거하는 방식에 주목하라.

당신의 코드가 실해에 약간의 시간이 걸린다면, 프로파일러 스레드는 어떤 메서드가 최적화 되야할지 알려줄 충분한 데이터를 수집한다.

이후, **Crankshaft**는 또 다른 스레드에서 최적화를 지삭한다. JS 추상 구문 트리를 **Hydrogen**이라 불리는 고레벨의 정적 단일 할당(SSA, Static Single-Assignment) 표현으로 변환하고 해당 Hydrogen 그래프를 최적화 하려 한다. 대부분의 최적화는 이 수준에서 끝난다,

## Inlining

첫번째 최적화는 되도록 많은 코드를 미리 inlining 하는 것이다. Inlining은 호출한 곳(함수가 호출된 줄)을 호출된 함수의 본문으로 바꾸는 작업이다. 이 작업을 통해 다음 최적화가 더욱 의미를 가지진다.

## Hidden class

자바스크립트는 prototype기반 언어다: 클래스가 없고 객체는 복사 프로세스를 이용해 만들어진다. 또한 다이나믹 프로그래밍 언어로써 이는 인스턴트화된 객체의 프로퍼티를 쉽게 더하고 지울수 있다는 뜻이다.

대부분 JS 인터프리터는 객체 프로퍼티 값을 메모리에 저장하기 위해 유사-딕셔너리 구조(해시 함수 기반)를 사용한다. 이런 구조는 자바나 C# 처럼 non-dynamic 언어 보다 프로퍼티 값을 가져오기에 더 비싼 값을 치룬다. 자바에서 모든 객체의 프로퍼티는 컴파일되기 전에 고정된 객체 레이아웃을 통해 고정되어 있고, 런타임에 동적으로 추가/삭제 되지 않는다.(C#은 동적 type을 가지고 있지만 여기서 다루지 않는다) 결과적으로 프로퍼티 값은(혹은 이러한 프로퍼티의 포인터)는 
서로 고정된 오프셋을 가진 메모리에 연속적 버퍼로 저장될 수 있다. 오프셋의 길이는 프로퍼티의 타입에 따라 결정되는데, 그렇다고 해서 JS에서 프로퍼티의 타입을 런타임중에 바꿀 수 있다는 것은 아니다.

딕셔너리를 사용해 메모리에서 객체의 프로퍼티의 위치를 찾는 것은 매우 비효율적이기 때문에, V8은 대신 다른 메서드를 사용한다:**hidden class**. Hidden Class들은 런타임중 만들어지는 점을 제외하면 자바의 고정된 객체 레이아웃(클래스)와 유사하게 동작한다.

```javascript
function Point(x, y) {
    this.x = x;
    this.y = y;
}
var p1 = new Point(1, 2);
```

한번 "new Point(1,2)"를 일으킨다면, V8은 "C0"이라 부를 hidden class를 만든다. 

![new Point(1,2)](https://cdn-images-1.medium.com/max/1600/1*pVnIrMZiB9iAz5sW28AixA.png)

아직 어떤 프로퍼티도 Point에 정의하지 않았기 때문에 "C0"은 비어있다.

처음 "this.x = x" 구문이 실행되면("Point"함수 내부에서) V8은 "C0"에 기반한 두번째 hidden class "C1"을 만든다. "C1"는 메모리에 프로퍼티 "x"를 찾을 수 있는 위치를 명세한다. 이번 경우, "x"는 오프셋 0 으로 저장된다. 이는 메모리에서 point 객체를 연속된 버퍼로 볼 때, 첫번째 오프셋이 "x" 프로퍼티에 해당함을 의미한다. V8은 만약 "x" 프로퍼티가 point 객체에 추가됐다면 "class transition" 상태로 "C0"을 업데이트 하는데, 그 hidden class는 "C0"에서 "C1"로 바뀌어야 한다. point 객체의 hidden class는 이제 아래 "C1"이다.

![switch hidden class](https://cdn-images-1.medium.com/max/1600/1*QsVUE3snZD9abYXccg6Sgw.png)

> 새 속성이 개체에 추가 될 때마다 이전 hidden class가 새 hidden class의 전환 경로로 업데이트된다. hidden class 전환은 동일한 방식으로 생성 된 개체간에 숨겨진 클래스를 공유 할 수 있으므로 중요하다. 두 객체가 hidden class를 공유하고 두 객체에 같은 속성이 추가되면 전환을 통해 두 객체 모두 동일한 새로운 hidden class와 함께 제공되는 최적화 된 코드를 모두받을 수 있다.

이러한 프로세스는 "this.y = y"구문이 실행될 때(Point 함수 내부에서 "this.x = x" 구문 이후) 반복된다.

새로운 hidden class는 "C2"라는 이름으로 만들어지고, 클래스 전환은 "y"가 Point 객체 (이미 속성 "x"가 포함되어 있음)에 추가 된 경우 "C1"의 상태에 추가된다. 이후 hidden class가 "C2"로 변경되야 하고 point 객체의 hidden class는 "C2"로 업데이트된다.

![update hidden class](https://cdn-images-1.medium.com/max/1600/1*spJ8v7GWivxZZzTAzqVPtA.png)

Hidden class 전환은 객체에 프로퍼티들이 추가되는 순서에 따라 다르다.

```javascript
function Point(x, y) {
    this.x = x;
    this.y = y;
}

var p1 = new Point(1, 2);
p1.a = 5;
p1.b = 6;

var p2 = new Point(3, 4);
p2.b = 7;
p2.a = 8;
```

이제 p1, p2 모두 같은 hidden class와 전환이 사용했으리라 가정할 것이다. 하지만 실제론 그렇지 않다. "p1"의 경우 "a" 라는 첫번쨰 프로퍼티가 추가 될 것이고 그 이후 "b"라는 프로퍼티가 추가될 것이다. 하지만 "p2" 입장에선, "b"가 첫번쨰로 할당되고, 뒤 이어 "a"가 할당된다. 그러므로 "p1"과 "p2"는 다른 전환 경로의 결과로 다른 hidden class로 끝난다. 이런 경우, hidden class를 재사용할 수 있도록 동일한 순서로 동적 프로퍼티들을 초기화하는 것이 좋다.

## Inline caching

V8은 inline caching이라 불리는 동적 타입 언어 최적화를 위한 또다른 기법을 활용한다. Inline caching은 동일한 메서드가 반복적으로 호출되는 현상이 같은 유형의 객체에서 자주 발생하는 경향이 있다는 관찰에 의존한다.(inline caching에 대한 자세한 설명은 [여기](https://github.com/sq/JSIL/wiki/Optimizing-dynamic-JavaScript-with-inline-caches))

우린 인라인 캐싱에 대한 일반적 개념을 다룰 것이다.

V8은 최근 메서드 호출에서 넘겨진 파라미터로써 객체 타입의 캐시를 유지하고, 해당 정보를 이용하여 미래에 전달될 객체 타입을 가정한다. 만약 V8이 메서드에 넘겨질 객체의 유형을 알맞게 가정할 수 있다면, 객체의 프로퍼티들에 접근하는 방법을 알아내는 대신 객체의 hidden class에 대한 이전 조회의 저장된 정보를 사용할 수 있다.

이제 hidden class와 inline caching의 연관성을 알아본다. 언제든 메서드가 특정 객체에서 호출될 때, V8 엔진은 특정 프로퍼티에 접근할 오프셋에 결정하기 위해, hidden class에대한 조회를 수행해야 한다. 동일한 hidden class에서 동일한 메서드가 성공적으로 2번 호출된 후, V8 엔진은 hidden class가 변경되지 않았다 가정하고 앞선 조회로 인해 저장된 오프셋을 이용한 특정 프로퍼티의 메모리 주소로 직접 점프한다. 이는 수행속도를 매우 증가시킨다.

Inline caching은 또한 hidden class를 공유하는 같은 유형의 객체가 어째서 중요한 지 나타내는 이유다. 앞선 예시 처럼, 다른 hidden class를 사용하는 같은 유형의 객체를 만들었다 가정했을 때, V8은 같은 타입의 객체지만 해당 hidden class들은 그들 프로퍼티들에 다른 오프셋에 할당했기 때문에 인라인 캐싱을 사용할 수 없게 된다.

![diffrent order](https://cdn-images-1.medium.com/max/1600/1*iHfI6MQ-YKQvWvo51J-P0w.png)
> 두 객체는 기본적으로 같지만 "a"와 "b" 프로퍼티의 순서가 다르다.

## Compilation to machine code

한번 Hydrogen 그래프가 최적화 되면, Crankshaft는 이를 Lithium이라 불리는 저수준 표현으로 낮춘다. 대부분읜 Lithium구현은 아키텍쳐에 따라 다르다. 레지스터 할당은 이곳에서 일어난다.

끝으로 Lithium은 기계어로 컴파일된다. 이제 OSR(on-stack replacement)이라 부르는 일이 일어난다. 우린 분명 long-running 메서드를 컴파일과 최적화 하기 전에, 이를 실행했을 가능 성이 크다. V8은 최적화된 버전으로 다시 시작하기 위해 느리게 실행되는 것을 잊지 않는다. 대신 우리는 모든 컨텍스트(스택, 레지스터)를 변환하여 실행 중간에 최적화된 버전으로 전환 할 수 있다. 이는 매우 복잡한 작업으로, 다른 최적화 중에도 V8은 처음엔 인라인으로 코드를 작성한다. V8만 이를 수행할 수있는 유일한 엔진은 아니다.

deoptimization이라 불리는 반대 변형을 만들기 위한 보호장치가 있으며, 엔진이 만든 가정이 더이상 유효하지 않은 경우 최적화 되지 않은 코드로 돌아갈 수도 있다.

## Garbage collection

V8은 Mark and Sweep의 전통적인 세대간 접근을 통해 구세대를 청소한다. Marking 단계에선 JS 실행을 멈춰야 한다. GC의 비용을 제어하고 안정적인 실행을 위해, V8은 증대적인 marking을 사용한다: 전체 힙을 돌아다니는 대신, 힙의 일부분만을 다니며 가능한 모든 객체를 마크하려 시도하고, 이후 정상 실행을 재실행한다. 그 다음 GC 중지는 이전 힙 워크 플로우가 중단된 지점부터 계속된다. 이는 정상 실행 중 매우 짧은 일시 중지을 허용한다는 뜻이다. 앞서 언급했듯, Sweep 단계는 분리된 스레드에서 처리한다.

## Ignition and TurboFan

2017년 초반 V8 5.9가 릴리즈 되면서 새로운 실행 파이프라인이 소개됐다. 새로운 파이프 라인은 실제 JS 어플리케이션에서 커다란 퍼포먼스 향상과 상당한 메모리 절감 효과를 달성했다.

새 파이프 라인은 [점화](https://github.com/v8/v8/wiki), V8의 인터프리터와 V8의 최신 최적화 컴파일러인 [터보팬](https://github.com/v8/v8/wiki/TurboFan) 위에서 만들어졌다. 

[여기](https://v8project.blogspot.kr/2017/05/launching-ignition-and-turbofan.html)서 V8팀의 토픽들을 확인해 볼 수 있다.

5.9 버전 이후, full-codegen과 Crankshaft(2010년 부터 V8에 쓰인 기술들)은 V8팀이 새로운 JS 기능들과 그 기능들을 위한 최적화를 위한 분투한 끝에 JS 실행에서 더이상 쓰이지 않는다.

이는 전체 V8이 더욱 간단해지고 미래를 향한 아키텍쳐를 유지할수 있게 됐다는 뜻이다.

![Improvements](https://cdn-images-1.medium.com/max/1600/0*pohqKvj9psTPRlOv.png)
> 웹과 Node.js에서 개선 현황 벤치마크

이러한 개선은 이제 막 시작됐다. 새로운 Ignition과 TurboFan 파이프라인은 JS의 퍼포먼스를 더 끌어올리고 크롬과 Node.js에서 V8의 공간을 축소시킬 최적화의 길을 트기 시작했다.

마지막으로 더나은 최적화된 JS 코드 작성하는 몇가지 팁과 트릭을 소개한다. 위 내용들에서 이끌어 낼 수 있지만, 편의를 위해 요약하고자 한다.

## How to write optimized JavaScript

1. **Order of object properties** : 항상 객체의 프로퍼티들을 같은 순서로 인스턴스화 해야 hidden class와 이후의 최적화 코드가 공유된다.

1. **Dynamic properties** : 인스턴스화 한 후 객체에 프로퍼티를 추가하면 hidden class 변경을 강제하고 이전 hidden class에 대해 최적화된 모든 메서드들을 느리게 만든다. 그러는 대신 객체의 프로퍼티들은 모두 생성자에 할당한다.

1. **Methods** : 같은 메서드를 반복해서 실행하는 코드는 다양한 메서드를 한번 실행하는 코드보다 빠르게 동작한다(inline caching으로 인해).

1. **Arrays** : 키가 증대되는 숫자가 아닌 이빠진 배열을 피하라. 요소가 듬성한 배역은 **해시 테이블**이다. 이런 배열의 요소들은 접근하기에 비싼 비용을 치룬다. 그리고 가능한 커다란 배열을 사전에 할당하는 것은 피해라. 점점 크게 만드는게 더 낫다. 마지막으로 배열에서 요소를 삭제하는 것도 피해야 한다. 키들이 중간중간 비게 되기 때문이다.

1. **Tagged values** : V8은 객체와 숫자를 32로 표현한다. 하나의 비트는 그것이 객체인지(flag = 1) 혹은 숫자인지(flag = 0, 31비트인 까닭에 SMI(SMall Integer)라 불린다.) 판단하기 위해 사용된다. 이후 숫자 값이 31비트 보다 큰경우 V8은 숫자를 boxing하여 이를 곱절하고 새로운 객체를 만들어 그 안에 숫자를 넣는다. 가능한 31비트 부호있는 숫자를 사용하여 JS 객체의 값 비싼 boxing 작업을 피하라.