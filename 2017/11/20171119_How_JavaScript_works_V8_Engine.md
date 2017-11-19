# How JavaScript works: inside the V8 engine + 5 tips on how to write optimized code

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