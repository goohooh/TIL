# React : Reconciliation
> **Diffing Algorithm**
> _원문 : [React Docs](https://reactjs.org/docs/reconciliation.html)_

## 동기(Motivation)

`state`나 `props`가 업데이트 되면 `render()` 함수는 다른 React Element Tree를 반환한다.
이제 React는 가장 최신의 Tree와 UI가 매칭되는 최적의 방식을 찾아야 한다.
일반적인 복잡도가 증가하는 구현보다, O(n) 알고리즘을 구현 한다

1. 다른 타입의 두 Element는 다른 트리를 만든다
2. 개발자는 child element들이 key props를 통해 다양한 렌더링에서도 안정적일 수 있다고 암시할 수 있다.

## The Diffing Algorithm

두개의 트리를 diffing 할때, React는 먼저 두 root 요소를 비교한다.
이러한 동작은 루트 요소의 타입에 따라 다르다.

## Elements of Different Types

루트 엘리먼트가 다른 타입일때 마다, 리액트는 낡은 tree는 허물고 스크래치 부터 새로운 트리를 만든다.

`<a>` to `<img>`, or from `<Article>` to `<Comments>`, or from `<Button>` to `<div>` - 어떤 것이든 전부 재건 된다.

트리를 허물 때, 낡은 DOM 노드는 파괴된다. 

컴포넌트 인스턴스는 `componentWillUnmount()`를 받는다. 새로운 트리를 만들 때, 

새로운 DOM 노드는 DOM에 삽입 되고 컴포넌트 인스턴스는 `componentWillMount()`를 받고 나서 

`componentDidMount()`를 받는다. 이전 트리와 관련된 모든 `state`는 소실된다.	

루트 아래에 있는 모든 구성 요소는 unmount되며 해당 상태가 파괴된다. 예를 들어, 디핑 시:

```jsx
<div>
	<Counter />
</div>

<span>
	<Counter />
</span>
```
이전 `Counter`는 파괴되고 새로운 것으로 remount된다.

## 같은 타입의 DOM 요소

컴포넌트가 업데이트되면 인스턴스가 동일하게 유지되므로 렌더링 되는 동안 상태가 유지된다. 

React는 새로운 요소에 매치되는 컴포넌트 인스턴스에 내재된 props를 업데이트 하고,

`componentWillReceiveProps()`와 `componentWillUpdate()`를 인스턴스 기저에서 호출한다.

다음으로 `render()`메서드가 호출되고 `diff algorithm`이 이전 결과와 새로운 결과를 토대로 

반복된다.

## Recursing on Children

리액트는 재귀적으로 children을 순회를 한다. 

chilren 목록을 동시에 작성하고 차이가 있을 때마다 변경을 만들어 낸다.

children 끝에 요소를 추가할 때 두 트리 사이의 전환은 원활하다.

```html
<ul>
	<li>first</li>
	<li>second</li>
</ul>

<ul>
	<li>first</li>
	<li>second</li>
	<li>third</li>
</ul>
```

React는 두 `<li>first</li>`를 매치하고, 두 `<li>second</li>`트리를 매치하고나서

`<li>third</li>`트리를 삽입한다.

이를 만약 네이티브하게 구현한다면, 요소를 삽입하려는 순간 성능에 악영향을 준다.

다른 예를 들면 아래 두 트리 사이의 변화는 빈약한 작업이 된다.

```html
<ul>
	<li>Duke</li>
	<li>Villanova</li>
</ul>

<ul>
	<li>Connecticut</li>
	<li>Duke</li>
	<li>Villanova</li>
</ul>
```

리액트는 `<li>Duke</li>` 와 `<li>Villanova</li>` 본래의 서브트리를

유지하는 대신 모든 자손을 변경한다. 하지만 이런 비효율은 문제가 된다


## keys

이러한 이슈를 해결하기 위해 리액트는 `key` 속성을 제공한다.

자식들이 키들을 가지고 있으면 리액트는 키를 이용해 자식들의 오리지날 트리와

자식들의 뒤이은 트리를 매치한다.

```html
<ul>
	<li key="2015">Duke</li>
	<li key="2016">Villanova</li>
</ul>

<ul>
	<li key="2014">Connecticut</li>
	<li key="2015">Duke</li>
	<li key="2016">Villanova</li>
</ul>
```

리액트는 이제 '2014'키의 요소가 새로 생긴것을 알고, 

'2015', '2016'를 가진 요소는 그저 이동했음을 알게 된다.

이 키들은 전역적인 유니크 키가 아니라, 자신의 형제들 중에서 유일한 키이어야 한다.

id나 해시로 키를 만들 수도 있다. 혹은 배열의 인덱스를 쓸 수도 있는데,

아이템들이 절대 재정리 되지않을 때만 효과적이다.

## Tradeoffs

리액트는 모든 액션에 전체 앱을 다시 렌더링 할 수 있다. 그리고 결과는 동일할 것이다.

분명히 해야할 건, '다시 렌더링' 한다는 건 모든 컴포넌트의 render를 호출한다는 것이지,

리액트가 그 모든 컴포넌트들을 unmount 하고 remount 하는 것은 아니라는 것이다.

차이만 적용된다라는 뜻이다.

위의 예시를 통해 알 수 있는 건, 서브트리가 그 형제들 사이에서 이동했다는 것.

하지만 다른 곳으로 옮겨 간것은 아니라는 것. 결국 이 알고리즘은 

모든 하위 트리를 다시 렌더링 하는 것이다.

리액트 자체는 시행착오를 통한 발견에 의존하기 때문에, 

이 뒤에 존재하는 가정들이 충족되지 않는다면 성능은 나빠질 것이다.

---

1. 이 알고리즘은 서로 다른 유형을 가진 컴포넌트들의 하위 트리를 일치시키려 하지 않는다.

	당신이 봤을 때 비슷한 출력물을 가진 두 컴포넌트 유형끼리 교체되려 할 때 

	동일한 유형으로 구성할 수 있다. 그리고 아직 이로 인한 이슈는 없었다.

2. 키는 안정적이고, 예측 가능하며, 고유해야 한다. 불안정한 키('Mathom.random()')는 

	많은 구성 요소 인스턴스와 DOM노드를 불필요하게 재현할 수 있으며, 이로 인해 

	성능 저하 및 하위 컴포넌트의 상태가 손실될 수 있습니다.

---