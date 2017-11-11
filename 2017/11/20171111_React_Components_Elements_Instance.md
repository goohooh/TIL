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

리액트에서는