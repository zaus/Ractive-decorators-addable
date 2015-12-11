/*

	Ractive-decorators-addable
	===========================

	Version 0.1.2.

	This plugin adds a 'addable' decorator to Ractive, which enables
	elements that correspond to array members to be added and removed.

	==========================

	Troubleshooting: If you're using a module system in your app (AMD or
	something more nodey) then you may need to change the paths below,
	where it says `require( 'Ractive' )` or `define([ 'Ractive' ]...)`.

	==========================

	Usage: Include this file on your page below Ractive, e.g:

	    <script src='lib/Ractive.js'></script>
	    <script src='lib/Ractive-decorators-addable.js'></script>

	Or, if you're using a module loader, require this module:

	    // requiring the plugin will 'activate' it - no need to use
	    // the return value
	    require( 'Ractive-decorators-addable' );

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

*/

var addableDecorator = (function (global, factory) {

	'use strict';

	// Common JS (i.e. browserify) environment
	if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
		factory(require('Ractive'));
	}

	// AMD?
	else if (typeof define === 'function' && define.amd) {
		define(['Ractive'], factory);
	}

	// browser global
	else if (global.Ractive) {
		factory(global.Ractive);
	}

	else {
		throw new Error('Could not find Ractive! It must be loaded before the Ractive-decorators-addable plugin');
	}

}(typeof window !== 'undefined' ? window : this, function (Ractive/*, $ */) {

	'use strict';

	var log, utils_extend, autoHandler, styleAdd, btnCreate,

		addable,
		ractive,
		sourceKeypath,
		sourceArray,
		sourceIndex,

		btnAdd,
		btnRemove,

		addHandler,
		remHandler,

		errorMessage;

	addable = function (node, options) {
		//node.addable = true;

		options = utils_extend({}, addable, options);

		//log('addable init', options);

		// add interactive ui
		var parent = node.parentNode;
		if (!parent._addable) parent._addable = false; // {} for more options

		// maybe only one add button
		if (options.allAdd || !parent._addable) {
			btnAdd = btnCreate(options.elementName, node, addHandler, options.addText, options.addClass, options.addTitle);
			
			styleAdd(options.addStyle || 'append', btnAdd, node, parent);
		}

		// end 'once' behavior
		if (!parent._addable) {
			parent.className = parent.className + ' ' + options.className;
			parent._addable = true;
		}

		btnRemove = btnRemove = btnCreate(options.elementName, node, remHandler, options.remText, options.remClass, options.remTitle);

		// try to append, otherwise add
		styleAdd(options.remStyle || 'inner', btnRemove, node, parent);

		return {
			teardown: function () {
				btnRemove.removeEventListener('click', remHandler, false); // TODO: actually remove the handler fn?  do we even need to if btnRemove is deleted?

				//node.removeChild(btnRemove); // already gone by this point
				// TODO: how to handle the last one?  i.e. how to handle the add button
				/*
				btnAdd.removeEventListener('click', addHandler, false);
				btnAdd.parentNode.removeChild(btnAdd);

				node.parentNode.className = node.parentNode.className.replace(' ' + options.className, '');
				delete node._addable;
				*/
			}
		};
	};

	addable.className = 'addable';

	addable.elementName = 'span';
	addable.addTitle = addable.addText = 'Add';
	addable.addClass = 'btn add';
	addable.addStyle = 'prepend'; // selector or 'append', 'prepend'; copy? -- UI doesn't really respect this when no more elements left
	addable.remTitle = addable.remText = 'Delete';
	addable.remClass = 'btn delete';
	addable.remStyle = 'inner'; // selector or inner|child,next|sibling
	addable.allAdd = false;

	// style selector "hacks" for navigating up the DOM
	addable.rootSelector = '$';
	addable.parentSelector = '^';

	//#region ----- utilities ----------
	btnCreate = function (el, node, handler, text, clss, title) {

		// from html -- http://stackoverflow.com/a/494348/1037948
		var btn;
		if (el[0] == '<') {
			btn = document.createElement('p');
			btn.innerHTML = el;
			btn = btn.firstChild;
		}
		else btn = document.createElement(el);

		btn.addEventListener('click', autoHandler(node, handler), false);
		btn.innerHTML += text;
		btn.className = clss;
		btn.title = title || text;
		return btn;
	}
	styleAdd = function (style, newNode, node, parent) {
		/// <summary>
		/// Add the <paramref name="newNode"/> according to <paramref name="style"/> to either the <paramref name="node"/> or <paramref name="parent"/>
		/// </summary>
		/// <param name="style">How to add it: append, prepend, next, inner</param>
		/// <param name="newNode">The node to insert</param>
		/// <param name="node">The source node</param>
		/// <param name="parent">The <paramref name="node"/>'s parent</param>

		switch (style) {
			case 'append':
				parent.appendChild(btnAdd);
				break;
			case 'prepend':
				parent.insertBefore(btnAdd, node);
				break;
			case 'next':
				if (node.nextSibling) parent.insertBefore(newNode, node.nextSibling);
				else parent.appendChild(newNode);
				break;
			case 'inner':
				node.appendChild(newNode);
				break;
				// any selector
			default:
				// root "selector" hack
				if(style.charAt(0) == addable.rootSelector) {
					style = style.substring(1);
					node = document;
				}
				// parent "selector" hack
				else while (style.charAt(0) == addable.parentSelector) {
					style = style.substring(1);
					node = node.parentNode;
				}
				var found = node.querySelector(style);
				if (!found) throw new Error("Couldn't locate decorator addable 'style' (" + style + ") to attach to in `node`");
				found.appendChild(newNode);
				break;
		}
	}
	utils_extend = function () {

		return function (target) {
			var prop, source, sources = Array.prototype.slice.call(arguments, 1);
			while (source = sources.shift()) {
				for (prop in source) {
					if (source.hasOwnProperty(prop)) {
						target[prop] = source[prop];
					}
				}
			}
			return target;
		};
	}();
	if (!Array.isArray) {
		Array.isArray = function (arg) {
			return Object.prototype.toString.call(arg) === '[object Array]';
		};
	}
	log = function () {
		if (!console || !console.log) return;
		console.log.apply(console, arguments);
	}
	autoHandler = function (node, handler) {
		return function (event) { return handler.apply(node, [event]); }
	}
	//#endregion ----- utilities ----------

	errorMessage = 'The addable decorator only works with elements that correspond to array members';

	addHandler = function (event) {
		var storage = this._ractive, lastDotIndex;

		sourceKeypath = storage.keypath.str || storage.keypath; // 0.7.3?  could hit other properties for already parsed

		// this decorator only works with array members!
		lastDotIndex = sourceKeypath.lastIndexOf('.');

		if (lastDotIndex === -1) {
			throw new Error(errorMessage);
		}

		sourceArray = sourceKeypath.substr(0, lastDotIndex);
		sourceIndex = +(sourceKeypath.substring(lastDotIndex + 1));

		if (isNaN(sourceIndex)) {
			throw new Error(errorMessage);
		}

		log('adding', sourceArray, sourceIndex, sourceKeypath);

		// keep a reference to the Ractive instance that 'owns' this data and this element
		ractive = storage.root;

		var source = ractive.get(sourceArray);
		var current = ractive.get(sourceKeypath);

		// make a copy of current; TODO: proper copy of array children
		if (Array.isArray(current)) current = [];
		else if (typeof (current) === "object") current = utils_extend({}, current);

		if (Array.isArray(source)) ractive.splice(sourceArray, sourceIndex, 0, current);
		else {
			source[sourceIndex + 1] = current;
			ractive.update(); // because we changed the data directly
		}
	};
	remHandler = function (event) {
		var storage = this._ractive, lastDotIndex;

		sourceKeypath = storage.keypath.str || storage.keypath;

		// this decorator only works with array members!
		lastDotIndex = sourceKeypath.lastIndexOf('.');

		if (lastDotIndex === -1) {
			throw new Error(errorMessage);
		}

		sourceArray = sourceKeypath.substr(0, lastDotIndex);
		sourceIndex = +(sourceKeypath.substring(lastDotIndex + 1));

		if (isNaN(sourceIndex)) {
			throw new Error(errorMessage);
		}

		log('removing', sourceArray, sourceIndex, sourceKeypath);

		// keep a reference to the Ractive instance that 'owns' this data and this element
		ractive = storage.root;

		var source = ractive.get(sourceArray);

		if (Array.isArray(source)) ractive.splice(sourceArray, sourceIndex, 1);
		else {
			delete source[sourceIndex];
			ractive.update(); // because we changed the data directly
		}
	};

	// expose
	Ractive.decorators.addable = addable;
	return addable;
}));

// Common JS (i.e. browserify) environment
if (typeof module !== 'undefined' && module.exports) {
	module.exports = addableDecorator;
}
