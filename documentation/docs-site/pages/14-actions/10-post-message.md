---
title: 'Post Message Action'
date: Last Modified
permalink: /actions/post-message/index.html
  order: 10
  parent: actions
  key: actions-postmessage
  title: 'Post Message'
---

Since WebPrototypingTool is web-based, your prototypes can be [embedded](/basics/sharing-embed/) into other sites using an [iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe). Websites that embed WebPrototypingTool prototypes can receive communications using the [Post Message API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage). This action is useful for extending the functionality of a code-based prototype or design specs, however this action does require basic knowledge of JavaScript, JSON and web APIs.

<div class="two-col">

<img src="{{ '/static/img/actions/postmessage.png' | url}}" >

| Property                        | Description                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Trigger                         | Event that initiates the action                                                                         |
| Delay                           | How long to wait before executing                                                                       |
| JSON                            | Messages must be sent as [JSON](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON) |
| <i class="ico">check</i>        | Tells you if the code is valid, but may not catch runtime errors                                        |
| <i class="ico">open_in_full</i> | Expands the script editor to fullscreen                                                                 |

</div>

---

## Demo

<div class="two-col" style="grid-template-columns: auto 1fr">

<div id="output" style=" height: 100%; background: #f2f3f4; display: grid; align-items: center; padding: 20px; border-radius: 8px;">
  Click the button to show a message from WebPrototypingTool...
</div>
</div>
<script>
  const outputTxt = document.getElementById('output');
  window.addEventListener('message', (e)=>{
    try{
      outputTxt.textContent = JSON.parse(e.data)?.msg
    }catch(e){}
  });
</script>

### WebPrototypingTool Post Message JSON

```json
{
  "msg": "Hello from WebPrototypingTool!"
}
```

### Site that embed a WebPrototypingTool prototype

<div id="output"></div>

<script>
  const outputTxt = document.getElementById('output');
  window.addEventListener('message', (e) => {
    try {
      outputTxt.textContent = JSON.parse(e.data)?.msg;
    } catch (e) {}
  });
</script>
```
