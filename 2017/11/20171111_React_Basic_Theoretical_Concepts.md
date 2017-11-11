# React Components, Elements, and Instances

> _Reference_ : [Dan Abramov](https://reactjs.org/blog/2015/12/18/react-components-elements-and-instances.html)

## Managing the Instances

전통적인 UI 모델에서 자식 컴포넌트의 인스턴스를 만들거나 없애는 것은 

전적으로 당신에게 달렸다. 만약 `Form` 컴포넌트가 `Button`컴포넌트를

렌더링하려 한다면, 이는 인스턴스를 만들어야하고 손수 새로운 정보를 최신의

상태로 만들어야 한다.

```javascript
class Form extends TraditionalObjectOrientedView {
  render() {
    // Read some data passed to the view
    const { isSubmitted, buttonText } = this.attrs;

    if (!isSubmitted && !this.button) {
      // Form is not yet submitted. Create the button!
      this.button = new Button({
        children: buttonText,
        color: 'blue'
      });
      this.el.appendChild(this.button.el);
    }

    if (this.button) {
      // The button is visible. Update its text!
      this.button.attrs.children = buttonText;
      this.button.render();
    }

    if (isSubmitted && this.button) {
      // Form was submitted. Destroy the button!
      this.el.removeChild(this.button.el);
      this.button.destroy();
    }

    if (isSubmitted && !this.message) {
      // Form was submitted. Show the success message!
      this.message = new Message({ text: 'Success!' });
      this.el.appendChild(this.message.el);
    }
  }
}
```
Backbone과 같은 라이브러리를 사용하여 객체 지향 방식으로 

일관되게 동작하는 복합 UI코드를 작성할 때 볼 수있는 가상코드이다.

---

각 컴포넌트 인스턴스는 돔 노드와 자식 컴포넌트의 인스턴스들을 계속 참조한채,

때가 되면 그들을 만들고 업데이트하고 없앤다. 

코드라인은 컴포넌트의 상태가 늘어나는 만큼 곱절로 증가할 것이다.

부모가 직접 자식 컴포넌트에 접근하는 만큼 추후에 때어내기가 힘들어 진다.


## Elements Describe the Tree

리액트에서 element는 **요구되는 property들과 컴포넌트의 인스턴스 혹은 DOM 노드를 설명하는 순수한 객체이다.**

이는 오직 컴포넌트 타입(예 : `Button`), 프로퍼티(예 : `color`), 내부에 있는 child element에 대한 정보만을 포함헌다.

---

element는 실제 인스턴스가 아니라 당신이 스크린에서 표현할 것을 리액트에게 전하는 방법이다.

당신은 element에서 어떤 메서드도 호출할 수 없다.

그저 두 필드(`@type: (String | ReactClass)`, `@props: Object`)를 가진 불변하는 객체의 명세다.

## DOM Elements

element의 `type`이 String일 때, 이는 해당 DOM노드의 태그 이름을 나타내며,

`props`는 attribute에 해당한다. 아래 예시는 리액트가 렌더링하는 것을 보여준다.

```javascript
{
  type: 'button',
  props: {
    className: 'button button-blue',
    children: {
      type: 'b',
      props: {
        children: 'OK!'
      }
    }
  }
}
```

위 element는 아래 HTML을 순수 객체로 표현하는 방식이다.

```html
<button class="button button-blue">
  <b>
    OK!
  </b>
</button> 
```

element가 어떻게 중첩되는지 주목하라. 관례적으로 element 트리를 만드려 할때, 

자신만의 element를 포함하는 `children` 속성으로서의 child element들을 하나 이상 만든다.

중요한 것은 두 부모와 자식 element들이 _실제 인스턴스가 아니라 단지 명세일 뿐_ 이라는 것이다.

당신이 이것들을 만들었지만 이것들은 화면위에 어떤것도 참조하고 있지 않다.

당신은 이것들을 만들수도 버릴 수도 있지만, 별로 중요하진 않다.

리액트의 element는 탐색하기 쉽고, 따로 해석할 필요도 없고, 당연히 실제 DOM보다 가볍다.

## Component Elements

또한 element의 `type`은 리액트 컴포넌트에 대응하는 함수나 클래스가 될 수 있다.

```javascript
{
  type: Button,
  props: {
    color: 'blue',
    children: 'OK!'
  }
}
```

이는 **리액트의 코어 아이디어**다.

---
컴포넌트를 설명하고 있는 element 또한 element이며, 

이는 마찬가지로 DOM 노드를 설명하는 element와 비슷하다. 

이것들은 서로 중첩되고 섞일 수 있다.

---

이러한 기능은 `Button`이 `<button>`돔이나 `<div>`돔 혹은 그 이외의 것을 그릴지 신경쓰지 않고 

특정 `color` 속성 값을 지정한 `Button`을 `DangerButton`으로 정의할 수 있게 해준다.

```javascript
const DangerButton = ({ children }) => ({
  type: Button,
  props: {
    color: 'red',
    children: children
  }
});
```

이제 단일 element 트리에서 DOM과 컴포넌트 element를 섞고 매치할 수 있다.

```javascript
const DeleteAccount = () => ({
  type: 'div',
  props: {
    children: [{
      type: 'p',
      props: {
        children: 'Are you sure?'
      }
    }, {
      type: DangerButton,
      props: {
        children: 'Yep'
      }
    }, {
      type: Button,
      props: {
        color: 'blue',
        children: 'Cancel'
      }
   }]
});
```

JSX가 좋다면

```javascript
const DeleteAccount = () => (
  <div>
    <p>Are you sure?</p>
    <DangerButton>Yep</DangerButton>
    <Button color='blue'>Cancel</Button>
  </div>
);
```

이러한 믹스매치는 전적으로 조립을 통해 컴포넌트들이 _무엇인지, 무엇을 가졌는지_ 관계를 표현함으로써,

컴포넌트들을 서로 분리시키는데 도움이 된다.

- `Button`은 특정 속성을 가진 DOM `<button>`이다.

- `DangerButton`은 특정 속성을 가진 `Button`이다.

- `DeleteAccount`는 `<div>`안에 `Button`과 `DangerButton`을 포함한다.


## Components Encapsulate Element Trees

리액트가 함수 혹은 클래스 `type`을 가진 element를 볼 때, 

주어진 `props`를 감안하여 렌더링 하려는 element를 컴포넌트에게 물어볼 수 있다.

아래 element를 보면

```javascript
{
  type: Button,
  props: {
    color: 'blue',
    children: 'OK!'
  }
}
```

리액트는 `Button`이 무엇을 그릴지 물어본다. 버튼은 아래 element를 리턴한다.

```javascript
{
  type: 'button',
  props: {
    className: 'button button-blue',
    childrent: {
      type: 'b',
      props: {
        childrent: 'OK!'
      }
    }
  }
}
```

리액트는 페이지의 모든 컴포넌트에서 element가 기본적인 DOM 태그 요소라는 걸 알때 까지 위의 프로세스를 반복한다.

마치 아이가 "Y가 뭐야?"라고 물으면 당신이 "X가 Y야."라고 설명하는 것처럼,

리액트는 세상의 작은 것 하나하나를 다 알때까지 캐묻는다.

`Form`예시를 기억하는가?

```javascript
const Form = ({ isSUbmitted, buttonText }) => {
  if (isSubmitted) {
    // Form submitted! Return a message element.
    return {
      type: Message,
      props: {
        text: 'Success!'
      }
    }

    // Form is still visible! Return a button element.
    return {
      type: Button,
      props: {
        children: buttonText,
        color: 'blue'
      }
    }
  }
}
```

바로 이거다! 리액트 컴포넌트에게 `props`는 인풋이고, element 트리는 아웃풋이다.

**리턴된 element 트리는 DOM 노드를 명세한 element나 다른 컴포넌트를 명세한 element일 수도 있다.**

**이는 내부의 DOM 구조에 의존하지 않고 독립된 UI 파트를 구성할 수 있도록 한다.**

리액트가 인스턴스를 만들고, 업데이트하고, 없애도록 했다.

우리는 컴포넌트들로부터 리턴된 element들로 이루어진 인스턴스들을 설명하고,

리액트는 그 인스턴스들의 관리를 담당한다.


## Components Can Be Classes or Functions

위 코드들에서 `Form`, `Message`, `Button`은 리액트 컴포넌트들이다.

위처럼 함수로 작성할 수도, React.Component를 이용해 클래스 기반으로 작성할 수도 있다.

아래는 컴포넌트를 선언하는 3가지 방식이고 대개 동일하다

```javascript
// 1) As a function of props
const Button = ({ children, color }) => ({
  type: 'button',
  props: {
    className: 'button button-'+color,
    children: {
      type: 'b',
      props: {
        children: children
      }
    }
  }
});

// 2) Using the React.createClass() factory
const Button = React.createClass({
  render() {
    const { children, color } = this.props;
    return {
      type: 'button',
      props: {
        className: 'button button-' + color,
        children: {
          type: 'b',
          props: {
            children: children
          }
        }
      }
    }
  }
});

// 3) As an ES6 class descending from React.Component
class Button extends React.Component {
  render() {
    const { children, color } = this.props;
    return {
      type: 'button',
      props: {
        className: 'button button-' + color,
        children: {
          type: 'b',
          props: {
            children: children
          }
        }
      }
    }
  }
}
```

컴포넌트가 클래스로 선언 됐다면, 함수형 컴포넌트보다 조금더 강력한 기능을 가진다.

local state와 해당 DOM이 생성되거나 없어질 때 커스텀한 로직을 수행할 수 있다.


함수형 컴포넌트는 덜 강력하나 간단하고, `render`메서드만을 가진 클래스 기반 컴포넌트처럼 작동한다.

클래스에서만 사용할 수 있는 기능이 필요하지 않은 경우에는 함수형 컴포넌트를 사용하는 것이 좋다.

**하지만 함수든 클래스든, 기본적으로 이것들은 모두 리액트 컴포넌트들이다.**

**자신의 인풋으로써 `props`를 받고 아웃풋으로 element를 리턴한다.**


## Top-Down Reconciliation

```javascript
ReactDOM.render({
  type: Form,
  props: {
    isSubmitted: false,
    buttonText: 'OK!'
  }
}, document.getElementById('root'));
```

위 호출에서, 리액트는 주어진 저 `props`와 `Form` 컴포넌트에게 어떤 element 트리를 리턴할지 물을것이다.

매우 간단한 용어를 통해 컴포넌트 트리에 대한 이해를 정제해본다면: 

```javascript
// React: You told me this...
{
  type: Form,
  props: {
    isSUbmitted: false,
    buttonText: 'OK!'
  }
}

// React: ...And Form told me this...
{
  type: BUtton,
  props: {
    children: 'OK!',
    color: 'blue'
  }
}

// React: ...and Button told me this! I guess I'm done.
{
  type: 'button',
  props: {
    className: 'button button-blue',
    children: {
      type: 'b',
      props: {
        children: 'OK!'
      }
    }
  }
}
```

이는 리액트가 `reconciliation`이라 부르며 당신이 

`ReactDOM.render()`or `setState()`를 호출할때 발생하는 프로세스의 일부분이다. 

reconciliation이 끝나면, 리액트는 최종적인 DOM 트리를 알게되고,

`react-dom` or `react-native`같은 renderer가 업데이트에 필요한 

최소한의 변경 셋만 DOM 노드들(React Native같은 경우 특정 플랫폼의 뷰)에 적용시킨다.

---

이러한 점진적 정제 과정은 또한 리액트를 쉽게 최적화할 수 있는 이유다.

만약 몇몇 컴포넌트 트리가 리액트가 효과적으로 방문기엔 너무 커진다면,

특정 부분 트리에 연관된 `props`가 변경되지 않았을 경우 정제 과정을 건너뛸 수 있다.

불변의 `props` 달라졌든(값이 바뀐게 아닌 그 자체가 다른 불변 값으로 대체 된 경우?) 아니든

리액트는 빠르게 계산할 수 있고(리액트와 불변 작업은 잘 맞는다)

최소한의 노력으로 훌륭한 최적화를 제공해준다.

---

아마 이 블로그에서 인스턴스에 비해 수많은 컴포넌트와 element들에 관한 이야기가 있음을

알아챘을 것이다. 즉, 리액트에서 인스턴스는 대부분의 객체 지향 UI프레임워크보다 덜 중요하다.

---

오직 클래스 기반 컴포넌트만 인스턴스를 가지며 당신은 그들을 직접 만들지 않는다.

리액트가 대신해준다. 

(부모 컴포넌트 인스턴스가 존재하는 자식 컴포넌트 인스턴스에 접근하는 메카니즘 속에서)

필수적 동작(예: 필드에 focus 설정)에서만 사용하고 일반적으론 피해야 한다.

React는 모든 클래스 컴포넌트에 대한 인스턴스를 생성하는 데 신경쓰므로,

(컴포넌트를 객체 지향 방식으로 작성할 수 있지만)

그 이외의 경우에는 인스턴스가 React의 프로그래밍 모델에서는 그다지 중요하지 않습니다


## 요약

1. `element`는 화면속의 나타내고자 하는 DOM 노드 혹은 다른 컴포넌트들을 설명한 순수 객체이다.

  `element`는 자신만의 `props`를 가진 다른 element들을 포함할 수 있다.

  리액트 `element`는 비용이 적다. 한번 만들어지면 절대 변하지 않는다.


2. `컴포넌트`는 여러 방식으로 선언할 수 있다. render메서드와 함께 클래스가 될 수도,

  혹은 간단하게 함수로 정의 될 수 있다. 두 경우 모두 인풋으로 `props`를 받고

  아웃풋으로 `element`트리를 리턴한다.

    컴포넌트가 `props`를 받는 것은, 특정 부모 컴포넌트가 이러한 `props`와 

    그것의 `type`을 포함한 `element`를 반환하기 때문이다. _(:의역)_

    사람들이 말하길 리액트는 `props`가 한방향으로 흐른다고 하는 이유다. :부모로부터 자식에게

3. `인스턴스`는 클래스 컴포넌트에서 작성한 `this`를 참조한 것이다.  

  지역 state를 저장하거나 생명주기 이벤트에 반응할 때 유용하다.

4. 함수형 컴포넌트는 전혀 인스턴스가 없다. 클래스 컴포넌트가 인스턴스를 가지므로

  당신은 컴포넌트 인스턴스를 만드는일에 신경쓰지 않아도 된다.(DOM렌더링)

5. 마지막으로, `element`들을 만들 때 

  `React.createElement()`, `JSX`, `element factory helper`를 써라.

  실제 코드에서선 순수 객체를 작성하지 않는다. 

  그저 기저에서 컴포넌트가 순수 객체라는 것만 알아 두어라.