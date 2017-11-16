function NameBox(name) {
  return { fontWeight: 'bold', labelContent: name };
}

function FancyUserBox(user) {
  return {
    borderStyle: '1px solid blue',
    childContent: [
      'Name: ',
      // Embed the render output of `NameBox`.
      NameBox(user.firstName + ' ' + user.lastName)
    ]
  };
}

function FancyBox(children) {
  // `FancyBox` doesn't need to know what's inside it.
  // Instead, it accepts `children` as an argument.
  return {
    borderStyle: '1px solid blue',
    children: children
  };
}

function UserBox(user) {
  // Now we can put different `children` inside `FancyBox` in different parts of UI.
  // For example, `UserBox` is a `FancyBox` with a `NameBox` inside.
  return FancyBox([
    'Name: ',
    NameBox(user.firstName + ' ' + user.lastName)
  ]);
}

function MessageBox(message) {
  // However a `MessageBox` is a `FancyBox` with a message.
  return FancyBox([
    'You received a new message: ',
    message
  ]);
}

function FancyNameBox(user, likes, onClick) {
  return FancyBox([
    'Name: ', NameBox(user.firstName + ' ' + user.lastName),
    'Likes: ', LikeBox(likes),
    LikeButton(onClick)
  ]);
}

// Implementation Details

var likes = 0;
function addOneMoreLike() {
  likes++;
  rerender();
}

// Init
// FancyNameBox(
//   { firstName: 'Sebastian', lastName: 'Markbåge' },
//   likes,
//   addOneMoreLike
// );