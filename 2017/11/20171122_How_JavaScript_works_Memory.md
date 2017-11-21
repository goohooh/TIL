# How JavaScript works: memory management + how to handle 4 common memory leaks

> _원문 : [How Javascript works - 3](https://blog.sessionstack.com/how-javascript-works-memory-management-how-to-handle-4-common-memory-leaks-3f28b94cfbec)_

매일 기본으로 사용되는 프로그래밍 언어의 성숙도와 복잡성 증가로 인해 개발자들로 부터 방치된 메모리 운영에 관한 논의를 할 것이다.

## 개요

C 같은 low-level 언어는 `malloc()`과 `free()`같은 메모리 관리 원형 함수를 갖는다. 이러한 함수들은 개발자가 명시적으로 할당하고 운영 체제로부터 메모리를 헤재하는데 사용된다.

JS는 객체들, 문자열 등등의 것들이 만들어질 때 메모리 할당을 하고 _가비지 컬렉션_ 이라 불리는 프로세스를 통해 "자동으로" 더이상 사용되지 않는 것들을 메모리 해제한다.

**리소스를 확보하는 것처럼 보이는 겉보기에 "자동적인" 특성은 혼란을 야기하며 JS나 여타 high-level 언어 개발자들에게 메모리관리를 신경쓰지 않아도 되는 것처럼 잘못된 인상을 줄 수 있다.**

**이는 매우큰 실수다.**

고수준 언어를 사용하더라도 개발자는 메모리 운영(최소한 기본정도는)에 관한 이해를 가져야 한다. 간혹 개발자들이 자동 메모리 운영 이슈(버그나 가비지컬렉터의 구현 한계 등)같이 제대로 다루기 위해 이해해야할 이슈들이 있다.(혹은 최소한의 트레이드 오프나 코드 부채로 해결방법을 찾거나)