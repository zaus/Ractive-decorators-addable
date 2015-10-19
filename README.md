Ractive.js addable decorator plugin
====================================

*Find more Ractive.js plugins at [ractivejs.org/plugins](http://ractivejs.org/plugins)*

[See the demo here.](http://zaus.github.io/Ractive-decorators-addable/)

Usage
-----

Include this file on your page below Ractive, e.g:

```html
<script src='lib/Ractive.js'></script>
<script src='lib/Ractive-decorators-addable.js'></script>
```

Or, if you're using a module loader, require this module:

```js
// requiring the plugin will 'activate' it - no need to use the return value
require( 'Ractive-decorators-addable' );
```

Then use the decorator like so:

	<!-- template -->
	<ul>
	    {{#list}}
	    <li decorator='addable'>{{.}}</li>
	    {{/list}}
	</ul>

	var ractive = new Ractive({
	    el: myContainer,
	    template: myTemplate,
	    data: { list: [ 'Firefox', 'Chrome', 'Internet Explorer', 'Opera', 'Safari', 'Maxthon' ] }
	});

Or with inline configuration:

	<ul>
	    {{#list}}
	    <li decorator='multi:{ sortable:true, addable:{ elementName: "<a><i></i></a>", addText: "", remText: "", allAdd: true, addStyle: "inner" } }'>
	    {{/list}
	</ul>

Or with global configuration:

	Ractive.decorators.addable.elementName = '<a><i></i></a>';
	Ractive.decorators.addable.addText = '';
	Ractive.decorators.addable.remText = '';



License
-------

Copyright (c) 2015 zaus. Licensed MIT

Forked from [ractive-addable](https://github.com/RactiveJS/Ractive-decorators-sortable/) plugin which was created with the [Ractive.js plugin template](https://github.com/RactiveJS/Plugin-template) for Grunt.
