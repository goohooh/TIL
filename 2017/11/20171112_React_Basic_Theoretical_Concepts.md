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

하나의 함수를 통해 복잡한 UI를 감당할 수 없다.

UI들을 각자의 구현 디테일을 놓치지 얂으면서 재활용 가능한 조각으로 추상화 할 수 있는 것이 중요하다.

마치 다른 함수를 호출하는 것 처럼 말이다.

```javascript
function FancyUserBox(user) {
	return {
		borderStyle: '1px solid blue',
		childContent: [
			'Name: ',
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
	return {
		borderStyle: '1px solid blue',
		children: children
	};
}

function UserBox(user){
	return FancyBox([
		'Name: ',
		NameBox(`${user.firstName} ${user.lastName}`)
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

var MeomizedNameBox = memoize(NameBox);

function NameAndAgeBox(user, currentTime) {
	return FancyBox([
		'Name: ',
		MemoizedNameBox(`${user.firstName} ${user.lastName}`),
		'Age in milliseconds: ',
		currentTime - user.dateOfBirth
	]);
}
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
	return FancyBox(
		UserList.bind(null, users)
	);
}

const box = FancyUserList(data.users);
const resolvedChildren = box.children(likesPerUser, updateUserLikes);
const resolveBox = {
	...box,
	children: resolvedChildren
}
```

## State Map

이전에 반복되는 패턴을 보았을 때 같은 패턴을 계속해서 다시 구현하는 것을 피하기 위해 합성을 사용할 수 있음을 알고 있다.

상태를 추출하고 전달하는 로직을 수없이 재사용한 저수준 함수로 옮길 수 있다.

```javascript
function FancyBoxWithState(
	children,
	stateMap,
	updateState
) {
	return FancyBox(
		children.map(child => child.continuation(
			stateMap.get(child.key),
			updateState
		))
	);
}

function UserList(users) {
	return users.map(user => {
		continuation: FancyNameBox.bind(null, user),
		key: user.id
	});
}

function FancyUserList(users) {
	return FancyBoxWithState.bind(null, UserList(users));
}

const continuation = FancyUserList(data.users);
/*
 * continuation = FancyBoxWithState.bind(null, UserList(data.users));
 * 		↓
 * continuation = FancyBoxWithState.bind(null, [{continuation: FancyNameBox.bind(null, user), key: user.id}, ... ])
 */

continuation(likesPerUser, updateUserLikes);
/*
 * continuation(likesPerUser, updateUserLikes)
 * 		↓
 * GG.......
 */
```