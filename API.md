# API
**NOTE: This API is WIP! Methods might not exist at this point**

# Notifications
### Construction
```
new Notifications($(".notifications"))
```
This creates a new Notifications object with the HTML element with class `notifications`

### Methods
#### `notifications.add(Id, Type, Body, Timeout, Options, Callback)`
`Id` must be a unique id for the message (if empty a new random id is assigned)

`Type` must be one of: `done, success, error, ask, progress, confirm, input, select`

`Body` can be either a HTML node or a string

`Timeout` is the time after which the message will auto-close
 - If `Type` is `progress` this timer will start after the progress reaches 100%
 - If set to 0 the message will not auto-close
 - If `Type` is `confirm` or `input` this will be always 0

`Options` is an Object with extra Options
 - If `Type` is `input`
  - `confirm_label` The label of the confirm button
  - `cancel_label` If set cancel button will be shown, the label of the cancel button
  - `placeholder` If set, the value of the `placeholder` property of the input field
  - `type` Default: `text`, value of the `type` property of the input field
 - If `Type` is `confirm`
  - `confirm_label` The label of the confirm button
  - `cancel_label` If set cancel button will be shown, the label of the cancel button
 - If `Type` is `list`
  - `elements` Object of elements shown `{"id":"Description"}`
  - `cancel_label` If set cancel button will be shown, the label of the cancel button


`Callback` will be called when the message closes.

Arguments of the callback:
 - `event` Either `auto` (if Timeout is up) or `user`
  - If `Type` is `progress, confirm, input, list` also `action`
 - `result`
  - If `Type` is `confirm` and event is `action`
    - Boolean if clicked on `Confirm` (true) or `Cancel` (false)
  - If `Type` is `input` and event is `action`
    - Content of the input box
  - If `Type` is `list` and event is `action`
    - When the cancel button is clicked: `false`
    - When a list item is clicked: id of the list item

Returns an instance of `Notification`

#### `get(Id, Throw)`
- `Id` Id of the message
- `Throw` If true, throws an error if the Id is unregistered

Returns the `Notification` object for `Id`

#### `close(id)`
 - `Id` of the message

Closes the message `Id`
Throws an error if the Id is unregistered

#### `closeAll()`

Closes **all** messages

#### `randomId()`

Returns a random message id

#### `displayMessage(Type, Body, Timeout, Callback)`

Same as `add(randomId(), Type, Body,{} , Timeout, Callback)`

#### `displayConfirm(Message, confirm_label, cancel_label, Callback)`

Same as `add(randomId(), "confirm", Message, 0, {confirm_label,cancel_label}, Callback)`

#### `displayPrompt(Message, confirm_label, cancel_label, Callback)`

Same as `add(randomId(), "prompt", Message, 0, {confirm_label,cancel_label}, Callback)`

# Notification
### Methods
#### `setBody(Body)`
Set the notification content to `Body`

#### `setProgress(Progress)`
If `Type` is `progress`
 - Set the progress of the spinner to `Progress`
  - If `Progress` is 100% also triggers the `success` animation and timeout
  - If `Progress` is negative also triggers the `error` animation and timeout

#### `close()`
Closes the message and triggers the callback
