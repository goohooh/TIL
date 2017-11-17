# React - Basic Theoretical Concepts

> _Reference_ : [React JS Github](https://github.com/reactjs/react-basic)

## Transformation

리액트의 핵심 전제는 UI들이 단순히 투사된 데이터를 다른 형태의 데이터로 투영한다는 것이다.

같은 인풋이 주어지면 아웃풋도 같다. 단순한 순수 함수다.

```javascript
function NameBox(name){
	return { fontWeight: 'bold', labelContent: name };
}
```
```
'Sebastian Markbage' ->
{ fontWeight: 'bold', labelContent: 'Sebastian Markbage' };
```

## Abstraction

하나의 함수로 복잡한 UI를 감당할 수 없다.

UI들을 각자의 구현 디테일을 놓치지 얂으면서 재활용 가능한 조각으로 추상화 할 수 있는 것이 중요하다.

마치 다른 함수를 호출하는 것 처럼 말이다.

```javascript
function FancyUserBox(user) {
	return {
		borderStyle: '1px solid blue',
		childContent: [
			'Name: ',
			// `NameBox`의 렌더 결과물 내장
			NameBox(`${user. firstName} ${user.lastName}`)
		]
	};
}
```
```
{ firstName: 'Sebastian', 'lastName': 'Markbage' } ->
{
	borderStyle: '1px solid blue',
	childContent: [
		'Name: ',
		{ fontWeight: 'bold', labelContent: 'Sebastian Markbage' }
	]
};
```

## Composition

재사용 가능한 기능을 가능케하기 위해, 단순히 그것들을 위한 새 컨테이너를 만들고 leaves를 재사용 하는것 만으로 충분치는 않다.

또한 다른 추상화를 구성하는 컨테이너에서 추상화를 작성할 수 있어야한다

내가 생각하는 "조립"은 둘 이상의 다른 추상화를 새로운 추상화로 결합하는 것이다.

```javascript
function FancyBox(children) {
	// `FancyBox`는 안에 뭐가 들었는지 알 필요 없음
	// 대신 chilren을 인자로 받음
	return {
		borderStyle: '1px solid blue',
		children: children
	};
}

function UserBox(user){
	// 이제 다른 영역의 UI 안에서 다른 children을 `FancyBox`에 넣어줄 수 있다.
	// 예를 들어, `UserBox`는 `FancyBox`안에 `NameBox`와 함께 있다.
	return FancyBox([
		'Name: ',
		NameBox(`${user.firstName} ${user.lastName}`)
	]);
}

function MessageBox(message) {
  // 하지만 `MessageBox`는 메시지와 함께 있는 `FancyBox`다.
  return FancyBox([
    'You received a new message: ',
    message
  ]);
}
```

## State

UI는 단순히 서버/비지니스 로직 state의 복제품 아니다. 

실제로 정확한 투영에 국한된 많은 state가 있으며 다른 state는 그렇지 않다.

텍스트 필드를 타이핑하기 시작했다고 가정해보자. 다른 탭들이나 모바일 기기에 복제되거나 되지않을 수도 있다.

스크롤 포지션은 여러 프로젝션에서 거의 복제하지 않는 전형적인 예라 할 수 있다.

우린 데이터가 불변하는 것을 선호한다. 

최상단에 존재하는 단일 원자로서의 state를 업데이트할 수 있는 함수들을 걸어 넣을 것이다.

```javascript
function FancyNameBox(user, likes, onClick){
	return FancyBox([
		'Name: ', NameBox(`${user.firstName} ${user.lastName}`),
		'Likes: ', LikeBox(likes),
		LikeButton(onClick)
	]);
}

// Implementation Details

var likes = 0;
function addOneMoreLike(){
	likes++;
	rerender();
}

// Init

FancyNameBox(
	{ firstName: 'Sebastian', lastName: 'Markbage' },
	likes,
	addOneMoreLike
);
```
_NOTE: 위 예시들은 state를 업데이트하는 사이드이펙트를 사용하고 있다._

_실제 이 멘탈 모델은 이것들이 "업데이트"를 통과하는 동안 다음 버전의 state를 리턴하는 것이다._

_위 예시는 그 과정 없이 단순히 설명한 것이다. 물론 우린 추후 이 예시를 바꾸려 한다._

## Memoization

순수 함수임을 안다면 그 함수를 반복적으로 호출하는 것은 비효율 적이다.

마지막 인자와 결과를 추적하는 메모이제이션 버전의 함수를 만들 수 있다.

같은 value를 계속 사용한다면 재실행할 필요가 없는 방법이다.

```javascript
function memoize(fn) {
	var cachedArg;
	var cachedResult;
	return function(arg) {
		if (cachedArg === arg) {
			return cachedResult;
		}
		cachedArg = arg;
		cachedResult = fn(arg);
		return cachedResult;
	}
}

// NameBox와 동일한 API를 가지지만 마지막 `MemoizedNameBox`가 마지막으로
// 호출됐을 당시의 단일 인자와 비교해 변경되지 않았다면 그 결과값을 캐시한다.
var MeomizedNameBox = memoize(NameBox);

function NameAndAgeBox(user, currentTime) {
	return FancyBox([
		'Name: ',
		MemoizedNameBox(`${user.firstName} ${user.lastName}`),
		'Age in milliseconds: ',
		currentTime - user.dateOfBirth
	]);
}

// `NameAndAgeBox`를 두번 호출하지만, `NameBox`는 한번호출된다.
const sebastian = { firstName: 'Sebastian', lastName: 'Markbage' };
NameAndAgeBox(sebastian, Date.now());
NameAndAgeBox(sebastian, Date.now());
```

## Lists

대부분의 UI들은 목록에서 각 항목에 대해 다양한 값들을 만들어내는 형식이다.

각 항목들의 state를 관리하기 위해 특정 항목들의 state를 들고있는 `Map`을 생성할 수 있다.

```javascript
function UserList(users, likesPerUser, updateUserLikes) {
	return users.map(user => FancyNameBox(
		user,
		likesPerUser.get(user.id),
		() => updateUserLikes(user.id, likesPerUser.get(user.id) +1)
	));
}

var likesPerUser = new Map();
function updateUserLikes(id, likeCount){
	likesPerUser.set(id, likeCount);
	rerender();
}

UserList(data.users, likesPerUser, updateUserLikes);
```
_NOTE: 지금 우린 다양한 인자들을 `FancyNameBox`에 넣고 있다._

_한번에 하나의 값만 기억하도록 했던 메모이제이션이 망가졌다. 이에 관해선 밑에서 다룬다._

## Continuations

공교롭게도, UI에선 수많은 리스트들의 리스트들이 있기 때문에, 이는 명료하게 관리해야할 상당히 많은 boilerplate가 되버린다.

지연수행 함수를 통해 이러한 boilerplate를 중요한 비지니스 로직상에서 들어낼 수 있다.

커링을 예로들 수 있다. 그리고나서 이제 보일러플레이트로부터 자유로워진 코어 함수의 바깥으로부터 state를 건다.

이것으로 보일러플레이트를 줄일 순 없지만 최소한 주요 비지니스 로직에서 걷어낼 수 있다.

```javascript
function FancyUserList(users){
	// `UserList`는 3가지 인자를 받는다 : `users`, `likesPerUser`, `updateUserLikes`

	// `FancyUserList`가 사실은 `UserList`에게 
	// `likesPerUser`와 `updateUserLikes`도 필요하단 것을 몰랐으면 한다.
	// 그래서 `FancyUserList`를 통해 이 state를 기록해두어 인자를 알리지 않도록 한다.

	// 현재로선 첫번째 인자만 제공하는 식으로 속일 수 있다:
	const children = UserList.bind(null, users);

	// 앞선 예시와 다르게, `children`은 부분적으로 적용된 함수라서
	// 아직 실제 children을 리턴하기 위해`likesPerUser`와 `updateUserLikes` 필요하다.

	// 하지만 `FancyBox`는 children을 잘 들여다보지 않고 그저 결과물로 이용할 뿐이다.
	// 그러므로 이후에 어떠한 외부 시스템으로 빠진 인자들을 주입할 것이다.
	return FancyBox(children);
}

// 렌더 결과물은 state가 주입되지 않아 온전히 알기 어렵다.
const box = FancyUserList(data.users);
// `box.children()`은 함수다. 이제서야 state를 주입한다.
const resolvedChildren = box.children(likesPerUser, updateUserLikes);
// 최종 렌더링 결과물을 갖게 됐다.
const resolveBox = {
	...box,
	children: resolvedChildren
}
```

## State Map

이전에 반복되는 패턴을 보았을 때 같은 패턴을 계속해서 다시 구현하는 것을 피하기 위해 합성을 사용할 수 있음을 알고 있다.

상태를 추출하고 전달하는 로직을 수없이 재사용한 저수준 함수로 옮길 수 있다.

```javascript
// `FancyBoxWithState`은 아직 resolved 되지 않은 `children`을 받는다.
// 각 child는 `continuation`을 포함한다. 이것은 child의 state와 이를 업데이트할 함수를 받고
// child의 아웃풋을 리턴할 것이다.
// child들은 또한 맵에 그들의 state를 추적할 수 있도록 유니크한 `key`를 포함하고있다.
function FancyBoxWithState(
	children,
	stateMap,
	updateState
) {
	// 이제 `stateMap`을 가지며,
	// children으로 부터 제공된 모든 continuation에 그것을 주입하여
	// resolved된 결과물을 얻는다.
	const resolvedChildren = children.map(child => child.continuation(
	 stateMap.get(child.key),
	 updateState
	));

	// 렌더된 결과물을 `FancyBox`에게 넘긴다.
	return FancyBox(resolvedChildren);
	);
}

function UserList(users) {
	// `UserList`는 state가 나중에 주입받을 것이라 예상하는 
	// children 리스트를 리턴한다. 아직 그들의 state는 모른채
	// 부분 적용된 함수("continuations")를 리턴한다.
	return users.map(user => {
		continuation: FancyNameBox.bind(null, user),
		key: user.id
	});
}

function FancyUserList(users) {
	// `FancyUserList`는 state를 나중에 주입받으리라 예상하는
	// `continuation`를 리턴한다. 
	// 이 state는 Stateful한 children으로 resolved 하기 위해 필요한
	// `FancyBoxWithState`에 전달 될 것이다.
	const continuation =FancyBoxWithState.bind(null, UserList(users));
	return continuation;
}

// `FancyUserList`의 렌더링 출력뭉은 아직 그릴 준비가 안됐다.
// 아직 state를 주입 직전의 연장상태다.
const continuation = FancyUserList(data.users);

// 이제 state를 주입했다.
const output = continuation(likePerUser, updateUserLikes);

// `FancyUserList`는 state를 `FancyBoxWithState`에게 전송하려 하고,
// 이들은 각 `children`의 `continuation`에 매핑되어 들어갈 것이다.

/*
 * 주 : 커링 기법을 통해 위 구현의 상세를 작성할 수 있다.
 */
```

## MemoizationMap

메모이제이션 목록에서 다양한 항목을 메모이제션하기가 더욱 어려워졌다.

이제 복잡하지만 메모리 사용 빈도가 적절하게 균형잡힌 캐싱 알고리즘을 찾아내야한다.

다행히, UI는 대체로 같은 위치에서 안정적인 경향이있다. 

트리 안에서 같은 포지션은 매번 같은 값을 같는다. 

이 트리는 메모이제이션 전략에 아주 탁월하다.

state때문에 사용한 똑같은 트릭으로 컴포저블 함수를 통해 메모이제이션 캐시를 넘긴다.

```javascript
// 이전 메모이제이션 예시를 떠올리면, 
// `memoize`내부 지역변수로써 캐시 인자와 캐시 결과를 가지고 있었다.
// 하지만 목록에서는 유용하지 않은 방법이다.
// 목록에선 함수가 수없이 다른 인자와 함께 호출되기 때문이다.

// `memoize`로 부터 리턴된 함수는 `memoizationCache`를 허용한다.
// `memoizationCache`는 인자로서 컴포넌트를 포함한
// 목록이 각 항목별로 "local" 캐시를 제공할 수 있기를 바란다. 
function memoize(fn) {
	return function(arg, memoizationCache) {
		if(memoizationCache.arg === arg) {
			return memoizationCache.result;
		}
		const result = fn(arg);
		memoizationCache.arg = arg;
		memoizationCache.result = result;
		return result;
	}
}

function FancyBoxWithState(
	children,
	stateMap,
	updateState,
	memoizationCacheMap
) {
	return FancyBox(
		children.map(child => child.continuation(
			stateMap.get(child.key),
			updateState,
			// UI가 바뀌는건 대게 화면의 일부인 경우가 많다.
			// 그말인 즉슨 대부분의 같은 키들을 가진 children들이 똑같이 출력된다는 것이다.
			// 각 child에게 자신의 메모이제이션 맵을 주게 되고
			// 일반적인 경우 아웃풋은 저장된다.
			memoizationCacheMap.get(child.key)
		));
	);
}
```

## 대수 효과

몇 가지 수준의 추상화를 통해 필요할 수있는 모든 작은 값을 전달하는 것은 PITA의 일종 인 것으로 밝혀졌다.

관련없는 두 추상화 사이에 지름길을 두는 것은 때떄로 유익하다. 리액트에선 이걸 `context`라 부른다.

가끔 데이터 의존성이 추상화 트리를 깔끔하게 따르는 것은 아니다.

에를 들어 당신에게 필요한 레이아웃 알고리즘이 완전히 children의 포지션을 채우기 전에 그들의 사이즈 알아야할 때이다.

아래 예제는 조금 "벗어나" 있다. ECMA스크립트에 제안된 대수효과를 사용할 것이다.

함수형 프로그래밍에 익숙하다면, 그들은 모나드에 의해 부과 된 중간 예식을 피하고 있다. (_뜻을 알 수 없음, 구글 번역_)

```javascript
function ThemeBorderColorRequest() { }

function FancyBox(children) {
	// "throw" 처럼 콜 스택에 전파됨
	const color = raise new ThemeBorderColorRequest();
	return {
		borderWidth: '1px',
		borderColor: color,
		children: children
	};
}

function BlueTheme(children) {
	return try {
		children();
	} catch effect ThemeBorderColorRequest -> [, continuation] {
		// "throw"와 달리 자식 함수를 재실행하고 어떤 데이터를 넘길 수 있다
		continuation('blue');
	}
}

function App(data) {
	return BlueTheme(
		FancyUserList.bind(null, data.users)
	);
}
```